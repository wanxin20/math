# 门户新闻中心设计（Portal News）

日期：2026-06-11
状态：已与用户通过可视化 mockup 确认（首页方案 A / 新闻列表页 / 文章详情页）

## 1. 背景与目标

competition.szmath.com 当前入口页只有"选择进入系统"三张卡片。学会需要在官网发布
《国家自然科学基金项目结题成果科普性介绍》类新闻文章（参考中科院沈自所、电子科大、
上海大学的同类页面），要求：

- 门户首页升级为学会官网形象（蓝白配色），展示新闻动态与通知公告；
- 提供官网风格的新闻列表页与文章详情页（面包屑、标题、发布时间/来源/浏览次数、
  正文配图、附件下载、上一条/下一条）；
- **深链**：给出 `https://competition.szmath.com/#/news/<id>` 链接可直接打开文章
 （结题材料需要可引用的固定 URL）；
- 管理员可持续发布带插图的文章；
- 首篇文章（宽带电磁信号压缩采样，U21A20455，含 3 图）随上线导入。

## 2. 现状

- 前端：React 19 + Vite + HashRouter 单页应用；`/` → SystemSelect，
  `/paper/* | /reform/* | /contest/*` → SystemApp。Tailwind（CDN）+ Font Awesome。
- 后端：NestJS 同一套代码跑三个实例（3000/3001/3002，独立数据库），nginx 反代
  `/api/{paper,reform,contest}/` 与 `/uploads/{paper,reform,contest}/`。
- news 模块已存在：实体 news_announcements（title/content/summary/type/priority/
  isPublished/publishDate/viewCount/attachment*），公开列表与详情（详情自增浏览量），
  管理员 CRUD + 发布切换；paper 系统后台已有 AdminNews 管理页（纯 textarea）。
- upload 模块已有 `POST /upload/image`（10MB，jpg/png/gif/webp），静态服务 `/uploads/`。

## 3. 范围

### 3.1 路由（前端 App.tsx 顶层新增）

| 路由 | 页面 | 说明 |
|---|---|---|
| `/` | PortalHome | 门户首页（替换 SystemSelect 内容） |
| `/news` | NewsList | 新闻列表；`?cat=news`（默认）/ `?cat=notice` 切栏目 |
| `/news/:id` | NewsDetail | 文章详情；支持外部直接深链访问 |

HashRouter 保持不变（无 nginx 改动）。原 `/paper /reform /contest` 路由不动。

### 3.2 数据来源

门户新闻 = **paper 后端** news 模块（生产 `/api/paper/news`，开发
`VITE_API_BASE_URL` 或 `http://localhost:3000/api/v1`）。

栏目映射（复用现有 type 枚举，不改表结构）：

- 新闻动态：`type = 'news'`
- 通知公告：`type IN ('notice','announcement','update')`

reform/contest 系统的公告不聚合到门户（保持系统独立）。paper 系统内部 Home 的
公告列表行为不变。

### 3.3 后端增强（一套代码，三实例共享，向后兼容）

1. `GET /news` 公开列表支持 `?type=news` 或 `?type=notice,announcement,update`
  （逗号分隔；不传 = 全部，兼容现有调用），并支持 `?search=` 标题模糊匹配
  （服务门户头部搜索框）。
2. `GET /news/:id` 公开详情：
   - 仅返回已发布文章，未发布/不存在返回 404（修复现状：现在会返回未发布内容）；
   - 响应附带 `prev` / `next`（按公开列表排序 publishDate DESC, createdAt DESC 的
     相邻已发布文章，仅 id + title，可为 null）。
3. 其余接口不动。

### 3.4 门户前端页面（蓝白主题，与已确认 mockup 一致）

新增 `components/portal/PortalLayout.tsx`：

- 白色学会名称栏（SVG ∑ logo + "深圳市数学学会 / SHENZHEN MATHEMATICAL SOCIETY"），
  右侧标题搜索框：提交后跳 `/news?q=<关键字>`，列表页按标题模糊检索；
- 蓝色导航栏：首页 / 新闻中心 / 论文评选 / 教师论文竞赛 / 数智创新竞赛
 （后三项跳对应系统）；
- 深蓝页脚：学会信息、快速链接、联系方式占位 + 版权行；备案号用 `constants.ts`
  中常量配置，留空则不显示。

`pages/portal/PortalHome.tsx`（路由 `/`）：

