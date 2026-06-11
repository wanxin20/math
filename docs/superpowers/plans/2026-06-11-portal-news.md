# 门户新闻中心实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 门户首页升级为学会官网形象（蓝白），新增新闻列表/详情页（支持 `/#/news/:id` 深链），后端 news 公开接口支持栏目过滤/搜索/上一条下一条，并导入首篇结题科普文章。

**Architecture:** 复用 paper 后端（端口 3000 / `/api/paper`）现有 news 模块作为门户新闻源；前端在 HashRouter 顶层加 `/news`、`/news/:id` 路由，门户页面独立于三套系统（免登录）。规格见 `docs/superpowers/specs/2026-06-11-portal-news-design.md`。

**Tech Stack:** React 19 + Vite + Tailwind(CDN) + react-router-dom 7（HashRouter）；NestJS + TypeORM + MySQL；jest（后端单测）。

**验证基线：** 后端 `npm test`；前端 `npm run lint && npm run build`。前端无测试设施（按仓库现状），以 lint+build+本地联调验证。

---

## 文件结构总览

| 文件 | 操作 | 职责 |
|---|---|---|
| `backend/package.json` | 改 | jest 增加 `moduleNameMapper`（支持 `@/` 别名） |
| `backend/src/modules/news/news.service.spec.ts` | 建 | 公开接口单测（type 过滤/搜索/仅已发布/prev-next） |
| `backend/src/modules/news/news.service.ts` | 改 | `findPublished` 支持 type/search；新增 `findOnePublic` |
| `backend/src/modules/news/news.controller.ts` | 改 | 公开列表接 query；公开详情走 `findOnePublic` + 404 |
| `services/portalApi.ts` | 建 | 门户专用 API（固定 paper 基址，免登录）+ 类型 + 日期工具 |
| `components/portal/portalStyles.ts` | 建 | 文章正文 CSS 字符串（`.portal-art-body`、`.fig-cap` 等） |
| `components/portal/PortalIcons.tsx` | 建 | 内联 SVG 图标（∑logo/文档/学位帽/奖杯/箭头/搜索/回形针） |
| `components/portal/PortalLayout.tsx` | 建 | 门户头部（学会名+搜索）/蓝色导航/页脚，注入样式 |
| `pages/portal/PortalHome.tsx` | 建 | 门户首页（横幅+新闻动态+通知公告+系统入口） |
| `pages/portal/NewsList.tsx` | 建 | 新闻列表页（栏目侧边栏/搜索/分页） |
| `pages/portal/NewsDetail.tsx` | 建 | 文章详情页（深链/404/附件/上一条下一条） |
| `App.tsx` | 改 | `/`→PortalHome，新增 `/news`、`/news/:id` |
| `pages/SystemSelect.tsx` | 删 | 被 PortalHome 取代 |
| `constants.ts` | 改 | 页脚备案号/联系邮箱常量 |
| `vite.config.ts` | 改 | dev 代理 `/uploads/paper` → localhost:3000（开发看图） |
| `pages/AdminNews.tsx` | 改 | 插入图片按钮 + 正文预览 + type 选项说明 |
| `backend/scripts/assets/news-u21a20455/article.html` | 建 | 首篇文章正文 HTML（含 `__FIG1__~3__` 占位） |
| `backend/scripts/assets/news-u21a20455/fig{1,2,3}.jpg` | 建 | 压缩后的三张插图（宽≤1200） |
| `backend/scripts/seed-news-article.js` | 建 | 幂等导入脚本（拷图→替换占位→INSERT） |

---

### Task 1: 后端单测基建 + 失败测试（红）

**Files:**
- Modify: `backend/package.json`（jest 块）
- Create: `backend/src/modules/news/news.service.spec.ts`

- [ ] **Step 1.1: jest 配置支持 `@/` 路径别名**

`backend/package.json` 的 `"jest"` 块中 `"testEnvironment": "node"` 之后加：

```json
,
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/$1"
    }
```

（jest `rootDir` 已是 `src`，与 tsconfig 的 `@/* → src/*` 对应。先 `cat backend/tsconfig.json` 确认 paths 映射，若不同则按实际调整。）

- [ ] **Step 1.2: 写失败单测**

`backend/src/modules/news/news.service.spec.ts`：

```ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Like } from 'typeorm';
import { NewsService } from './news.service';
import { NewsAnnouncement, NewsType } from './entities/news-announcement.entity';

const createMockRepo = () => ({
  findAndCount: jest.fn().mockResolvedValue([[], 0]),
  findOne: jest.fn(),
  find: jest.fn().mockResolvedValue([]),
  increment: jest.fn().mockResolvedValue(undefined),
  create: jest.fn(),
  save: jest.fn(),
  remove: jest.fn(),
});

describe('NewsService 门户公开接口', () => {
  let service: NewsService;
  let repo: ReturnType<typeof createMockRepo>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        NewsService,
        { provide: getRepositoryToken(NewsAnnouncement), useFactory: createMockRepo },
      ],
    }).compile();
    service = module.get(NewsService);
    repo = module.get(getRepositoryToken(NewsAnnouncement));
  });

  describe('findPublished', () => {
    it('默认只查已发布，不带 type 过滤', async () => {
      await service.findPublished({ page: 1, pageSize: 10 });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isPublished: true } }),
      );
    });

    it('type=news 单值过滤', async () => {
      await service.findPublished({ page: 1, pageSize: 10, type: 'news' });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isPublished: true, type: NewsType.NEWS } }),
      );
    });

    it('type 多值（逗号分隔）用 In 过滤', async () => {
      await service.findPublished({ page: 1, pageSize: 10, type: 'notice,announcement,update' });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isPublished: true,
            type: In([NewsType.NOTICE, NewsType.ANNOUNCEMENT, NewsType.UPDATE]),
          },
        }),
      );
    });

    it('type 全为非法值时返回空页且不查库', async () => {
      const result = await service.findPublished({ page: 1, pageSize: 10, type: 'bogus' });
      expect(repo.findAndCount).not.toHaveBeenCalled();
      expect(result.items).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('search 用标题 Like 过滤', async () => {
      await service.findPublished({ page: 1, pageSize: 10, search: '基金' });
      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: { isPublished: true, title: Like('%基金%') } }),
      );
    });
  });

  describe('findOnePublic', () => {
    const published = (id: number, title = `新闻${id}`) =>
      ({ id, title, isPublished: true, viewCount: 0 }) as unknown as NewsAnnouncement;

    it('未发布或不存在返回 null 且不自增浏览量', async () => {
      repo.findOne.mockResolvedValue(null);
      const result = await service.findOnePublic(99);
      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 99, isPublished: true } });
      expect(result).toBeNull();
      expect(repo.increment).not.toHaveBeenCalled();
    });

    it('已发布返回详情并自增浏览量', async () => {
      repo.findOne.mockResolvedValue(published(2));
      repo.find.mockResolvedValue([published(3), published(2), published(1)]);
      const result = await service.findOnePublic(2);
      expect(repo.increment).toHaveBeenCalledWith({ id: 2 }, 'viewCount', 1);
      expect(result!.viewCount).toBe(1);
    });

    it('中间一条：prev=更新的一条，next=更旧的一条', async () => {
      repo.findOne.mockResolvedValue(published(2));
      repo.find.mockResolvedValue([published(3), published(2), published(1)]);
      const result = await service.findOnePublic(2);
      expect(result!.prev).toEqual({ id: 3, title: '新闻3' });
      expect(result!.next).toEqual({ id: 1, title: '新闻1' });
    });

    it('最新一条 prev=null；最旧一条 next=null；仅一条两者皆 null', async () => {
      repo.findOne.mockResolvedValue(published(3));
      repo.find.mockResolvedValue([published(3), published(2)]);
      let result = await service.findOnePublic(3);
      expect(result!.prev).toBeNull();
      expect(result!.next).toEqual({ id: 2, title: '新闻2' });

      repo.findOne.mockResolvedValue(published(2));
      result = await service.findOnePublic(2);
      expect(result!.prev).toEqual({ id: 3, title: '新闻3' });
      expect(result!.next).toBeNull();

      repo.findOne.mockResolvedValue(published(1));
      repo.find.mockResolvedValue([published(1)]);
      result = await service.findOnePublic(1);
      expect(result!.prev).toBeNull();
      expect(result!.next).toBeNull();
    });
  });
});
```

- [ ] **Step 1.3: 运行确认失败**

