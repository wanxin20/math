import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * 青年科学家奖评选 —— “从申报平台注册”的用户标记。
 *
 * 设计要点（关键：不影响三套系统）：
 * - **不修改共享的 `users` 表结构**，而是单独一张标记表；userId 与 users.id 对应（uuid 字符串），
 *   松关联不加外键。
 * - 该表**只建在 paper 库（teacher_research_platform）**、且只有本申报模块读写。reform/contest
 *   后端虽然也会加载本实体，但它们从不调用 /scientist 路由 → 永不查询此表 → 零影响。
 */
@Entity('scientist_registrant')
export class ScientistRegistrant {
  @PrimaryColumn({ type: 'varchar', length: 36, comment: '用户账号ID（=users.id）' })
  userId: string;

  @Column({ type: 'varchar', length: 20, default: 'scientist', comment: '注册来源' })
  source: string;

  @CreateDateColumn()
  createdAt: Date;
}
