# 青年科学家奖评选 — 在线申报功能 设计文档

日期：2026-06-17
仓库：`math`（竞赛平台 / competition.szmath.com）
关联：现有 `/scientist` 静态通知页 → 升级为「注册 + 在线填报 + 材料上传」。

## 1. 背景与目标

现状：`pages/portal/ScientistAward.tsx`（路由 `/scientist`）是纯静态通知页——展示评选通知、下载空白表格、邮箱投递，**没有真正的在线注册/上传**。

甲方原想为「青年科学家奖评选」单独做一套系统（新库、新注册）。为节省成本，**改为复用 contest 系统**（数智创新竞赛，端口 3002，库 `teacher_research_contest`）的账号体系、文件上传、管理员能力，新增一个**独立的申报模块与表**，承载本评选的报名与材料提交。

核心原则：**不改动 contest 现有竞赛的任何表与业务逻辑**（报名/缴费/评审），新功能自成一张表、一个模块。

## 2. 复用 vs 新增

复用（contest 后端现成能力）：
- 账号注册/登录 + JWT（`auth` 模块，三套共用）
- 文件上传 `POST /upload/file` → 阿里云 OSS（5GB，已上线）
- 管理员守卫 `AdminGuard`（`UserRole.ADMIN`）
- Excel 导出（`exceljs` 已是依赖）

新增：
- 后端模块 `scientist`（实体 + 控制器 + 服务 + DTO）
- 前端：首页第 4 张卡片 + 申报页在线申报区 + 管理端列表页

## 3. 数据模型（contest 库新增表 `scientist_application`）

TypeORM 实体 `ScientistApplication`（`backend/src/modules/scientist/entities/scientist-application.entity.ts`）：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | int PK 自增 | |
| `userId` | varchar(36) FK→User，唯一 | 绑定登录账号，一人一份、可修改 |
| `name` | varchar | 申报人姓名 |
| `birthDate` | date | 出生年月（用于"≤40 周岁，1985-01-01 后"提示，仅展示不强制） |
| `gender` | varchar 可空 | 性别 |
| `institution` | varchar | 工作单位 |
| `title` | varchar 可空 | 职称/职务 |
| `phone` | varchar | 手机 |
| `email` | varchar | 邮箱（默认取账号邮箱，可改） |
| `researchField` | varchar 可空 | 研究方向 |
| `isSocietyMember` | boolean 默认 false | 是否学会会员（非会员需上传《会员申请表》） |
| `willingSponsorConference` | boolean 默认 false | **是否愿意赞助、参与、协办学会举办的学术会议**（本次新增勾选项，opt-in） |
| `materials` | json | 附件清单 `[{category, fileName, fileUrl, size, mimetype}]` |
| `notes` | text 可空 | 备注 |
| `status` | enum `draft`/`submitted` 默认 `submitted` | 草稿/已提交 |
| `createdAt` / `updatedAt` | timestamp | |

`materials.category` 取值（与通知"申报材料"对应）：
- `form` 申报表（必填，1 份）
- `certificate` 证件（身份证 / 毕业证 / 学位证 / 职称证，可多份）
- `papers` 代表性论文（≤5 篇，可多份）
- `attachment` 其他附件（专利 / 软著 / 科研项目 / 奖励 / 成果转化或应用证明等，可多份）
- `memberForm` 会员申请表（仅"非会员"显示，可选）

> 说明：实体在共享代码中全局注册，`DB_SYNCHRONIZE=true` 重启时会在 **paper/reform/contest 三个库都建出该空表**（无害，数据只经 contest 接口写入 contest 库）。如要求严格仅 contest 建表，可按 `SYSTEM_PREFIX` 条件注册实体——默认不做（空表无害）。

## 4. 后端接口（`scientist.controller`，挂在 contest 后端）

申报人（`JwtAuthGuard`）：
- `POST /scientist/application` — 提交申报（body：申报人信息 + `willingSponsorConference` + `materials` 清单；文件先经 `/upload/file` 上传拿到 OSS 链接）
- `GET /scientist/application/mine` — 查看本人申报
- `PUT /scientist/application/mine` — 修改/补交（截止前可改）

管理员（`AdminGuard`）：
- `GET /scientist/applications` — 申报列表（分页/搜索）
- `GET /scientist/applications/:id` — 申报明细
- `GET /scientist/applications/export` — 导出名单 Excel（exceljs）

DTO：`CreateScientistApplicationDto` / `UpdateScientistApplicationDto`，含 `class-validator` 校验；遵守全局 `ValidationPipe`（`forbidNonWhitelisted`，字段须在白名单内）。

## 5. 前端

**① 平台首页（`pages/portal/PortalHome.tsx`）**
- 在现有 3 张系统卡片之外，新增**第 4 张卡片「青年科学家奖评选」**，图标用奖章/星标，副标题如「2026 大湾区 · 在线申报与材料提交」，点击进入 `/scientist`。
- 栅格由 `md:grid-cols-3` 调整为容纳 4 张（如 `md:grid-cols-2 lg:grid-cols-4` 或 2×2），保持视觉协调。

**② 申报页（`pages/portal/ScientistAward.tsx`，路由 `/scientist`）**
- 保留：评选通知全文 + 空白表格下载（《申报表》《会员申请表》）。
- 新增「在线申报区」：
  - 未登录 → 注册/登录（**沿用 contest 账号**，调用 `/api/contest/auth/*`）。
  - 已登录 → 申报表单（申报人信息字段 + `willingSponsorConference` 勾选 + 按类别上传材料）→ 提交。
  - 非会员勾选时，动态显示《会员申请表》上传项。
  - 已提交后可返回查看 / 修改。
- 本页所有接口固定走 **contest 系统**（`/api/contest/`，账号/Token 与 contest 一致）。

**③ 管理端**
- 学会用 contest 管理员账号登录，进入「青年科学家奖申报」列表页：查看明细、下载各附件（OSS 链接）、导出名单 Excel。

## 6. 部署影响

- 后端：新增模块需重新编译并重启 PM2（三套都重启，短暂中断）；重启时自动建表（仅新增）。**不改任何现有表/逻辑**，对正在运行的竞赛系统零影响。
- 前端：重新构建并部署到 `/var/www/math`（首页卡片 + 申报页 + 管理端）。
- OSS / nginx：复用现有（上传 5GB、签名跳转）；无需新配置。

## 7. 待确认 / 默认取值

- `willingSponsorConference` 默认 **未勾选（false，opt-in）**；若需默认勾选，改默认值即可。
- 申报人信息字段集如上；如需增减（如身份证号、最高学历）后续可调。
- 截止时间沿用通知中的 2026-07-13（仅前端展示提示，不做硬性拦截）。
