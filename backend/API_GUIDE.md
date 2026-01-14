# API 使用指南

## 📖 快速开始

### 基础信息

- **Base URL**: `http://localhost:3000/api/v1`
- **Content-Type**: `application/json`
- **认证方式**: Bearer Token (JWT)

### 响应格式

所有API响应统一格式：

```json
{
  "code": 200,
  "data": { ... },
  "message": "success",
  "timestamp": "2026-01-14T10:30:00.000Z"
}
```

错误响应：

```json
{
  "code": 400,
  "message": "错误信息",
  "timestamp": "2026-01-14T10:30:00.000Z",
  "path": "/api/v1/...",
  "method": "POST"
}
```

---

## 🔐 认证模块

### 1. 用户注册

**POST** `/auth/register`

**请求体**:
```json
{
  "name": "张老师",
  "email": "zhang@example.com",
  "password": "password123",
  "institution": "XX小学",
  "title": "高级教师",
  "phone": "13800138000"
}
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "user": {
      "id": "uuid-string",
      "name": "张老师",
      "email": "zhang@example.com",
      "institution": "XX小学",
      "title": "高级教师",
      "phone": "13800138000",
      "status": "active",
      "createdAt": "2026-01-14T10:30:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "success"
}
```

### 2. 用户登录

**POST** `/auth/login`

**请求体**:
```json
{
  "email": "zhang@example.com",
  "password": "password123"
}
```

**响应**: 同注册响应

### 3. 获取当前用户信息

**GET** `/auth/profile`

**Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "id": "uuid-string",
    "name": "张老师",
    "email": "zhang@example.com",
    "institution": "XX小学",
    "title": "高级教师",
    ...
  }
}
```

---

## 🏆 竞赛模块

### 1. 获取竞赛列表

**GET** `/competitions?page=1&pageSize=10&status=open&category=基础教育`

**Query参数**:
- `page`: 页码（默认1）
- `pageSize`: 每页数量（默认10）
- `status`: 竞赛状态（draft/open/closed/completed）
- `category`: 竞赛类别

**响应**:
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": "pedagogy-2024",
        "title": "2024年度全国基础教育教学研究论文大赛",
        "description": "...",
        "category": "基础教育",
        "fee": 200,
        "deadline": "2024-10-15",
        "status": "open",
        "currentParticipants": 120
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 10,
    "totalPages": 5
  }
}
```

### 2. 获取开放报名的竞赛

**GET** `/competitions/open`

返回所有状态为`open`的竞赛列表。

### 3. 获取竞赛详情

**GET** `/competitions/:id`

**示例**: `/competitions/pedagogy-2024`

---

## 📝 报名模块

### 1. 创建报名

**POST** `/registrations` 🔒需要认证

**Headers**:
```
Authorization: Bearer <your-jwt-token>
```

**请求体**:
```json
{
  "competitionId": "pedagogy-2024",
  "notes": "期待参与本次评选"
}
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "userId": "user-uuid",
    "competitionId": "pedagogy-2024",
    "status": "PENDING_PAYMENT",
    "registrationTime": "2026-01-14T10:30:00.000Z",
    "competition": { ... },
    "payments": [
      {
        "id": 1,
        "paymentAmount": 200,
        "paymentStatus": "pending"
      }
    ]
  }
}
```

### 2. 获取我的报名列表

**GET** `/registrations` 🔒需要认证

**响应**:
```json
{
  "code": 200,
  "data": [
    {
      "id": 1,
      "competitionId": "pedagogy-2024",
      "competitionTitle": "2024年度全国基础教育教学研究论文大赛",
      "status": "PENDING_PAYMENT",
      "registrationTime": "2026-01-14T10:30:00.000Z",
      "payment": { ... },
      "paperSubmission": null
    }
  ]
}
```

### 3. 检查是否已报名

**GET** `/registrations/check/:competitionId` 🔒需要认证

**示例**: `/registrations/check/pedagogy-2024`

**响应**:
```json
{
  "code": 200,
  "data": {
    "hasRegistered": true
  }
}
```

---

## 💳 支付模块

### 1. 获取支付记录

**GET** `/payments/registration/:registrationId` 🔒需要认证

**示例**: `/payments/registration/1`

### 2. 模拟支付（开发测试）

**POST** `/payments/mock/:registrationId` 🔒需要认证

**示例**: `/payments/mock/1`

**响应**:
```json
{
  "code": 200,
  "data": {
    "success": true,
    "message": "支付成功",
    "payment": {
      "id": 1,
      "paymentStatus": "success",
      "paymentMethod": "模拟支付",
      "paymentTime": "2026-01-14T10:30:00.000Z",
      "paymentTransactionId": "MOCK-1704379800000"
    }
  }
}
```

> 注意：生产环境需要集成真实支付接口

---

## 📄 论文提交模块

### 1. 提交论文

**POST** `/papers` 🔒需要认证

**请求体**:
```json
{
  "registrationId": 1,
  "paperTitle": "基于AI的教学方法创新研究",
  "paperAbstract": "本文探讨了...",
  "paperKeywords": "AI,教学,创新",
  "submissionFileName": "paper.pdf",
  "submissionFileUrl": "/uploads/papers/paper.pdf",
  "submissionFileSize": 2048000,
  "submissionFileType": "pdf",
  "researchField": "教学方法"
}
```

