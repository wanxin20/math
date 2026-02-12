import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CompetitionStatus } from '@/common/enums/competition-status.enum';
import { UserRegistration } from '../../registrations/entities/user-registration.entity';

@Entity('competitions')
export class Competition {
  @PrimaryColumn('varchar', { length: 50, comment: '评选项目ID' })
  id: string;

  @Column({ length: 200, comment: '评选标题' })
  title: string;

  @Column({ type: 'text', nullable: true, comment: '评选描述' })
  description: string;

  @Column({ length: 50, comment: '论文类型' })
  category: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '评审费用（元）' })
  fee: number;

  @Column({ type: 'date', comment: '截止日期' })
  deadline: Date;

  @Column({ name: 'start_date', type: 'date', nullable: true, comment: '开始日期' })
  startDate: Date;

  @Column({ name: 'current_participants', default: 0, comment: '当前参与人数' })
  currentParticipants: number;

  @Column({
    type: 'enum',
    enum: CompetitionStatus,
    default: CompetitionStatus.DRAFT,
    comment: '项目状态',
  })
  status: CompetitionStatus;

  @Column({ name: 'cover_image_url', length: 500, nullable: true, comment: '封面图片URL' })
  coverImageUrl: string;

  @Column({ type: 'text', nullable: true, comment: '申报指南/竞赛规则' })
  guidelines: string;

  @Column({ name: 'award_info', type: 'text', nullable: true, comment: '奖项设置说明' })
  awardInfo: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @OneToMany(() => UserRegistration, (registration) => registration.competition)
  registrations: UserRegistration[];
}
