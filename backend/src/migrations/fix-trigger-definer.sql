-- 修复触发器 DEFINER 用户不存在导致 UPDATE 失败的问题
-- 错误: ER_NO_SUCH_USER - The user specified as a definer ('root'@'%') does not exist
-- 原因: 原 database.sql 建表时用 root@% 创建了触发器，当前 MySQL 实例没有该用户
-- 方案: 删掉旧触发器，不指定 DEFINER 重建 → MySQL 会用当前连接用户做 DEFINER

USE teacher_research_platform;

-- 1) 查看触发器当前 DEFINER（诊断用，可先单独运行这一行）
SELECT TRIGGER_NAME, DEFINER
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = DATABASE();

-- 2) 删除旧触发器
DROP TRIGGER IF EXISTS tr_after_payment_success;
DROP TRIGGER IF EXISTS tr_after_review_completed;
DROP TRIGGER IF EXISTS tr_after_award_created;

-- 3) 重建触发器（不写 DEFINER=，默认用当前连接用户）

DELIMITER //

CREATE TRIGGER tr_after_payment_success
AFTER UPDATE ON registration_payments
FOR EACH ROW
BEGIN
    IF NEW.payment_status = 'success' AND OLD.payment_status != 'success' THEN
        UPDATE user_registrations
        SET status = 'SUBMITTED'
        WHERE id = NEW.registration_id AND status = 'PENDING_PAYMENT';

        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
        SELECT ur.user_id, 'payment_completed', 'registration', NEW.registration_id,
               JSON_OBJECT('competition_id', ur.competition_id, 'amount', NEW.payment_amount, 'transaction_id', NEW.payment_transaction_id)
        FROM user_registrations ur
        WHERE ur.id = NEW.registration_id;
    END IF;
END //

CREATE TRIGGER tr_after_review_completed
AFTER INSERT ON paper_reviews
FOR EACH ROW
BEGIN
    DECLARE v_total_reviews INT;
    DECLARE v_required_reviews INT DEFAULT 2;

    SELECT COUNT(*) INTO v_total_reviews
    FROM paper_reviews
    WHERE registration_id = NEW.registration_id AND review_result != 'pending';

    IF v_total_reviews >= v_required_reviews THEN
        UPDATE user_registrations
        SET status = 'REVIEWED'
        WHERE id = NEW.registration_id AND status = 'UNDER_REVIEW';
    ELSEIF v_total_reviews = 1 THEN
        UPDATE user_registrations
        SET status = 'UNDER_REVIEW'
        WHERE id = NEW.registration_id AND status = 'SUBMITTED';
    END IF;
END //

CREATE TRIGGER tr_after_award_created
AFTER INSERT ON award_records
FOR EACH ROW
BEGIN
    UPDATE user_registrations
    SET status = 'AWARDED'
    WHERE id = NEW.registration_id;

    INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details)
    SELECT ur.user_id, 'award_granted', 'registration', NEW.registration_id,
           JSON_OBJECT('competition_id', ur.competition_id, 'award_level', NEW.award_level, 'certificate_number', NEW.certificate_number)
    FROM user_registrations ur
    WHERE ur.id = NEW.registration_id;
END //

DELIMITER ;

-- 4) 验证（应该看到 DEFINER 变成当前用户，例如 teacher_user@%）
SELECT TRIGGER_NAME, DEFINER
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = DATABASE();
