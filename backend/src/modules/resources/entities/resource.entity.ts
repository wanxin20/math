import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('resources')
export class Resource {
  @PrimaryGeneratedColumn({ comment: '资源ID' })
  id: number;

  @Column({ length: 200, comment: '资源名称' })
  name: string;

  @Column({ type: 'text', nullable: true, comment: '资源描述' })
  description: string;

  @Column({ length: 50, comment: '资源类型' })
  type: string;

  @Column({ length: 50, nullable: true, comment: '资源分类' })
  category: string;

  @Column({ name: 'file_url', length: 500, comment: '文件URL' })
  fileUrl: string;

  @Column({ name: 'file_size', type: 'bigint', nullable: true, comment: '文件大小（字节）' })
  fileSize: number;

  @Column({ name: 'download_count', default: 0, comment: '下载次数' })
  downloadCount: number;

  @Column({ name: 'is_public', default: true, comment: '是否公开' })
  isPublic: boolean;

  @Column({ name: 'sort_order', default: 0, comment: '排序顺序' })
  sortOrder: number;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
