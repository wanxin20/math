// 青年科学家奖评选 —— 专用 API 客户端。
// 该功能在平台首页是独立入口（顶层路由 /scientist），不在某个 SystemApp 内，
// 故无法靠 URL hash 推断系统；这里**固定指向 paper 系统**（账号/Token/数据都用 paper 论文评选系统）。

const TOKEN_KEY = 'paper_token';
const USER_KEY = 'paper_user';

function getApiBaseUrl(): string {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL as string;
  if (import.meta.env.DEV) return 'http://localhost:3000/api/v1';
  return '/api/paper';
}

export function getScientistToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function getScientistUser(): any | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function setAuth(token: string, user: any) {
  localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function clearScientistAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
  const token = getScientistToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    const res = await fetch(`${getApiBaseUrl()}${endpoint}`, { ...options, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401 && token) clearScientistAuth();
      const msg = Array.isArray(data.message) ? data.message.join('；') : data.message;
      return { success: false, code: res.status, message: msg || '请求失败' };
    }
    // 后端 TransformInterceptor 统一包成 {code,data,message,timestamp}；正确解包，
    // 注意 data 可能合法为 null（如"暂无申报"），不能 ?? 回退到整个信封
    const payload =
      data && typeof data === 'object' && 'data' in data ? (data as { data: T }).data : (data as T);
    return { success: true, data: payload, message: data?.message };
  } catch (e: any) {
    return { success: false, message: e.message || '网络请求失败' };
  }
}

export const scientistAuth = {
  async login(email: string, password: string) {
    const r = await request<{ accessToken: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (r.success && r.data?.accessToken) setAuth(r.data.accessToken, r.data.user);
    return r;
  },
  sendVerificationCode(email: string) {
    return request('/auth/send-verification-code', { method: 'POST', body: JSON.stringify({ email }) });
  },
  verifyCode(email: string, code: string) {
    return request('/auth/verify-code', { method: 'POST', body: JSON.stringify({ email, code }) });
  },
  register(data: {
    name: string;
    email: string;
    password: string;
    institution: string;
    title: string;
    phone: string;
  }) {
    return request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
  },
};

/** 申报材料类别 → 中文标签（前端共用，避免多处重复） */
export const CAT_LABEL: Record<string, string> = {
  form: '申报表',
  certificate: '证件',
  papers: '代表性论文',
  attachment: '其他附件',
  memberForm: '会员申请表',
};

export interface ScientistMaterial {
  category: 'form' | 'certificate' | 'papers' | 'attachment' | 'memberForm';
  fileName: string;
  fileUrl: string;
  size?: number;
  mimetype?: string;
}

export interface ScientistApplicationData {
  name: string;
  birthDate?: string;
  gender?: string;
  institution: string;
  title?: string;
  phone: string;
  email: string;
  researchField?: string;
  isSocietyMember?: boolean;
  willingSponsorConference?: boolean;
  materials?: ScientistMaterial[];
  notes?: string;
}

export const scientistApi = {
  submit(data: ScientistApplicationData) {
    return request('/scientist/application', { method: 'POST', body: JSON.stringify(data) });
  },
  update(data: ScientistApplicationData) {
    return request('/scientist/application/mine', { method: 'PUT', body: JSON.stringify(data) });
  },
  getMine() {
    return request('/scientist/application/mine');
  },
  adminList() {
    return request('/scientist/applications');
  },
  async adminExportExcel(): Promise<{ success: boolean; message?: string }> {
    const token = getScientistToken();
    try {
      const res = await fetch(`${getApiBaseUrl()}/scientist/applications/export`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.status === 401) {
        clearScientistAuth();
        return { success: false, message: '登录已过期，请重新登录' };
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        return { success: false, message: d.message || '导出失败' };
      }
      const blob = await res.blob();
      const disposition = res.headers.get('Content-Disposition');
      let filename = `青年科学家奖申报名单_${Date.now()}.xlsx`;
      if (disposition) {
        const m = disposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i) || disposition.match(/filename="?([^";]+)"?/i);
        if (m?.[1]) filename = decodeURIComponent(m[1].trim().replace(/^["']|["']$/g, ''));
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (e: any) {
      return { success: false, message: e.message || '导出失败' };
    }
  },
};

/** 上传单个文件到 paper 的 /upload/file（→ OSS），带进度回调 */
export function scientistUploadFile(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<ApiResponse<{ filename: string; originalname: string; url: string; size: number; mimetype: string }>> {
  return new Promise((resolve) => {
    const form = new FormData();
    form.append('file', file);
    const token = getScientistToken();
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener('load', () => {
      try {
        if (xhr.status === 401) {
          clearScientistAuth();
          resolve({ success: false, code: 401, message: '登录已过期，请重新登录' });
          return;
        }
        const data = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300) resolve({ success: true, data: data.data || data });
        else resolve({ success: false, message: data.message || '上传失败' });
      } catch (err: any) {
        resolve({ success: false, message: err.message || '文件上传失败' });
      }
    });
    xhr.addEventListener('error', () => resolve({ success: false, message: '网络错误，上传失败' }));
    xhr.open('POST', `${getApiBaseUrl()}/upload/file`);
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(form);
  });
}
