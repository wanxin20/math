import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '../../components/portal/PortalLayout';
import {
  FileTextIcon,
  GraduationCapIcon,
  TrophyIcon,
  ArrowRightIcon,
} from '../../components/portal/PortalIcons';
import {
  portalNewsApi,
  PortalNewsItem,
  formatNewsDate,
} from '../../services/portalApi';
import { systemConfig } from '../../store/system';

const SYSTEM_CARDS = [
  {
    to: '/paper',
    name: systemConfig.paper.name,
    desc: '深圳市数学学会论文评选、报名、提交与评审',
    icon: <FileTextIcon size={28} />,
    iconBg: 'bg-gradient-to-br from-indigo-600 to-indigo-500 shadow-indigo-600/30',
    accent: 'text-indigo-600',
    hoverBorder: 'hover:border-indigo-200',
  },
  {
    to: '/reform',
    name: systemConfig.reform.name,
    desc: '教育教学改革项目管理、申报与评审',
    icon: <GraduationCapIcon size={28} />,
    iconBg: 'bg-gradient-to-br from-emerald-600 to-emerald-500 shadow-emerald-600/30',
    accent: 'text-emerald-600',
    hoverBorder: 'hover:border-emerald-200',
  },
  {
    to: '/contest',
    name: systemConfig.contest.name,
    desc: '湾区数学与智能+科技创新竞赛',
    icon: <TrophyIcon size={28} />,
    iconBg: 'bg-gradient-to-br from-amber-500 to-amber-400 shadow-amber-500/30',
    accent: 'text-amber-600',
    hoverBorder: 'hover:border-amber-200',
  },
];

