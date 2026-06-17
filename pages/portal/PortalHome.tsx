import React from 'react';
import { Link } from 'react-router-dom';
import PortalLayout from '../../components/portal/PortalLayout';
import {
  FileTextIcon,
  GraduationCapIcon,
  TrophyIcon,
  MedalIcon,
  ArrowRightIcon,
} from '../../components/portal/PortalIcons';
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
  {
    to: '/scientist',
    name: '青年科学家奖评选',
    desc: '2026 大湾区 · 在线注册申报与材料提交',
    icon: <MedalIcon size={28} />,
    iconBg: 'bg-gradient-to-br from-rose-600 to-rose-500 shadow-rose-600/30',
    accent: 'text-rose-600',
    hoverBorder: 'hover:border-rose-200',
  },
];

/** 竞赛平台入口首页：横幅 + 业务系统入口。路由: / */
const PortalHome: React.FC = () => {
  return (
    <PortalLayout>
      {/* 横幅 */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#0f2a5c] via-blue-700 to-blue-500 text-white">
        <div className="absolute right-0 top-4 text-7xl tracking-[20px] opacity-10 whitespace-nowrap select-none pointer-events-none">
          ∑ ∫ π √ ∞ ƒ(x) Δ λ θ ∂
        </div>
        <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-16 md:py-24">
          <h1 className="text-3xl md:text-[42px] font-bold tracking-widest mb-4">
            深圳市数学学会竞赛服务平台
          </h1>
          <p className="text-base md:text-[17px] text-blue-200 tracking-wider">
            论文评选 · 教师论文竞赛 · 数智创新竞赛 —— 请选择要进入的系统
          </p>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 md:px-8 py-12">
        <h2 className="text-[22px] font-bold text-[#0f2a5c] border-l-4 border-blue-700 pl-3 mb-6">
          选择进入系统
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
