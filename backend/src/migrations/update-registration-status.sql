-- ================================================================
-- 更新 user_registrations 表的 status 枚举值
-- 添加日期: 2026-02-06
-- 说明: 更新报名状态枚举，支持新的工作流程
-- ================================================================

USE teacher_research_platform;

-- 1. 修改 status 字段的枚举值
ALTER TABLE user_registrations 
MODIFY COLUMN status ENUM(
  'PENDING_SUBMISSION',  -- 待提交（可上传文件暂存）
  'PENDING_PAYMENT',     -- 待支付（点击提交后）
  'SUBMITTED',           -- 已提交（支付成功）
  'UNDER_REVIEW',        -- 评审中
  'REVIEWED',            -- 已评审
  'AWARDED',             -- 已获奖
  'REJECTED'             -- 已拒绝
) DEFAULT 'PENDING_SUBMISSION' COMMENT '报名状态';

-- 2. 更新现有数据：将旧的 PENDING_PAYMENT 状态（没有文件上传的）更新为 PENDING_SUBMISSION
-- 如果已经有文件上传，保持 PENDING_PAYMENT 状态
UPDATE user_registrations ur
SET ur.status = 'PENDING_SUBMISSION'
WHERE ur.status = 'PENDING_PAYMENT'
  AND NOT EXISTS (
    SELECT 1 FROM paper_submissions ps 
    WHERE ps.registration_id = ur.id
  );

-- 3. 更新现有数据：将旧的 PAID 状态更新为 SUBMITTED
-- 注意：如果你的数据库中有 PAID 状态，需要先临时添加到枚举中
-- 如果没有 PAID 状态的数据，可以跳过这一步

-- 4. 验证更新结果
SELECT 
  status, 
  COUNT(*) as count 
FROM user_registrations 
GROUP BY status;

-- ================================================================
-- 执行说明
-- ================================================================
/*
在服务器上执行此脚本：

1. 备份数据库（重要！）：
   mysqldump -u root -p teacher_research_platform > backup_$(date +%Y%m%d_%H%M%S).sql

2. 执行迁移脚本：
   mysql -u root -p teacher_research_platform < update-registration-status.sql

3. 验证结果：
   mysql -u root -p teacher_research_platform -e "SHOW COLUMNS FROM user_registrations LIKE 'status';"

4. 测试应用程序功能是否正常
*/
