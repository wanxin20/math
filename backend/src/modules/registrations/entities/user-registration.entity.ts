import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { RegistrationStatus } from '@/common/enums/registration-status.enum';
import { User } from '../../users/entities/user.entity';
import { Competition } from '../../competitions/entities/competition.entity';
import { RegistrationPayment } from '../../payments/entities/registration-payment.entity';
import { PaperSubmission } from '../../papers/entities/paper-submission.entity';
import { AwardRecord } from '../../awards/entities/award-record.entity';

@Entity('user_registrations')
export class UserRegistration {
  @PrimaryGeneratedColumn({ comment: '报名记录ID' })
  id: number;

  @Column({ name: 'user_id', length: 36, comment: '用户ID' })
  userId: string;

  @Column({ name: 'competition_id', length: 50, comment: '评选项目ID' })
  competitionId: string;

  @Column({
    type: 'enum',
    enum: RegistrationStatus,
    default: RegistrationStatus.PENDING_SUBMISSION,
    comment: '报名状态',
  })
  status: RegistrationStatus;

  @Column({
    name: 'registration_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '报名时间',
  })
  registrationTime: Date;

  @Column({ type: 'text', nullable: true, comment: '备注信息' })
  notes: string;

  @Column({ name: 'need_invoice', type: 'tinyint', default: 0, comment: '是否需要发票（0否1是）' })
  needInvoice: number;

  @Column({ name: 'invoice_title', type: 'varchar', length: 200, nullable: true, comment: '发票抬头' })
  invoiceTitle: string | null;

  @Column({ name: 'invoice_tax_no', type: 'varchar', length: 50, nullable: true, comment: '纳税人识别号/税号' })
  invoiceTaxNo: string | null;

  @Column({ name: 'invoice_address', type: 'varchar', length: 500, nullable: true, comment: '发票地址' })
  invoiceAddress: string | null;

  @Column({ name: 'invoice_phone', type: 'varchar', length: 30, nullable: true, comment: '发票联系电话' })
  invoicePhone: string | null;

  @Column({ name: 'invoice_email', type: 'varchar', length: 100, nullable: true, comment: '发票邮箱' })
  invoiceEmail: string | null;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => User, (user) => user.registrations)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Competition, (competition) => competition.registrations)
  @JoinColumn({ name: 'competition_id' })
  competition: Competition;

  @OneToMany(() => RegistrationPayment, (payment) => payment.registration)
  payments: RegistrationPayment[];

  @OneToOne(() => PaperSubmission, (submission) => submission.registration)
  paperSubmission: PaperSubmission;

  @OneToOne(() => AwardRecord, (award) => award.registration)
  awardRecord: AwardRecord;
}
