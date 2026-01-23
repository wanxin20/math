import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { WechatPayService } from './wechat-pay.service';
import { RegistrationPayment } from './entities/registration-payment.entity';
import { UserRegistration } from '../registrations/entities/user-registration.entity';
import { Competition } from '../competitions/entities/competition.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([RegistrationPayment, UserRegistration, Competition]),
    ConfigModule,
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService, WechatPayService],
  exports: [PaymentsService, WechatPayService],
})
export class PaymentsModule {}
