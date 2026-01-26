import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentStatus } from '@/common/enums/payment-status.enum';
import { UserRegistration } from '../../registrations/entities/user-registration.entity';

@Entity('registration_payments')
export class RegistrationPayment {
  @PrimaryGeneratedColumn({ comment: '支付记录ID' })
  id: number;

  @Column({ name: 'registration_id', comment: '报名记录ID' })
  registrationId: number;

  @Column({
    name: 'payment_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    comment: '支付金额',
  })
  paymentAmount: number;

  @Column({ name: 'payment_method', length: 50, nullable: true, comment: '支付方式' })
  paymentMethod: string;

  @Column({
    name: 'payment_status',
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
    comment: '支付状态',
  })
  paymentStatus: PaymentStatus;

  @Column({
    name: 'payment_transaction_id',
    length: 100,
    nullable: true,
    comment: '商户订单号（PAY-xxx）',
  })
  paymentTransactionId: string;

  @Column({
    name: 'wechat_transaction_id',
    length: 100,
    nullable: true,
    comment: '微信支付交易号',
  })
  wechatTransactionId: string;

  @Column({ name: 'payment_time', type: 'timestamp', nullable: true, comment: '支付时间' })
  paymentTime: Date;

  @Column({
    name: 'refund_amount',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: '退款金额',
  })
  refundAmount: number;

  @Column({ name: 'refund_time', type: 'timestamp', nullable: true, comment: '退款时间' })
  refundTime: Date;

  @Column({ name: 'refund_reason', length: 500, nullable: true, comment: '退款原因' })
  refundReason: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @ManyToOne(() => UserRegistration, (registration) => registration.payments)
  @JoinColumn({ name: 'registration_id' })
  registration: UserRegistration;
}
