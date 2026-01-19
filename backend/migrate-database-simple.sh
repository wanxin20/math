#!/bin/bash

# ================================================================
# 数据库迁移脚本 - 简化版
# 无需确认，直接执行迁移
# ================================================================

set -e

BACKUP_DIR="./database_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DUMP_FILE="${BACKUP_DIR}/dump_${TIMESTAMP}.sql"

echo "开始数据库迁移..."
mkdir -p "${BACKUP_DIR}"

# 导出
echo "1/3 导出远程数据库..."
mysqldump \
    -hdbconn.sealosgzg.site \
    -P36594 \
    -uroot \
    -p7d8k64zs \
    --single-transaction \
    --quick \
    --add-drop-table \
    --routines \
    --triggers \
    teacher_research_platform > "${DUMP_FILE}"

echo "✓ 导出成功: ${DUMP_FILE} ($(du -h ${DUMP_FILE} | cut -f1))"

# 创建数据库
echo "2/3 创建本地数据库..."
mysql -u"${TARGET_USER}" -p"${TARGET_PASS}" <<EOF
DROP DATABASE IF EXISTS ${TARGET_DB};
CREATE DATABASE ${TARGET_DB} DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EOF

echo "✓ 数据库已创建"

# 导入
echo "3/3 导入数据..."
mysql -u"${TARGET_USER}" -p"${TARGET_PASS}" "${TARGET_DB}" < "${DUMP_FILE}"

echo "✓ 导入成功"

# 验证
echo ""
echo "迁移完成！验证结果："
mysql -u"${TARGET_USER}" -p"${TARGET_PASS}" "${TARGET_DB}" -e "
SELECT 
    '表数量' as item, 
    COUNT(*) as count 
FROM information_schema.tables 
WHERE table_schema='${TARGET_DB}'
UNION ALL
SELECT '用户数', COUNT(*) FROM users
UNION ALL
SELECT '竞赛数', COUNT(*) FROM competitions
UNION ALL
SELECT '报名数', COUNT(*) FROM user_registrations;
"

echo ""
echo "备份文件: ${DUMP_FILE}"
