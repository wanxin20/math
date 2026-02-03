-- 论文提交支持多文件：增加 submission_files JSON 列
-- 执行: mysql -u root -p teacher_research_platform < add-paper-submission-files.sql

ALTER TABLE paper_submissions
ADD COLUMN submission_files JSON NULL COMMENT '多文件列表 [{fileName, fileUrl, size?, mimetype?}]' AFTER submission_file_type;
