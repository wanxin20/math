-- 添加 REVISION_REQUIRED 状态到 user_registrations 表
-- Migration: 添加"需要修改"状态，用于管理员退回论文时使用

-- 修改 status 字段的枚举类型，添加 REVISION_REQUIRED
ALTER TABLE user_registrations 
MODIFY COLUMN status ENUM(
  'PENDING_SUBMISSION',
  'PENDING_PAYMENT', 
  'PAID',
  'SUBMITTED', 
  'REVISION_REQUIRED',
  'UNDER_REVIEW', 
  'REVIEWED', 
  'AWARDED', 
  'REJECTED'
) DEFAULT 'PENDING_SUBMISSION' COMMENT '报名状态';

-- 说明：
-- REVISION_REQUIRED: 需要修改（管理员退回论文，用户已支付，重新提交无需再次支付）
-- 状态流程：
-- 1. 首次提交：PENDING_SUBMISSION -> PENDING_PAYMENT -> SUBMITTED
-- 2. 管理员退回：SUBMITTED -> REVISION_REQUIRED
-- 3. 重新提交：REVISION_REQUIRED -> SUBMITTED（无需再次支付）