Run: `cd backend && npm test -- news.service.spec`
Expected: FAIL（`findOnePublic` 不存在；`findPublished` 不识别 type/search）

- [ ] **Step 1.4: 提交**

```bash
git add backend/package.json backend/src/modules/news/news.service.spec.ts
git commit -m "test: news 公开接口单测（type过滤/搜索/仅已发布/上一条下一条）"
```

### Task 2: news 服务与控制器实现（绿）

**Files:**
- Modify: `backend/src/modules/news/news.service.ts`
- Modify: `backend/src/modules/news/news.controller.ts`

- [ ] **Step 2.1: service 实现**

`news.service.ts`：导入改为
`import { Repository, Like, In, FindOptionsWhere } from 'typeorm';`，
并导入 `NewsType`：
`import { NewsAnnouncement, NewsType } from './entities/news-announcement.entity';`

替换 `findPublished`：

```ts
  /**
   * 获取已发布的新闻列表（公开）
   * @param type 逗号分隔的 NewsType 过滤（如 "news" 或 "notice,announcement,update"）
   * @param search 标题模糊匹配
   */
  async findPublished(
    paginationDto: PaginationDto & { type?: string; search?: string },
  ) {
    const { page = 1, pageSize = 10, type, search } = paginationDto;

    const where: FindOptionsWhere<NewsAnnouncement> = { isPublished: true };

    if (type) {
      const validTypes = Object.values(NewsType) as string[];
      const types = type
        .split(',')
        .map((t) => t.trim())
        .filter((t): t is NewsType => validTypes.includes(t));
      if (types.length === 0) {
        return new PaginatedResponseDto<NewsAnnouncement>([], 0, page, pageSize);
      }
      where.type = types.length === 1 ? types[0] : In(types);
    }

    if (search) {
      where.title = Like(`%${search}%`);
    }

    const [items, total] = await this.newsRepository.findAndCount({
      where,
      order: { publishDate: 'DESC', createdAt: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return new PaginatedResponseDto(items, total, page, pageSize);
  }
```

`findOne` 保持不动（兼容既有调用），其后新增：

```ts
  /**
   * 门户公开详情：仅已发布；自增浏览量；附带上一条/下一条
   *（按公开列表排序 publishDate DESC, createdAt DESC，上一条=更新的一条）
   */
  async findOnePublic(id: number) {
    const news = await this.newsRepository.findOne({
      where: { id, isPublished: true },
    });
    if (!news) return null;

    await this.newsRepository.increment({ id }, 'viewCount', 1);
    news.viewCount += 1;

    const ordered = await this.newsRepository.find({
      where: { isPublished: true },
      order: { publishDate: 'DESC', createdAt: 'DESC' },
      select: ['id', 'title'],
    });
    const idx = ordered.findIndex((n) => n.id === id);
    const prev = idx > 0 ? { id: ordered[idx - 1].id, title: ordered[idx - 1].title } : null;
    const next =
      idx >= 0 && idx < ordered.length - 1
        ? { id: ordered[idx + 1].id, title: ordered[idx + 1].title }
        : null;

    return { ...news, prev, next };
  }
```

- [ ] **Step 2.2: controller 接 query 与 404**

`news.controller.ts`：`NotFoundException` 加入 `@nestjs/common` 导入；两个公开端点改为：

```ts
  @Get()
  @Public()
  @ApiOperation({ summary: '获取已发布的新闻列表（公开，支持 type/search 过滤）' })
  async findPublished(
    @Query() paginationDto: PaginationDto,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    return this.newsService.findPublished({ ...paginationDto, type, search });
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '获取新闻详情（公开，仅已发布，含上一条/下一条）' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const news = await this.newsService.findOnePublic(id);
    if (!news) {
      throw new NotFoundException('文章不存在或已下线');
    }
    return news;
  }
```

- [ ] **Step 2.3: 跑测试**

Run: `cd backend && npm test -- news.service.spec`
Expected: PASS（11 个用例全绿）

- [ ] **Step 2.4: 编译检查 + 提交**

Run: `cd backend && npx tsc --noEmit -p tsconfig.json`（或 `npm run build`）
Expected: 无错误

```bash
git add backend/src/modules/news/news.service.ts backend/src/modules/news/news.controller.ts
git commit -m "feat: news 公开接口支持栏目过滤/标题搜索/仅已发布详情+上一条下一条"
```

### Task 3: 门户 API 封装 + 常量 + dev 代理

**Files:**
- Create: `services/portalApi.ts`
- Modify: `constants.ts`
- Modify: `vite.config.ts`

- [ ] **Step 3.1: `services/portalApi.ts`**

```ts
// 门户（入口首页/新闻中心）专用 API。
// 门户页面不属于任何子系统，固定使用 paper 后端的公开 news 接口，免登录。

export type PortalNewsCategory = 'news' | 'notice';

export interface PortalNewsItem {
  id: number;
  title: string;
  summary?: string;
  type: 'notice' | 'news' | 'announcement' | 'update';
  priority: 'normal' | 'important' | 'urgent';
  publishDate?: string;
  viewCount: number;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
}

export interface PortalNewsNeighbor {
  id: number;
  title: string;
}

export interface PortalNewsDetail extends PortalNewsItem {
  content: string;
  prev: PortalNewsNeighbor | null;
  next: PortalNewsNeighbor | null;
}

export interface PortalPage<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** 栏目 → 后端 type 过滤参数 */
const CATEGORY_TYPES: Record<PortalNewsCategory, string> = {
  news: 'news',
  notice: 'notice,announcement,update',
};

export const CATEGORY_LABELS: Record<PortalNewsCategory, string> = {
  news: '新闻动态',
  notice: '通知公告',
};

function getPortalApiBase(): string {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (import.meta.env.DEV) {
    return 'http://localhost:3000/api/v1';
  }
  return '/api/paper';
}

export class PortalApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function portalGet<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${getPortalApiBase()}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', 'X-System': 'paper' },
  });
  let body: any = null;
  try {
    body = await res.json();
  } catch (_) {
    /* 非 JSON 响应按状态码处理 */
  }
  if (!res.ok) {
    const msg = Array.isArray(body?.message)
      ? body.message.join('；')
      : body?.message || `请求失败（${res.status}）`;
    throw new PortalApiError(res.status, msg);
  }
  return (body && body.data !== undefined ? body.data : body) as T;
}

export const portalNewsApi = {
  getList(params: {
    cat?: PortalNewsCategory;
    page?: number;
    pageSize?: number;
    q?: string;
  }): Promise<PortalPage<PortalNewsItem>> {
    const query = new URLSearchParams();
    query.set('page', String(params.page ?? 1));
    query.set('pageSize', String(params.pageSize ?? 10));
    if (params.cat) query.set('type', CATEGORY_TYPES[params.cat]);
    if (params.q) query.set('search', params.q);
    return portalGet(`/news?${query.toString()}`);
  },

  getDetail(id: number): Promise<PortalNewsDetail> {
    return portalGet(`/news/${id}`);
  },
};

/** 列表/首页用：日期拆为 日 + 年月（publishDate 可能为空，回退 createdAt） */
export function formatNewsDate(item: { publishDate?: string; createdAt?: string }): {
  day: string;
  yearMonth: string;
  full: string;
} {
  const raw = item.publishDate || item.createdAt;
  const d = raw ? new Date(raw) : null;
  if (!d || isNaN(d.getTime())) return { day: '--', yearMonth: '----', full: '—' };
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    day: pad(d.getDate()),
    yearMonth: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`,
    full: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
  };
}
```

- [ ] **Step 3.2: `constants.ts` 追加**

```ts

// ===== 门户页脚配置（留空字符串则不显示对应内容）=====
export const PORTAL_ICP_BEIAN = ''; // 例：'粤ICP备2026XXXXXX号'
export const PORTAL_CONTACT_EMAIL = ''; // 例：'contact@szmath.com'
```

- [ ] **Step 3.3: vite dev 代理（开发环境能看到正文图片）**

读取 `vite.config.ts`，在 `defineConfig({...})` 中合并：

```ts
  server: {
    proxy: {
      // 正文图片 URL 形如 /uploads/paper/images/xxx.jpg（生产由 nginx 解析）
      '/uploads/paper': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/uploads\/paper/, '/uploads'),
      },
    },
  },
