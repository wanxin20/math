// API 配置和工具
// 根据系统选择不同的API地址
import { getSystem, SystemType } from '../store/system';

/**
 * 从 URL 推断当前系统类型（避免时序问题）
 * 优先从 window.location.hash 判断（因为使用 HashRouter）
 */
function getCurrentSystemFromUrl(): SystemType {
  let system = getSystem(); // 默认值
  
  if (typeof window !== 'undefined') {
    const hash = window.location.hash;
    if (hash.startsWith('#/reform')) {
      system = 'reform';
    } else if (hash.startsWith('#/paper')) {
      system = 'paper';
    }
  }
  
  return system;
}

/**
 * 获取当前系统的 API 基础地址
 * - 开发环境：paper系统使用 3000 端口，reform系统使用 3001 端口
 * - 生产环境：通过Nginx代理到 /api/paper/ 或 /api/reform/
 */
function getApiBaseUrl(): string {
  const system = getCurrentSystemFromUrl();
  
  // 如果环境变量指定了 API 地址，直接使用
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // 开发环境：根据系统使用不同端口
  if (import.meta.env.DEV) {
    return system === 'reform' 
      ? 'http://localhost:3001/api/v1'
      : 'http://localhost:3000/api/v1';
  }
  
  // 生产环境：使用相对路径，由Nginx代理
  // Nginx 会将 /api/paper/ 代理到 http://127.0.0.1:3000/api/v1/
  // 所以这里不需要包含 /v1
  return system === 'reform' ? '/api/reform' : '/api/paper';
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

/** 当前系统的 token 键名，与后端多数据源/双实例配合 */
function getTokenKey(): string {
  const system = getCurrentSystemFromUrl();
  return `${system}_token`;
}

// 统一的请求封装
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem(getTokenKey());
  const system = getCurrentSystemFromUrl();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    'X-System': system, // 后端据此切换数据源（若使用单实例多库）
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const apiBaseUrl = getApiBaseUrl();
    const response = await fetch(`${apiBaseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  } catch (error: any) {
    console.error('API请求错误:', error);
    return {
      success: false,
      message: error.message || '网络请求失败',
    };
  }
}

// 认证相关 API
export const authApi = {
  // 登录
  login: async (email: string, password: string) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // 注册
  register: async (data: {
    name: string;
    email: string;
    password: string;
    institution: string;
    title: string;
    phone: string;
  }) => {
    return request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 获取当前用户信息
  getCurrentUser: async () => {
    return request('/auth/profile');
  },

  // 登出
  logout: async () => {
    return request('/auth/logout', {
      method: 'POST',
    });
  },

  // 发送邮箱验证码
  sendVerificationCode: async (email: string) => {
    return request('/auth/send-verification-code', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // 验证邮箱验证码
  verifyCode: async (email: string, code: string) => {
    return request('/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  // 重置密码
  resetPassword: async (email: string, code: string, newPassword: string) => {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
  },
};

// 竞赛相关 API
export const competitionApi = {
  // 获取竞赛列表
  getList: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    category?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/competitions?${query}`);
  },

  // 获取竞赛详情
  getDetail: async (id: string) => {
    return request(`/competitions/${id}`);
  },

  // 管理员：创建竞赛
  adminCreate: async (data: any) => {
    return request('/competitions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 管理员：更新竞赛
  adminUpdate: async (id: string, data: any) => {
    return request(`/competitions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 管理员：删除竞赛
  adminDelete: async (id: string) => {
    return request(`/competitions/${id}`, {
      method: 'DELETE',
    });
  },

  // 管理员：获取竞赛列表（含搜索）
  adminGetList: async (params?: {
    page?: number;
    pageSize?: number;
    status?: string;
    category?: string;
    search?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/competitions?${query}`);
  },
};

// 报名相关 API
export const registrationApi = {
  // 创建报名
  create: async (competitionId: string) => {
    return request('/registrations', {
      method: 'POST',
      body: JSON.stringify({ competitionId }),
    });
  },

  // 获取我的报名列表
  getMyRegistrations: async () => {
    return request('/registrations');
  },

  // 获取报名详情
  getDetail: async (id: string) => {
    return request(`/registrations/${id}`);
  },

  // 取消报名
  cancel: async (id: string) => {
    return request(`/registrations/${id}/cancel`, {
      method: 'POST',
    });
  },

  // 管理员：获取某个竞赛的所有报名记录
  getByCompetitionId: async (competitionId: string) => {
    return request(`/registrations/competition/${competitionId}`);
  },

  // 管理员：导出竞赛报名列表为 Excel（返回 blob 并触发下载）
  exportExcel: async (competitionId: string): Promise<{ success: boolean; message?: string }> => {
    const token = localStorage.getItem(getTokenKey());
    const apiBaseUrl = getApiBaseUrl();
    try {
      const response = await fetch(`${apiBaseUrl}/registrations/competition/${competitionId}/export`, {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        return { success: false, message: data.message || '导出失败' };
      }
      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition');
      let filename = `报名列表_${competitionId}_${Date.now()}.xlsx`;
      if (disposition) {
        const match = disposition.match(/filename\*?=(?:UTF-8'')?([^;]+)/i) || disposition.match(/filename="?([^";]+)"?/i);
        if (match?.[1]) filename = decodeURIComponent(match[1].trim().replace(/^["']|["']$/g, ''));
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true };
    } catch (e: any) {
      console.error('Export Excel error:', e);
      return { success: false, message: e.message || '导出失败' };
    }
  },

  // 确认提交（上传文件后点击提交按钮）
  confirmSubmission: async (registrationId: number) => {
    return request(`/registrations/${registrationId}/confirm-submission`, {
      method: 'POST',
    });
  },

  // 管理员：退回论文（允许用户重新上传，不需要再次缴费）
  rejectSubmission: async (registrationId: number, reason?: string) => {
    return request(`/registrations/${registrationId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason: reason || undefined }),
    });
  },

  // 更新报名发票信息（缴费前）
  updateInvoice: async (
    registrationId: number,
    data: { needInvoice: boolean; invoiceTitle?: string; invoiceTaxNo?: string; invoiceAddress?: string; invoicePhone?: string; invoiceEmail?: string },
  ) => {
    return request(`/registrations/${registrationId}/invoice`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};

// 支付相关 API
export const paymentApi = {
  // 创建支付订单
  create: async (registrationId: string, paymentMethod: 'wechat' | 'alipay') => {
    return request('/payments', {
      method: 'POST',
      body: JSON.stringify({ registrationId, paymentMethod }),
    });
  },

  // 查询支付状态
  getStatus: async (paymentId: string) => {
    return request(`/payments/${paymentId}/status`);
  },

  // 获取我的支付记录
  getMyPayments: async () => {
    return request('/payments/my');
  },

  // 微信支付：创建支付订单（生成二维码）
  wechatCreate: async (registrationId: number) => {
    return request(`/payments/wechat/create/${registrationId}`, {
      method: 'POST',
    });
  },

  // 微信支付：查询订单状态
  wechatQuery: async (registrationId: number) => {
    return request(`/payments/wechat/query/${registrationId}`, {
      method: 'GET',
    });
  },
};

// 论文提交相关 API
export const paperApi = {
  // 提交论文（支持单文件或多文件：submissionFiles 与 submissionFileName+Url 二选一）
  submit: async (data: {
    registrationId: number;
    paperTitle: string;
    paperAbstract?: string;
    paperKeywords?: string;
    submissionFileName?: string;
    submissionFileUrl?: string;
    submissionFileSize?: number;
    submissionFileType?: string;
    submissionFiles?: Array<{ fileName: string; fileUrl: string; size?: number; mimetype?: string }>;
    researchField?: string;
  }) => {
    return request('/papers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 获取我的论文列表
  getMyPapers: async () => {
    return request('/papers/my');
  },

  // 获取论文详情
  getDetail: async (id: string) => {
    return request(`/papers/${id}`);
  },

  // 更新论文
  update: async (id: string, data: any) => {
    return request(`/papers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // 上传论文文件（使用正确的upload端点）
  uploadFile: async (file: File, onProgress?: (percent: number) => void) => {
    return new Promise<ApiResponse>((resolve) => {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem(getTokenKey());
      const apiBaseUrl = getApiBaseUrl();

      const xhr = new XMLHttpRequest();

      // 监听上传进度
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });

      // 监听完成
      xhr.addEventListener('load', () => {
        try {
          const data = JSON.parse(xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              success: true,
              data: data.data || data,
            });
          } else {
            resolve({
              success: false,
              message: data.message || '上传失败',
            });
          }
        } catch (error: any) {
          console.error('文件上传错误:', error);
          resolve({
            success: false,
            message: error.message || '文件上传失败',
          });
        }
      });

      // 监听错误
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          message: '网络错误，上传失败',
        });
      });

      // 监听中断
      xhr.addEventListener('abort', () => {
        resolve({
          success: false,
          message: '上传已取消',
        });
      });

      xhr.open('POST', `${apiBaseUrl}/upload/file`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  },
};

// 资源相关 API
export const resourceApi = {
  // 获取资源列表
  getList: async (params?: {
    page?: number;
    pageSize?: number;
    type?: string;
    category?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/resources?${query}`);
  },

  // 获取资源详情
  getDetail: async (id: string) => {
    return request(`/resources/${id}`);
  },

  // 下载资源
  download: async (id: string) => {
    const token = localStorage.getItem(getTokenKey());
    const apiBaseUrl = getApiBaseUrl();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    window.open(`${apiBaseUrl}/resources/${id}/download`, '_blank');
  },

  // 管理员：获取所有资源列表
  adminGetList: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/resources/admin/list?${query}`);
  },

  // 管理员：获取资源详情
  adminGetDetail: async (id: number) => {
    return request(`/resources/admin/${id}`);
  },

  // 管理员：创建资源
  adminCreate: async (data: {
    name: string;
    description?: string;
    type: string;
    category?: string;
    fileUrl: string;
    fileSize?: number;
    isPublic?: boolean;
    sortOrder?: number;
  }) => {
    return request('/resources/admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 管理员：更新资源
  adminUpdate: async (id: number, data: any) => {
    return request(`/resources/admin/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // 管理员：删除资源
  adminDelete: async (id: number) => {
    return request(`/resources/admin/${id}`, {
      method: 'DELETE',
    });
  },
};

// 新闻公告相关 API
export const newsApi = {
  // 获取已发布新闻列表（公开）
  getList: async (params?: {
    page?: number;
    pageSize?: number;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/news?${query}`);
  },

  // 获取新闻详情（公开）
  getDetail: async (id: number) => {
    return request(`/news/${id}`);
  },

  // 管理员：获取所有新闻列表
  adminGetList: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/news/admin/all?${query}`);
  },

  // 管理员：创建新闻
  adminCreate: async (data: any) => {
    return request('/news', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // 管理员：更新新闻
  adminUpdate: async (id: number, data: any) => {
    return request(`/news/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // 管理员：删除新闻
  adminDelete: async (id: number) => {
    return request(`/news/${id}`, {
      method: 'DELETE',
    });
  },

  // 管理员：切换发布状态
  adminTogglePublish: async (id: number) => {
    return request(`/news/${id}/toggle-publish`, {
      method: 'POST',
    });
  },
};

// 用户相关 API
export const userApi = {
  // 获取当前用户信息
  getProfile: async () => {
    return request('/users/me');
  },

  // 更新个人信息
  updateProfile: async (data: {
    name?: string;
    institution?: string;
    title?: string;
    phone?: string;
  }) => {
    return request('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // 修改密码（需要验证码）
  changePassword: async (email: string, code: string, newPassword: string) => {
    return request('/users/change-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
  },

  // 管理员：获取所有用户列表
  adminGetList: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/users/admin/list?${query}`);
  },

  // 管理员：获取用户统计信息
  adminGetStatistics: async () => {
    return request('/users/admin/statistics');
  },

  // 管理员：获取用户详情
  adminGetDetail: async (id: string) => {
    return request(`/users/admin/${id}`);
  },

  // 管理员：更新用户信息
  adminUpdate: async (id: string, data: any) => {
    return request(`/users/admin/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // 管理员：删除用户
  adminDelete: async (id: string) => {
    return request(`/users/admin/${id}`, {
      method: 'DELETE',
    });
  },
};

// 上传相关 API
export const uploadApi = {
  // 上传文件（支持进度回调）
  uploadFile: async (file: File, onProgress?: (percent: number) => void) => {
    return new Promise<ApiResponse>((resolve) => {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem(getTokenKey());
      const apiBaseUrl = getApiBaseUrl();

      const xhr = new XMLHttpRequest();

      // 监听上传进度
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      });

      // 监听完成
      xhr.addEventListener('load', () => {
        try {
          const result = JSON.parse(xhr.responseText);
          
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve({
              success: true,
              data: result.data,
              message: result.message,
            });
          } else {
            resolve({
              success: false,
              message: result.message || '上传失败',
            });
          }
        } catch (error: any) {
          console.error('文件上传错误:', error);
          resolve({
            success: false,
            message: error.message || '文件上传失败',
          });
        }
      });

      // 监听错误
      xhr.addEventListener('error', () => {
        resolve({
          success: false,
          message: '网络错误，上传失败',
        });
      });

      // 监听中断
      xhr.addEventListener('abort', () => {
        resolve({
          success: false,
          message: '上传已取消',
        });
      });

      xhr.open('POST', `${apiBaseUrl}/upload/file`);
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }
      xhr.send(formData);
    });
  },

  // 上传图片
  uploadImage: async (file: File) => {
    const token = localStorage.getItem(getTokenKey());
    const apiBaseUrl = getApiBaseUrl();
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${apiBaseUrl}/upload/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || '上传失败');
      }

      // 后端通过TransformInterceptor包装后，数据在result.data中
      return {
        success: true,
        data: result.data,
        message: result.message,
      };
    } catch (error: any) {
      console.error('图片上传错误:', error);
      return {
        success: false,
        message: error.message || '图片上传失败',
      };
    }
  },
};

export default {
  auth: authApi,
  user: userApi,
  competition: competitionApi,
  registration: registrationApi,
  payment: paymentApi,
  paper: paperApi,
  resource: resourceApi,
  news: newsApi,
  upload: uploadApi,
};
