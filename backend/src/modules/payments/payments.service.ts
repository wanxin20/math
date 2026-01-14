import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegistrationPayment } from './entities/registration-payment.entity';
import { UserRegistration } from '../registrations/entities/user-registration.entity';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentStatus } from '@/common/enums/payment-status.enum';
import { RegistrationStatus } from '@/common/enums/registration-status.enum';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(RegistrationPayment)
    private paymentsRepository: Repository<RegistrationPayment>,
    @InjectRepository(UserRegistration)
    private registrationsRepository: Repository<UserRegistration>,
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
