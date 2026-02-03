-- 报名表增加发票相关字段
ALTER TABLE user_registrations
ADD COLUMN need_invoice TINYINT(1) DEFAULT 0 COMMENT '是否需要发票（0否1是）' AFTER notes,
ADD COLUMN invoice_title VARCHAR(200) NULL COMMENT '发票抬头' AFTER need_invoice,
ADD COLUMN invoice_tax_no VARCHAR(50) NULL COMMENT '纳税人识别号/税号' AFTER invoice_title,
ADD COLUMN invoice_address VARCHAR(500) NULL COMMENT '发票地址' AFTER invoice_tax_no,
ADD COLUMN invoice_phone VARCHAR(30) NULL COMMENT '发票联系电话' AFTER invoice_address,
ADD COLUMN invoice_email VARCHAR(100) NULL COMMENT '发票邮箱' AFTER invoice_phone;
