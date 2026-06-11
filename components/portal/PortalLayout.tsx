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
  // 搜索框只在新闻中心（列表/详情）显示
  const showSearch = location.pathname.startsWith('/news');

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
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3.5 shrink-0">
            <span className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-700/25">
              <SigmaIcon size={30} />
            </span>
            <span>
              <span className="block text-[24px] md:text-[27px] font-bold text-[#0f2a5c] tracking-wide leading-tight">
                深圳市数学学会
              </span>
              <span className="hidden sm:block text-[12px] text-slate-500 tracking-wider">
                SHENZHEN MATHEMATICAL SOCIETY
              </span>
            </span>
          </Link>
          {showSearch && (
            <form onSubmit={handleSearch} className="hidden md:flex items-center">
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索新闻标题"
                className="w-52 border border-slate-300 border-r-0 rounded-l-full px-4 py-2 text-sm outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                aria-label="搜索"
                className="bg-blue-700 hover:bg-blue-800 text-white rounded-r-full px-4 py-[9px] transition"
              >
                <SearchIcon />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* 蓝色导航栏 */}
      <nav className="bg-blue-700">
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 flex overflow-x-auto">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`shrink-0 px-6 md:px-8 py-3.5 text-base transition ${
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
      <footer className="bg-[#0f2a5c] text-[#93b4dd] mt-12">
        <div className="max-w-[1320px] mx-auto px-6 md:px-8 py-10 grid grid-cols-1 md:grid-cols-3 gap-8 text-sm leading-8">
          <div>
            <b className="block text-blue-100 text-base mb-2">深圳市数学学会</b>
            服务数学学术交流，促进数学教育发展
          </div>
          <div>
            <b className="block text-blue-100 text-base mb-2">快速链接</b>
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
              <b className="block text-blue-100 text-base mb-2">联系我们</b>
              邮箱：{PORTAL_CONTACT_EMAIL}
            </div>
          )}
        </div>
        <div className="border-t border-[#1e3a8a] text-center text-[13px] py-4 text-[#7396c4]">
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
