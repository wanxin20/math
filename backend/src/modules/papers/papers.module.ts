import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PapersService } from './papers.service';
import { PapersController } from './papers.controller';
import { PaperSubmission } from './entities/paper-submission.entity';
import { UserRegistration } from '../registrations/entities/user-registration.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PaperSubmission, UserRegistration])],
  controllers: [PapersController],
  providers: [PapersService],
  exports: [PapersService],
})
export class PapersModule {}
