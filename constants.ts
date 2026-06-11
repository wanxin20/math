// API 配置常量
// 开发环境使用完整URL，生产环境使用相对路径（由Nginx代理）
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';
export const APP_NAME = '论文评选平台';

// ===== 门户页脚配置（留空字符串则不显示对应内容）=====
export const PORTAL_ICP_BEIAN = ''; // 例：'粤ICP备2026XXXXXX号'
export const PORTAL_CONTACT_EMAIL = ''; // 例：'contact@szmath.com'
