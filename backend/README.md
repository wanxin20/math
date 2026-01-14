# 教师教研论文评选平台 - 后端服务

基于 NestJS + TypeScript + TypeORM + MySQL 构建的教师教研论文评选平台后端服务。

## 🚀 快速开始

### 环境要求

- Node.js >= 18.x
- MySQL >= 8.0
- npm >= 9.x

### 安装依赖

```bash
npm install
```

### 配置环境变量

复制 `.env.example` 为 `.env` 并修改配置：

```bash
cp .env.example .env
```

主要配置项：
- 数据库连接信息
- JWT密钥
- 文件上传配置
- 第三方服务密钥（支付宝、微信支付等）

### 初始化数据库

1. 创建数据库：
```sql
CREATE DATABASE teacher_research_platform CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. 导入数据库结构：
```bash
mysql -u root -p teacher_research_platform < database.sql
```

> 注意：database.sql 文件位于项目根目录

### 启动服务

```bash
# 开发模式（带热重载）
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

服务启动后：
- API 地址：http://localhost:3000/api/v1
- Swagger 文档：http://localhost:3000/api-docs

## 📂 项目结构

```
backend/src/
├── main.ts                      # 应用入口
├── app.module.ts                # 根模块
├── app.controller.ts            # 根控制器
├── app.service.ts               # 根服务
│
├── modules/                     # 业务模块
│   ├── auth/                    # 认证模块（登录/注册/JWT）
│   │   ├── dto/
│   │   ├── strategies/
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   │
│   ├── users/                   # 用户模块
│   ├── competitions/            # 竞赛管理
│   ├── registrations/           # 报名管理
│   ├── payments/                # 支付管理
│   ├── papers/                  # 论文提交
│   ├── resources/               # 资源管理
│   ├── news/                    # 新闻公告
│   ├── reviews/                 # 评审系统（待扩展）
│   ├── awards/                  # 获奖记录（待扩展）
│   └── ...
│
└── common/                      # 通用组件
    ├── decorators/              # 装饰器（@Public, @CurrentUser）
    ├── guards/                  # 守卫（JWT认证）
    ├── interceptors/            # 拦截器（日志、响应转换）
    ├── filters/                 # 异常过滤器
    ├── dto/                     # 通用DTO（分页）
    ├── enums/                   # 枚举定义
    └── utils/                   # 工具函数
```

## 🔌 API 接口

### 认证模块 (Auth)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/auth/register` | 用户注册 | 否 |
| POST | `/api/v1/auth/login` | 用户登录 | 否 |
| GET  | `/api/v1/auth/profile` | 获取当前用户信息 | 是 |

### 竞赛模块 (Competitions)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET  | `/api/v1/competitions` | 获取竞赛列表（分页） | 否 |
| GET  | `/api/v1/competitions/open` | 获取开放报名的竞赛 | 否 |
| GET  | `/api/v1/competitions/:id` | 获取竞赛详情 | 否 |
| POST | `/api/v1/competitions` | 创建竞赛（管理员） | 是 |

### 报名模块 (Registrations)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/registrations` | 创建报名 | 是 |
| GET  | `/api/v1/registrations` | 获取我的报名列表 | 是 |
| GET  | `/api/v1/registrations/:id` | 获取报名详情 | 是 |
| GET  | `/api/v1/registrations/check/:competitionId` | 检查是否已报名 | 是 |

### 支付模块 (Payments)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET  | `/api/v1/payments/registration/:id` | 获取支付记录 | 是 |
| POST | `/api/v1/payments/mock/:id` | 模拟支付（测试） | 是 |

### 论文提交 (Papers)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/api/v1/papers` | 提交论文 | 是 |
| GET  | `/api/v1/papers/registration/:id` | 获取论文提交记录 | 是 |

### 资源模块 (Resources)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET  | `/api/v1/resources` | 获取资源列表 | 否 |
| POST | `/api/v1/resources/:id/download` | 记录资源下载 | 否 |

### 新闻公告 (News)

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET  | `/api/v1/news` | 获取新闻列表 | 否 |
| GET  | `/api/v1/news/:id` | 获取新闻详情 | 否 |

## 🔐 认证机制

