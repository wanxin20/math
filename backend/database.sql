-- ================================================================
-- 教师教研论文评选平台数据库设计
-- Database Design for Teacher Research Paper Selection Platform
-- ================================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS teacher_research_platform 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE teacher_research_platform;

-- ================================================================
-- 1. 用户表 (Users Table)
-- 存储教师用户的基本信息
-- ================================================================
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY COMMENT '用户唯一标识',
    name VARCHAR(100) NOT NULL COMMENT '教师姓名',
    email VARCHAR(150) NOT NULL UNIQUE COMMENT '电子邮箱',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希值',
    institution VARCHAR(200) NOT NULL COMMENT '任教单位/学校',
    title VARCHAR(100) NOT NULL COMMENT '职称/职务',
    phone VARCHAR(20) NOT NULL COMMENT '手机号码',
    avatar_url VARCHAR(500) COMMENT '头像URL',
    status ENUM('active', 'suspended', 'deleted') DEFAULT 'active' COMMENT '账户状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    last_login_at TIMESTAMP NULL COMMENT '最后登录时间',
    INDEX idx_email (email),
    INDEX idx_phone (phone),
    INDEX idx_institution (institution)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ================================================================
-- 2. 竞赛/评选项目表 (Competitions Table)
-- 存储各类教研论文评选活动信息
-- ================================================================
CREATE TABLE competitions (
    id VARCHAR(50) PRIMARY KEY COMMENT '评选项目ID',
    title VARCHAR(200) NOT NULL COMMENT '评选标题',
    description TEXT COMMENT '评选描述',
    category VARCHAR(50) NOT NULL COMMENT '评选类别（基础教育/教学创新/教育技术）',
    fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '评审费用（元）',
    deadline DATE NOT NULL COMMENT '截止日期',
    start_date DATE COMMENT '开始日期',
    -- max_participants INT COMMENT '最大参与人数',
    current_participants INT DEFAULT 0 COMMENT '当前参与人数',
    status ENUM('draft', 'open', 'closed', 'completed') DEFAULT 'draft' COMMENT '项目状态',
    cover_image_url VARCHAR(500) COMMENT '封面图片URL',
    guidelines TEXT COMMENT '申报指南/竞赛规则',
    award_info TEXT COMMENT '奖项设置说明',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_category (category),
    INDEX idx_deadline (deadline),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='竞赛评选项目表';

-- ================================================================
-- 3. 用户报名表 (User Registrations Table)
-- 存储用户参与评选的基本报名记录
-- ================================================================
CREATE TABLE user_registrations (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '报名记录ID',
    user_id VARCHAR(36) NOT NULL COMMENT '用户ID',
    competition_id VARCHAR(50) NOT NULL COMMENT '评选项目ID',
    status ENUM('PENDING_PAYMENT', 'PAID', 'SUBMITTED', 'UNDER_REVIEW', 'REVIEWED', 'AWARDED', 'REJECTED') 
        DEFAULT 'PENDING_PAYMENT' COMMENT '报名状态',
    registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '报名时间',
    notes TEXT COMMENT '备注信息',
    need_invoice TINYINT(1) DEFAULT 0 COMMENT '是否需要发票（0否1是）',
    invoice_title VARCHAR(200) COMMENT '发票抬头',
    invoice_tax_no VARCHAR(50) COMMENT '纳税人识别号/税号',
    invoice_address VARCHAR(500) COMMENT '发票地址',
    invoice_phone VARCHAR(30) COMMENT '发票联系电话',
    invoice_email VARCHAR(100) COMMENT '发票邮箱（接收电子发票）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    UNIQUE KEY uk_user_competition (user_id, competition_id),
    INDEX idx_user_id (user_id),
    INDEX idx_competition_id (competition_id),
    INDEX idx_status (status),
    INDEX idx_registration_time (registration_time),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户报名表';

-- ================================================================
-- 4. 支付记录表 (Registration Payments Table)
-- 存储报名的支付信息
-- ================================================================
CREATE TABLE registration_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '支付记录ID',
    registration_id BIGINT NOT NULL COMMENT '报名记录ID',
    payment_amount DECIMAL(10, 2) NOT NULL COMMENT '支付金额',
    payment_method VARCHAR(50) COMMENT '支付方式（微信/支付宝/银行转账）',
    payment_status ENUM('pending', 'success', 'failed', 'refunded') DEFAULT 'pending' COMMENT '支付状态',
    payment_transaction_id VARCHAR(100) COMMENT '商户订单号（PAY-xxx）',
    wechat_transaction_id VARCHAR(100) COMMENT '微信支付交易号',
    payment_time TIMESTAMP NULL COMMENT '支付时间',
    refund_amount DECIMAL(10, 2) COMMENT '退款金额',
    refund_time TIMESTAMP NULL COMMENT '退款时间',
    refund_reason VARCHAR(500) COMMENT '退款原因',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_registration_id (registration_id),
    INDEX idx_payment_status (payment_status),
    INDEX idx_payment_time (payment_time),
    INDEX idx_transaction_id (payment_transaction_id),
    FOREIGN KEY (registration_id) REFERENCES user_registrations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='支付记录表';

-- ================================================================
-- 5. 论文提交表 (Paper Submissions Table)
-- 存储论文提交的详细信息
-- ================================================================
CREATE TABLE paper_submissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '提交记录ID',
    registration_id BIGINT NOT NULL UNIQUE COMMENT '报名记录ID',
    paper_title VARCHAR(300) NOT NULL COMMENT '论文标题',
    paper_abstract TEXT COMMENT '论文摘要',
    paper_keywords VARCHAR(500) COMMENT '关键词',
    
    -- 文件信息
    submission_file_name VARCHAR(255) NOT NULL COMMENT '提交文件名',
    submission_file_url VARCHAR(500) NOT NULL COMMENT '提交文件URL',
    submission_file_size BIGINT COMMENT '文件大小（字节）',
    submission_file_type VARCHAR(50) COMMENT '文件类型（pdf/doc/zip）',
    
    -- 提交信息
    submission_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
    is_final BOOLEAN DEFAULT TRUE COMMENT '是否为最终版本',
    version INT DEFAULT 1 COMMENT '版本号',
    
    -- 额外信息
    author_count INT DEFAULT 1 COMMENT '作者数量',
    co_authors VARCHAR(500) COMMENT '合作作者（JSON数组）',
    research_field VARCHAR(100) COMMENT '研究领域',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_registration_id (registration_id),
    INDEX idx_submission_time (submission_time),
    INDEX idx_research_field (research_field),
    FOREIGN KEY (registration_id) REFERENCES user_registrations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='论文提交表';

-- ================================================================
-- 6. 论文评审表 (Paper Reviews Table)
-- 存储论文的评审信息（支持多轮评审）
-- ================================================================
CREATE TABLE paper_reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '评审记录ID',
    registration_id BIGINT NOT NULL COMMENT '报名记录ID',
    reviewer_id VARCHAR(36) NOT NULL COMMENT '评审专家ID',
    
    -- 评审信息
    review_round INT DEFAULT 1 COMMENT '评审轮次（1-初审/2-复审/3-终审）',
    review_score DECIMAL(5, 2) COMMENT '评审分数',
    review_comments TEXT COMMENT '评审意见',
    review_result ENUM('passed', 'failed', 'revision_required', 'pending') DEFAULT 'pending' COMMENT '评审结果',
    
    -- 详细评分（可选）
    score_innovation DECIMAL(5, 2) COMMENT '创新性得分',
    score_academic DECIMAL(5, 2) COMMENT '学术性得分',
    score_practicality DECIMAL(5, 2) COMMENT '实用性得分',
    score_writing DECIMAL(5, 2) COMMENT '写作质量得分',
    
    review_time TIMESTAMP NULL COMMENT '评审时间',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_registration_id (registration_id),
    INDEX idx_reviewer_id (reviewer_id),
    INDEX idx_review_round (review_round),
    INDEX idx_review_result (review_result),
    INDEX idx_review_time (review_time),
    FOREIGN KEY (registration_id) REFERENCES user_registrations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='论文评审表';

-- ================================================================
-- 7. 获奖记录表 (Award Records Table)
-- 存储最终获奖信息
-- ================================================================
CREATE TABLE award_records (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '获奖记录ID',
    registration_id BIGINT NOT NULL UNIQUE COMMENT '报名记录ID',
    award_level VARCHAR(50) NOT NULL COMMENT '获奖等级（特等奖/一等奖/二等奖/三等奖/优秀奖）',
    certificate_number VARCHAR(100) COMMENT '证书编号',
    certificate_url VARCHAR(500) COMMENT '证书下载链接',
    award_date DATE COMMENT '获奖日期',
    is_published BOOLEAN DEFAULT FALSE COMMENT '是否公示',
    publish_date DATE COMMENT '公示日期',
    remarks TEXT COMMENT '备注',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    
    INDEX idx_registration_id (registration_id),
    INDEX idx_award_level (award_level),
    INDEX idx_award_date (award_date),
    INDEX idx_certificate_number (certificate_number),
    FOREIGN KEY (registration_id) REFERENCES user_registrations(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='获奖记录表';

-- ================================================================
-- 8. 资源模板表 (Templates/Resources Table)
-- 存储论文模板、申报表等教研资源
-- ================================================================
CREATE TABLE resources (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '资源ID',
    name VARCHAR(200) NOT NULL COMMENT '资源名称',
    description TEXT COMMENT '资源描述',
    type VARCHAR(50) NOT NULL COMMENT '资源类型（doc/pdf/xls/video等）',
    category VARCHAR(50) COMMENT '资源分类（论文模板/申报表/视频教程等）',
    file_url VARCHAR(500) NOT NULL COMMENT '文件URL',
    file_size BIGINT COMMENT '文件大小（字节）',
    download_count INT DEFAULT 0 COMMENT '下载次数',
    is_public BOOLEAN DEFAULT TRUE COMMENT '是否公开',
    sort_order INT DEFAULT 0 COMMENT '排序顺序',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_sort_order (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='教研资源表';

-- ================================================================
-- 9. 新闻公告表 (News & Announcements Table)
-- 存储平台通知公告信息
-- ================================================================
CREATE TABLE news_announcements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '公告ID',
    title VARCHAR(300) NOT NULL COMMENT '公告标题',
    content TEXT COMMENT '公告内容',
    summary VARCHAR(500) COMMENT '摘要',
    type ENUM('notice', 'news', 'announcement', 'update') DEFAULT 'notice' COMMENT '公告类型',
    priority ENUM('normal', 'important', 'urgent') DEFAULT 'normal' COMMENT '优先级',
    is_published BOOLEAN DEFAULT FALSE COMMENT '是否发布',
    publish_date DATE COMMENT '发布日期',
    view_count INT DEFAULT 0 COMMENT '浏览次数',
    author_id VARCHAR(36) COMMENT '发布者ID',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_publish_date (publish_date),
    INDEX idx_type (type),
    INDEX idx_priority (priority),
    INDEX idx_is_published (is_published)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='新闻公告表';

-- ================================================================
-- 10. 评审专家表 (Reviewers Table)
-- 存储评审专家信息
-- ================================================================
CREATE TABLE reviewers (
    id VARCHAR(36) PRIMARY KEY COMMENT '评审专家ID',
    name VARCHAR(100) NOT NULL COMMENT '专家姓名',
    email VARCHAR(150) NOT NULL UNIQUE COMMENT '电子邮箱',
    institution VARCHAR(200) COMMENT '所在单位',
    title VARCHAR(100) COMMENT '职称',
    expertise_areas VARCHAR(500) COMMENT '专业领域（JSON数组）',
    bio TEXT COMMENT '个人简介',
    status ENUM('active', 'inactive') DEFAULT 'active' COMMENT '状态',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评审专家表';

-- ================================================================
-- 11. AI聊天记录表 (AI Chat History Table)
-- 存储用户与AI助手的对话记录
-- ================================================================
CREATE TABLE ai_chat_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '聊天记录ID',
    user_id VARCHAR(36) COMMENT '用户ID（可为空，游客也可使用）',
    session_id VARCHAR(100) NOT NULL COMMENT '会话ID',
    role ENUM('user', 'assistant', 'system') NOT NULL COMMENT '角色',
    message TEXT NOT NULL COMMENT '消息内容',
    language VARCHAR(10) DEFAULT 'zh' COMMENT '语言（zh/en）',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_id (user_id),
    INDEX idx_session_id (session_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI聊天记录表';

-- ================================================================
-- 12. 系统配置表 (System Configuration Table)
-- 存储系统全局配置信息
-- ================================================================
CREATE TABLE system_config (
    id INT AUTO_INCREMENT PRIMARY KEY COMMENT '配置ID',
    config_key VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键',
    config_value TEXT COMMENT '配置值',
    description VARCHAR(500) COMMENT '配置说明',
    category VARCHAR(50) COMMENT '配置分类',
    is_editable BOOLEAN DEFAULT TRUE COMMENT '是否可编辑',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_config_key (config_key),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ================================================================
-- 13. 操作日志表 (Audit Logs Table)
-- 记录重要操作的审计日志
-- ================================================================
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
    user_id VARCHAR(36) COMMENT '操作用户ID',
    action VARCHAR(100) NOT NULL COMMENT '操作类型（login/register/payment/submit等）',
    resource_type VARCHAR(50) COMMENT '资源类型（user/competition/registration等）',
    resource_id VARCHAR(100) COMMENT '资源ID',
    details TEXT COMMENT '操作详情（JSON格式）',
    ip_address VARCHAR(45) COMMENT 'IP地址',
    user_agent VARCHAR(500) COMMENT '用户代理',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
    INDEX idx_user_id (user_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作审计日志表';

-- ================================================================
-- 初始化数据 (Initial Data)
-- ================================================================

-- 插入初始竞赛项目
INSERT INTO competitions (id, title, description, category, fee, deadline, start_date, status) VALUES
('pedagogy-2024', '2024年度全国基础教育教学研究论文大赛', '旨在挖掘一线教师的教学实践智慧，推动课程改革与教学方法创新。', '基础教育', 200.00, '2024-10-15', '2024-05-01', 'open'),
('innovation-2024', '"卓越课堂"教学创新案例评选', '重点考察课堂教学模式的突破，通过教学录像与设计方案进行综合评定。', '教学创新', 150.00, '2024-11-20', '2024-06-01', 'open'),
('edtech-2024', '智慧教育与数字化校园建设专项论文奖', '探讨AI与大数据技术在现代校园管理与课堂教学中的深度融合应用。', '教育技术', 180.00, '2024-12-05', '2024-07-01', 'open');

-- 插入初始资源模板
INSERT INTO resources (name, description, type, category, file_url, sort_order) VALUES
('教研论文标准 Word 模版', '符合学会规范的论文排版格式', 'doc', '论文模板', '#', 1),
('教学设计案例申报表', '教学创新案例评选专用申报表', 'doc', '申报表', '#', 2),
('参考文献引用规范 (APA/MLA)', '标准学术引用格式说明文档', 'pdf', '写作规范', '#', 3),
('评审标准评分表(参考)', '论文评审标准与评分细则', 'xls', '评审标准', '#', 4);

-- 插入初始新闻公告
INSERT INTO news_announcements (title, summary, type, priority, is_published, publish_date) VALUES
('关于2024年度教育教学研究论文格式要求的补充通知', '请各位教师注意论文格式的最新要求变更', 'notice', 'important', TRUE, '2024-05-20'),
('学会新版教师教研成果 LaTeX 模板正式发布', '提供更专业的排版选择', 'news', 'normal', TRUE, '2024-05-15'),
('"卓越课堂"教学创新案例评选第一阶段结果公示', '第一阶段入围名单已公布', 'announcement', 'important', TRUE, '2024-05-10');

-- 插入系统配置
INSERT INTO system_config (config_key, config_value, description, category) VALUES
('site_name', 'XXXX教师论文竞赛平台', '网站名称', 'general'),
('support_email', 'support@example.com', '客服邮箱', 'contact'),
('max_file_size', '52428800', '最大上传文件大小（字节，默认50MB）', 'upload'),
('allowed_file_types', 'pdf,doc,docx,zip', '允许上传的文件类型', 'upload');

-- ================================================================
-- 视图 (Views)
-- ================================================================

-- 创建用户报名统计视图
CREATE OR REPLACE VIEW v_registration_statistics AS
SELECT 
    c.id AS competition_id,
    c.title AS competition_title,
    c.category,
    COUNT(ur.id) AS total_registrations,
    SUM(CASE WHEN ur.status = 'PENDING_PAYMENT' THEN 1 ELSE 0 END) AS pending_payment,
    SUM(CASE WHEN ur.status = 'PAID' THEN 1 ELSE 0 END) AS paid,
    SUM(CASE WHEN ur.status = 'SUBMITTED' THEN 1 ELSE 0 END) AS submitted,
    SUM(CASE WHEN ur.status IN ('UNDER_REVIEW', 'REVIEWED') THEN 1 ELSE 0 END) AS under_review,
    SUM(CASE WHEN ur.status = 'AWARDED' THEN 1 ELSE 0 END) AS awarded,
    SUM(rp.payment_amount) AS total_revenue
FROM competitions c
LEFT JOIN user_registrations ur ON c.id = ur.competition_id
LEFT JOIN registration_payments rp ON ur.id = rp.registration_id AND rp.payment_status = 'success'
GROUP BY c.id, c.title, c.category;

-- 创建用户参与详情视图
CREATE OR REPLACE VIEW v_user_participation AS
SELECT 
    u.id AS user_id,
    u.name AS user_name,
    u.email,
    u.institution,
    u.title AS user_title,
    COUNT(ur.id) AS total_participations,
    COUNT(ar.id) AS awards_count,
    MAX(ur.registration_time) AS last_participation_date
FROM users u
LEFT JOIN user_registrations ur ON u.id = ur.user_id
LEFT JOIN award_records ar ON ur.id = ar.registration_id
GROUP BY u.id, u.name, u.email, u.institution, u.title;

-- 创建报名完整信息视图（关联所有相关表）
CREATE OR REPLACE VIEW v_registration_full_details AS
SELECT 
    ur.id AS registration_id,
    ur.user_id,
    u.name AS user_name,
    u.email AS user_email,
    u.institution,
    ur.competition_id,
    c.title AS competition_title,
    c.category AS competition_category,
    ur.status,
    ur.registration_time,
    
    -- 支付信息
    rp.payment_amount,
    rp.payment_method,
    rp.payment_status,
    rp.payment_time,
    rp.payment_transaction_id,
    
    -- 论文信息
    ps.paper_title,
    ps.paper_abstract,
    ps.submission_file_name,
    ps.submission_time,
    
    -- 评审信息
    (SELECT AVG(review_score) FROM paper_reviews WHERE registration_id = ur.id) AS avg_review_score,
    (SELECT COUNT(*) FROM paper_reviews WHERE registration_id = ur.id) AS review_count,
    
    -- 获奖信息
    ar.award_level,
    ar.certificate_number,
    ar.award_date
    
FROM user_registrations ur
INNER JOIN users u ON ur.user_id = u.id
INNER JOIN competitions c ON ur.competition_id = c.id
LEFT JOIN registration_payments rp ON ur.id = rp.registration_id AND rp.payment_status = 'success'
LEFT JOIN paper_submissions ps ON ur.id = ps.registration_id
LEFT JOIN award_records ar ON ur.id = ar.registration_id;

-- ================================================================
-- 存储过程 (Stored Procedures)
-- ================================================================

-- 创建用户报名存储过程
DELIMITER //
CREATE PROCEDURE sp_create_registration(
    IN p_user_id VARCHAR(36),
    IN p_competition_id VARCHAR(50),
    OUT p_registration_id BIGINT,
    OUT p_error_message VARCHAR(500)
)
BEGIN
    DECLARE v_exists INT;
    DECLARE v_fee DECIMAL(10,2);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        SET p_error_message = '系统错误，报名失败';
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    -- 检查是否已经报名
    SELECT COUNT(*) INTO v_exists 
    FROM user_registrations 
    WHERE user_id = p_user_id AND competition_id = p_competition_id;
    
    IF v_exists > 0 THEN
        SET p_error_message = '您已经报名过该评选项目';
        ROLLBACK;
    ELSE
        -- 获取评审费
        SELECT fee INTO v_fee FROM competitions WHERE id = p_competition_id;
        
        -- 插入报名记录
        INSERT INTO user_registrations (user_id, competition_id, status)
        VALUES (p_user_id, p_competition_id, 'PENDING_PAYMENT');
        
        SET p_registration_id = LAST_INSERT_ID();
        
        -- 创建支付记录
        INSERT INTO registration_payments (registration_id, payment_amount, payment_status)
        VALUES (p_registration_id, v_fee, 'pending');
        
        SET p_error_message = NULL;
        
        -- 更新竞赛参与人数
        UPDATE competitions 
        SET current_participants = current_participants + 1 
        WHERE id = p_competition_id;
        
        COMMIT;
    END IF;
END //
DELIMITER ;

-- ================================================================
-- 触发器 (Triggers)
-- ================================================================

-- 创建支付成功后自动更新报名状态的触发器
DELIMITER //
CREATE TRIGGER tr_after_payment_success
AFTER UPDATE ON registration_payments
FOR EACH ROW
BEGIN
    IF NEW.payment_status = 'success' AND OLD.payment_status != 'success' THEN
        -- 更新报名状态为已支付
        UPDATE user_registrations 
        SET status = 'PAID' 
        WHERE id = NEW.registration_id AND status = 'PENDING_PAYMENT';
        
        -- 记录支付日志
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
        SELECT ur.user_id, 'payment_completed', 'registration', NEW.registration_id,
               JSON_OBJECT('competition_id', ur.competition_id, 'amount', NEW.payment_amount, 'transaction_id', NEW.payment_transaction_id)
        FROM user_registrations ur
        WHERE ur.id = NEW.registration_id;
    END IF;
END //
DELIMITER ;

-- 创建论文提交后自动更新报名状态的触发器
DELIMITER //
CREATE TRIGGER tr_after_paper_submission
AFTER INSERT ON paper_submissions
FOR EACH ROW
BEGIN
    -- 更新报名状态为已提交
    UPDATE user_registrations 
    SET status = 'SUBMITTED' 
    WHERE id = NEW.registration_id;
    
    -- 记录提交日志
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
    SELECT ur.user_id, 'paper_submitted', 'registration', NEW.registration_id,
           JSON_OBJECT('competition_id', ur.competition_id, 'paper_title', NEW.paper_title, 'file_name', NEW.submission_file_name)
    FROM user_registrations ur
    WHERE ur.id = NEW.registration_id;
END //
DELIMITER ;

-- 创建评审完成后自动更新报名状态的触发器
DELIMITER //
CREATE TRIGGER tr_after_review_completed
AFTER INSERT ON paper_reviews
FOR EACH ROW
BEGIN
    DECLARE v_total_reviews INT;
    DECLARE v_required_reviews INT DEFAULT 2; -- 默认需要2位专家评审
    
    -- 统计该论文的评审数量
    SELECT COUNT(*) INTO v_total_reviews 
    FROM paper_reviews 
    WHERE registration_id = NEW.registration_id AND review_result != 'pending';
    
    -- 如果达到要求的评审数量，更新状态
    IF v_total_reviews >= v_required_reviews THEN
        UPDATE user_registrations 
        SET status = 'REVIEWED' 
        WHERE id = NEW.registration_id AND status = 'UNDER_REVIEW';
    ELSIF v_total_reviews = 1 THEN
        -- 第一次评审后更新为评审中
        UPDATE user_registrations 
        SET status = 'UNDER_REVIEW' 
        WHERE id = NEW.registration_id AND status = 'SUBMITTED';
    END IF;
END //
DELIMITER ;

-- 创建获奖记录后自动更新报名状态的触发器
DELIMITER //
CREATE TRIGGER tr_after_award_created
AFTER INSERT ON award_records
FOR EACH ROW
BEGIN
    -- 更新报名状态为已获奖
    UPDATE user_registrations 
    SET status = 'AWARDED' 
    WHERE id = NEW.registration_id;
    
    -- 记录获奖日志
    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
    SELECT ur.user_id, 'award_granted', 'registration', NEW.registration_id,
           JSON_OBJECT('competition_id', ur.competition_id, 'award_level', NEW.award_level, 'certificate_number', NEW.certificate_number)
    FROM user_registrations ur
    WHERE ur.id = NEW.registration_id;
END //
DELIMITER ;

-- ================================================================
-- 索引优化建议
-- ================================================================
-- 以下索引已在表创建时添加，此处仅作说明：
-- 1. users表：email, phone, institution（用于快速查询和登录）
-- 2. competitions表：category, deadline, status（用于筛选和过滤）
-- 3. user_registrations表：user_id, competition_id, status（用于查询用户报名情况）
-- 4. 复合唯一索引：(user_id, competition_id)（防止重复报名）
-- 5. 外键索引：所有外键字段均已建立索引以提升JOIN性能

-- ================================================================
-- 数据库使用说明
-- ================================================================
/*
📌 核心业务流程说明：

1. 用户注册流程
   - 在 users 表插入用户信息
   - 密码需要使用 bcrypt/Argon2 等加密算法存储 password_hash
   - 示例：
     INSERT INTO users (id, name, email, password_hash, institution, title, phone) 
     VALUES (UUID(), '张老师', 'zhang@example.com', '$2a$10$...', 'XX小学', '高级教师', '13800138000');

2. 报名流程
   - 调用存储过程 sp_create_registration 创建报名记录
   - 自动创建报名记录（user_registrations）和支付记录（registration_payments）
   - 初始状态：user_registrations.status = 'PENDING_PAYMENT'
   - 示例：
     CALL sp_create_registration('user_uuid', 'pedagogy-2024', @reg_id, @error);
     SELECT @reg_id, @error;

3. 支付流程
   - 更新 registration_payments 表的支付信息
   - 触发器自动更新 user_registrations 状态为 'PAID'
   - 示例：
     UPDATE registration_payments 
     SET payment_status = 'success', 
         payment_time = NOW(), 
         payment_transaction_id = '202401120001'
     WHERE registration_id = 1;

4. 论文提交流程
   - 在 paper_submissions 表插入论文信息
   - 触发器自动更新 user_registrations 状态为 'SUBMITTED'
   - 示例：
     INSERT INTO paper_submissions (registration_id, paper_title, paper_abstract, 
                                     submission_file_name, submission_file_url)
     VALUES (1, '论文标题', '摘要内容', 'paper.pdf', '/uploads/paper.pdf');

5. 评审流程
   - 在 paper_reviews 表插入评审记录（支持多轮、多人评审）
   - 触发器自动更新报名状态：
     * 第1次评审：状态更新为 'UNDER_REVIEW'
     * 达到评审要求数量：状态更新为 'REVIEWED'
   - 示例：
     INSERT INTO paper_reviews (registration_id, reviewer_id, review_round, 
                                 review_score, review_comments, review_result)
     VALUES (1, 'reviewer_uuid', 1, 92.5, '创新性强，建议发表', 'passed');

6. 获奖流程
   - 在 award_records 表插入获奖记录
   - 触发器自动更新 user_registrations 状态为 'AWARDED'
   - 示例：
     INSERT INTO award_records (registration_id, award_level, certificate_number)
     VALUES (1, '一等奖', 'CERT-2024-001');

7. 查询统计
   - v_registration_statistics：查看各项目的报名统计和收入
   - v_user_participation：查看用户参与情况和获奖数量
   - v_registration_full_details：查看报名的完整详细信息（关联所有相关表）
   - 示例：
     SELECT * FROM v_registration_statistics WHERE category = '基础教育';
     SELECT * FROM v_user_participation WHERE awards_count > 0;
     SELECT * FROM v_registration_full_details WHERE user_id = 'user_uuid';

📌 表结构关系说明：

核心表：user_registrations（报名记录）
  ├── registration_payments（支付信息，1对多，支持多次支付/退款）
  ├── paper_submissions（论文提交，1对1）
  ├── paper_reviews（评审记录，1对多，支持多轮多人评审）
  └── award_records（获奖记录，1对1）

关联表：
  - users（用户信息）
  - competitions（竞赛项目）
  - reviewers（评审专家）

📌 注意事项：

1. 所有时间字段使用 TIMESTAMP 类型，自动处理时区
2. 金额字段使用 DECIMAL(10,2)，精确到分
3. 外键使用 ON DELETE CASCADE，删除父记录时自动删除关联数据
4. 触发器自动维护状态流转，无需手动更新 user_registrations.status
5. 支持多轮评审：review_round 字段区分初审、复审、终审
6. 支持论文版本管理：paper_submissions.version 字段
7. 支持支付退款：registration_payments 表记录退款信息
*/

-- ================================================================
-- 管理员功能扩展 (Administrator Feature Extension)
-- 添加日期: 2026-01-14
-- ================================================================

-- 1. 为 users 表添加 role 字段，区分普通用户和管理员
ALTER TABLE users 
ADD COLUMN role ENUM('user', 'admin') DEFAULT 'user' COMMENT '用户角色' AFTER status;

-- 2. 为 role 字段添加索引
ALTER TABLE users 
ADD INDEX idx_role (role);

-- 3. 创建默认管理员账号
-- 注意：密码为 'admin123' 经过 bcrypt 加密后的哈希值
-- 实际使用时请务必修改密码！
INSERT INTO users (
    id, 
    name, 
    email, 
    password_hash, 
    institution, 
    title, 
    phone, 
    status, 
    role,
    created_at
) VALUES (
    'admin-uuid-00000000-0000-0000-0001',
    '系统管理员',
    'admin@example.com',
    '$2a$10$YourBcryptHashedPasswordHere',
    '平台管理组',
    '系统管理员',
    '13800000000',
    'active',
    'admin',
    CURRENT_TIMESTAMP
) ON DUPLICATE KEY UPDATE 
    role = 'admin';

-- ================================================================
-- 管理员功能说明
-- ================================================================
/*
📌 管理员功能概述：

1. **用户角色**：
   - user: 普通用户（教师）
   - admin: 管理员

2. **管理员权限**：
   - 查看所有用户信息
   - 编辑用户信息（姓名、邮箱、单位、职称、手机、状态、角色）
   - 删除用户
   - 查看用户统计信息
   - 管理资源（创建、编辑、删除）
   - 查看所有资源（包括非公开资源）

3. **API 端点**：
   用户管理：
   - GET    /api/v1/users/admin/list        - 获取所有用户列表
   - GET    /api/v1/users/admin/statistics  - 获取用户统计信息
   - GET    /api/v1/users/admin/:id         - 获取指定用户详情
   - PATCH  /api/v1/users/admin/:id         - 更新用户信息
   - DELETE /api/v1/users/admin/:id         - 删除用户
   
   资源管理：
   - GET    /api/v1/resources/admin/list    - 获取所有资源列表
   - GET    /api/v1/resources/admin/:id     - 获取资源详情
   - POST   /api/v1/resources/admin         - 创建资源
   - PATCH  /api/v1/resources/admin/:id     - 更新资源
   - DELETE /api/v1/resources/admin/:id     - 删除资源

4. **前端路由**：
   - /admin/users      - 用户管理页面
   - /admin/resources  - 资源管理页面

5. **安全机制**：
   - 所有管理员 API 都需要 JWT 认证
   - 使用 AdminGuard 守卫验证用户角色
   - 非管理员用户访问管理员页面会被重定向

6. **默认管理员账号**：
   - 邮箱: admin@example.com
   - 密码: admin123 (请务必修改！)
   
   修改密码的方法：
   a) 使用 bcrypt 生成新密码的哈希值：
      Node.js: 
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('你的新密码', 10);
   
   b) 更新数据库：
      UPDATE users 
      SET password_hash = '新的哈希值' 
      WHERE email = 'admin@example.com';

7. **创建新管理员**：
   方式一：通过现有管理员在用户管理界面中将普通用户提升为管理员
   方式二：直接修改数据库：
      UPDATE users SET role = 'admin' WHERE id = '用户ID';

📌 使用建议：

1. 首次部署后，立即登录管理员账号并修改密码
2. 不要使用管理员账号进行日常操作
3. 定期审查管理员列表，确保只有授权人员拥有管理员权限
4. 重要操作建议开启操作日志（已有 audit_logs 表）
5. 建议为管理员账号配置更强的密码策略

📌 扩展建议：

1. 可以增加更细粒度的权限控制（如：超级管理员、资源管理员、用户管理员等）
2. 可以添加管理员操作审计日志的查看功能
3. 可以增加批量操作功能（批量导入用户、批量删除等）
4. 可以添加数据统计和可视化功能
*/
