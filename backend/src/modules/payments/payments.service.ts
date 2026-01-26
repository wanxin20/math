import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistrationPayment } from './entities/registration-payment.entity';
import { UserRegistration } from '../registrations/entities/user-registration.entity';
import { Competition } from '../competitions/entities/competition.entity';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentStatus } from '@/common/enums/payment-status.enum';
import { RegistrationStatus } from '@/common/enums/registration-status.enum';
import { WechatPayService } from './wechat-pay.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(RegistrationPayment)
    private paymentsRepository: Repository<RegistrationPayment>,
    @InjectRepository(UserRegistration)
    private registrationsRepository: Repository<UserRegistration>,
    @InjectRepository(Competition)
    private competitionsRepository: Repository<Competition>,
    private wechatPayService: WechatPayService,
  ) {}

  /**
   * 获取支付记录
   */
  async findByRegistrationId(registrationId: number) {
    const payment = await this.paymentsRepository.findOne({
      where: { registrationId },
      relations: ['registration'],
    });

    if (!payment) {
      throw new NotFoundException('支付记录不存在');
    }

    return payment;
  }

  /**
   * 模拟支付（开发测试用）
   */
  async mockPayment(registrationId: number, userId: string) {
    // 1. 获取报名记录
    const registration = await this.registrationsRepository.findOne({
      where: { id: registrationId, userId },
    });

    if (!registration) {
      throw new NotFoundException('报名记录不存在');
    }

    if (registration.status !== RegistrationStatus.PENDING_PAYMENT) {
      throw new BadRequestException('该报名记录不需要支付');
    }

    // 2. 获取支付记录
    const payment = await this.paymentsRepository.findOne({
      where: { registrationId },
    });

    if (!payment) {
      throw new NotFoundException('支付记录不存在');
    }

    // 3. 更新支付状态
    payment.paymentStatus = PaymentStatus.SUCCESS;
    payment.paymentMethod = '模拟支付';
    payment.paymentTime = new Date();
    payment.paymentTransactionId = `MOCK-${Date.now()}`;

    await this.paymentsRepository.save(payment);

    // 4. 更新报名状态
    registration.status = RegistrationStatus.PAID;
    await this.registrationsRepository.save(registration);

    this.logger.log(`报名记录 ${registrationId} 支付成功`);

    return {
      success: true,
      message: '支付成功',
      payment,
    };
  }

  /**
   * 创建微信支付订单
   * @param registrationId 报名记录ID
   * @param userId 用户ID
   * @returns 微信支付二维码链接
   */
  async createWechatPayOrder(registrationId: number, userId: string) {
    // 1. 获取报名记录
    const registration = await this.registrationsRepository.findOne({
      where: { id: registrationId, userId },
      relations: ['competition'],
    });

    if (!registration) {
      throw new NotFoundException('报名记录不存在');
    }

    if (registration.status !== RegistrationStatus.PENDING_PAYMENT) {
      throw new BadRequestException('该报名记录不需要支付');
    }

    // 2. 获取或创建支付记录
    let payment = await this.paymentsRepository.findOne({
      where: { registrationId },
    });

    if (!payment) {
      // 创建支付记录
      payment = this.paymentsRepository.create({
        registrationId,
        paymentAmount: registration.competition.fee,
        paymentStatus: PaymentStatus.PENDING,
      });
      await this.paymentsRepository.save(payment);
    }

    // 3. 生成订单号（使用支付记录ID）
    const orderId = `PAY-${Date.now()}-${payment.id}`;

    // 4. 创建微信支付订单
    const codeUrl = await this.wechatPayService.createNativeOrder(
      orderId,
      Number(registration.competition.fee),
      registration.competition.title,
    );

    // 5. 更新支付记录
    payment.paymentTransactionId = orderId;
    payment.paymentMethod = '微信支付';
    await this.paymentsRepository.save(payment);

    this.logger.log(`创建微信支付订单成功：报名ID=${registrationId}, 订单号=${orderId}`);

    return {
      codeUrl,
      orderId,
      amount: registration.competition.fee,
      description: registration.competition.title,
    };
  }

  /**
   * 查询微信支付订单状态
   * @param registrationId 报名记录ID
   * @param userId 用户ID
   */
  async queryWechatPayOrder(registrationId: number, userId: string) {
    // 1. 获取报名记录
    const registration = await this.registrationsRepository.findOne({
      where: { id: registrationId, userId },
    });

    if (!registration) {
      throw new NotFoundException('报名记录不存在');
    }

    // 2. 获取支付记录
    const payment = await this.paymentsRepository.findOne({
      where: { registrationId },
    });

    if (!payment || !payment.paymentTransactionId) {
      throw new NotFoundException('支付订单不存在');
    }

    // 3. 查询微信支付订单状态
    try {
      const orderInfo = await this.wechatPayService.queryOrder(payment.paymentTransactionId);

      // 4. 如果订单已支付，更新本地状态
      if (orderInfo.trade_state === 'SUCCESS' && payment.paymentStatus !== PaymentStatus.SUCCESS) {
        await this.handlePaymentSuccess(payment, orderInfo);
      }

      return {
        orderStatus: orderInfo.trade_state,
        tradeStateDesc: orderInfo.trade_state_desc,
        paymentStatus: payment.paymentStatus,
        paidAt: payment.paymentTime,
      };
    } catch (error) {
      this.logger.error(`查询微信支付订单失败：${payment.paymentTransactionId}`, error);
      throw new BadRequestException('查询支付状态失败');
    }
  }

  /**
   * 处理支付成功
   * @param payment 支付记录
   * @param orderInfo 微信支付订单信息
   */
  private async handlePaymentSuccess(payment: RegistrationPayment, orderInfo: any) {
    // 更新支付记录
    payment.paymentStatus = PaymentStatus.SUCCESS;
    payment.paymentTime = new Date(orderInfo.success_time);
    // 保留原订单号不变，单独存储微信交易号
    payment.wechatTransactionId = orderInfo.transaction_id;

    await this.paymentsRepository.save(payment);

    // 更新报名状态
    await this.registrationsRepository.update(
      { id: payment.registrationId },
      { status: RegistrationStatus.PAID },
    );

    this.logger.log(`支付成功：报名ID=${payment.registrationId}, 商户订单号=${payment.paymentTransactionId}, 微信交易号=${orderInfo.transaction_id}`);
  }

  /**
   * 处理微信支付回调
   * @param notifyData 回调数据
   */
  async handleWechatPayNotify(notifyData: any) {
    try {
      // 解密回调数据
      const resource = notifyData.resource;
      const decrypted = this.wechatPayService.decryptNotify(
        resource.ciphertext,
        resource.nonce,
        resource.associated_data,
      );

      this.logger.log(`收到微信支付回调：${JSON.stringify(decrypted)}`);

      // 查找支付记录
      const payment = await this.paymentsRepository.findOne({
        where: { paymentTransactionId: decrypted.out_trade_no },
      });

      if (!payment) {
        this.logger.error(`找不到支付记录：${decrypted.out_trade_no}`);
        return { code: 'FAIL', message: '订单不存在' };
      }

      // 如果已经处理过，直接返回成功
      if (payment.paymentStatus === PaymentStatus.SUCCESS) {
        return { code: 'SUCCESS', message: '成功' };
      }

      // 验证支付状态
      if (decrypted.trade_state === 'SUCCESS') {
        await this.handlePaymentSuccess(payment, decrypted);
        return { code: 'SUCCESS', message: '成功' };
      } else {
        this.logger.warn(`支付状态异常：${decrypted.trade_state}, 订单号：${decrypted.out_trade_no}`);
        return { code: 'FAIL', message: '支付状态异常' };
      }
    } catch (error) {
      this.logger.error('处理微信支付回调失败', error);
      return { code: 'FAIL', message: '处理失败' };
    }
  }

  /**
   * 更新支付状态（供支付回调使用）
   */
  async updatePaymentStatus(registrationId: number, updatePaymentDto: UpdatePaymentDto) {
    const payment = await this.paymentsRepository.findOne({
      where: { registrationId },
    });

    if (!payment) {
      throw new NotFoundException('支付记录不存在');
    }

    // 更新支付信息
    Object.assign(payment, updatePaymentDto);

    if (updatePaymentDto.paymentStatus === PaymentStatus.SUCCESS) {
      payment.paymentTime = new Date();

      // 更新报名状态为已支付
      await this.registrationsRepository.update(
        { id: registrationId },
        { status: RegistrationStatus.PAID },
      );
    }

    await this.paymentsRepository.save(payment);

    this.logger.log(`支付记录 ${payment.id} 状态更新为 ${updatePaymentDto.paymentStatus}`);

    return payment;
  }
}
