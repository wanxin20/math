
import React, { useState } from 'react';
import { COMPETITIONS } from '../constants';
import { Competition, RegistrationStatus, User } from '../types';
import { Language } from '../i18n';

interface CompetitionListProps {
  user: User | null;
  onRegister: (compId: string) => void;
  hasRegistered: (compId: string) => boolean;
  lang: Language;
}

const CompetitionList: React.FC<CompetitionListProps> = ({ user, onRegister, hasRegistered, lang }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(lang === 'zh' ? '全部' : 'All');
  const categories = [lang === 'zh' ? '全部' : 'All', ...new Set(COMPETITIONS.map(c => c.category))];

  const filteredCompetitions = selectedCategory === (lang === 'zh' ? '全部' : 'All')
    ? COMPETITIONS 
    : COMPETITIONS.filter(c => c.category === selectedCategory);

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{lang === 'zh' ? '论文评选中心' : 'Paper Selection Center'}</h1>
        <p className="text-gray-500 mb-8 max-w-2xl">
          {lang === 'zh' 
            ? '请选择您要参与的教研论文或案例评选。报名后，请在个人中心完成缴费并上传最终稿件。' 
            : 'Select a research paper or case selection to participate. After application, pay and upload in your dashboard.'}
        </p>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === cat 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredCompetitions.map(comp => {
          const isRegistered = hasRegistered(comp.id);
          return (
            <div key={comp.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition">
              <div className="w-full md:w-64 h-40 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                 <i className={`fas ${comp.category === '教育技术' ? 'fa-laptop-code' : 'fa-book-open'} text-5xl text-indigo-200`}></i>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{comp.category}</span>
                  <span className="text-xs text-red-500 font-medium">{lang === 'zh' ? '截止日期' : 'Deadline'}: {comp.deadline}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{lang === 'zh' ? comp.title : comp.id.toUpperCase()}</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">{comp.description}</p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{lang === 'zh' ? '评审费' : 'Fee'}</span>
                    <span className="text-lg font-bold text-gray-900">￥{comp.fee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{lang === 'zh' ? '对象' : 'Target'}</span>
                    <span className="text-sm font-medium text-gray-700">{lang === 'zh' ? '在职教师及教研员' : 'Teachers & Researchers'}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center items-center gap-3 w-full md:w-48">
                {isRegistered ? (
                  <div className="bg-green-50 text-green-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                    <i className="fas fa-check-circle"></i>
                    {lang === 'zh' ? '已在项目中' : 'Applied'}
                  </div>
                ) : (
                  <button 
                    onClick={() => onRegister(comp.id)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition"
                  >
                    {lang === 'zh' ? '立即报名' : 'Apply Now'}
                  </button>
                )}
                <button className="text-indigo-600 text-xs font-semibold hover:underline">{lang === 'zh' ? '查看申报指南' : 'View Guidelines'}</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompetitionList;
