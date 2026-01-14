
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Language, translations } from '../i18n';
import api from '../services/api';
import { Competition } from '../types';

interface HomeProps {
  lang: Language;
}

const Home: React.FC<HomeProps> = ({ lang }) => {
  const t = translations[lang].home;
  const [featuredCompetitions, setFeaturedCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedCompetitions();
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

      {/* Stats and News Combined Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Stats */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: '注册教师', value: '12万+', icon: 'fa-chalkboard-teacher', color: 'bg-blue-500' },
            { label: '收录论文', value: '8.5万', icon: 'fa-file-alt', color: 'bg-orange-500' },
            { label: '覆盖学校', value: '4500+', icon: 'fa-school', color: 'bg-purple-500' },
            { label: '评审专家', value: '1200人', icon: 'fa-user-graduate', color: 'bg-emerald-500' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-md transition group">
              <div className={`${stat.color} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                <i className={`fas ${stat.icon}`}></i>
              </div>
              <div className="text-2xl font-black text-gray-900 mb-1">{stat.value}</div>
              <div className="text-gray-400 text-xs font-medium uppercase tracking-widest">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Right: News List */}
        <div className="lg:col-span-2 bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
              {t.newsTitle}
            </h2>
            <button className="text-sm text-indigo-600 font-semibold hover:underline">{t.newsMore}</button>
          </div>
          <div className="space-y-6">
            {t.newsList.map((news, i) => (
              <div key={i} className="flex items-center gap-6 group cursor-pointer">
                <div className="shrink-0 text-center">
                   <div className="text-sm font-bold text-gray-400 group-hover:text-indigo-600 transition">{news.date.split('-')[1]}-{news.date.split('-')[2]}</div>
                   <div className="text-[10px] text-gray-300 font-medium">{news.date.split('-')[0]}</div>
                </div>
                <div className="h-0.5 w-4 bg-gray-100 group-hover:w-8 transition-all group-hover:bg-indigo-200"></div>
                <div className="text-gray-700 font-medium group-hover:text-indigo-700 transition flex-1 truncate">{news.title}</div>
                <i className="fas fa-chevron-right text-[10px] text-gray-200 group-hover:text-indigo-400"></i>
              </div>
            ))}
          </div>
        </div>
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
                   <div className="absolute inset-0 opacity-10 group-hover:scale-125 transition-transform duration-700">
                     <svg viewBox="0 0 200 200" className="w-full h-full"><path fill="#6366f1" d="M40,-64.1C51.6,-56.9,60.6,-45,67.6,-32C74.7,-19,79.9,-4.9,78.2,8.8C76.6,22.5,68.2,35.9,57.6,46.1C47.1,56.4,34.5,63.5,21,68.3C7.5,73.1,-7,75.6,-20.5,72C-34,68.4,-46.6,58.8,-56.3,47.1C-66,35.3,-72.9,21.5,-74.6,7.1C-76.3,-7.4,-72.8,-22.4,-65,-35.6C-57.2,-48.7,-45.1,-60.1,-31.6,-66.2C-18.1,-72.3,-3.3,-73.2,10.7,-68.9C24.7,-64.5,40,-64.1Z" transform="translate(100 100)" /></svg>
                   </div>
                   <i className={`fas ${comp.id === 'pedagogy-2024' ? 'fa-book-reader' : comp.id === 'innovation-2024' ? 'fa-chalkboard-teacher' : 'fa-laptop-code'} text-7xl text-indigo-300 relative z-10 group-hover:rotate-12 transition-transform`}></i>
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

      {/* Partners Section */}
      <section className="text-center">
        <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.3em] mb-12">{t.partnersTitle}</h2>
        <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
           <div className="flex flex-col items-center gap-2">
             <i className="fas fa-university text-4xl"></i>
             <span className="text-[10px] font-bold">EDUCATIONAL ALLIANCE</span>
           </div>
           <div className="flex flex-col items-center gap-2">
             <i className="fas fa-award text-4xl"></i>
             <span className="text-[10px] font-bold">PEDAGOGY SOCIETY</span>
           </div>
           <div className="flex flex-col items-center gap-2">
             <i className="fas fa-school text-4xl"></i>
             <span className="text-[10px] font-bold">STATE SCHOOLS DEPT</span>
           </div>
           <div className="flex flex-col items-center gap-2">
             <i className="fas fa-microchip text-4xl"></i>
             <span className="text-[10px] font-bold">DIGITAL LEARNING</span>
           </div>
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
    </div>
  );
};

export default Home;
