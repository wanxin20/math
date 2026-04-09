import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserRegistration } from './user-registration.entity';

@Entity('advisors')
export class Advisor {
  @PrimaryGeneratedColumn({ comment: '指导老师ID' })
  id: number;

  @Column({ name: 'registration_id', comment: '报名记录ID' })
  registrationId: number;

  @Column({ length: 100, comment: '姓名' })
  name: string;

  @Column({ length: 200, comment: '学校/单位' })
  institution: string;

  @Column({ length: 100, nullable: true, comment: '职称' })
  title: string;

  @Column({ length: 20, comment: '手机号（必填）' })
  phone: string;

  @Column({ length: 150, nullable: true, comment: '邮箱（选填）' })
  email: string;

  @Column({ name: 'sort_order', default: 0, comment: '排序' })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  @ManyToOne(() => UserRegistration, (registration) => registration.advisors, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'registration_id' })
  registration: UserRegistration;
}
