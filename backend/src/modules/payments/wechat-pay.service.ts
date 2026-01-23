import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// 微信支付插件导入
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Formatter, Rsa } = require('wechatpay-axios-plugin');

@Injectable()
export class WechatPayService implements OnModuleInit {
  private readonly logger = new Logger(WechatPayService.name);
  private wechatpay: any;
  private publicKey!: string; // 微信支付平台公钥
  private readonly platformPublicKeyId = 'PUB_KEY_ID_0115000352722026011900211689002000'; // 公钥ID
  private privateKey!: string; // 商户私钥
  private mchid!: string;
  private serial!: string;
  private apiv3Key!: string;
  private appid!: string;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    // 检查必要配置
    const mchid = this.configService.get<string>('WECHAT_PAY_MCH_ID');
    if (!mchid) {
      this.logger.error('❌ 微信支付商户号未配置（WECHAT_PAY_MCH_ID）');
      throw new Error('微信支付商户号未配置，请检查环境变量');
    }

    // 微信支付是必要功能，初始化失败应该抛出错误
    await this.initWechatPay();
  }

  /**
   * 加载微信支付平台公钥
   */
  private loadPlatformPublicKey(): string {
    const publicKeyPath = path.join(process.cwd(), 'src/config/wechat_pay/pub_key.pem');
    
    this.logger.log(`公钥文件路径: ${publicKeyPath}`);
    
    if (!fs.existsSync(publicKeyPath)) {
      throw new Error(`微信支付平台公钥文件不存在：${publicKeyPath}`);
    }
    
    const publicKey = fs.readFileSync(publicKeyPath, 'utf-8');
    this.logger.log(`✅ 平台公钥文件读取成功`);
    this.logger.log(`公钥ID: ${this.platformPublicKeyId}`);
    
    return publicKey;
  }

  /**
   * 初始化微信支付
   */
  private async initWechatPay() {
    this.logger.log('==========================================');
    this.logger.log('开始初始化微信支付');
    this.logger.log('==========================================');
    
    const mchid = this.configService.get<string>('WECHAT_PAY_MCH_ID');
    const serial = this.configService.get<string>('WECHAT_PAY_CERT_SERIAL_NO');
    const apiv3Key = this.configService.get<string>('WECHAT_PAY_API_KEY');
    const appid =
      this.configService.get<string>('WECHAT_PAY_APPID') ||
      this.configService.get<string>('WECHAT_PAY_APP_ID');
    
    this.logger.log(`商户号: ${mchid || '未配置'}`);
    this.logger.log(`证书序列号: ${serial || '未配置'}`);
    this.logger.log(`AppID: ${appid || '未配置'}`);
    this.logger.log(`API密钥长度: ${apiv3Key?.length || 0} (应该是32位)`);
    
    // 验证配置
    if (!mchid || !serial || !apiv3Key || !appid) {
      throw new Error('微信支付配置不完整，请检查环境变量（WECHAT_PAY_MCH_ID, WECHAT_PAY_CERT_SERIAL_NO, WECHAT_PAY_API_KEY, WECHAT_PAY_APP_ID）');
    }

    if (apiv3Key.length !== 32) {
      throw new Error(`API v3 密钥长度不正确：${apiv3Key.length}，应该是 32 位`);
    }
    
    // 配置验证通过后赋值
    this.mchid = mchid;
    this.serial = serial;
    this.apiv3Key = apiv3Key;
    this.appid = appid;
    
    // 读取私钥文件
    const privateKeyPath = this.configService.get<string>('WECHAT_PAY_PRIVATE_KEY_PATH');
    
    if (!privateKeyPath) {
      throw new Error('微信支付私钥文件路径未配置（WECHAT_PAY_PRIVATE_KEY_PATH）');
    }
    
    const absolutePath = path.join(process.cwd(), privateKeyPath);
    this.logger.log(`私钥文件路径: ${absolutePath}`);
    
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`微信支付私钥文件不存在：${absolutePath}`);
    }

    this.privateKey = fs.readFileSync(absolutePath, 'utf-8');
    this.logger.log(`✅ 私钥文件读取成功`);

    // 加载平台公钥
    this.publicKey = this.loadPlatformPublicKey();

    this.logger.log('==========================================');
    this.logger.log('✅ 微信支付初始化成功！');
    this.logger.log('==========================================');
  }

  /**
   * 生成授权签名
   * @param method HTTP方法
   * @param url 请求URL
   * @param body 请求体
   */
  private generateAuthorizationSignature(method: string, url: string, body: string = ''): string {
    const urlObj = new URL(url);
    const uri = `${urlObj.pathname}${urlObj.search}`;
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const nonce = crypto.randomBytes(16).toString('hex');
    
    // 构造签名串: HTTP方法\nURL\n时间戳\n随机串\n请求体\n
    const signStr = `${method}\n${uri}\n${timestamp}\n${nonce}\n${body}\n`;
    
    // 使用商户私钥签名
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signStr);
    const signature = sign.sign(this.privateKey, 'base64');
    
    // 生成Authorization头
    const authorization = `WECHATPAY2-SHA256-RSA2048 mchid="${this.mchid}",nonce_str="${nonce}",signature="${signature}",timestamp="${timestamp}",serial_no="${this.serial}"`;
    
    return authorization;
  }

  /**
   * 创建 Native 支付订单（扫码支付）
   * @param orderId 订单号
   * @param amount 金额（元）
   * @param description 商品描述
   * @returns 二维码链接
   */
  async createNativeOrder(orderId: string, amount: number, description: string): Promise<string> {
    try {
      const notifyUrl = this.configService.get<string>('WECHAT_PAY_NOTIFY_URL');
      
      if (!notifyUrl || !this.appid || !this.mchid) {
        throw new Error('微信支付配置不完整');
      }
      
      // 金额转换为分
      const totalAmount = Math.round(amount * 100);

      const params = {
        appid: this.appid,
        mchid: this.mchid,
        description,
        out_trade_no: orderId,
        notify_url: notifyUrl,
        amount: {
          total: totalAmount,
          currency: 'CNY',
        },
      };

      const body = JSON.stringify(params);
      const url = 'https://api.mch.weixin.qq.com/v3/pay/transactions/native';
      const authorization = this.generateAuthorizationSignature('POST', url, body);

      this.logger.log(`创建微信支付订单：${orderId}, 金额：${amount}元`);

      // 调用微信支付 Native 下单接口
      const response = await axios({
        method: 'POST',
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authorization,
          'User-Agent': 'Mozilla/5.0',
        },
        data: body,
      });

      // 验证响应签名
      const timestamp = response.headers['wechatpay-timestamp'];
      const nonce = response.headers['wechatpay-nonce'];
      const signature = response.headers['wechatpay-signature'];
      const serial = response.headers['wechatpay-serial'];
      const responseBody = JSON.stringify(response.data);

      if (!this.verifyResponseSignature(timestamp, nonce, responseBody, signature, serial)) {
        throw new Error('响应签名验证失败');
      }

      // 返回二维码链接
      const codeUrl = response.data.code_url;
      
      this.logger.log(`微信支付订单创建成功：${orderId}, 二维码：${codeUrl}`);
      
      return codeUrl;
    } catch (error) {
      this.logger.error(`创建微信支付订单失败：${orderId}`, error);
      throw error;
    }
  }

  /**
   * 查询订单状态
   * @param orderId 订单号
   */
  async queryOrder(orderId: string) {
    try {
      if (!this.mchid) {
        throw new Error('微信支付商户号未配置');
      }
      
      const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${orderId}?mchid=${this.mchid}`;
      const authorization = this.generateAuthorizationSignature('GET', url);

      const response = await axios({
        method: 'GET',
        url,
        headers: {
          'Accept': 'application/json',
          'Authorization': authorization,
          'User-Agent': 'Mozilla/5.0',
        },
      });

      // 验证响应签名
      const timestamp = response.headers['wechatpay-timestamp'];
      const nonce = response.headers['wechatpay-nonce'];
      const signature = response.headers['wechatpay-signature'];
      const serial = response.headers['wechatpay-serial'];
      const responseBody = JSON.stringify(response.data);

      if (!this.verifyResponseSignature(timestamp, nonce, responseBody, signature, serial)) {
        throw new Error('响应签名验证失败');
      }

      return response.data;
    } catch (error) {
      this.logger.error(`查询微信支付订单失败：${orderId}`, error);
      throw error;
    }
  }

  /**
   * 关闭订单
   * @param orderId 订单号
   */
  async closeOrder(orderId: string) {
    try {
      if (!this.mchid) {
        throw new Error('微信支付商户号未配置');
      }
      
      const body = JSON.stringify({ mchid: this.mchid });
      const url = `https://api.mch.weixin.qq.com/v3/pay/transactions/out-trade-no/${orderId}/close`;
      const authorization = this.generateAuthorizationSignature('POST', url, body);

      await axios({
        method: 'POST',
        url,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': authorization,
          'User-Agent': 'Mozilla/5.0',
        },
        data: body,
      });

      this.logger.log(`微信支付订单已关闭：${orderId}`);
    } catch (error) {
      this.logger.error(`关闭微信支付订单失败：${orderId}`, error);
      throw error;
    }
  }

  /**
   * 验证响应签名
   * @param timestamp 时间戳
   * @param nonce 随机串
   * @param body 响应体
   * @param signature 签名
   * @param serial 证书序列号
   */
  private verifyResponseSignature(
    timestamp: string,
    nonce: string,
    body: string,
    signature: string,
    serial: string,
  ): boolean {
    try {
      // 检查证书序列号是否匹配
      if (serial !== this.platformPublicKeyId) {
        this.logger.warn(`证书序列号不匹配，期望: ${this.platformPublicKeyId}, 实际: ${serial}`);
        // 注意：这里不直接返回false，因为可能有多个公钥
      }

      // 构造验签名串: 时间戳\n随机串\n响应体\n
      const signStr = `${timestamp}\n${nonce}\n${body}\n`;
      
      this.logger.debug(`验签名串: ${signStr}`);
      this.logger.debug(`签名: ${signature}`);

      // 使用平台公钥验签
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(signStr);
      const isValid = verify.verify(this.publicKey, signature, 'base64');

      if (!isValid) {
        this.logger.error('响应签名验证失败');
        this.logger.debug(`时间戳: ${timestamp}`);
        this.logger.debug(`随机串: ${nonce}`);
        this.logger.debug(`响应体: ${body}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error('验证响应签名时发生错误', error);
      return false;
    }
  }

  /**
   * 验证支付回调签名
   * @param signature 签名
   * @param body 回调body
   * @param timestamp 时间戳
   * @param nonce 随机字符串
   * @param serial 证书序列号
   */
  verifySignature(signature: string, body: string, timestamp: string, nonce: string, serial: string): boolean {
    try {
      // 检查证书序列号是否匹配
      if (serial !== this.platformPublicKeyId) {
        this.logger.warn(`证书序列号不匹配，期望: ${this.platformPublicKeyId}, 实际: ${serial}`);
      }

      // 构造验签名串: 时间戳\n随机串\n请求体\n
      const signStr = `${timestamp}\n${nonce}\n${body}\n`;
      
      this.logger.debug(`验签名串: ${signStr}`);
      this.logger.debug(`签名: ${signature}`);

      // 使用平台公钥验签
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(signStr);
      const isValid = verify.verify(this.publicKey, signature, 'base64');

      if (!isValid) {
        this.logger.error('回调签名验证失败');
        this.logger.debug(`时间戳: ${timestamp}`);
        this.logger.debug(`随机串: ${nonce}`);
        this.logger.debug(`请求体: ${body}`);
      }

      return isValid;
    } catch (error) {
      this.logger.error('验证微信支付回调签名失败', error);
      return false;
    }
  }

  /**
   * 解密回调数据
   * @param ciphertext 密文
   * @param nonce 随机串
   * @param associated_data 附加数据
   */
  decryptNotify(ciphertext: string, nonce: string, associated_data: string): any {
    try {
      if (!this.apiv3Key) {
        throw new Error('微信支付 API 密钥未配置');
      }
      
      // AES-256-GCM 解密
      const key = Buffer.from(this.apiv3Key, 'utf-8');
      const nonceBuffer = Buffer.from(nonce, 'utf-8');
      const associatedDataBuffer = Buffer.from(associated_data, 'utf-8');
      const ciphertextBuffer = Buffer.from(ciphertext, 'base64');
      
      // GCM 标签在密文末尾 16 字节
      const authTag = ciphertextBuffer.slice(-16);
      const encryptedData = ciphertextBuffer.slice(0, -16);
      
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonceBuffer);
      decipher.setAuthTag(authTag);
      decipher.setAAD(associatedDataBuffer);
      
      let decrypted = decipher.update(encryptedData, undefined, 'utf-8');
      decrypted += decipher.final('utf-8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      this.logger.error('解密微信支付回调数据失败', error);
      throw error;
    }
  }
}
