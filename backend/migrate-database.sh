#!/bin/bash

# ================================================================
# 数据库迁移脚本
# 功能：从远程数据库导出数据并导入到本地数据库
# 使用方法：bash migrate-database.sh
# ================================================================

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ================================================================
# 源数据库配置（远程数据库）
# ================================================================
SOURCE_HOST="dbconn.sealosgzg.site"
SOURCE_PORT="36594"
SOURCE_USER="root"
SOURCE_PASSWORD="7d8k64zs"
SOURCE_DATABASE="teacher_research_platform"

# ================================================================
# 目标数据库配置（本地数据库）
# ================================================================
TARGET_HOST="localhost"
TARGET_PORT="3306"
TARGET_USER="math"
TARGET_PASSWORD="Szmathweb666!"
TARGET_DATABASE="teacher_research_platform"

# ================================================================
# 备份配置
# ================================================================
BACKUP_DIR="./database_backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/migration_${TIMESTAMP}.sql"
TEMP_FILE="${BACKUP_DIR}/temp_${TIMESTAMP}.sql"

# ================================================================
# 函数定义
# ================================================================

# 打印信息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

# 打印警告
print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 打印错误
print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        print_error "命令 '$1' 未找到，请先安装"
        exit 1
    fi
}

# 测试数据库连接
test_connection() {
    local host=$1
    local port=$2
    local user=$3
    local password=$4
    local database=$5
    local name=$6

    print_info "测试 ${name} 连接..."
    
    if mysql -h"${host}" -P"${port}" -u"${user}" -p"${password}" -e "SELECT 1;" "${database}" &> /dev/null; then
        print_info "${name} 连接成功 ✓"
        return 0
    else
        print_error "${name} 连接失败 ✗"
        return 1
    fi
}

# ================================================================
# 主流程
# ================================================================

echo "================================================================"
echo "           数据库迁移脚本"
echo "================================================================"
echo ""

# 1. 检查必要的命令
print_info "检查系统环境..."
check_command "mysql"
check_command "mysqldump"

# 2. 创建备份目录
print_info "创建备份目录..."
mkdir -p "${BACKUP_DIR}"

# 3. 测试源数据库连接
if ! test_connection "${SOURCE_HOST}" "${SOURCE_PORT}" "${SOURCE_USER}" "${SOURCE_PASSWORD}" "${SOURCE_DATABASE}" "源数据库"; then
    print_error "无法连接到源数据库，请检查配置"
    exit 1
fi

# 4. 测试目标数据库连接
if ! test_connection "${TARGET_HOST}" "${TARGET_PORT}" "${TARGET_USER}" "${TARGET_PASSWORD}" "mysql" "目标数据库服务器"; then
    print_error "无法连接到目标数据库服务器，请检查配置"
    exit 1
fi

echo ""
print_warning "================================================"
print_warning "  即将开始数据迁移，请确认以下信息："
print_warning "================================================"
echo ""
echo "  源数据库："
echo "    - 地址: ${SOURCE_HOST}:${SOURCE_PORT}"
echo "    - 用户: ${SOURCE_USER}"
echo "    - 数据库: ${SOURCE_DATABASE}"
echo ""
echo "  目标数据库："
echo "    - 地址: ${TARGET_HOST}:${TARGET_PORT}"
echo "    - 用户: ${TARGET_USER}"
echo "    - 数据库: ${TARGET_DATABASE}"
echo ""
echo "  备份文件: ${BACKUP_FILE}"
echo ""
print_warning "⚠️  警告：目标数据库中的现有数据将被覆盖！"
echo ""
read -p "确认继续？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    print_info "操作已取消"
    exit 0
fi

echo ""

# 5. 从源数据库导出数据
print_info "正在从源数据库导出数据..."
print_info "这可能需要几分钟，请耐心等待..."

mysqldump \
    -h"${SOURCE_HOST}" \
    -P"${SOURCE_PORT}" \
    -u"${SOURCE_USER}" \
    -p"${SOURCE_PASSWORD}" \
    --single-transaction \
    --quick \
    --lock-tables=false \
    --add-drop-table \
    --routines \
    --triggers \
    --events \
    "${SOURCE_DATABASE}" > "${TEMP_FILE}"

if [ $? -eq 0 ]; then
    print_info "数据导出成功 ✓"
else
    print_error "数据导出失败 ✗"
    rm -f "${TEMP_FILE}"
    exit 1
fi

