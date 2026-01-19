#!/bin/bash

# ================================================================
# 数据库验证脚本
# 验证迁移后的数据完整性
# ================================================================

TARGET_USER="math"
TARGET_PASS="Szmathweb666!"
TARGET_DB="teacher_research_platform"

echo "================================================================"
echo "           数据库完整性验证"
echo "================================================================"
echo ""

# 连接测试
echo "1. 测试数据库连接..."
if mysql -u"${TARGET_USER}" -p"${TARGET_PASS}" -e "USE ${TARGET_DB}; SELECT 1;" &> /dev/null; then
    echo "✓ 连接成功"
else
    echo "✗ 连接失败"
    exit 1
fi

echo ""
echo "2. 数据库统计信息："
echo "================================================================"

mysql -u"${TARGET_USER}" -p"${TARGET_PASS}" "${TARGET_DB}" <<EOF
-- 表数量
SELECT '数据表数量' as '统计项', COUNT(*) as '数量' 
FROM information_schema.tables 
WHERE table_schema='${TARGET_DB}';

-- 数据统计
SELECT '用户总数' as '统计项', COUNT(*) as '数量' FROM users
UNION ALL
SELECT '管理员数量', COUNT(*) FROM users WHERE role='admin'
UNION ALL
SELECT '普通用户数量', COUNT(*) FROM users WHERE role='user'
UNION ALL
SELECT '竞赛项目数', COUNT(*) FROM competitions
UNION ALL
SELECT '报名记录数', COUNT(*) FROM user_registrations
UNION ALL
SELECT '支付记录数', COUNT(*) FROM registration_payments
UNION ALL
SELECT '论文提交数', COUNT(*) FROM paper_submissions
UNION ALL
SELECT '评审记录数', COUNT(*) FROM paper_reviews
UNION ALL
SELECT '获奖记录数', COUNT(*) FROM award_records
UNION ALL
SELECT '资源文件数', COUNT(*) FROM resources
UNION ALL
SELECT '新闻公告数', COUNT(*) FROM news_announcements;
EOF

echo ""
echo "3. 所有数据表："
echo "================================================================"
mysql -u"${TARGET_USER}" -p"${TARGET_PASS}" "${TARGET_DB}" -e "SHOW TABLES;"

echo ""
echo "4. 检查关键表结构："
echo "================================================================"

# 检查 users 表
echo ""
echo "▸ users 表结构："
mysql -u"${TARGET_USER}" -p"${TARGET_PASS}" "${TARGET_DB}" -e "DESCRIBE users;" | head -10

# 检查是否有管理员
echo ""
echo "▸ 管理员账户："
mysql -u"${TARGET_USER}" -p"${TARGET_PASS}" "${TARGET_DB}" -e "SELECT id, name, email, role, status FROM users WHERE role='admin';"

# 检查竞赛状态
echo ""
echo "▸ 竞赛项目状态分布："
mysql -u"${TARGET_USER}" -p"${TARGET_PASS}" "${TARGET_DB}" -e "SELECT status, COUNT(*) as count FROM competitions GROUP BY status;"

# 检查报名状态
echo ""
echo "▸ 报名状态分布："
mysql -u"${TARGET_USER}" -p"${TARGET_PASS}" "${TARGET_DB}" -e "SELECT status, COUNT(*) as count FROM user_registrations GROUP BY status;"

echo ""
echo "================================================================"
echo "验证完成！"
echo "================================================================"