**响应**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "registrationId": 1,
    "paperTitle": "基于AI的教学方法创新研究",
    "submissionFileName": "paper.pdf",
    "submissionTime": "2026-01-14T10:30:00.000Z",
    ...
  }
}
```

### 2. 获取论文提交记录

**GET** `/papers/registration/:registrationId` 🔒需要认证

---

## 📚 资源模块

### 1. 获取资源列表

**GET** `/resources?page=1&pageSize=10&category=论文模板`

**Query参数**:
- `page`: 页码
- `pageSize`: 每页数量
- `category`: 资源分类（论文模板/申报表/写作规范等）

**响应**:
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "教研论文标准 Word 模版",
        "description": "符合学会规范的论文排版格式",
        "type": "doc",
        "category": "论文模板",
        "fileUrl": "/resources/template.docx",
        "fileSize": 102400,
        "downloadCount": 1520,
        "isPublic": true
      }
    ],
    "total": 20,
    "page": 1,
    "pageSize": 10,
    "totalPages": 2
  }
}
```

### 2. 记录资源下载

**POST** `/resources/:id/download`

**示例**: `/resources/1/download`

用于统计下载次数。

---

## 📰 新闻公告模块

### 1. 获取新闻列表

**GET** `/news?page=1&pageSize=10`

**响应**:
```json
{
  "code": 200,
  "data": {
    "items": [
      {
        "id": 1,
        "title": "关于2024年度教育教学研究论文格式要求的补充通知",
        "summary": "请各位教师注意论文格式的最新要求变更",
        "type": "notice",
        "priority": "important",
        "isPublished": true,
        "publishDate": "2024-05-20",
        "viewCount": 320
      }
    ],
    "total": 30,
    "page": 1,
    "pageSize": 10,
    "totalPages": 3
  }
}
```

### 2. 获取新闻详情

**GET** `/news/:id`

**示例**: `/news/1`

**响应**:
```json
{
  "code": 200,
  "data": {
    "id": 1,
    "title": "...",
    "content": "完整内容...",
    "summary": "摘要",
    "type": "notice",
    "priority": "important",
    "publishDate": "2024-05-20",
    "viewCount": 321
  }
}
```

---

## 🔄 业务流程示例

### 完整的参赛流程

```javascript
// 1. 用户注册/登录
POST /api/v1/auth/register
// 或
POST /api/v1/auth/login
// 获取 accessToken

// 2. 查看竞赛列表
GET /api/v1/competitions/open

// 3. 报名竞赛
POST /api/v1/registrations
Headers: Authorization: Bearer <token>
Body: { "competitionId": "pedagogy-2024" }

// 4. 支付评审费（模拟支付）
POST /api/v1/payments/mock/1
Headers: Authorization: Bearer <token>

// 5. 上传论文
POST /api/v1/papers
Headers: Authorization: Bearer <token>
Body: { 
  "registrationId": 1,
  "paperTitle": "...",
  "submissionFileUrl": "/uploads/..." 
}

// 6. 查看报名状态
GET /api/v1/registrations
Headers: Authorization: Bearer <token>
```

---

## 📊 状态说明

### 报名状态 (RegistrationStatus)

| 状态 | 说明 |
|------|------|
| `PENDING_PAYMENT` | 待支付 |
| `PAID` | 已支付 |
| `SUBMITTED` | 已提交论文 |
| `UNDER_REVIEW` | 评审中 |
| `REVIEWED` | 已评审 |
| `AWARDED` | 已获奖 |
| `REJECTED` | 已拒绝 |

### 支付状态 (PaymentStatus)

| 状态 | 说明 |
|------|------|
| `pending` | 待支付 |
| `success` | 支付成功 |
| `failed` | 支付失败 |
| `refunded` | 已退款 |

### 竞赛状态 (CompetitionStatus)

| 状态 | 说明 |
|------|------|
| `draft` | 草稿 |
| `open` | 开放报名 |
| `closed` | 已关闭 |
| `completed` | 已完成 |

---

## ❗ 错误码

| HTTP状态码 | 说明 |
|-----------|------|
| 200 | 请求成功 |
| 201 | 创建成功 |
| 400 | 请求参数错误 |
| 401 | 未授权（需要登录） |
| 403 | 禁止访问 |
| 404 | 资源不存在 |
| 409 | 冲突（如重复报名） |
| 500 | 服务器内部错误 |

---

## 🧪 测试建议

### 使用 Postman/Insomnia

1. 导入 API 集合（可从 Swagger 导出）
2. 设置环境变量：`{{baseUrl}}` = `http://localhost:3000/api/v1`
3. 设置认证 Token：`{{token}}` = 登录后获取的 accessToken

### 使用 cURL

```bash
# 登录
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"zhang@example.com","password":"password123"}'

# 获取竞赛列表
curl http://localhost:3000/api/v1/competitions/open

# 创建报名（需要token）
curl -X POST http://localhost:3000/api/v1/registrations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"competitionId":"pedagogy-2024"}'
```

---

## 📝 注意事项

1. **Token过期**: Token默认有效期7天，过期需要重新登录
2. **文件上传**: 当前版本文件上传返回本地路径，生产环境需要上传到OSS
3. **支付接口**: 模拟支付仅用于开发测试，生产环境需要集成真实支付
4. **分页查询**: 建议pageSize不要超过100，避免性能问题
5. **并发请求**: 注意rate limiting，避免频繁请求导致限流

---

**更多信息请查看 Swagger 文档**: http://localhost:3000/api-docs
