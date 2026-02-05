import React from 'react';
import { Link } from 'react-router-dom';
import { systemConfig } from '../store/system';

/**
 * 系统选择入口页：选择进入「论文评选」或「教改系统」。
 * 路由: /
 */
const SystemSelect: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-indigo-50">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-2">
          选择进入系统
        </h1>
        <p className="text-gray-500 font-medium">请选择您要使用的平台</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl w-full">
        <Link
          to="/paper"
          className="group block bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-100 hover:shadow-2xl hover:border-indigo-200 transition-all duration-300 text-left"
        >
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-2xl mb-6 group-hover:scale-110 transition-transform">
            <i className="fas fa-feather-alt"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {systemConfig.paper.name}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            深圳数学学会论文评选、报名、提交与评审
          </p>
          <span className="text-indigo-600 font-semibold inline-flex items-center gap-2">
            进入系统
            <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
          </span>
        </Link>

        <Link
          to="/reform"
          className="group block bg-white rounded-3xl p-8 md:p-10 shadow-xl border border-gray-100 hover:shadow-2xl hover:border-emerald-200 transition-all duration-300 text-left"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-2xl mb-6 group-hover:scale-110 transition-transform">
            <i className="fas fa-chalkboard-teacher"></i>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {systemConfig.reform.name}
          </h2>
          <p className="text-gray-500 text-sm mb-6">
            教育教学改革项目管理、申报与评审
          </p>
          <span className="text-emerald-600 font-semibold inline-flex items-center gap-2">
            进入系统
            <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
          </span>
        </Link>
      </div>
      <p className="mt-12 text-sm text-gray-400">
        两套系统数据与账号独立，请分别登录使用
      </p>
    </div>
  );
};

export default SystemSelect;