使用 **JWT (JSON Web Token)** 认证：

1. 用户登录后获得 `accessToken`
2. 请求时在 Header 中携带：`Authorization: Bearer <token>`
3. 使用 `@Public()` 装饰器标记公开接口（不需要认证）

## 🔧 开发工具

```bash
# 代码格式化
npm run format

# ESLint 检查
npm run lint

# 修复 ESLint 错误
npm run lint -- --fix

# 单元测试
npm run test

# 测试覆盖率
npm run test:cov
```

## 📦 核心依赖

- **NestJS**: 10.3.0 - 渐进式Node.js框架
- **TypeORM**: 0.3.19 - ORM框架
- **MySQL2**: 3.7.0 - MySQL驱动
- **Passport**: 0.7.0 - 认证中间件
- **JWT**: 10.2.0 - JWT实现
- **class-validator**: 0.14.0 - DTO验证
- **Swagger**: 7.1.17 - API文档生成

## 🌟 核心特性

✅ **完整的用户认证系统** - JWT + Passport
✅ **竞赛管理** - 创建、查询、筛选竞赛
✅ **报名流程** - 报名 → 支付 → 提交论文
✅ **支付集成** - 支持微信支付、支付宝（含模拟支付）
✅ **文件上传** - 论文文件上传管理
✅ **资源下载** - 模板、文档下载
✅ **新闻公告** - 动态发布系统
✅ **Swagger文档** - 自动生成API文档
✅ **全局异常处理** - 统一错误响应格式
✅ **请求日志** - 记录所有API调用
✅ **数据验证** - 基于class-validator的DTO验证

## 🎯 业务流程

### 1. 用户注册/登录
```
注册 → 填写信息 → 创建账户 → 返回JWT
登录 → 验证凭证 → 返回JWT + 用户信息
```

### 2. 竞赛报名流程
```
选择竞赛 → 创建报名 → 支付评审费 → 状态变为"已支付"
```

### 3. 论文提交流程
```
完成支付 → 上传论文文件 → 填写论文信息 → 提交 → 状态变为"已提交"
```

### 4. 评审流程（待实现）
```
已提交 → 分配评审专家 → 多轮评审 → 评审完成 → 发布获奖结果
```

## 🔒 安全措施

- ✅ 密码使用 bcrypt 加密（强度10）
- ✅ JWT Token 有效期控制
- ✅ 输入验证（class-validator）
- ✅ SQL注入防护（TypeORM参数化查询）
- ✅ XSS防护（helmet中间件）
- ✅ CORS配置

## 📝 数据库说明

数据库设计包含以下核心表：

- `users` - 用户表
- `competitions` - 竞赛表
- `user_registrations` - 报名记录表
- `registration_payments` - 支付记录表
- `paper_submissions` - 论文提交表
- `award_records` - 获奖记录表
- `resources` - 资源模板表
- `news_announcements` - 新闻公告表

详细设计请参考 `database.sql` 文件。

## 🐛 常见问题

### 1. 数据库连接失败
- 检查 `.env` 中的数据库配置是否正确
- 确认 MySQL 服务是否启动
- 检查防火墙和端口配置

### 2. JWT 认证失败
- 确认 `JWT_SECRET` 已配置
- 检查 Token 是否过期
- 确认 Header 格式：`Authorization: Bearer <token>`

### 3. 端口被占用
- 修改 `.env` 中的 `PORT` 配置
- 或者杀死占用端口的进程

## 📄 代码规范

请严格遵守 `backend/.cursorrules` 中定义的代码规范：

- 文件名使用 kebab-case
- 类名使用 PascalCase
- 变量/函数使用 camelCase
- 所有DTO必须使用 class-validator
- Controller方法必须添加 Swagger 文档
- 禁止使用 any 类型
- 代码提交前必须通过 ESLint 检查

## 🚧 待扩展功能

- [ ] 评审系统完整实现
- [ ] 文件上传到OSS
- [ ] 真实支付接口集成
- [ ] AI聊天助手
- [ ] 邮件通知系统
- [ ] 管理后台权限系统
- [ ] 数据统计报表

## 📞 联系方式

如有问题，请联系开发团队。

---

**开发团队** | 2026年1月
