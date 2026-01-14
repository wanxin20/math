import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { UserRegistration } from '../../registrations/entities/user-registration.entity';

@Entity('award_records')
export class AwardRecord {
  @PrimaryGeneratedColumn({ comment: '获奖记录ID' })
  id: number;

  @Column({ name: 'registration_id', unique: true, comment: '报名记录ID' })
  registrationId: number;

  @Column({ name: 'award_level', length: 50, comment: '获奖等级' })
  awardLevel: string;

  @Column({ name: 'certificate_number', length: 100, nullable: true, comment: '证书编号' })
  certificateNumber: string;

  @Column({ name: 'certificate_url', length: 500, nullable: true, comment: '证书下载链接' })
  certificateUrl: string;

  @Column({ name: 'award_date', type: 'date', nullable: true, comment: '获奖日期' })
  awardDate: Date;

  @Column({ name: 'is_published', default: false, comment: '是否公示' })
  isPublished: boolean;

  @Column({ name: 'publish_date', type: 'date', nullable: true, comment: '公示日期' })
  publishDate: Date;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  remarks: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @OneToOne(() => UserRegistration, (registration) => registration.awardRecord)
  @JoinColumn({ name: 'registration_id' })
  registration: UserRegistration;
}
