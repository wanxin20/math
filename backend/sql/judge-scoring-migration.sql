-- 评委打分功能数据库迁移
-- ⚠️ 三个数据库(paper/reform/contest)都必须执行，否则共享代码查询时会报列/表不存在
-- 功能仅在 contest 前端启用，但后端代码和实体是共享的

-- 1. 修改 users 表 role 枚举，新增 judge
ALTER TABLE users MODIFY COLUMN role ENUM('user', 'admin', 'judge') NOT NULL DEFAULT 'user' COMMENT '用户角色';

-- 2. competitions 表新增评分标准字段
ALTER TABLE competitions ADD COLUMN scoring_criteria JSON DEFAULT NULL COMMENT '评分标准 JSON [{name,maxScore,description,weight}]';

-- 3. 新建评委分配表
CREATE TABLE IF NOT EXISTS judge_assignments (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '分配记录ID',
  judge_user_id VARCHAR(36) NOT NULL COMMENT '评委用户ID',
  competition_id VARCHAR(50) NOT NULL COMMENT '竞赛ID',
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '分配时间',
  UNIQUE KEY uk_judge_competition (judge_user_id, competition_id),
  KEY idx_competition (competition_id),
  CONSTRAINT fk_ja_user FOREIGN KEY (judge_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_ja_competition FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评委竞赛分配表';

-- 4. 新建评分记录表
CREATE TABLE IF NOT EXISTS judge_scores (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '评分记录ID',
  judge_user_id VARCHAR(36) NOT NULL COMMENT '评委用户ID',
  registration_id BIGINT NOT NULL COMMENT '报名记录ID',
  competition_id VARCHAR(50) NOT NULL COMMENT '竞赛ID',
  total_score DECIMAL(6,2) NOT NULL COMMENT '总分',
  criteria_scores JSON DEFAULT NULL COMMENT '各维度评分 JSON [{name,score,maxScore}]',
  comments TEXT DEFAULT NULL COMMENT '评语',
  scored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '评分时间',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY uk_judge_registration (judge_user_id, registration_id),
  KEY idx_competition (competition_id),
  KEY idx_registration (registration_id),
  CONSTRAINT fk_js_user FOREIGN KEY (judge_user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_js_registration FOREIGN KEY (registration_id) REFERENCES user_registrations(id) ON DELETE CASCADE,
  CONSTRAINT fk_js_competition FOREIGN KEY (competition_id) REFERENCES competitions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评委评分记录表';
