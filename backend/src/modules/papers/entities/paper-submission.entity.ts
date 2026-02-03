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

@Entity('paper_submissions')
export class PaperSubmission {
  @PrimaryGeneratedColumn({ comment: '提交记录ID' })
  id: number;

  @Column({ name: 'registration_id', unique: true, comment: '报名记录ID' })
  registrationId: number;

  @Column({ name: 'paper_title', length: 300, comment: '论文标题' })
  paperTitle: string;

  @Column({ name: 'paper_abstract', type: 'text', nullable: true, comment: '论文摘要' })
  paperAbstract: string;

  @Column({ name: 'paper_keywords', length: 500, nullable: true, comment: '关键词' })
  paperKeywords: string;

  @Column({ name: 'submission_file_name', length: 255, comment: '提交文件名' })
  submissionFileName: string;

  @Column({ name: 'submission_file_url', length: 500, comment: '提交文件URL' })
  submissionFileUrl: string;

  @Column({ name: 'submission_file_size', type: 'bigint', nullable: true, comment: '文件大小' })
  submissionFileSize: number;

  @Column({ name: 'submission_file_type', length: 50, nullable: true, comment: '文件类型' })
  submissionFileType: string;

  /** 多文件：JSON 数组 [{ fileName, fileUrl, size?, mimetype? }]，为空则使用上面单文件字段 */
  @Column({ name: 'submission_files', type: 'json', nullable: true, comment: '多文件列表' })
  submissionFiles: Array<{ fileName: string; fileUrl: string; size?: number; mimetype?: string }> | null;

  @Column({
    name: 'submission_time',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    comment: '提交时间',
  })
  submissionTime: Date;

  @Column({ name: 'is_final', default: true, comment: '是否为最终版本' })
  isFinal: boolean;

  @Column({ default: 1, comment: '版本号' })
  version: number;

  @Column({ name: 'author_count', default: 1, comment: '作者数量' })
  authorCount: number;

  @Column({ name: 'co_authors', length: 500, nullable: true, comment: '合作作者（JSON数组）' })
  coAuthors: string;

  @Column({ name: 'research_field', length: 100, nullable: true, comment: '研究领域' })
  researchField: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;

  // 关联关系
  @OneToOne(() => UserRegistration, (registration) => registration.paperSubmission)
  @JoinColumn({ name: 'registration_id' })
  registration: UserRegistration;
}
