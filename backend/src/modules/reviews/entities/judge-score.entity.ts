import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { UserRegistration } from '../../registrations/entities/user-registration.entity';
import { Competition } from '../../competitions/entities/competition.entity';

@Entity('judge_scores')
@Unique(['judgeUserId', 'registrationId'])
export class JudgeScore {
  @PrimaryGeneratedColumn({ comment: '评分记录ID' })
  id: number;

  @Column({ name: 'judge_user_id', length: 36, comment: '评委用户ID' })
  judgeUserId: string;

  @Column({ name: 'registration_id', comment: '报名记录ID' })
  registrationId: number;

  @Column({ name: 'competition_id', length: 50, comment: '竞赛ID' })
  competitionId: string;

  @Column({ name: 'total_score', type: 'decimal', precision: 6, scale: 2, comment: '总分' })
  totalScore: number;

  @Column({ name: 'criteria_scores', type: 'json', nullable: true, comment: '各维度评分 JSON [{name,score,maxScore}]' })
  criteriaScores: Array<{ name: string; score: number; maxScore: number }> | null;

  @Column({ type: 'text', nullable: true, comment: '评语' })
  comments: string | null;

  @Column({ name: 'scored_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', comment: '评分时间' })
  scoredAt: Date;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'judge_user_id' })
  judge: User;

  @ManyToOne(() => UserRegistration)
  @JoinColumn({ name: 'registration_id' })
  registration: UserRegistration;

  @ManyToOne(() => Competition)
  @JoinColumn({ name: 'competition_id' })
  competition: Competition;
}
