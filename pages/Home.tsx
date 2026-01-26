
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Language, translations } from '../i18n';
import api from '../services/api';
import { Competition } from '../types';

interface HomeProps {
  lang: Language;
}

interface NewsItem {
  id: number;
  title: string;
  content: string;
  publishDate: string;
  isPublished: boolean;
  viewCount: number;
}

const Home: React.FC<HomeProps> = ({ lang }) => {
  const t = translations[lang].home;
  const [featuredCompetitions, setFeaturedCompetitions] = useState<Competition[]>([]);
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingNews, setLoadingNews] = useState(true);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);
  const [showNewsModal, setShowNewsModal] = useState(false);

  useEffect(() => {
    loadFeaturedCompetitions();
    loadNews();
  }, []);

  const loadFeaturedCompetitions = async () => {
    setLoading(true);
    try {
      const response = await api.competition.getList({ page: 1, pageSize: 3 });
      if (response.success && response.data) {
        const competitions = response.data.items || response.data;
        setFeaturedCompetitions(Array.isArray(competitions) ? competitions.slice(0, 3) : []);
      }
    } catch (error) {
      console.error('Failed to load featured competitions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNews = async () => {
    setLoadingNews(true);
    try {
      const response = await api.news.getList({ page: 1, pageSize: 6 });
      if (response.success && response.data) {
        const news = response.data.items || response.data;
        setNewsList(Array.isArray(news) ? news : []);
      }
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setLoadingNews(false);
    }
  };

  const handleNewsClick = (news: NewsItem) => {
    setSelectedNews(news);
    setShowNewsModal(true);
  };

  const closeNewsModal = () => {
    setShowNewsModal(false);
    setTimeout(() => setSelectedNews(null), 300);
  };
  
  return (
    <div className="space-y-24 pb-12">
      {/* Enhanced Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-blue-800 to-blue-900 rounded-[2.5rem] p-8 md:p-20 text-white shadow-2xl">
        {/* Animated Background Elements (Education Themed) */}
        <div className="absolute top-0 right-0 w-full h-full pointer-events-none overflow-hidden opacity-20">
          <div className="absolute top-10 right-20 text-6xl font-serif italic select-none"><i className="fas fa-feather-alt"></i></div>
          <div className="absolute bottom-20 right-40 text-8xl font-serif select-none"><i className="fas fa-book"></i></div>
          <div className="absolute top-1/2 right-1/4 text-5xl font-serif select-none"><i className="fas fa-graduation-cap"></i></div>
          <div className="absolute bottom-1/4 right-10 text-7xl font-serif select-none"><i className="fas fa-lightbulb"></i></div>
          <svg className="absolute -bottom-20 -right-20 w-96 h-96 opacity-10" viewBox="0 0 100 100">
             <circle cx="50" cy="50" r="40" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="5,5" />
             <rect x="30" y="30" width="40" height="40" fill="none" stroke="white" strokeWidth="0.2" rx="2" />
          </svg>
        </div>
        
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-200 text-xs font-bold mb-8 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-400"></span>
            </span>
            {lang === 'zh' ? '教师专业成长年度评选进行中' : 'Annual Professional Growth Selection Open'}
          </div>
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-[1.1] tracking-tight">
            {t.heroTitle}
          </h1>
          <p className="text-xl md:text-2xl text-blue-100/80 mb-12 leading-relaxed font-light">
            {t.heroSub}
          </p>
          <div className="flex flex-wrap gap-5">
            <Link to="/competitions" className="bg-white text-indigo-900 px-10 py-4 rounded-2xl font-bold shadow-xl hover:bg-blue-50 transition transform hover:-translate-y-1 active:scale-95 flex items-center gap-2">
              {t.ctaRegister}
              <i className="fas fa-arrow-right text-sm"></i>
            </Link>
            <Link to="/resources" className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-4 rounded-2xl font-bold hover:bg-white/20 transition flex items-center gap-2">
              <i className="fas fa-book-open text-sm"></i>
              {t.ctaGuide}
            </Link>
          </div>
        </div>
      </section>

      {/* News Announcements Section */}
      <section className="bg-white rounded-[2rem] p-8 md:p-12 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <span className="w-1.5 h-8 bg-indigo-600 rounded-full"></span>
            {t.newsTitle}
          </h2>
          <button className="text-sm text-indigo-600 font-semibold hover:underline flex items-center gap-2">
            {t.newsMore}
            <i className="fas fa-arrow-right text-xs"></i>
          </button>
        </div>
        {loadingNews ? (
          <div className="space-y-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center gap-6 animate-pulse">
                <div className="shrink-0 w-16">
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
                <div className="h-0.5 w-4 bg-gray-200"></div>
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : newsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {newsList.map((news) => {
              const date = new Date(news.publishDate);
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const year = date.getFullYear();
              
              return (
                <div 
                  key={news.id} 
                  onClick={() => handleNewsClick(news)}
                  className="flex items-center gap-6 group cursor-pointer hover:bg-gray-50 p-4 rounded-xl transition"
                >
                  <div className="shrink-0 text-center">
                    <div className="text-sm font-bold text-gray-400 group-hover:text-indigo-600 transition">{month}-{day}</div>
                    <div className="text-[10px] text-gray-300 font-medium">{year}</div>
                  </div>
                  <div className="h-0.5 w-4 bg-gray-100 group-hover:w-8 transition-all group-hover:bg-indigo-200"></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-gray-700 font-medium group-hover:text-indigo-700 transition truncate">{news.title}</div>
                  </div>
                  <i className="fas fa-chevron-right text-[10px] text-gray-200 group-hover:text-indigo-400"></i>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <i className="fas fa-newspaper text-6xl text-gray-300 mb-4"></i>
            <p>{lang === 'zh' ? '暂无公告' : 'No announcements'}</p>
          </div>
        )}
      </section>

      {/* Popular Research Categories */}
      <section>
        <div className="flex justify-between items-end mb-10 px-2">
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-4">{t.popular}</h2>
            <p className="text-gray-500 font-medium italic">Leading the future of education through rigorous inquiry.</p>
          </div>
          <Link to="/competitions" className="bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl font-bold hover:bg-indigo-600 hover:text-white transition flex items-center gap-2">
            {t.viewAll}
            <i className="fas fa-external-link-alt text-[10px]"></i>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden animate-pulse">
                <div className="h-56 bg-gray-200"></div>
                <div className="p-8">
                  <div className="h-6 bg-gray-200 rounded mb-4 w-20"></div>
                  <div className="h-8 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-8"></div>
                  <div className="flex items-center justify-between">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                    <div className="h-12 w-12 bg-gray-200 rounded-2xl"></div>
                  </div>
                </div>
              </div>
            ))
          ) : featuredCompetitions.length > 0 ? (
            featuredCompetitions.map(comp => (
            <div key={comp.id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden hover:shadow-2xl transition-all duration-500 group relative">
                <div className="h-56 bg-gradient-to-br from-indigo-50 to-blue-50 flex items-center justify-center relative overflow-hidden">
                   {comp.coverImageUrl ? (
                     <img 
                       src={comp.coverImageUrl} 
                       alt={comp.title}
                       className="w-full h-full object-cover"
                     />
                   ) : (
                     <>
                       <div className="absolute inset-0 opacity-10 group-hover:scale-125 transition-transform duration-700">
                         <svg viewBox="0 0 200 200" className="w-full h-full"><path fill="#6366f1" d="M40,-64.1C51.6,-56.9,60.6,-45,67.6,-32C74.7,-19,79.9,-4.9,78.2,8.8C76.6,22.5,68.2,35.9,57.6,46.1C47.1,56.4,34.5,63.5,21,68.3C7.5,73.1,-7,75.6,-20.5,72C-34,68.4,-46.6,58.8,-56.3,47.1C-66,35.3,-72.9,21.5,-74.6,7.1C-76.3,-7.4,-72.8,-22.4,-65,-35.6C-57.2,-48.7,-45.1,-60.1,-31.6,-66.2C-18.1,-72.3,-3.3,-73.2,10.7,-68.9C24.7,-64.5,40,-64.1Z" transform="translate(100 100)" /></svg>
                       </div>
                       <i className={`fas ${comp.id === 'pedagogy-2024' ? 'fa-book-reader' : comp.id === 'innovation-2024' ? 'fa-chalkboard-teacher' : 'fa-laptop-code'} text-7xl text-indigo-300 relative z-10 group-hover:rotate-12 transition-transform`}></i>
                     </>
                   )}
                </div>
                <div className="p-8">
                   <span className="text-[10px] font-black bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block">{comp.category}</span>
                   <h3 className="text-2xl font-black text-gray-900 mb-4 group-hover:text-indigo-600 transition-colors leading-tight">{lang === 'zh' ? comp.title : comp.id.toUpperCase().replace(/-/g, ' ')}</h3>
                   <p className="text-gray-400 text-sm mb-8 line-clamp-2 leading-relaxed font-medium">{comp.description}</p>
                   <div className="flex items-center justify-between">
                     <div className="flex flex-col">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Evaluation Fee</span>
                        <span className="text-xl font-black text-gray-900">￥{comp.fee}</span>
                     </div>
                     <Link to="/competitions" className="bg-indigo-600 text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:bg-indigo-700 hover:rotate-90 transition-all shadow-lg shadow-indigo-200">
                        <i className="fas fa-plus"></i>
                     </Link>
                   </div>
                </div>
            </div>
          ))
          ) : (
            <div className="col-span-3 text-center py-12 text-gray-500">
              <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
              <p>{lang === 'zh' ? '暂无竞赛信息' : 'No competitions available'}</p>
            </div>
          )}
        </div>
      </section>

      {/* Process Section (Visual Revamp) */}
      <section className="bg-indigo-50/50 rounded-[3rem] p-12 md:p-16 border border-indigo-100">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-gray-900 mb-4">{t.process}</h2>
          <p className="text-gray-400 text-sm font-medium">Standard process for professional recognition.</p>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 relative">
          {t.steps.map((item, i) => (
            <div key={i} className="flex-1 text-center relative z-10 group">
              <div className="w-20 h-20 bg-white rounded-[1.5rem] flex items-center justify-center text-2xl mx-auto mb-6 shadow-sm border border-gray-100 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-xl group-hover:shadow-indigo-100">
                <span className="font-black text-lg opacity-20 absolute -top-2 -right-2 text-gray-400 group-hover:text-white group-hover:opacity-40">0{i+1}</span>
                <i className={`fas ${i===0 ? 'fa-id-badge' : i===1 ? 'fa-pen-fancy' : i===2 ? 'fa-credit-card' : i===3 ? 'fa-file-download' : 'fa-cloud-upload-alt'}`}></i>
              </div>
              <h4 className="font-black text-gray-900 mb-3 text-sm tracking-tight">{item.title}</h4>
              <p className="text-gray-400 text-[11px] leading-relaxed font-medium px-4 opacity-0 group-hover:opacity-100 transition-opacity">{item.desc}</p>
            </div>
          ))}
          {/* Connector Line */}
          <div className="hidden md:block absolute top-10 left-[10%] right-[10%] h-0.5 bg-indigo-100 -z-0"></div>
        </div>
      </section>

      {/* News Detail Modal */}
      {showNewsModal && selectedNews && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={closeNewsModal}
        >
          <div 
            className="bg-white rounded-3xl w-full md:w-[800px] h-[90vh] md:h-[85vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-8 py-6 text-white relative">
              <button 
                onClick={closeNewsModal}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
              <div className="flex items-center gap-3 mb-3">
                <i className="fas fa-bullhorn text-2xl"></i>
                <span className="text-sm font-bold uppercase tracking-wider opacity-90">
                  {lang === 'zh' ? '通知公告' : 'Announcement'}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold leading-tight pr-12">
                {selectedNews.title}
              </h2>
            </div>

            {/* Modal Body */}
            <div className="px-8 py-6 overflow-y-auto h-[calc(90vh-200px)] md:h-[calc(85vh-180px)]">
              {/* Publish Date */}
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
                <i className="fas fa-calendar-alt text-indigo-600"></i>
                <span className="font-medium">
                  {lang === 'zh' ? '发布时间' : 'Published'}:
                </span>
                <span className="font-bold text-gray-700">
                  {new Date(selectedNews.publishDate).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {/* Content */}
              <div className="prose prose-indigo max-w-none">
                <div 
                  className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: selectedNews.content }}
                />
              </div>
            </div>

            
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
