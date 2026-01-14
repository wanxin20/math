
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User } from '../types';
import { Language, translations } from '../i18n';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
  lang: Language;
  setLang: (lang: Language) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, onLogout, lang, setLang }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const t = translations[lang].nav;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" onClick={closeMenu} className="flex items-center gap-2 group shrink-0">
            <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition">
              <i className="fas fa-feather-alt text-white text-xl"></i>
            </div>
            <span className="text-lg md:text-xl font-bold text-gray-900 tracking-tight truncate max-w-[180px] sm:max-w-none">
              {t.title}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className={`text-sm font-medium transition ${isActive('/') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>{t.home}</Link>
            <Link to="/competitions" className={`text-sm font-medium transition ${isActive('/competitions') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>{t.competitions}</Link>
            <Link to="/resources" className={`text-sm font-medium transition ${isActive('/resources') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>{t.resources}</Link>
            {user && (
              <Link to="/dashboard" className={`text-sm font-medium transition ${isActive('/dashboard') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>{t.dashboard}</Link>
            )}
            {user && user.role === 'admin' && (
              <>
                <Link to="/admin/users" className={`text-sm font-medium transition ${isActive('/admin/users') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>用户管理</Link>
                <Link to="/admin/competitions" className={`text-sm font-medium transition ${isActive('/admin/competitions') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>竞赛管理</Link>
                <Link to="/admin/resources" className={`text-sm font-medium transition ${isActive('/admin/resources') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>资源管理</Link>
              </>
            )}
          </nav>

          {/* Actions & Mobile Toggle */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Language Switcher (Desktop Only) */}
            <button 
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition text-xs font-semibold text-gray-600"
            >
              <i className="fas fa-globe"></i>
              {lang === 'zh' ? 'EN' : '中文'}
            </button>

            {user ? (
              <div className="hidden md:flex items-center gap-4">
                <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                <button onClick={onLogout} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">
                  {t.logout}
                </button>
              </div>
            ) : (
              <Link to="/login" className="hidden sm:block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-sm transition">
                {t.login}
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button 
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              <i className={`fas ${isMenuOpen ? 'fa-times' : 'fa-bars'} text-xl`}></i>
            </button>
          </div>
        </div>

        {/* Mobile Sidebar/Menu */}
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden" onClick={closeMenu}></div>
            
            {/* Menu Panel */}
            <div className="absolute top-16 left-0 w-full bg-white border-b border-gray-200 shadow-xl z-50 md:hidden animate-in slide-in-from-top-2 duration-200">
              <nav className="flex flex-col p-4 space-y-1">
                <Link 
                  to="/" 
                  onClick={closeMenu} 
                  className={`px-4 py-3 rounded-xl text-base font-semibold ${isActive('/') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <i className="fas fa-home w-8"></i>{t.home}
                </Link>
                <Link 
                  to="/competitions" 
                  onClick={closeMenu} 
                  className={`px-4 py-3 rounded-xl text-base font-semibold ${isActive('/competitions') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <i className="fas fa-pen-fancy w-8"></i>{t.competitions}
                </Link>
                <Link 
                  to="/resources" 
                  onClick={closeMenu} 
                  className={`px-4 py-3 rounded-xl text-base font-semibold ${isActive('/resources') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                >
                  <i className="fas fa-book-open w-8"></i>{t.resources}
                </Link>
                {user && (
                  <Link 
                    to="/dashboard" 
                    onClick={closeMenu} 
                    className={`px-4 py-3 rounded-xl text-base font-semibold ${isActive('/dashboard') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                  >
                    <i className="fas fa-user-circle w-8"></i>{t.dashboard}
                  </Link>
                )}
                {user && user.role === 'admin' && (
                  <>
                    <Link 
                      to="/admin/users" 
                      onClick={closeMenu} 
                      className={`px-4 py-3 rounded-xl text-base font-semibold ${isActive('/admin/users') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <i className="fas fa-users-cog w-8"></i>用户管理
                    </Link>
                    <Link 
                      to="/admin/competitions" 
                      onClick={closeMenu} 
                      className={`px-4 py-3 rounded-xl text-base font-semibold ${isActive('/admin/competitions') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <i className="fas fa-trophy w-8"></i>竞赛管理
                    </Link>
                    <Link 
                      to="/admin/resources" 
                      onClick={closeMenu} 
                      className={`px-4 py-3 rounded-xl text-base font-semibold ${isActive('/admin/resources') ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
                    >
                      <i className="fas fa-folder-open w-8"></i>资源管理
                    </Link>
                  </>
                )}
                
                <div className="pt-4 mt-2 border-t border-gray-100 flex flex-col gap-3">
                  <div className="flex items-center justify-between px-4 py-2">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">{lang === 'zh' ? '切换语言' : 'Language'}</span>
                    <button 
                      onClick={() => { setLang(lang === 'zh' ? 'en' : 'zh'); closeMenu(); }}
                      className="text-blue-600 font-bold"
                    >
                      {lang === 'zh' ? 'English' : '简体中文'}
                    </button>
                  </div>
                  
                  {user ? (
                    <div className="flex flex-col gap-3 px-4 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                          {user.name[0]}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-gray-900">{user.name}</span>
                          <span className="text-xs text-gray-500 truncate max-w-[200px]">{user.institution}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => { onLogout(); closeMenu(); }} 
                        className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-bold text-sm"
                      >
                        {t.logout}
                      </button>
                    </div>
                  ) : (
                    <div className="px-4 pb-4">
                      <Link 
                        to="/login" 
                        onClick={closeMenu} 
                        className="flex items-center justify-center w-full bg-blue-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-100"
                      >
                        {t.login}
                      </Link>
                    </div>
                  )}
                </div>
              </nav>
            </div>
          </>
        )}
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {children}
      </main>
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
           <div className="col-span-1 md:col-span-2">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <i className="fas fa-feather-alt text-blue-500 text-2xl"></i>
              <span className="text-xl font-bold text-white">XXXX</span>
            </div>
            <p className="text-sm">Empowering the next generation of educators through research.</p>
           </div>
           <div className="text-xs">
             <h5 className="text-white font-bold mb-4 uppercase tracking-widest">{lang === 'zh' ? '联系我们' : 'Contact Us'}</h5>
             <p>Email: support@xxxx-edu.cn</p>
             <p>Tel: 400-XXX-XXXX</p>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
