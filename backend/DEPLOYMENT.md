# 双系统部署说明

本文档说明如何部署和运行双系统（论文评选 + 教改）架构。

## 📋 架构说明

采用**双实例 + 两库**方案：
- **论文评选系统**：端口 3000，数据库 `teacher_research_platform`
- **教改系统**：端口 3001，数据库 `teacher_research_reform`

前端通过路由区分：
- 论文评选：`/paper/*` → API: `http://localhost:3000/api/v1`
- 教改系统：`/reform/*` → API: `http://localhost:3001/api/v1`

## 🚀 快速开始

### 1. 初始化教改系统数据库

教改系统需要单独的数据库，使用提供的脚本初始化：

**Linux/Mac:**
```bash
cd backend
chmod +x init-reform-db.sh
./init-reform-db.sh
```

**Windows:**
```cmd
cd backend
init-reform-db.bat
```

该脚本会：
1. 创建数据库 `teacher_research_reform`
2. 导入 `database.sql` 中的表结构
3. 验证导入结果

### 2. 启动服务

#### 方式一：分别启动（推荐用于开发）

**启动论文评选系统（端口 3000）：**

Linux/Mac:
```bash
npm run start:paper
# 或
./start-paper.sh
```

Windows:
```cmd
npm run start:paper
# 或
start-paper.bat
```

**启动教改系统（端口 3001）：**

Linux/Mac:
```bash
npm run start:reform
# 或
./start-reform.sh
```

Windows:
```cmd
npm run start:reform
# 或
start-reform.bat
```

#### 方式二：同时启动两个系统

需要先安装 `concurrently`：
```bash
npm install -g concurrently
```

然后运行：
```bash
npm run start:both
```

## 📝 配置文件说明

### .env.paper（论文评选系统）
```env
PORT=3000
DB_HOST=dbconn.sealosgzg.site
DB_PORT=36594
DB_USERNAME=root
DB_PASSWORD=7d8k64zs
DB_DATABASE=teacher_research_platform
```

### .env.reform（教改系统）
```env
PORT=3001
DB_HOST=dbconn.sealosgzg.site
DB_PORT=37159
DB_USERNAME=root
DB_PASSWORD=szddzg7k
DB_DATABASE=teacher_research_reform
```

## 🌐 生产环境部署

### 使用 PM2

安装 PM2：
```bash
npm install -g pm2
```

创建 `ecosystem.config.js`：
```javascript
module.exports = {
  apps: [
    {
      name: 'paper-system',
      script: 'dist/main.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_file: '.env.paper'
    },
    {
      name: 'reform-system',
      script: 'dist/main.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      env_file: '.env.reform'
    }
  ]
};
```

启动：
```bash
# 构建项目
npm run build

# 启动所有服务
pm2 start ecosystem.config.js

# 查看状态
pm2 status

# 查看日志
pm2 logs

# 停止服务
pm2 stop all

# 重启服务
pm2 restart all
```

### Nginx 配置

生产环境需要 Nginx 反向代理，根据路径分流到不同端口：

```nginx
server {
    listen 80;
    server_name competition.szmath.com;

    # 前端静态文件
    location / {
        root /var/www/math-platform/dist;
        try_files $uri $uri/ /index.html;
    }

    # 论文评选系统 API
    location /api/paper/v1/ {
        proxy_pass http://localhost:3000/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 教改系统 API
    location /api/reform/v1/ {
        proxy_pass http://localhost:3001/api/v1/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 上传文件访问（两个系统共享）
    location /uploads/ {
        alias /var/www/math-platform/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

重启 Nginx：
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## 🔍 验证部署

### 1. 检查后端服务

论文评选系统：
```bash
curl http://localhost:3000/api/v1/
```

教改系统：
```bash
curl http://localhost:3001/api/v1/
```

### 2. 检查数据库连接

查看日志确认两个系统连接到了不同的数据库：
```bash
pm2 logs paper-system | grep "Database"
pm2 logs reform-system | grep "Database"
```

### 3. 前端验证

访问前端页面：
- 论文评选系统：`http://localhost:5173/#/paper/home`
- 教改系统：`http://localhost:5173/#/reform/home`

打开浏览器开发者工具，查看 Network 标签，确认：
- `/paper/*` 页面请求发送到 `http://localhost:3000/api/v1`
- `/reform/*` 页面请求发送到 `http://localhost:3001/api/v1`

## 📊 监控和日志

### PM2 监控

```bash
# 实时监控
pm2 monit

# 查看日志
pm2 logs

# 查看特定应用日志
pm2 logs paper-system
pm2 logs reform-system

# 清空日志
pm2 flush
```

### 日志文件位置

- 应用日志：`~/.pm2/logs/`
- Nginx日志：`/var/log/nginx/`

## 🔧 故障排查

### 端口被占用

```bash
# 查看端口占用
lsof -i :3000
lsof -i :3001

# 或在Windows上
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

### 数据库连接失败

1. 检查数据库配置：
```bash
cat .env.paper
cat .env.reform
```

2. 测试数据库连接：
```bash
mysql -h dbconn.sealosgzg.site -P 36594 -u root -p7d8k64zs -e "SHOW DATABASES;"
mysql -h dbconn.sealosgzg.site -P 37159 -u root -pszddzg7k -e "SHOW DATABASES;"
```

3. 检查防火墙规则

### 前端无法连接后端

1. 检查 CORS 配置（.env 文件中的 `CORS_ORIGIN`）
2. 检查 Nginx 配置
3. 查看浏览器控制台错误信息

## 📚 相关文档

- [MULTI_SYSTEM.md](./MULTI_SYSTEM.md) - 双系统架构说明
- [migrate-database.sh](./migrate-database.sh) - 数据库迁移脚本

## 🆘 支持

如有问题，请联系技术团队或查看项目文档。
