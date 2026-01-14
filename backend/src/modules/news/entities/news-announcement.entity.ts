import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum NewsType {
  NOTICE = 'notice',
  NEWS = 'news',
  ANNOUNCEMENT = 'announcement',
  UPDATE = 'update',
}

export enum NewsPriority {
  NORMAL = 'normal',
  IMPORTANT = 'important',
  URGENT = 'urgent',
}

@Entity('news_announcements')
export class NewsAnnouncement {
  @PrimaryGeneratedColumn({ comment: '公告ID' })
  id: number;

  @Column({ length: 300, comment: '公告标题' })
  title: string;

  @Column({ type: 'text', nullable: true, comment: '公告内容' })
  content: string;

  @Column({ length: 500, nullable: true, comment: '摘要' })
  summary: string;

  @Column({
    type: 'enum',
    enum: NewsType,
    default: NewsType.NOTICE,
    comment: '公告类型',
  })
  type: NewsType;

  @Column({
    type: 'enum',
    enum: NewsPriority,
    default: NewsPriority.NORMAL,
    comment: '优先级',
  })
  priority: NewsPriority;

  @Column({ name: 'is_published', default: false, comment: '是否发布' })
  isPublished: boolean;

  @Column({ name: 'publish_date', type: 'date', nullable: true, comment: '发布日期' })
  publishDate: Date;

  @Column({ name: 'view_count', default: 0, comment: '浏览次数' })
  viewCount: number;

  @Column({ name: 'author_id', length: 36, nullable: true, comment: '发布者ID' })
  authorId: string;

  @CreateDateColumn({ name: 'created_at', comment: '创建时间' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', comment: '更新时间' })
  updatedAt: Date;
}
