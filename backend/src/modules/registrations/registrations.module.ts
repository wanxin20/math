import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { UserRegistration } from './entities/user-registration.entity';
import { Competition } from '../competitions/entities/competition.entity';
import { RegistrationPayment } from '../payments/entities/registration-payment.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserRegistration, Competition, RegistrationPayment])],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