- 深蓝渐变横幅（标题 + 副标题，数学符号水印装饰）；
- 新闻动态面板（2/3 宽）：首条 featured（日期徽章 + 标题 + 摘要）+ 4 条列表，
  "查看更多 ›" → `/news`；
- 通知公告面板（1/3 宽）：5 条，带 重要/通知 标签（priority=urgent/important →
  红色"重要"标签），"更多 ›" → `/news?cat=notice`；
- 业务系统入口：三张卡片（SVG 线性图标：文档/学位帽/奖杯，渐变底色），保留原有
  跳转与说明文案，及"三套系统数据与账号独立"提示；
- 数据为空/接口失败时面板显示空态文案，不阻塞页面。

`pages/portal/NewsList.tsx`（路由 `/news`）：

- 子横幅"新闻中心" + 面包屑：首页 › 新闻中心 › {栏目}；
- 左侧栏目导航：新闻动态 / 通知公告（高亮当前，切换改 `?cat=`）；
- 右侧列表：日期徽章 + 标题 + 摘要单行截断，点击 → `/news/:id`；
- 分页（沿用后端 page/pageSize，每页 10 条，显示总条数）；
- 支持 `?q=` 关键字（来自头部搜索框），显示"搜索：xxx 的结果"并可清除。

`pages/portal/NewsDetail.tsx`（路由 `/news/:id`）：

- 面包屑：首页 › 新闻中心 › 正文；
- 居中标题、信息栏（发布时间 ｜ 来源：深圳市数学学会 ｜ 浏览次数）；
- 正文 `dangerouslySetInnerHTML` 渲染（与现有系统内公告模态一致的信任模型：
  内容仅管理员可写）；文章样式：两端对齐、首行缩进、行高 2，`img` 居中限宽、
  圆角细边框，`.fig-cap` 图注样式；
- attachmentUrl 存在时显示附件下载条；
- 底部：返回列表 + 上一条/下一条（来自后端 prev/next）；
- 404/已下线：提示"文章不存在或已下线" + 返回列表链接。

API 封装：`services/api.ts` 新增 `portalNewsApi`（getList(type,page)/getDetail(id)），
独立解析 paper 基址（不依赖当前 system 路径，免登录）。

### 3.5 管理端增强（pages/AdminNews.tsx，paper 系统使用）

- 内容 textarea 上方加"插入图片"按钮：调用现有 `uploadApi.uploadImage`，成功后在
  光标处插入 `<img src="..." alt="">` 与可选 `<p class="fig-cap">图注</p>` 模板；
- 加"预览"切换：用与详情页相同的文章样式渲染当前内容；
- type 下拉补充说明文案（news=门户新闻动态，notice/announcement/update=通知公告）。

### 3.6 首篇文章导入

- docx（已解析）→ HTML：标题、导语、三个章节、3 张插图（压缩为 JPEG，宽 ≤1200px）
  + 图注；
- 图片随脚本存放于 `backend/scripts/assets/news-u21a20455/`，执行时拷贝到
  `backend/uploads/images/`（按现有时间戳命名规则）；正文中的图片 URL 与现有上传
  文件一致（含系统前缀，如 `/uploads/paper/images/<name>.jpg`，生产经 nginx 解析；
  开发环境可设 `APP_URL` 转绝对地址）；
- 种子脚本 `backend/scripts/seed-news-article.js`：插入 news_announcements 一条
 （type=news，isPublished=true，publishDate=2026-06-11，summary=导语截取），
  幂等（按标题查重）；本地开发库执行验证；生产执行步骤写入脚本头部注释。

## 4. 错误处理

- 门户 API 失败：面板空态/“加载失败，点击重试”；列表页重试按钮；详情页区分
  404（已下线）与网络错误（可重试）。
- 深链访问未发布文章：404 文案 + 返回列表。
- 图片加载失败：浏览器默认 alt 展示，不破坏版式。

## 5. 测试与验证

- 后端 jest 单测（news.service）：type 过滤、公开详情仅已发布、prev/next 边界
 （首条/末条/仅一条）。
- 前端：`npm run lint` + `npm run build` 通过；本地起 vite + paper 后端人工验证
  首页/列表/详情/深链/管理端插图全链路。

## 6. 不做的事（YAGNI）

- 不做富文本编辑器（textarea + 插入图片 + 预览已满足）；
- 不聚合 reform/contest 公告；搜索仅限标题模糊匹配（不做全文检索）；
- 不改 HashRouter 为 BrowserRouter（深链已满足，避免 nginx/缓存风险）；
- 不做英文版门户页面。
