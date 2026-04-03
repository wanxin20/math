-- 三个数据库（paper / reform / contest）都需要执行此 SQL
-- 原因：后端代码共享，TypeORM 查询会 JOIN team_members 表
-- paper/reform 库中此表将为空，不影响业务

-- 竞赛组成员表
CREATE TABLE IF NOT EXISTS `team_members` (
  `id` bigint NOT NULL AUTO_INCREMENT COMMENT '成员ID',
  `registration_id` bigint NOT NULL COMMENT '报名记录ID',
  `name` varchar(100) NOT NULL COMMENT '成员姓名',
  `institution` varchar(200) NOT NULL COMMENT '学校/单位',
  `title` varchar(100) DEFAULT NULL COMMENT '职称/年级',
  `phone` varchar(20) DEFAULT NULL COMMENT '手机号（选填）',
  `email` varchar(150) DEFAULT NULL COMMENT '邮箱（选填）',
  `sort_order` int NOT NULL DEFAULT 0 COMMENT '排序（用于证书出名顺序）',
  `created_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) COMMENT '创建时间',
  `updated_at` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6) COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `IDX_team_members_registration_id` (`registration_id`),
  CONSTRAINT `FK_team_members_registration` FOREIGN KEY (`registration_id`) REFERENCES `user_registrations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='竞赛组成员';

-- Competition 表新增团队人数限制字段
ALTER TABLE `competitions`
  ADD COLUMN `min_team_size` int DEFAULT NULL COMMENT '竞赛组最少成员数（不含组长）' AFTER `problem_attachment_name`,
  ADD COLUMN `max_team_size` int DEFAULT NULL COMMENT '竞赛组最多成员数（不含组长）' AFTER `min_team_size`;
