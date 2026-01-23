import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  ParseIntPipe,
  Body,
  Req,
  Res,
  HttpCode,
  Logger,
  Headers,
  RawBodyRequest,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { WechatPayService } from './wechat-pay.service';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Request, Response } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  private readonly logger = new Logger(PaymentsController.name);

  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly wechatPayService: WechatPayService,
  ) {}

  @Get('registration/:registrationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '获取报名的支付记录' })
  async findByRegistrationId(@Param('registrationId', ParseIntPipe) registrationId: number) {
    return this.paymentsService.findByRegistrationId(registrationId);
  }

  @Post('mock/:registrationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '模拟支付（开发测试用）' })
  async mockPayment(
    @Param('registrationId', ParseIntPipe) registrationId: number,
    @CurrentUser('userId') userId: string,
  ) {
    return this.paymentsService.mockPayment(registrationId, userId);
  }

  @Post('wechat/create/:registrationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '创建微信支付订单（扫码支付）' })
  async createWechatPayOrder(
    @Param('registrationId', ParseIntPipe) registrationId: number,
    @CurrentUser('userId') userId: string,
  ) {
    return this.paymentsService.createWechatPayOrder(registrationId, userId);
  }

  @Get('wechat/query/:registrationId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: '查询微信支付订单状态' })
  async queryWechatPayOrder(
    @Param('registrationId', ParseIntPipe) registrationId: number,
    @CurrentUser('userId') userId: string,
  ) {
    return this.paymentsService.queryWechatPayOrder(registrationId, userId);
  }

  @Post('wechat/notify')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: '微信支付回调接口' })
  async wechatPayNotify(
    @Body() body: any,
    @Req() req: RawBodyRequest<Request>,
    @Res() res: Response,
    @Headers() headers: any,
  ) {
    try {
      this.logger.log('收到微信支付回调');
      
      // 获取签名相关信息
      const signature = headers['wechatpay-signature'];
      const timestamp = headers['wechatpay-timestamp'];
      const nonce = headers['wechatpay-nonce'];
      const serial = headers['wechatpay-serial'];
      
      // 获取原始请求体（用于验签）
      // Express 的 raw body 在 req.rawBody 或通过 JSON.stringify(body) 获取
      const rawBody = req.rawBody ? req.rawBody.toString('utf-8') : JSON.stringify(body);
      
      this.logger.debug(`验签参数 - timestamp: ${timestamp}, nonce: ${nonce}, serial: ${serial}`);
      this.logger.debug(`原始请求体: ${rawBody}`);

      // 验证签名
      if (!signature || !timestamp || !nonce || !serial) {
        this.logger.error('缺少签名参数');
        return res.status(400).json({ code: 'FAIL', message: '缺少签名参数' });
      }

      const isValid = this.wechatPayService.verifySignature(
        signature,
        rawBody,
        timestamp,
        nonce,
        serial,
      );

      if (!isValid) {
        this.logger.error('签名验证失败');
        return res.status(401).json({ code: 'FAIL', message: '签名验证失败' });
      }

      this.logger.log('签名验证通过');

      // 处理回调
      const result = await this.paymentsService.handleWechatPayNotify(body);

      // 返回响应
      return res.status(200).json(result);
    } catch (error) {
      this.logger.error('处理微信支付回调失败', error);
      return res.status(500).json({ code: 'FAIL', message: '系统错误' });
    }
  }
}
