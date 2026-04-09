import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { JudgeAssignment } from './entities/judge-assignment.entity';
import { JudgeScore } from './entities/judge-score.entity';
import { Competition } from '../competitions/entities/competition.entity';
import { UserRegistration } from '../registrations/entities/user-registration.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JudgeAssignment,
      JudgeScore,
      Competition,
      UserRegistration,
      User,
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
