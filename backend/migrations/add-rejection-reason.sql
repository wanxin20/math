-- 添加退回原因字段到 user_registrations 表
-- Migration: 添加管理员退回论文功能

ALTER TABLE user_registrations 
ADD COLUMN rejection_reason TEXT COMMENT '退回原因（管理员退回论文时填写）' AFTER invoice_email;
