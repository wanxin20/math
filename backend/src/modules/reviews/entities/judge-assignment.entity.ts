import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Competition } from '../../competitions/entities/competition.entity';

@Entity('judge_assignments')
@Unique(['judgeUserId', 'competitionId'])
export class JudgeAssignment {
  @PrimaryGeneratedColumn({ comment: '分配记录ID' })
  id: number;

  @Column({ name: 'judge_user_id', length: 36, comment: '评委用户ID' })
  judgeUserId: string;

  @Column({ name: 'competition_id', length: 50, comment: '竞赛ID' })
  competitionId: string;

  @CreateDateColumn({ name: 'assigned_at', comment: '分配时间' })
  assignedAt: Date;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'judge_user_id' })
  judge: User;

  @ManyToOne(() => Competition)
  @JoinColumn({ name: 'competition_id' })
  competition: Competition;
}
