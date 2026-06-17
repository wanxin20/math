import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/** 申报材料附件项 */
export interface ScientistMaterial {
  /** 类别：form 申报表 / certificate 证件 / papers 代表性论文 / attachment 其他附件 / memberForm 会员申请表 */
  category: string;
  fileName: string;
  fileUrl: string;
  size?: number;
  mimetype?: string;
}

export enum ScientistApplicationStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
}

/**
 * 青年科学家奖评选 - 在线申报记录
 * 仅用于 contest 系统（teacher_research_contest 库）。一人一份（userId 唯一），可修改/补交。
 * 与 contest 竞赛的报名/缴费/评审表完全独立，不影响其逻辑。
 */
@Entity('scientist_application')
export class ScientistApplication {
  @PrimaryGeneratedColumn()
  id: number;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 36, comment: '申报人账号ID（一人一份）' })
  userId: string;

  @Column({ type: 'varchar', length: 100, comment: '申报人姓名' })
  name: string;

  @Column({ type: 'date', nullable: true, comment: '出生年月' })
  birthDate: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true, comment: '性别' })
  gender: string | null;

  @Column({ type: 'varchar', length: 200, comment: '工作单位' })
  institution: string;

  @Column({ type: 'varchar', length: 100, nullable: true, comment: '职称/职务' })
  title: string | null;

  @Column({ type: 'varchar', length: 30, comment: '手机' })
  phone: string;

  @Column({ type: 'varchar', length: 120, comment: '邮箱' })
  email: string;

  @Column({ type: 'varchar', length: 200, nullable: true, comment: '研究方向' })
  researchField: string | null;

  @Column({ type: 'boolean', default: false, comment: '是否学会会员' })
  isSocietyMember: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: '是否愿意赞助/参与/协办学会举办的学术会议',
  })
  willingSponsorConference: boolean;

  @Column({ type: 'json', nullable: true, comment: '材料附件清单' })
  materials: ScientistMaterial[] | null;

  @Column({ type: 'text', nullable: true, comment: '备注' })
  notes: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    default: ScientistApplicationStatus.SUBMITTED,
    comment: '状态：draft/submitted',
  })
  status: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
