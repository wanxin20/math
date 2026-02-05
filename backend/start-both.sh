#!/bin/bash
# 同时启动两个系统实例

echo "========================================"
echo "🚀 启动双系统实例"
echo "========================================"
echo ""

# 检查是否安装了 concurrently
if ! command -v concurrently &> /dev/null; then
    echo "📦 安装 concurrently..."
    npm install -g concurrently
fi

echo "📝 启动信息："
echo "   论文评选系统：http://localhost:3000"
echo "   教改系统：http://localhost:3001"
echo ""

# 使用 concurrently 同时启动两个实例
npx concurrently \
  --names "paper,reform" \
  --prefix-colors "blue,green" \
  --kill-others \
  "cp .env.paper .env && npm run start:dev" \
  "cp .env.reform .env && PORT=3001 npm run start:dev"