const PRIORITY_TAG: Record<string, { label: string; cls: string }> = {
  urgent: { label: '重要', cls: 'bg-red-50 text-red-600 border-red-200' },
  important: { label: '重要', cls: 'bg-red-50 text-red-600 border-red-200' },
  normal: { label: '通知', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
};

type PanelState = { items: PortalNewsItem[]; loading: boolean; error: boolean };
const initialPanel: PanelState = { items: [], loading: true, error: false };

/** 门户首页：横幅 + 新闻动态/通知公告 + 业务系统入口。路由: / */
const PortalHome: React.FC = () => {
  const [news, setNews] = useState<PanelState>(initialPanel);
  const [notices, setNotices] = useState<PanelState>(initialPanel);

  const load = async (
    cat: 'news' | 'notice',
    set: React.Dispatch<React.SetStateAction<PanelState>>,
  ) => {
    set((s) => ({ ...s, loading: true, error: false }));
    try {
      const page = await portalNewsApi.getList({ cat, page: 1, pageSize: 5 });
      set({ items: page.items, loading: false, error: false });
    } catch (e) {
      console.error(`加载${cat === 'news' ? '新闻' : '公告'}失败`, e);
      set({ items: [], loading: false, error: true });
    }
  };

  useEffect(() => {
    load('news', setNews);
    load('notice', setNotices);
  }, []);

  const featured = news.items[0];
  const restNews = news.items.slice(1);

  const emptyHint = (state: PanelState, cat: 'news' | 'notice') =>
    state.loading ? (
      <div className="py-16 text-center text-slate-400 text-base">加载中…</div>
    ) : state.error ? (
      <div className="py-16 text-center text-slate-400 text-base">
        加载失败{' '}
        <button
          onClick={() => load(cat, cat === 'news' ? setNews : setNotices)}
          className="text-blue-700 hover:underline"
        >
          重试
        </button>
      </div>
    ) : (
      <div className="py-16 text-center text-slate-400 text-base">暂无内容</div>
    );

  return (
    <PortalLayout>
      {/* 横幅 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2a5c] via-blue-700 to-blue-500 text-white">
        <div className="absolute right-0 top-4 text-7xl tracking-[20px] opacity-10 whitespace-nowrap select-none pointer-events-none">
          ∑ ∫ π √ ∞ ƒ(x) Δ λ θ ∂
        </div>
        <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-14 md:py-20">
          <h1 className="text-3xl md:text-[42px] font-bold tracking-widest mb-4">
            深圳市数学学会学术服务平台
          </h1>
          <p className="text-base md:text-[17px] text-blue-200 tracking-wider">
            论文评选 · 教师论文竞赛 · 数智创新竞赛 —— 服务数学学术交流与人才培养
          </p>
        </div>
      </div>

      <div className="max-w-[1320px] mx-auto px-4 md:px-8 py-9">
        {/* 新闻 + 公告 双栏 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <section className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <header className="flex items-center justify-between px-6 py-4 border-b-2 border-slate-100">
              <h2 className="text-[20px] font-bold text-[#0f2a5c] border-l-4 border-blue-700 pl-3">
                新闻动态
              </h2>
              <Link to="/news" className="text-sm text-blue-700 hover:underline">
                查看更多 ›
              </Link>
            </header>
            {featured ? (
              <>
                <Link
                  to={`/news/${featured.id}`}
                  className="flex gap-4 px-6 py-5 border-b border-dashed border-slate-200 group"
                >
                  <span className="shrink-0 w-[68px] h-[68px] bg-blue-50 border border-blue-200 rounded-lg text-center text-blue-700">
                    <span className="block text-[26px] font-extrabold leading-tight mt-2">
                      {formatNewsDate(featured).day}
                    </span>
                    <span className="block text-xs text-blue-400">
                      {formatNewsDate(featured).yearMonth}
                    </span>
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[17px] text-slate-800 leading-relaxed font-medium group-hover:text-blue-700 transition">
                      {featured.title}
                    </span>
                    {featured.summary && (
                      <span className="block text-sm text-slate-400 leading-relaxed mt-2 line-clamp-2">
                        {featured.summary}
                      </span>
                    )}
                  </span>
                </Link>
                <ul className="px-6 py-2.5">
                  {restNews.map((n) => (
                    <li key={n.id} className="border-b border-dotted border-slate-100 last:border-none">
                      <Link
                        to={`/news/${n.id}`}
                        className="flex items-center justify-between gap-4 py-3 group"
                      >
                        <span className="truncate text-[15.5px] text-slate-700 group-hover:text-blue-700 transition">
                          <span className="text-blue-500 mr-2.5">•</span>
                          {n.title}
                        </span>
                        <span className="shrink-0 text-[13px] text-slate-400">
                          {formatNewsDate(n).full}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              emptyHint(news, 'news')
            )}
          </section>

          <section className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <header className="flex items-center justify-between px-6 py-4 border-b-2 border-slate-100">
              <h2 className="text-[20px] font-bold text-[#0f2a5c] border-l-4 border-blue-700 pl-3">
                通知公告
              </h2>
              <Link to="/news?cat=notice" className="text-sm text-blue-700 hover:underline">
                更多 ›
              </Link>
            </header>
            {notices.items.length > 0 ? (
              <ul className="px-6 py-2.5">
                {notices.items.map((n) => {
                  const tag = PRIORITY_TAG[n.priority] || PRIORITY_TAG.normal;
                  return (
                    <li key={n.id} className="border-b border-dotted border-slate-100 last:border-none">
                      <Link
                        to={`/news/${n.id}`}
                        className="block py-3.5 text-[15px] leading-relaxed text-slate-700 hover:text-blue-700 transition"
                      >
                        <span className={`inline-block text-xs px-2 py-0.5 rounded border mr-2.5 align-[1px] ${tag.cls}`}>
                          {tag.label}
                        </span>
                        {n.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              emptyHint(notices, 'notice')
            )}
          </section>
        </div>

        {/* 系统入口 */}
        <h2 className="text-[20px] font-bold text-[#0f2a5c] border-l-4 border-blue-700 pl-3 mt-10 mb-5">
          业务系统入口
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {SYSTEM_CARDS.map((card) => (
            <Link
              key={card.to}
              to={card.to}
              className={`group bg-white border border-slate-200 rounded-xl p-8 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-blue-700/10 ${card.hoverBorder}`}
            >
              <span className={`w-[60px] h-[60px] rounded-2xl text-white flex items-center justify-center mb-5 shadow-lg ${card.iconBg}`}>
                {card.icon}
              </span>
              <h3 className="text-[20px] font-bold text-slate-800 mb-1.5">{card.name}</h3>
              <p className="text-sm text-slate-400 mb-4">{card.desc}</p>
              <span className={`inline-flex items-center gap-1.5 text-[15px] font-semibold ${card.accent}`}>
                进入系统
                <span className="group-hover:translate-x-1 transition-transform">
                  <ArrowRightIcon size={16} />
                </span>
              </span>
            </Link>
          ))}
        </div>
        <p className="mt-7 text-center text-sm text-slate-400">
          三套系统数据与账号独立，请分别登录使用
        </p>
      </div>
    </PortalLayout>
  );
};

export default PortalHome;
