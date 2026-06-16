import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// ali-oss 无内置类型声明；tsconfig noImplicitAny=false，默认 import 解析为 any，编译通过
import OSS from 'ali-oss';

/**
 * 阿里云 OSS 服务
 *
 * 设计要点（与本服务器/业务的约束匹配）：
 * - 上传走「内网 endpoint」(oss-cn-shenzhen-internal)：ECS 与 OSS 同区域，流量免费、更快。
 * - 浏览器下载用的签名 URL 走「外网 endpoint」(oss-cn-shenzhen)：内网地址外部访问不到。
 *   签名是纯本地计算，不发请求，所以用外网 client 仅用于生成 URL。
 * - 大文件（代码/预训练权重，最大 2GB）用 multipartUpload 从磁盘分片上传，
 *   内存占用低，适配 1.6G 内存的小服务器；小文件用 put 直传。
 * - Bucket 私有：文件不公开，统一通过后端签名后 302 跳转访问（见 UploadController）。
 * - 未配置/配置不全时自动禁用，回退到本地磁盘存储（保证本地开发与异常容错）。
 */
@Injectable()
export class OssService {
  private readonly logger = new Logger('OssService');
  private uploadClient: any = null; // 内网 endpoint，用于上传
  private signClient: any = null; // 外网 endpoint，仅用于生成签名 URL
  private bucketName = '';

  constructor(private readonly config: ConfigService) {
    const enabled = this.config.get<string>('OSS_ENABLED') === 'true';
    const region = this.config.get<string>('OSS_REGION');
    const accessKeyId = this.config.get<string>('OSS_ACCESS_KEY_ID');
    const accessKeySecret = this.config.get<string>('OSS_ACCESS_KEY_SECRET');
    const bucket = this.config.get<string>('OSS_BUCKET');

    const incomplete =
      !region ||
      !accessKeyId ||
      !accessKeySecret ||
      !bucket ||
      accessKeyId.startsWith('your-') ||
      bucket.startsWith('your-');

    if (!enabled || incomplete) {
      this.logger.warn(
        'OSS 未启用或配置不完整，新上传文件将继续使用本地磁盘存储（如需启用：在 .env 设置 OSS_ENABLED=true 并填写真实 OSS_* 配置）',
      );
      return;
    }

    this.bucketName = bucket;
    // OSS_INTERNAL 默认 true（线上 ECS）；本地开发若需直传可设为 false
    const useInternal = this.config.get<string>('OSS_INTERNAL') !== 'false';
    const common = { region, accessKeyId, accessKeySecret, bucket, secure: true };

    this.uploadClient = new OSS({ ...common, internal: useInternal });
    this.signClient = new OSS(common); // 外网，用于签名 URL

    this.logger.log(
      `OSS 已启用: bucket=${bucket}, region=${region}, 上传endpoint=${useInternal ? '内网' : '外网'}`,
    );
  }

  /** OSS 是否可用 */
  get enabled(): boolean {
    return this.uploadClient !== null;
  }

  get bucket(): string {
    return this.bucketName;
  }

  /**
   * 把本地文件上传到 OSS。
   * @param key OSS 对象键，如 paper/images/1718000000-123.png
   * @param localPath 本地临时文件路径
   * @param size 文件大小（字节），用于选择直传或分片
   */
  async putFile(key: string, localPath: string, size: number): Promise<void> {
    if (!this.uploadClient) {
      throw new Error('OSS 未启用');
    }
    const LARGE = 8 * 1024 * 1024; // 8MB 以上走分片
    if (size > LARGE) {
      await this.uploadClient.multipartUpload(key, localPath, {
        partSize: 5 * 1024 * 1024, // 5MB 分片
        parallel: 3, // 并发 3，控制内存峰值（约 15MB）
      });
    } else {
      await this.uploadClient.put(key, localPath);
    }
  }

  /**
   * 为私有对象生成限时签名 URL（外网，供浏览器访问）。
   * @param key OSS 对象键
   * @param expiresSeconds 有效期（秒），默认 1 小时
   */
  signUrl(key: string, expiresSeconds = 3600): string {
    const client = this.signClient || this.uploadClient;
    if (!client) {
      throw new Error('OSS 未启用');
    }
    return client.signatureUrl(key, { expires: expiresSeconds });
  }
}
