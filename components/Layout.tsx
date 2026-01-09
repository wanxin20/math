
import React from 'react';
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
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  const t = translations[lang].nav;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition">
              <i className="fas fa-square-root-alt text-white text-xl"></i>
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">{t.title}</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className={`text-sm font-medium transition ${isActive('/') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>{t.home}</Link>
            <Link to="/competitions" className={`text-sm font-medium transition ${isActive('/competitions') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>{t.competitions}</Link>
            <Link to="/resources" className={`text-sm font-medium transition ${isActive('/resources') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>{t.resources}</Link>
            {user && (
              <Link to="/dashboard" className={`text-sm font-medium transition ${isActive('/dashboard') ? 'text-blue-600' : 'text-gray-600 hover:text-blue-600'}`}>{t.dashboard}</Link>
            )}
          </nav>

          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <button 
              onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition text-xs font-semibold text-gray-600"
            >
              <i className="fas fa-globe"></i>
              {lang === 'zh' ? 'EN' : '中文'}
            </button>

            {user ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold text-gray-900">{user.name}</span>
                </div>
                <button onClick={onLogout} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition">
                  {t.logout}
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium shadow-sm transition">
                {t.login}
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        {children}
      </main>
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8 text-center md:text-left">
           <div className="col-span-1 md:col-span-2">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
              <i className="fas fa-square-root-alt text-blue-500 text-2xl"></i>
              <span className="text-xl font-bold text-white">XXXX</span>
            </div>
            <p className="text-sm">Empowering the next generation of mathematicians.</p>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;