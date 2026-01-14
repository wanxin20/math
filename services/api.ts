// API 配置和工具
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  code?: number;
}

// 统一的请求封装
async function request<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('math_token');
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
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

  // 模拟支付（开发测试用）
  mockPayment: async (registrationId: number) => {
    return request(`/payments/mock/${registrationId}`, {
      method: 'POST',
    });
  },
};

// 论文提交相关 API
export const paperApi = {
  // 提交论文
  submit: async (data: {
    registrationId: number;
    paperTitle: string;
    paperAbstract?: string;
    paperKeywords?: string;
    submissionFileName: string;
    submissionFileUrl: string;
    submissionFileSize?: number;
    submissionFileType?: string;
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
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('math_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/upload/file`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '上传失败');
      }

      return {
        success: true,
        data: data.data || data,
      };
    } catch (error: any) {
      console.error('文件上传错误:', error);
      return {
        success: false,
        message: error.message || '文件上传失败',
      };
    }
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
    const token = localStorage.getItem('math_token');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    window.open(`${API_BASE_URL}/resources/${id}/download`, '_blank');
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
  // 获取新闻列表
  getList: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
  }) => {
    const query = new URLSearchParams(params as any).toString();
    return request(`/news?${query}`);
  },

  // 获取新闻详情
  getDetail: async (id: string) => {
    return request(`/news/${id}`);
  },
};

// 用户相关 API
export const userApi = {
  // 获取用户信息
  getProfile: async () => {
    return request('/users/me');
  },

  // 更新用户信息
  updateProfile: async (data: any) => {
    return request('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  // 修改密码
  changePassword: async (oldPassword: string, newPassword: string) => {
    return request('/users/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
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
  // 上传文件
  uploadFile: async (file: File) => {
    const token = localStorage.getItem('math_token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload/file`, {
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
      console.error('文件上传错误:', error);
      return {
        success: false,
        message: error.message || '文件上传失败',
      };
    }
  },

  // 上传图片
  uploadImage: async (file: File) => {
    const token = localStorage.getItem('math_token');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/upload/image`, {
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
  competition: competitionApi,
  registration: registrationApi,
  payment: paymentApi,
  paper: paperApi,
  resource: resourceApi,
  news: newsApi,
  user: userApi,
  upload: uploadApi,
};
