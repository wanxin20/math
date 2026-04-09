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

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0, comment: '报名费用（元）' })
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

  @Column({ name: 'problem_attachment_url', length: 1000, nullable: true, comment: '赛题附件URL' })
  problemAttachmentUrl: string;

  @Column({ name: 'problem_attachment_name', length: 300, nullable: true, comment: '赛题附件原始文件名' })
  problemAttachmentName: string;

  @Column({ name: 'min_team_size', nullable: true, comment: '竞赛组最少成员数（不含组长，仅 contest 系统使用）' })
  minTeamSize: number;

  @Column({ name: 'max_team_size', nullable: true, comment: '竞赛组最多成员数（不含组长，仅 contest 系统使用）' })
  maxTeamSize: number;

  @Column({ name: 'scoring_criteria', type: 'json', nullable: true, comment: '评分标准 JSON [{name,maxScore,description,weight}]' })
  scoringCriteria: Array<{ name: string; maxScore: number; description?: string; weight?: number }> | null;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @OneToMany(() => UserRegistration, (registration) => registration.competition)
  registrations: UserRegistration[];
}