```

（若已有 `server` 配置则在其中追加 `proxy` 键。）

- [ ] **Step 3.4: lint + build + 提交**

Run: `npm run lint && npm run build`
Expected: 通过（portalApi 暂未被引用，确认无 unused 报错；若 ESLint 报 unused-export 类问题忽略——该规则未启用）

```bash
git add services/portalApi.ts constants.ts vite.config.ts
git commit -m "feat: 门户新闻 API 封装与页脚常量、dev 图片代理"
```

### Task 4: 门户外壳（样式/图标/布局）

**Files:**
- Create: `components/portal/portalStyles.ts`
- Create: `components/portal/PortalIcons.tsx`
- Create: `components/portal/PortalLayout.tsx`

- [ ] **Step 4.1: `components/portal/portalStyles.ts`**

```ts
// 门户文章正文排版样式（详情页与管理端预览共用）。
// 管理员正文 HTML 中可用的类：fig-cap（图注）、sec-title（章节标题）。
export const PORTAL_ARTICLE_CSS = `
.portal-art-body { font-size: 16px; color: #374151; line-height: 2; text-align: justify; word-break: break-word; }
.portal-art-body p { text-indent: 2em; margin: 0 0 14px; }
.portal-art-body img { display: block; margin: 18px auto 8px; max-width: min(88%, 900px); height: auto; border: 1px solid #eef2f7; border-radius: 6px; box-shadow: 0 4px 16px rgba(15,42,92,.07); }
.portal-art-body .fig-cap { text-align: center; text-indent: 0; font-size: 13px; color: #64748b; margin: 0 0 18px; }
.portal-art-body .sec-title { font-weight: 700; color: #0f2a5c; margin: 18px 0 10px; }
.portal-art-body a { color: #1d4ed8; }
.portal-art-body table { margin: 12px auto; border-collapse: collapse; }
.portal-art-body td, .portal-art-body th { border: 1px solid #e2e8f0; padding: 6px 10px; }
`;
```

- [ ] **Step 4.2: `components/portal/PortalIcons.tsx`**

```tsx
import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

/** ∑ 学会 logo 符号 */
export const SigmaIcon: React.FC<IconProps> = ({ size = 26, className, strokeWidth = 2.4 }) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}>
    <path d="M18 5.5V4H6l7 8-7 8h12v-1.5" />
  </svg>
);

/** 文档（论文评选） */
export const FileTextIcon: React.FC<IconProps> = ({ size = 24, className, strokeWidth = 2 }) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <line x1="10" y1="9" x2="8" y2="9" />
  </svg>
);

/** 学位帽（教师论文竞赛） */
export const GraduationCapIcon: React.FC<IconProps> = ({ size = 24, className, strokeWidth = 2 }) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}>
    <path d="M22 10 12 5 2 10l10 5 10-5z" />
    <path d="M6 12.5V17c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
    <path d="M22 10v6" />
  </svg>
);

/** 奖杯（数智创新竞赛） */
export const TrophyIcon: React.FC<IconProps> = ({ size = 24, className, strokeWidth = 2 }) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}>
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
    <path d="M6 2h12v7a6 6 0 0 1-12 0V2z" />
    <path d="M12 15v3" />
    <path d="M8 22h8" />
    <path d="M10 22a2 2 0 0 1 2-2 2 2 0 0 1 2 2" />
  </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 14, className, strokeWidth = 2.4 }) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 16, className, strokeWidth = 2.4 }) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const PaperclipIcon: React.FC<IconProps> = ({ size = 18, className, strokeWidth = 2 }) => (
  <svg {...base(size)} strokeWidth={strokeWidth} className={className}>
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);
```

- [ ] **Step 4.3: `components/portal/PortalLayout.tsx`**

```tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PORTAL_ICP_BEIAN, PORTAL_CONTACT_EMAIL } from '../../constants';
import { PORTAL_ARTICLE_CSS } from './portalStyles';
import { SigmaIcon, SearchIcon } from './PortalIcons';

const NAV_ITEMS: { label: string; to: string; isActive: (path: string) => boolean }[] = [
  { label: '首页', to: '/', isActive: (p) => p === '/' },
  { label: '新闻中心', to: '/news', isActive: (p) => p.startsWith('/news') },
  { label: '论文评选', to: '/paper', isActive: () => false },
  { label: '教师论文竞赛', to: '/reform', isActive: () => false },
  { label: '数智创新竞赛', to: '/contest', isActive: () => false },
];

/**
 * 门户外壳：学会名称栏 + 蓝色导航 + 页脚。
 * 用于 / 、/news 、/news/:id（系统内部页面仍用各自 Layout）。
 */
const PortalLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = keyword.trim();
    navigate(q ? `/news?q=${encodeURIComponent(q)}` : '/news');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f3f7fc]">
      <style>{PORTAL_ARTICLE_CSS}</style>

      {/* 学会名称栏 */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-[1140px] mx-auto px-4 md:px-6 py-3.5 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 shrink-0">
            <span className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-700/25">
              <SigmaIcon />
            </span>
            <span>
              <span className="block text-[20px] md:text-[22px] font-bold text-[#0f2a5c] tracking-wide leading-tight">
                深圳市数学学会
              </span>
              <span className="hidden sm:block text-[11px] text-slate-500 tracking-wider">
                SHENZHEN MATHEMATICAL SOCIETY
              </span>
            </span>
          </Link>
          <form onSubmit={handleSearch} className="hidden md:flex items-center">
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="搜索新闻标题"
              className="w-44 border border-slate-300 border-r-0 rounded-l-full px-4 py-1.5 text-[13px] outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              aria-label="搜索"
              className="bg-blue-700 hover:bg-blue-800 text-white rounded-r-full px-4 py-[7px] transition"
            >
              <SearchIcon />
            </button>
          </form>
        </div>
      </div>

      {/* 蓝色导航栏 */}
      <nav className="bg-blue-700">
        <div className="max-w-[1140px] mx-auto px-4 md:px-6 flex overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`shrink-0 px-5 md:px-6 py-3 text-[15px] transition ${
                item.isActive(location.pathname)
                  ? 'bg-blue-800 text-white font-semibold'
                  : 'text-blue-100 hover:bg-blue-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="flex-1">{children}</main>

      {/* 页脚 */}
      <footer className="bg-[#0f2a5c] text-[#93b4dd] mt-10">
        <div className="max-w-[1140px] mx-auto px-6 py-7 grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px] leading-7">
          <div>
            <b className="block text-blue-100 text-sm mb-1">深圳市数学学会</b>
            服务数学学术交流，促进数学教育发展
          </div>
          <div>
            <b className="block text-blue-100 text-sm mb-1">快速链接</b>
            <Link to="/news" className="hover:text-white">新闻中心</Link>
            <span className="mx-2 opacity-40">/</span>
            <Link to="/paper" className="hover:text-white">论文评选</Link>
            <span className="mx-2 opacity-40">/</span>
            <Link to="/reform" className="hover:text-white">教师论文竞赛</Link>
            <span className="mx-2 opacity-40">/</span>
            <Link to="/contest" className="hover:text-white">数智创新竞赛</Link>
          </div>
          {PORTAL_CONTACT_EMAIL && (
            <div>
              <b className="block text-blue-100 text-sm mb-1">联系我们</b>
              邮箱：{PORTAL_CONTACT_EMAIL}
            </div>
          )}
        </div>
        <div className="border-t border-[#1e3a8a] text-center text-xs py-3 text-[#7396c4]">
          版权所有 © {new Date().getFullYear()} 深圳市数学学会
          {PORTAL_ICP_BEIAN && <span className="mx-2">｜</span>}
          {PORTAL_ICP_BEIAN && (
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              {PORTAL_ICP_BEIAN}
            </a>
          )}
        </div>
      </footer>
    </div>
  );
};

export default PortalLayout;
```

- [ ] **Step 4.4: lint + build + 提交**

Run: `npm run lint && npm run build`
Expected: 通过

```bash
git add components/portal/
git commit -m "feat: 门户外壳（布局/SVG图标/文章排版样式）"
```

### Task 5: 门户首页 PortalHome + 路由切换

**Files:**
- Create: `pages/portal/PortalHome.tsx`
- Modify: `App.tsx`
- Delete: `pages/SystemSelect.tsx`

- [ ] **Step 5.1: `pages/portal/PortalHome.tsx`**

```tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '../../components/portal/PortalLayout';
import {
  FileTextIcon,
  GraduationCapIcon,
  TrophyIcon,
  ArrowRightIcon,
} from '../../components/portal/PortalIcons';
import {
  portalNewsApi,
  PortalNewsItem,
  formatNewsDate,
} from '../../services/portalApi';
import { systemConfig } from '../../store/system';

