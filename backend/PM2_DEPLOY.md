# PM2 部署指南 - 双系统

## 📋 前置条件

确保已完成以下步骤：
1. ✅ 代码已上传到服务器
2. ✅ 已安装 Node.js (建议 v18+)
3. ✅ 已全局安装 PM2：`npm install -g pm2`
4. ✅ 已配置好 `.env.paper` 和 `.env.reform` 文件
5. ✅ 已构建项目：`npm run build`

---

## 🚀 基本操作命令

### 1. 启动所有服务（首次部署）

```bash
cd /path/to/backend
pm2 start ecosystem.config.js
```

这会同时启动两个系统：
- `paper-system` (端口 3000)
- `reform-system` (端口 3001)

### 2. 查看运行状态

```bash
# 查看所有进程状态
pm2 status
# 或
pm2 list

# 实时监控（CPU、内存）
pm2 monit
```

### 3. 查看日志

```bash
# 查看所有日志
pm2 logs

# 查看指定系统日志
pm2 logs paper-system
pm2 logs reform-system

# 清空日志
pm2 flush
```

### 4. 重启服务

```bash
# 重启所有服务
pm2 restart ecosystem.config.js

# 重启指定服务
pm2 restart paper-system
pm2 restart reform-system

# 优雅重启（0 秒停机）
pm2 reload ecosystem.config.js
```

### 5. 停止服务

```bash
# 停止所有服务
pm2 stop ecosystem.config.js

# 停止指定服务
pm2 stop paper-system
pm2 stop reform-system
```

### 6. 删除进程

```bash
# 删除所有进程
pm2 delete ecosystem.config.js

# 删除指定进程
pm2 delete paper-system
pm2 delete reform-system

# 删除所有进程
pm2 delete all
```

---

## 🔄 更新代码后的部署流程

当你更新代码后，按以下步骤操作：

```bash
# 1. 进入后端目录
cd /path/to/backend

# 2. 拉取最新代码（如果使用 git）
git pull

# 3. 安装依赖（如果有新依赖）
npm install

# 4. 重新构建
npm run build

# 5. 重启服务
pm2 restart ecosystem.config.js

# 6. 查看状态
pm2 status

# 7. 查看日志（确认启动成功）
pm2 logs --lines 50
```

---

## 💾 保存配置和设置开机自启

### 保存当前 PM2 进程列表

```bash
pm2 save
```

### 设置开机自启动

```bash
# 生成启动脚本
pm2 startup

# 执行输出的命令（类似下面这样，具体看系统输出）
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u your-username --hp /home/your-username

# 保存当前进程列表
pm2 save
```

### 取消开机自启

```bash
pm2 unstartup
```

---

## 📊 监控和管理

### 查看详细信息

```bash
# 查看指定进程详细信息
pm2 show paper-system
pm2 show reform-system

# 查看 CPU 和内存使用情况
pm2 monit
```

### 实时日志

```bash
# 实时查看所有日志
pm2 logs --raw

# 实时查看指定系统日志
pm2 logs paper-system --raw
```

### 日志文件位置

日志文件存储在 `backend/logs/` 目录下：
- `paper-error.log` - 论文评选系统错误日志
- `paper-out.log` - 论文评选系统输出日志
- `reform-error.log` - 教改系统错误日志
- `reform-out.log` - 教改系统输出日志

---

## 🔧 常用管理命令

```bash
# 重载环境变量（修改 .env 文件后）
pm2 restart ecosystem.config.js --update-env

# 查看 PM2 版本
pm2 --version

# 更新 PM2
npm install -g pm2@latest
pm2 update

# 清空所有日志
pm2 flush

# 重置重启次数计数
pm2 reset all
```

---

## 🐛 故障排查

### 服务无法启动

```bash
# 1. 查看错误日志
pm2 logs paper-system --err --lines 100
pm2 logs reform-system --err --lines 100

# 2. 检查端口占用
netstat -tulnp | grep 3000
netstat -tulnp | grep 3001

# 3. 检查环境变量配置
cat .env.paper
cat .env.reform

# 4. 手动测试启动
node dist/main.js
```

### 内存泄漏或高占用

```bash
# 查看内存使用
pm2 monit

# 如果内存超过 500M 会自动重启（已配置 max_memory_restart）
```

### 查看系统资源

```bash
# CPU 和内存
pm2 monit

# 详细指标
pm2 describe paper-system
```

---

## 📝 完整部署示例

首次部署完整流程：

```bash
# 1. 进入项目目录
cd /var/www/math/backend

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 确保日志目录存在
mkdir -p logs

# 5. 检查配置文件
ls -la .env.paper .env.reform ecosystem.config.js

# 6. 启动服务
pm2 start ecosystem.config.js

# 7. 查看状态
pm2 status

# 8. 查看日志（确认启动成功）
pm2 logs --lines 50

# 9. 保存配置
pm2 save

# 10. 设置开机自启
pm2 startup
# 执行输出的命令
pm2 save
```

---

## 🌐 配合 Nginx 使用

确保 Nginx 配置正确代理到两个端口：
- `/api/paper/` → `http://127.0.0.1:3000/api/v1/`
- `/api/reform/` → `http://127.0.0.1:3001/api/v1/`

测试 Nginx 配置：

```bash
# 测试配置
sudo nginx -t

# 重载 Nginx
sudo nginx -s reload

# 或重启 Nginx
sudo systemctl restart nginx
```

---

## 📞 快速参考

| 操作 | 命令 |
|------|------|
| 启动所有服务 | `pm2 start ecosystem.config.js` |
| 重启所有服务 | `pm2 restart ecosystem.config.js` |
| 停止所有服务 | `pm2 stop ecosystem.config.js` |
| 查看状态 | `pm2 status` |
| 查看日志 | `pm2 logs` |
| 实时监控 | `pm2 monit` |
| 保存配置 | `pm2 save` |
| 删除所有进程 | `pm2 delete all` |

---

## ⚠️ 注意事项

1. **端口冲突**：确保 3000 和 3001 端口未被占用
2. **数据库连接**：确认两个 `.env` 文件中的数据库配置正确
3. **文件权限**：确保 logs 目录有写入权限
4. **内存限制**：已设置 500M 内存限制，超出会自动重启
5. **日志管理**：定期清理日志文件，避免占用过多磁盘空间

---

## 📚 更多资源

- PM2 官方文档：https://pm2.keymetrics.io/docs/usage/quick-start/
- PM2 生态系统文件：https://pm2.keymetrics.io/docs/usage/application-declaration/
