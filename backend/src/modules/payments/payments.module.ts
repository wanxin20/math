import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { RegistrationPayment } from './entities/registration-payment.entity';
import { UserRegistration } from '../registrations/entities/user-registration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RegistrationPayment, UserRegistration])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
