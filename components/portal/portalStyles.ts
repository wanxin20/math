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
