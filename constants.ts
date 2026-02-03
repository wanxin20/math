// API 配置常量
// 开发环境使用完整URL，生产环境使用相对路径（由Nginx代理）
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const APP_NAME = '论文评选平台';
