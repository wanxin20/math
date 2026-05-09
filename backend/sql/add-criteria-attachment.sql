-- 评审标准附件功能数据库迁移
-- ⚠️ 三个数据库(paper/reform/contest)都必须执行，否则共享代码查询时会报列不存在
-- 用途：管理员可在 Competition 上传评审标准文件（Word/PDF），评委打分时可下载查看原文

ALTER TABLE competitions
  ADD COLUMN criteria_attachment_url VARCHAR(1000) DEFAULT NULL COMMENT '评审标准附件URL（评委可下载查看）',
  ADD COLUMN criteria_attachment_name VARCHAR(300) DEFAULT NULL COMMENT '评审标准附件原始文件名';