# 6. 检查导出文件大小
FILE_SIZE=$(du -h "${TEMP_FILE}" | cut -f1)
print_info "导出文件大小: ${FILE_SIZE}"

# 7. 创建目标数据库（如果不存在）
print_info "检查目标数据库..."

mysql -h"${TARGET_HOST}" -P"${TARGET_PORT}" -u"${TARGET_USER}" -p"${TARGET_PASSWORD}" <<EOF
CREATE DATABASE IF NOT EXISTS ${TARGET_DATABASE} 
DEFAULT CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;
EOF

if [ $? -eq 0 ]; then
    print_info "目标数据库已准备好 ✓"
else
    print_error "创建目标数据库失败 ✗"
    rm -f "${TEMP_FILE}"
    exit 1
fi

# 8. 导入数据到目标数据库
print_info "正在导入数据到目标数据库..."
print_info "这可能需要几分钟，请耐心等待..."

mysql \
    -h"${TARGET_HOST}" \
    -P"${TARGET_PORT}" \
    -u"${TARGET_USER}" \
    -p"${TARGET_PASSWORD}" \
    "${TARGET_DATABASE}" < "${TEMP_FILE}"

if [ $? -eq 0 ]; then
    print_info "数据导入成功 ✓"
    # 保存备份文件
    mv "${TEMP_FILE}" "${BACKUP_FILE}"
    print_info "备份文件已保存: ${BACKUP_FILE}"
else
    print_error "数据导入失败 ✗"
    rm -f "${TEMP_FILE}"
    exit 1
fi

# 9. 验证迁移结果
print_info "验证迁移结果..."

# 获取源数据库表数量
SOURCE_TABLE_COUNT=$(mysql -h"${SOURCE_HOST}" -P"${SOURCE_PORT}" -u"${SOURCE_USER}" -p"${SOURCE_PASSWORD}" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${SOURCE_DATABASE}';" 2>/dev/null)

# 获取目标数据库表数量
TARGET_TABLE_COUNT=$(mysql -h"${TARGET_HOST}" -P"${TARGET_PORT}" -u"${TARGET_USER}" -p"${TARGET_PASSWORD}" -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${TARGET_DATABASE}';" 2>/dev/null)

echo ""
echo "验证结果："
echo "  - 源数据库表数量: ${SOURCE_TABLE_COUNT}"
echo "  - 目标数据库表数量: ${TARGET_TABLE_COUNT}"

if [ "${SOURCE_TABLE_COUNT}" == "${TARGET_TABLE_COUNT}" ]; then
    print_info "表数量一致 ✓"
else
    print_warning "表数量不一致，请手动检查"
fi

# 10. 显示目标数据库中的表
print_info "目标数据库中的表："
mysql -h"${TARGET_HOST}" -P"${TARGET_PORT}" -u"${TARGET_USER}" -p"${TARGET_PASSWORD}" -e "SHOW TABLES;" "${TARGET_DATABASE}"

echo ""
echo "================================================================"
print_info "数据库迁移完成！"
echo "================================================================"
echo ""
print_info "迁移摘要："
echo "  - 备份文件: ${BACKUP_FILE}"
echo "  - 文件大小: ${FILE_SIZE}"
echo "  - 迁移时间: $(date)"
echo ""
print_info "建议："
echo "  1. 请登录目标数据库验证数据完整性"
echo "  2. 检查关键表的数据记录数"
echo "  3. 备份文件保存在: ${BACKUP_DIR}/"
echo ""

# 11. 显示快速验证命令
print_info "快速验证命令："
echo ""
echo "  # 查看所有表"
echo "  mysql -h${TARGET_HOST} -P${TARGET_PORT} -u${TARGET_USER} -p'${TARGET_PASSWORD}' ${TARGET_DATABASE} -e 'SHOW TABLES;'"
echo ""
echo "  # 查看用户数量"
echo "  mysql -h${TARGET_HOST} -P${TARGET_PORT} -u${TARGET_USER} -p'${TARGET_PASSWORD}' ${TARGET_DATABASE} -e 'SELECT COUNT(*) as user_count FROM users;'"
echo ""
echo "  # 查看竞赛数量"
echo "  mysql -h${TARGET_HOST} -P${TARGET_PORT} -u${TARGET_USER} -p'${TARGET_PASSWORD}' ${TARGET_DATABASE} -e 'SELECT COUNT(*) as competition_count FROM competitions;'"
echo ""

print_info "脚本执行完成！"
