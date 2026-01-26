-- 添加微信交易号字段
-- 执行日期: 2026-01-26

USE teacher_research_platform;

-- 添加 wechat_transaction_id 字段
ALTER TABLE registration_payments 
ADD COLUMN wechat_transaction_id VARCHAR(100) NULL COMMENT '微信支付交易号' 
AFTER payment_transaction_id;

-- 更新字段注释
ALTER TABLE registration_payments 
MODIFY COLUMN payment_transaction_id VARCHAR(100) COMMENT '商户订单号（PAY-xxx）';

-- 添加索引
ALTER TABLE registration_payments 
ADD INDEX idx_wechat_transaction_id (wechat_transaction_id);

-- 查看表结构
DESCRIBE registration_payments;
