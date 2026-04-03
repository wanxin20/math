import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { UserRegistration } from './entities/user-registration.entity';
import { TeamMember } from './entities/team-member.entity';
import { Competition } from '../competitions/entities/competition.entity';
import { RegistrationPayment } from '../payments/entities/registration-payment.entity';
import { PaperSubmission } from '../papers/entities/paper-submission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserRegistration, TeamMember, Competition, RegistrationPayment, PaperSubmission])],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
  exports: [RegistrationsService],
})
export class RegistrationsModule {}