const SYSTEM_CARDS = [
  {
    to: '/paper',
    name: systemConfig.paper.name,
    desc: '深圳市数学学会论文评选、报名、提交与评审',
    icon: <FileTextIcon />,
    iconBg: 'bg-gradient-to-br from-indigo-600 to-indigo-500 shadow-indigo-600/30',
    accent: 'text-indigo-600',
    hoverBorder: 'hover:border-indigo-200',
  },
  {
    to: '/reform',
    name: systemConfig.reform.name,
    desc: '教育教学改革项目管理、申报与评审',
    icon: <GraduationCapIcon />,
    iconBg: 'bg-gradient-to-br from-emerald-600 to-emerald-500 shadow-emerald-600/30',
    accent: 'text-emerald-600',
    hoverBorder: 'hover:border-emerald-200',
  },
  {
    to: '/contest',
    name: systemConfig.contest.name,
    desc: '湾区数学与智能+科技创新竞赛',
    icon: <TrophyIcon />,
    iconBg: 'bg-gradient-to-br from-amber-500 to-amber-400 shadow-amber-500/30',
    accent: 'text-amber-600',
    hoverBorder: 'hover:border-amber-200',
  },
];

const PRIORITY_TAG: Record<string, { label: string; cls: string }> = {
  urgent: { label: '重要', cls: 'bg-red-50 text-red-600 border-red-200' },
  important: { label: '重要', cls: 'bg-red-50 text-red-600 border-red-200' },
  normal: { label: '通知', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
};

type PanelState = { items: PortalNewsItem[]; loading: boolean; error: boolean };
const initialPanel: PanelState = { items: [], loading: true, error: false };

/** 门户首页：横幅 + 新闻动态/通知公告 + 业务系统入口。路由: / */
const PortalHome: React.FC = () => {
  const [news, setNews] = useState<PanelState>(initialPanel);
  const [notices, setNotices] = useState<PanelState>(initialPanel);

  const load = async (
    cat: 'news' | 'notice',
    set: React.Dispatch<React.SetStateAction<PanelState>>,
  ) => {
    set((s) => ({ ...s, loading: true, error: false }));
    try {
      const page = await portalNewsApi.getList({ cat, page: 1, pageSize: 5 });
      set({ items: page.items, loading: false, error: false });
    } catch (e) {
      console.error(`加载${cat === 'news' ? '新闻' : '公告'}失败`, e);
      set({ items: [], loading: false, error: true });
    }
  };

  useEffect(() => {
    load('news', setNews);
    load('notice', setNotices);
  }, []);

  const featured = news.items[0];
  const restNews = news.items.slice(1);

  const emptyHint = (state: PanelState, cat: 'news' | 'notice') =>
    state.loading ? (
      <div className="py-10 text-center text-slate-400 text-sm">加载中…</div>
    ) : state.error ? (
      <div className="py-10 text-center text-slate-400 text-sm">
        加载失败{' '}
        <button
          onClick={() => load(cat, cat === 'news' ? setNews : setNotices)}
          className="text-blue-700 hover:underline"
        >
          重试
        </button>
      </div>
    ) : (
      <div className="py-10 text-center text-slate-400 text-sm">暂无内容</div>
    );

  return (
    <PortalLayout>
      {/* 横幅 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2a5c] via-blue-700 to-blue-500 text-white">
        <div className="absolute right-0 top-2 text-6xl tracking-[18px] opacity-10 whitespace-nowrap select-none pointer-events-none">
          ∑ ∫ π √ ∞ ƒ(x) Δ λ θ ∂
        </div>
        <div className="max-w-[1140px] mx-auto px-4 md:px-6 py-10 md:py-12">
          <h1 className="text-2xl md:text-[32px] font-bold tracking-widest mb-2.5">
            深圳市数学学会学术服务平台
          </h1>
          <p className="text-sm md:text-[15px] text-blue-200 tracking-wider">
            论文评选 · 教师论文竞赛 · 数智创新竞赛 —— 服务数学学术交流与人才培养
          </p>
        </div>
      </div>

      <div className="max-w-[1140px] mx-auto px-4 md:px-6 py-7">
        {/* 新闻 + 公告 双栏 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <section className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <header className="flex items-center justify-between px-5 py-3.5 border-b-2 border-slate-100">
              <h2 className="text-[17px] font-bold text-[#0f2a5c] border-l-4 border-blue-700 pl-2.5">
                新闻动态
              </h2>
              <Link to="/news" className="text-[13px] text-blue-700 hover:underline">
                查看更多 ›
              </Link>
            </header>
            {featured ? (
              <>
                <Link
                  to={`/news/${featured.id}`}
                  className="flex gap-3.5 px-5 py-4 border-b border-dashed border-slate-200 group"
                >
                  <span className="shrink-0 w-[58px] h-[58px] bg-blue-50 border border-blue-200 rounded-lg text-center text-blue-700">
                    <span className="block text-[22px] font-extrabold leading-tight mt-1.5">
                      {formatNewsDate(featured).day}
                    </span>
                    <span className="block text-[11px] text-blue-400">
                      {formatNewsDate(featured).yearMonth}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] text-slate-800 leading-relaxed font-medium group-hover:text-blue-700 transition">
                      {featured.title}
                    </span>
                    {featured.summary && (
                      <span className="block text-[12.5px] text-slate-400 leading-relaxed mt-1.5 line-clamp-2">
                        {featured.summary}
                      </span>
                    )}
                  </span>
                </Link>
                <ul className="px-5 py-2">
                  {restNews.map((n) => (
                    <li key={n.id} className="border-b border-dotted border-slate-100 last:border-none">
                      <Link
                        to={`/news/${n.id}`}
                        className="flex items-center justify-between gap-4 py-2.5 group"
                      >
                        <span className="truncate text-sm text-slate-700 group-hover:text-blue-700 transition">
                          <span className="text-blue-500 mr-2">•</span>
                          {n.title}
                        </span>
                        <span className="shrink-0 text-xs text-slate-400">
                          {formatNewsDate(n).full}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              emptyHint(news, 'news')
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <header className="flex items-center justify-between px-5 py-3.5 border-b-2 border-slate-100">
              <h2 className="text-[17px] font-bold text-[#0f2a5c] border-l-4 border-blue-700 pl-2.5">
                通知公告
              </h2>
              <Link to="/news?cat=notice" className="text-[13px] text-blue-700 hover:underline">
                更多 ›
              </Link>
            </header>
            {notices.items.length > 0 ? (
              <ul className="px-5 py-2">
                {notices.items.map((n) => {
                  const tag = PRIORITY_TAG[n.priority] || PRIORITY_TAG.normal;
                  return (
                    <li key={n.id} className="border-b border-dotted border-slate-100 last:border-none">
                      <Link to={`/news/${n.id}`} className="block py-2.5 text-[13.5px] leading-relaxed text-slate-700 hover:text-blue-700 transition">
                        <span className={`inline-block text-[11px] px-1.5 py-px rounded border mr-2 align-[1px] ${tag.cls}`}>
                          {tag.label}
                        </span>
                        {n.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              emptyHint(notices, 'notice')
            )}
          </section>
        </div>

        {/* 系统入口 */}
        <h2 className="text-[17px] font-bold text-[#0f2a5c] border-l-4 border-blue-700 pl-2.5 mt-7 mb-3.5">
          业务系统入口
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 md:gap-5">
          {SYSTEM_CARDS.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className={`group bg-white border border-slate-200 rounded-xl p-5.5 md:p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-700/10 ${card.hoverBorder}`}
            >
              <span className={`w-[50px] h-[50px] rounded-xl text-white flex items-center justify-center mb-3.5 shadow-lg ${card.iconBg}`}>
                {card.icon}
              </span>
              <h3 className="text-[17px] font-bold text-slate-800 mb-1">{card.name}</h3>
              <p className="text-[12.5px] text-slate-400 mb-3">{card.desc}</p>
              <span className={`inline-flex items-center gap-1.5 text-[13.5px] font-semibold ${card.accent}`}>
                进入系统
                <span className="group-hover:translate-x-1 transition-transform">
                  <ArrowRightIcon />
                </span>
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-5 text-center text-[13px] text-slate-400">
          三套系统数据与账号独立，请分别登录使用
        </p>
      </div>
    </PortalLayout>
  );
};

export default PortalHome;
```

- [ ] **Step 5.2: `App.tsx` 路由**

```tsx
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import PortalHome from './pages/portal/PortalHome';
import NewsList from './pages/portal/NewsList';
import NewsDetail from './pages/portal/NewsDetail';
import SystemApp from './components/SystemApp';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PortalHome />} />
        <Route path="/news" element={<NewsList />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/paper/*" element={<SystemApp system="paper" />} />
        <Route path="/reform/*" element={<SystemApp system="reform" />} />
        <Route path="/contest/*" element={<SystemApp system="contest" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
```

注意：本步骤与 Task 6/7 的 NewsList/NewsDetail 同批提交（App.tsx 引用它们才能编译）。
**执行顺序：Task 5.1 → Task 6 → Task 7 → 回到本步骤改 App.tsx → 删 SystemSelect → 统一验证提交。**

- [ ] **Step 5.3: 删除 `pages/SystemSelect.tsx`**

```bash
git rm pages/SystemSelect.tsx
```

- [ ] **Step 5.4: lint + build + 提交（与 Task 6/7 合并验证后）**

Run: `npm run lint && npm run build`
Expected: 通过

```bash
git add App.tsx pages/portal/
git commit -m "feat: 门户首页/新闻列表/文章详情页与顶层路由（含 /#/news/:id 深链）"
```

### Task 6: 新闻列表页 NewsList

**Files:**
- Create: `pages/portal/NewsList.tsx`

- [ ] **Step 6.1: 组件**

```tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import PortalLayout from '../../components/portal/PortalLayout';
import {
  portalNewsApi,
  PortalNewsItem,
  PortalNewsCategory,
  CATEGORY_LABELS,
  formatNewsDate,
} from '../../services/portalApi';

const PAGE_SIZE = 10;
const CATS: PortalNewsCategory[] = ['news', 'notice'];

/** 新闻列表页。路由: /news?cat=news|notice&page=1&q=关键字 */
const NewsList: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const cat: PortalNewsCategory = searchParams.get('cat') === 'notice' ? 'notice' : 'news';
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const q = searchParams.get('q') || '';

  const [items, setItems] = useState<PortalNewsItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    portalNewsApi
      .getList({ cat: q ? undefined : cat, page, pageSize: PAGE_SIZE, q: q || undefined })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error('加载新闻列表失败', e);
        setError(true);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [cat, page, q]);

  const switchCat = (next: PortalNewsCategory) => {
    setSearchParams(next === 'news' ? {} : { cat: next });
  };

  const gotoPage = (p: number) => {
    const params: Record<string, string> = {};
    if (cat !== 'news') params.cat = cat;
    if (q) params.q = q;
    if (p > 1) params.page = String(p);
    setSearchParams(params);
    window.scrollTo(0, 0);
  };

  return (
    <PortalLayout>
      <div className="bg-gradient-to-r from-[#0f2a5c] via-blue-700 to-blue-500 text-white">
        <div className="max-w-[1140px] mx-auto px-4 md:px-6 py-6 text-2xl font-bold tracking-widest">
          新闻中心
        </div>
      </div>
      <div className="bg-[#f3f7fc] border-b border-slate-200/70">
        <div className="max-w-[1140px] mx-auto px-4 md:px-6 py-3 text-[13px] text-slate-500">
          当前位置：<Link to="/" className="text-blue-700 hover:underline">首页</Link>
          <span className="mx-1">›</span>新闻中心
          <span className="mx-1">›</span>
          {q ? `搜索“${q}”` : CATEGORY_LABELS[cat]}
        </div>
      </div>

      <div className="max-w-[1140px] mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-5 items-start">
          {/* 栏目侧边栏 */}
          <aside className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="bg-gradient-to-br from-blue-700 to-blue-500 text-white text-[17px] font-bold px-5 py-4 tracking-wider">
              新闻中心
            </div>
            {CATS.map((c) => (
              <button
                key={c}
                onClick={() => switchCat(c)}
                className={`w-full flex items-center justify-between px-5 py-3.5 text-left text-[14.5px] border-b border-slate-100 transition ${
                  !q && cat === c
                    ? 'text-blue-700 font-bold bg-blue-50 border-l-4 border-l-blue-700 pl-4'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {CATEGORY_LABELS[c]} <span>›</span>
              </button>
            ))}
          </aside>

          {/* 列表 */}
          <section className="bg-white border border-slate-200 rounded-xl px-5 md:px-6 pb-5">
            {q && (
              <div className="flex items-center justify-between pt-4 text-sm text-slate-500">
                <span>
                  搜索 <b className="text-slate-700">“{q}”</b> 的结果（{total} 条）
                </span>
                <button onClick={() => navigate('/news')} className="text-blue-700 hover:underline">
                  清除搜索
                </button>
              </div>
            )}
            {loading ? (
              <div className="py-20 text-center text-slate-400">加载中…</div>
            ) : error ? (
              <div className="py-20 text-center text-slate-400">
                加载失败{' '}
                <button onClick={() => gotoPage(page)} className="text-blue-700 hover:underline">
                  重试
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="py-20 text-center text-slate-400">暂无内容</div>
            ) : (
              <ul>
                {items.map((n) => {
                  const d = formatNewsDate(n);
                  return (
                    <li key={n.id} className="border-b border-dashed border-slate-200 last:border-none">
                      <Link to={`/news/${n.id}`} className="flex items-center gap-4 py-4 group">
                        <span className="shrink-0 w-16 h-16 bg-[#f5f9ff] border border-blue-100 rounded-lg text-center text-blue-700">
                          <span className="block text-2xl font-extrabold leading-tight mt-2">{d.day}</span>
                          <span className="block text-[11px] text-blue-400">{d.yearMonth}</span>
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-base text-slate-800 leading-relaxed group-hover:text-blue-700 transition">
                            {n.title}
                          </span>
                          {n.summary && (
                            <span className="block truncate text-[12.5px] text-slate-400 mt-1">
                              {n.summary}
                            </span>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {!loading && !error && totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4 text-[13px]">
                <button
                  disabled={page <= 1}
                  onClick={() => gotoPage(page - 1)}
                  className="border border-slate-200 rounded-md px-3 py-1.5 text-slate-600 disabled:opacity-40 hover:border-blue-300"
                >
                  ‹ 上一页
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                  .map((p, idx, arr) => (
                    <React.Fragment key={p}>
                      {idx > 0 && arr[idx - 1] !== p - 1 && <span className="text-slate-400">…</span>}
                      <button
                        onClick={() => gotoPage(p)}
                        className={`border rounded-md px-3 py-1.5 ${
                          p === page
                            ? 'bg-blue-700 border-blue-700 text-white'
                            : 'border-slate-200 text-slate-600 hover:border-blue-300'
                        }`}
                      >
                        {p}
                      </button>
                    </React.Fragment>
                  ))}
                <button
                  disabled={page >= totalPages}
                  onClick={() => gotoPage(page + 1)}
                  className="border border-slate-200 rounded-md px-3 py-1.5 text-slate-600 disabled:opacity-40 hover:border-blue-300"
                >
                  下一页 ›
                </button>
                <span className="text-slate-400 ml-1">共 {total} 条</span>
              </div>
            )}
          </section>
        </div>
      </div>
    </PortalLayout>
  );
};

export default NewsList;
```

（说明：带 `q` 搜索时跨栏目搜全部已发布文章，故 `cat: undefined`；侧边栏高亮也随之取消。）

### Task 7: 文章详情页 NewsDetail（深链核心）

**Files:**
- Create: `pages/portal/NewsDetail.tsx`

- [ ] **Step 7.1: 组件**

```tsx
import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PortalLayout from '../../components/portal/PortalLayout';
import { PaperclipIcon } from '../../components/portal/PortalIcons';
import {
  portalNewsApi,
  PortalNewsDetail as NewsDetailData,
  PortalApiError,
  formatNewsDate,
} from '../../services/portalApi';

type LoadState =
  | { status: 'loading' }
  | { status: 'notfound' }
  | { status: 'error' }
  | { status: 'ok'; data: NewsDetailData };

/** 文章详情页。路由: /news/:id —— 支持外部深链直接访问 */
const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const numericId = Number(id);

  const load = () => {
    if (!Number.isInteger(numericId) || numericId <= 0) {
      setState({ status: 'notfound' });
      return;
    }
    setState({ status: 'loading' });
    portalNewsApi
      .getDetail(numericId)
      .then((data) => setState({ status: 'ok', data }))
      .catch((e) => {
        if (e instanceof PortalApiError && e.status === 404) {
          setState({ status: 'notfound' });
        } else {
          console.error('加载文章失败', e);
          setState({ status: 'error' });
        }
      });
  };

  useEffect(() => {
    load();
    window.scrollTo(0, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (state.status === 'ok') {
      const prevTitle = document.title;
      document.title = `${state.data.title} - 深圳市数学学会`;
      return () => {
        document.title = prevTitle;
      };
    }
  }, [state]);

  return (
    <PortalLayout>
      <div className="bg-gradient-to-r from-[#0f2a5c] via-blue-700 to-blue-500 text-white">
        <div className="max-w-[1140px] mx-auto px-4 md:px-6 py-6 text-2xl font-bold tracking-widest">
          新闻中心
        </div>
      </div>
      <div className="bg-[#f3f7fc] border-b border-slate-200/70">
        <div className="max-w-[1140px] mx-auto px-4 md:px-6 py-3 text-[13px] text-slate-500">
          当前位置：<Link to="/" className="text-blue-700 hover:underline">首页</Link>
          <span className="mx-1">›</span>
          <Link to="/news" className="text-blue-700 hover:underline">新闻中心</Link>
          <span className="mx-1">›</span>正文
        </div>
      </div>

      <div className="max-w-[1140px] mx-auto px-4 md:px-6 py-6">
        <div className="bg-white border border-slate-200 rounded-xl px-5 py-8 md:px-14 md:py-10">
          {state.status === 'loading' && (
            <div className="py-24 text-center text-slate-400">加载中…</div>
          )}

          {state.status === 'notfound' && (
            <div className="py-24 text-center">
              <div className="text-slate-500 mb-4">文章不存在或已下线</div>
              <Link to="/news" className="text-blue-700 font-semibold hover:underline">
                ‹ 返回新闻列表
              </Link>
            </div>
          )}

          {state.status === 'error' && (
            <div className="py-24 text-center">
              <div className="text-slate-500 mb-4">加载失败，请稍后重试</div>
              <button onClick={load} className="text-blue-700 font-semibold hover:underline">
                重新加载
              </button>
            </div>
          )}

          {state.status === 'ok' && (
            <article>
              <h1 className="text-xl md:text-[25px] font-extrabold text-slate-800 text-center leading-relaxed mb-4">
                {state.data.title}
              </h1>
              <div className="text-center text-[13px] text-slate-400 pb-4 border-b border-slate-100 mb-6">
                <span>发布时间:{formatNewsDate(state.data).full}</span>
                <span className="mx-2.5 text-slate-200">｜</span>
                <span>来源:深圳市数学学会</span>
                <span className="mx-2.5 text-slate-200">｜</span>
                <span>浏览次数:{state.data.viewCount}</span>
              </div>

              <div
                className="portal-art-body"
                dangerouslySetInnerHTML={{ __html: state.data.content }}
              />

              {state.data.attachmentUrl && (
                <div className="flex items-center gap-2.5 bg-[#f8fbff] border border-blue-200 rounded-lg px-4 py-3.5 mt-6 text-sm text-slate-700">
                  <span className="text-blue-700"><PaperclipIcon /></span>
                  附件：
                  <a
                    href={state.data.attachmentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-700 font-semibold hover:underline"
                  >
                    {state.data.attachmentName || '下载附件'}
                  </a>
                </div>
              )}

              <div className="mt-7 pt-4 border-t border-slate-100 text-sm leading-loose text-slate-600">
                <Link to="/news" className="float-right text-blue-700 font-semibold hover:underline">
                  返回列表 ›
                </Link>
                <div>
                  <span className="text-slate-400">上一条：</span>
                  {state.data.prev ? (
                    <Link to={`/news/${state.data.prev.id}`} className="hover:text-blue-700">
                      {state.data.prev.title}
                    </Link>
                  ) : (
                    <span className="text-slate-400">（无）</span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400">下一条：</span>
                  {state.data.next ? (
                    <Link to={`/news/${state.data.next.id}`} className="hover:text-blue-700">
                      {state.data.next.title}
                    </Link>
                  ) : (
                    <span className="text-slate-400">（无）</span>
                  )}
                </div>
              </div>
            </article>
          )}
        </div>
      </div>
    </PortalLayout>
  );
};

export default NewsDetail;
```

（完成本组件后回到 Task 5.2-5.4 改 App.tsx、删 SystemSelect、统一 lint/build/提交。）

### Task 8: AdminNews 插入图片 + 预览

**Files:**
- Modify: `pages/AdminNews.tsx`

- [ ] **Step 8.1: 状态与处理函数**

读取 `pages/AdminNews.tsx`。在组件顶部已有 state 区追加：

```tsx
  const contentTextareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
```

在 `handleAttachmentUpload` 之后追加：

```tsx
  /** 在正文光标处插入 HTML 片段 */
  const insertAtCursor = (snippet: string) => {
    if (!editingNews) return;
    const content = editingNews.content || '';
    const ta = contentTextareaRef.current;
    if (!ta) {
      setEditingNews({ ...editingNews, content: content + snippet });
      return;
    }
    const start = ta.selectionStart ?? content.length;
    const end = ta.selectionEnd ?? content.length;
    setEditingNews({
      ...editingNews,
      content: content.slice(0, start) + snippet + content.slice(end),
    });
  };

  /** 上传图片并在光标处插入 <img> + 图注模板 */
  const handleInsertImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingNews) return;
    setImageUploading(true);
    try {
      const res = await uploadApi.uploadImage(file);
      if (res.success && res.data?.url) {
        insertAtCursor(`\n<img src="${res.data.url}" alt="" />\n<p class="fig-cap">图X　请替换为图注</p>\n`);
      } else {
        alert(res.message || '图片上传失败，请重试');
      }
    } catch (err) {
      console.error('图片上传失败', err);
      alert('图片上传失败，请重试');
    } finally {
      setImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };
```

确认文件顶部已 `import { useRef }`（已有）并已导入 `uploadApi`（已有）。

- [ ] **Step 8.2: 编辑弹窗 UI**

找到内容 `<textarea ...>`（约 575 行）。改造：

1. textarea 加 `ref={contentTextareaRef}`；
2. 其上方加工具行（与现有 inline-style 风格一致）：

```tsx
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    disabled={imageUploading}
                    style={{
                      padding: '6px 14px', backgroundColor: '#eff6ff', color: '#1d4ed8',
                      border: '1px solid #bfdbfe', borderRadius: '8px', fontSize: '13px',
                      cursor: imageUploading ? 'wait' : 'pointer',
                    }}
                  >
                    {imageUploading ? '上传中…' : '🖼 插入图片'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPreview((v) => !v)}
                    style={{
                      padding: '6px 14px', backgroundColor: showPreview ? '#1d4ed8' : '#f8fafc',
                      color: showPreview ? '#fff' : '#475569', border: '1px solid #e2e8f0',
                      borderRadius: '8px', fontSize: '13px', cursor: 'pointer',
                    }}
                  >
                    {showPreview ? '关闭预览' : '👁 预览'}
                  </button>
                  <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                    支持 HTML；图片插入后可在 &lt;p class="fig-cap"&gt; 中填写图注
                  </span>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    style={{ display: 'none' }}
                    onChange={handleInsertImage}
                  />
                </div>
```

3. textarea 之后加预览块：

```tsx
                {showPreview && (
                  <div style={{ marginTop: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '20px', maxHeight: '420px', overflow: 'auto', background: '#fff' }}>
                    <style>{PORTAL_ARTICLE_CSS}</style>
                    <div
                      className="portal-art-body"
                      dangerouslySetInnerHTML={{ __html: editingNews.content || '<p style="color:#9ca3af">（暂无内容）</p>' }}
                    />
                  </div>
                )}
```

文件顶部导入：`import { PORTAL_ARTICLE_CSS } from '../components/portal/portalStyles';`

- [ ] **Step 8.3: type 下拉选项说明**

找到类型 `<select>`（含 notice/news/announcement/update option），option 文案改为：

```tsx
<option value="notice">通知（门户·通知公告栏）</option>
<option value="news">新闻（门户·新闻动态栏）</option>
<option value="announcement">公告（门户·通知公告栏）</option>
<option value="update">更新（门户·通知公告栏）</option>
```

- [ ] **Step 8.4: lint + build + 提交**

Run: `npm run lint && npm run build`
Expected: 通过

```bash
git add pages/AdminNews.tsx
git commit -m "feat: 新闻管理支持正文插入图片与门户样式预览"
```

### Task 9: 首篇文章资产与种子脚本

**Files:**
- Create: `backend/scripts/assets/news-u21a20455/fig1.jpg / fig2.jpg / fig3.jpg`
- Create: `backend/scripts/assets/news-u21a20455/article.html`
- Create: `backend/scripts/seed-news-article.js`

- [ ] **Step 9.1: 压缩三张插图**

源图在 `.tmp-docx/unpacked/word/media/image{1,2,3}.png`（已从 docx 解出）。先目视确认 image2=图2（AIC 硬件照片）、image3=图3（软件平台界面）与文中顺序一致，再：

```bash
python - <<'EOF'
from PIL import Image
import os
src = r'D:\86135\Desktop\myprojects\math\.tmp-docx\unpacked\word\media'
dst = r'D:\86135\Desktop\myprojects\math\backend\scripts\assets\news-u21a20455'
os.makedirs(dst, exist_ok=True)
for i in (1, 2, 3):
    img = Image.open(os.path.join(src, f'image{i}.png'))
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    if img.width > 1200:
        img = img.resize((1200, round(img.height * 1200 / img.width)), Image.LANCZOS)
    img.save(os.path.join(dst, f'fig{i}.jpg'), 'JPEG', quality=88)
    print(f'fig{i}.jpg', img.size, os.path.getsize(os.path.join(dst, f'fig{i}.jpg')), 'bytes')
EOF
```

Expected: 三个 jpg，每个 < 300KB

- [ ] **Step 9.2: `article.html`（正文，占位 `__FIG1__`~`__FIG3__`）**

完整内容（来自 docx 提取文本；两处明显笔误已修正并需在交付说明中告知用户核对：
①"本成本成果取得了"→"本成果取得了"；②"替代传统多级超外差著降低"→"替代传统多级超外差架构，显著降低"）：

```html
<p>本介绍来源于国家自然科学基金联合重点项目“宽带电磁信号压缩采样与智能处理一体化研究”（No. U21A20455）。项目起止时间为2022年1月至2025年12月。本项目工作概括如下：</p>
<p class="sec-title">一、项目背景</p>
<p>随着雷达、通信和遥测等技术快速发展，电磁信号的频率范围不断拓展，瞬时带宽持续增加，频谱环境日益密集。传统数字接收机依赖高速采样获取宽带信号，不仅对模数转换器件提出了更高要求，也显著增加了数据传输、存储和实时处理压力。压缩感知理论通过利用信号的稀疏结构，以较少观测数据恢复关键信息，为低于奈奎斯特速率的宽带信号采样提供了新的技术路径。</p>
<p>然而，现有方法在复杂环境下仍面临若干挑战：首先，基于传统压缩感知的亚奈奎斯特采样方法在频谱密集、低信噪比条件下性能容易下降，如何发展新的压缩感知方法和理论，实现低信噪比环境下频谱密集宽带电磁信号的高效压缩采样。其次，如何构建智能处理一体化框架，实现复杂环境下大瞬时带宽信号的实时电子监测。</p>
<p>针对上述问题，本项目面向频谱密集、低信噪比和复杂电磁环境下的宽带信号监测需求，围绕宽带电磁信号新型压缩采样硬件系统和压缩感知方法与理论，以及智能处理一体化平台开展研究，为提升宽带电磁信号的高效采样、快速处理和智能识别能力提供理论与技术支撑。</p>
<p class="sec-title">二、研究取得成果的总体情况</p>
<p>本项目构建了覆盖“宽带电磁信号获取—压缩采样硬件实现—信号重构与感知识别—性能评估与自适应控制”的软硬件一体化体系，形成了从前端设备、核心硬件到后端算法与验证平台的全套设计与实现，如图1所示。</p>
<img src="__FIG1__" alt="图1 宽带电磁信号压缩采样与智能处理全流程" />
<p class="fig-cap">图1　宽带电磁信号压缩采样与智能处理全流程</p>
<p>项目研制了新型压缩采样硬件系统，开发了智能处理一体化软件平台，提出了一系列面向低信噪比和密集频谱环境的信号重构、检测与识别方法。在本项目资助下，共发表高水平学术论文近60篇，申请发明专利近40项；培养了一批优秀的硕士和博士研究生及博士后。</p>
<p class="sec-title">三、相关成果</p>
<p class="sec-title">成果一：新型AIC硬件系统</p>
<p>针对传统宽带接收机采样速率高、数据量大和处理压力重的问题，项目研制了参数可调的“新型AIC（模拟信息转换器）硬件系统”，如图2所示，该硬件结合自适应网络模块，可动态调节采样方式，以实现智能系统的闭环运行。具备200 MHz—40 GHz频率监测范围，可对200 MHz—6 GHz范围内的信号开展压缩感知处理，支持8路并行混频和8通道同步采集，瞬时分析带宽达到6 GHz，ADC有效位数达到13位，为复杂电磁环境下的亚奈奎斯特采样实验和算法验证提供了稳定平台。</p>
<img src="__FIG2__" alt="图2 新型AIC硬件系统" />
<p class="fig-cap">图2　新型AIC硬件系统</p>
<p>本成果取得三个方面的进展：</p>
<p>（1）面向宽带电磁信号的自适应压缩采样一体化架构：本项目突破传统压缩采集系统“固定采样结构”的设计范式，构建了融合“压缩采样—信号重构—硬件链路灵活调整”的一体化系统框架。通过引入可重构的硬件带通链路及灵活化的码型波形，使系统能够根据不同电磁环境与信号特征动态调整采样策略，显著提升了压缩采样系统在复杂、多变信号场景下的鲁棒性与适应性。</p>
<p>（2）实现宽带快速感知与高动态范围接收性能的协同优化：突破了传统接收机在“感知速度”与“动态范围”之间的性能制约，本项目基于压缩感知（CS）理论与调制宽带转换（MWC）结构，提出一种无需逐频扫描的宽带并行感知机制。兼顾了宽带并行化处理的快速感知特性与低速高精度 ADC的优势信噪比与动态范围性能。</p>
<p>（3）构建低复杂度、高性价比的超宽带压缩采样硬件实现路径：本项目在硬件实现层面提出了一种兼顾性能与成本的系统设计方案。通过采用单级宽带混频与低通滤波结构，替代传统多级超外差架构，显著降低模拟前端复杂度；同时，多通道低速高精度采样方案避免了射频直采架构对超高速 ADC 的链路的依赖，实现系统整体性能与成本之间的优化平衡。</p>
<p class="sec-title">成果二：基于张量的多尺度频率注意力智能重构网络</p>
<p>在低信噪比和频谱密集场景中，相邻信号可能非常接近，传统压缩感知算法容易出现重构精度下降、弱信号漏检等问题。项目团队将模型驱动方法、深度学习、连续频率表示和张量低秩结构相结合，提出了基于张量的多尺度频率注意力智能重构网络。面向多观测宽带压缩感知重构，该方法将多帧观测提升到三阶 Hankel 张量空间，利用 Tucker 低秩分解刻画跨时间、跨通道和跨子带的联合结构，并结合几何感知深度展开方法提升恢复效率。</p>
<p>本成果取得了以下三方面进展：</p>
<p>（1）将多帧观测数据提升至三阶 Hankel 张量空间，充分利用不同观测之间的多维结构相关性，为频谱密集条件下的联合重构提供更加有效的先验信息。</p>
<p>（2）构建几何感知的深度展开网络，将流形约束、可学习度量和向量场修正机制引入迭代过程，以提升算法对复杂信号结构的适应能力和求解效率。</p>
<p>（3）建立相应的理论分析。在目标张量满足一定非相干性条件、算法参数设置合理的情况下，证明算法的恢复误差会随着迭代过程持续下降，并具有线性收敛性质。</p>
<p class="sec-title">成果三：智能处理一体化软件平台</p>
<p>围绕宽带电磁信号从采集到分析的完整处理流程，项目团队开发了“宽带电磁信号压缩采样与智能处理一体化软件平台”，如图3所示。该平台将硬件控制、测试信号生成、压缩采样配置、信号重构、检测识别、自适应调参以及性能评估等功能集成到统一软件环境中。该平台既可用于仿真数据分析，也可与压缩采样硬件系统联动，为算法测试、系统验证和典型场景下的性能评估提供统一工具。</p>
<img src="__FIG3__" alt="图3 宽带电磁信号压缩采样与智能处理一体化软件平台" />
<p class="fig-cap">图3　宽带电磁信号压缩采样与智能处理一体化软件平台</p>
<p>本成果取得了以下三方面进展：</p>
<p>（1）构建软硬件协同的一体化验证环境：平台通过硬件上位机模块实现采样参数配置、设备状态监测、数据交互和统一控制，并支持与压缩采样硬件系统对接，提高了软硬件联合调试和系统验证的便利性。</p>
<p>（2）集成多类压缩采样与信号处理算法：平台支持调制宽带转换器、模拟信息转换器等压缩采样结构的配置与验证，并集成经典稀疏重构方法以及项目提出的系列算法，可用于不同信号条件下的重构、检测和识别实验。</p>
<p>（3）形成面向复杂环境的自适应处理闭环：平台能够根据采样结果和信号状态，对采样方式、重构算法和关键参数进行动态调整，并对误差、信噪比、命中率等指标进行评估和可视化展示，为复杂电磁环境下的智能监测和处理提供技术支撑。</p>
```

- [ ] **Step 9.3: 种子脚本 `backend/scripts/seed-news-article.js`**

先 `cat backend/env.config.example` 确认 DB 环境变量名（预期 `DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_DATABASE`，若不同按实际改脚本）。

```js
/**
 * 导入《国家自然科学基金项目结题成果科普性介绍》（U21A20455）到 news_announcements。
 *
 * 用法（在 backend 目录下执行，需 node + mysql2，已是项目依赖）：
 *   node scripts/seed-news-article.js --env .env            # 指定环境文件
 *   node scripts/seed-news-article.js --env .env.paper
 *   node scripts/seed-news-article.js --env .env.paper --force   # 已存在时更新正文
 *
 * 行为：
 *   1) 将 scripts/assets/news-u21a20455/fig{1,2,3}.jpg 按上传命名规则拷贝到 uploads/images/
 *   2) 正文占位符替换为 /uploads/<SYSTEM_PREFIX>/images/<文件名>（与现网上传文件一致，nginx 解析）
 *   3) 幂等：按标题查重，已存在则跳过（--force 时更新 content/summary）
 *
 * 生产部署：在 paper 实例目录执行并指向 paper 库；图片目录需随 uploads 一起持久化。
 */
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const TITLE =
  '这些技术助力宽带电磁信号高效压缩采样与智能化处理——国家自然科学基金项目结题成果科普性介绍';
const SUMMARY =
  '本介绍来源于国家自然科学基金联合重点项目“宽带电磁信号压缩采样与智能处理一体化研究”（No. U21A20455），项目起止时间为2022年1月至2025年12月。';
const PUBLISH_DATE = '2026-06-11';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { env: '.env', force: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--env') out.env = args[++i];
    else if (args[i] === '--force') out.force = true;
  }
  return out;
}

/** 极简 .env 解析（KEY=VALUE，支持注释行） */
function loadEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  const env = {};
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
  return env;
}

async function main() {
  const { env: envFile, force } = parseArgs();
  const backendRoot = path.resolve(__dirname, '..');
  const env = { ...loadEnvFile(path.join(backendRoot, envFile)), ...process.env };

  const prefix = env.SYSTEM_PREFIX || 'paper';
  const assetsDir = path.join(__dirname, 'assets', 'news-u21a20455');
  const uploadsDir = path.join(backendRoot, 'uploads', 'images');
  fs.mkdirSync(uploadsDir, { recursive: true });

  // 1) 拷贝图片（按现有上传命名规则：时间戳-随机数.jpg）
  const urls = {};
  for (const i of [1, 2, 3]) {
    const src = path.join(assetsDir, `fig${i}.jpg`);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}.jpg`;
    fs.copyFileSync(src, path.join(uploadsDir, name));
    urls[`__FIG${i}__`] = `/uploads/${prefix}/images/${name}`;
  }

  // 2) 组装正文
  let content = fs.readFileSync(path.join(assetsDir, 'article.html'), 'utf8');
  for (const [ph, url] of Object.entries(urls)) {
    content = content.replaceAll(ph, url);
  }

  // 3) 入库（幂等）
  const conn = await mysql.createConnection({
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USERNAME || env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_DATABASE || env.DB_NAME,
    charset: 'utf8mb4',
  });
  try {
    const [rows] = await conn.execute(
      'SELECT id FROM news_announcements WHERE title = ? LIMIT 1',
      [TITLE],
    );
    if (rows.length > 0) {
      if (!force) {
        console.log(`已存在（id=${rows[0].id}），跳过。如需更新正文请加 --force`);
        return;
      }
      await conn.execute(
        'UPDATE news_announcements SET content = ?, summary = ? WHERE id = ?',
        [content, SUMMARY, rows[0].id],
      );
      console.log(`已更新正文（id=${rows[0].id}）`);
      return;
    }
    const [result] = await conn.execute(
      `INSERT INTO news_announcements
        (title, content, summary, type, priority, is_published, publish_date, view_count)
       VALUES (?, ?, ?, 'news', 'normal', 1, ?, 0)`,
      [TITLE, content, SUMMARY, PUBLISH_DATE],
    );
    console.log(`导入成功，id=${result.insertId}`);
    console.log(`门户深链：https://competition.szmath.com/#/news/${result.insertId}`);
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error('导入失败：', err.message);
  process.exit(1);
});
```

- [ ] **Step 9.4: 本地执行验证（若本地 MySQL 可用）**

Run: `cd backend && node scripts/seed-news-article.js --env <本地 paper 环境文件>`
Expected: `导入成功，id=N`；`uploads/images/` 出现 3 张 jpg。
（本地无数据库时跳过执行，记入交付说明。）

- [ ] **Step 9.5: 提交**

```bash
git add backend/scripts/assets/news-u21a20455/ backend/scripts/seed-news-article.js
git commit -m "feat: 首篇结题科普文章资产与幂等导入脚本"
```

### Task 10: 端到端验证

- [ ] **Step 10.1: 全量静态检查**

Run: `npm run lint && npm run build && cd backend && npm test && npx tsc --noEmit -p tsconfig.json`
Expected: 全部通过

- [ ] **Step 10.2: 本地联调（paper 后端 + vite dev）**

1. 启动 paper 后端（按 backend README/启动脚本，端口 3000）；
2. `npm run dev` 启动前端（注意 `.env.development` 已设 `VITE_API_BASE_URL=http://localhost:3000/api/v1`）；
3. 验证清单：
   - `http://localhost:5173/#/` 门户首页：横幅/双栏/三卡片渲染，新闻动态出现种子文章；
   - 点击文章 → `/#/news/1` 详情：标题/日期/浏览量/三图/上一条下一条/返回列表；
   - **深链**：新开浏览器标签直接访问 `http://localhost:5173/#/news/1`，应直接打开文章；
   - `/#/news` 列表分页与栏目切换、`/#/news?cat=notice`；
   - 头部搜索"基金" → 列表显示搜索结果；
   - 刷新详情页浏览次数 +1；
   - `/#/paper` 等三个系统入口可正常进入（回归）；
   - paper 管理员 → 新闻管理：插入图片、预览、保存（回归 + 新功能）。
4. 后端不可用时（无本地 MySQL）：至少验证前端各页渲染空态/错误态不崩溃，并在交付说明中标注未验证项。

- [ ] **Step 10.3: 视觉对照**

与定稿 mockup（`.superpowers/brainstorm/1939-1781167443/content/homepage-fullpage-v2.html`、`news-pages.html`）对照首页/列表/详情整体观感（蓝白、间距、字号），明显偏差则修正。

- [ ] **Step 10.4: 收尾提交**

```bash
git add -A
git commit -m "chore: 门户新闻中心联调修正"   # 仅当有修正时
```

---

## Self-Review 结论

- **Spec 覆盖**：路由/深链（T5/T7）、type+search+prev/next+仅已发布（T1/T2）、门户三页（T4-T7）、页脚常量（T3）、AdminNews 增强（T8）、种子导入（T9）、错误态（T6/T7 组件内）、测试与验证（T1/T10）——全覆盖。
- **占位符**：无 TBD；备案号/邮箱常量留空属于产品配置而非计划占位。
- **类型一致性**：`findOnePublic` 命名前后一致；`PortalNewsDetail.prev/next` 与后端返回结构一致；`fig-cap/sec-title` 类名在 portalStyles、article.html、AdminNews 模板三处一致；`formatNewsDate` 签名一致。
