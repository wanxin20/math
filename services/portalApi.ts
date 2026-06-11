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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any = null;
  try {
    body = await res.json();
  } catch {
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
    if (params.cat) {
      query.set('type', CATEGORY_TYPES[params.cat]);
    }
    if (params.q) {
      query.set('search', params.q);
    }
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
  if (!d || isNaN(d.getTime())) {
    return { day: '--', yearMonth: '----', full: '—' };
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    day: pad(d.getDate()),
    yearMonth: `${d.getFullYear()}-${pad(d.getMonth() + 1)}`,
    full: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
  };
}
