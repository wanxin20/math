
import React, { useState } from 'react';
import { COMPETITIONS } from '../constants';
import { Competition, RegistrationStatus, User } from '../types';

interface CompetitionListProps {
  user: User | null;
  onRegister: (compId: string) => void;
  hasRegistered: (compId: string) => boolean;
}

const CompetitionList: React.FC<CompetitionListProps> = ({ user, onRegister, hasRegistered }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');
  const categories = ['全部', ...new Set(COMPETITIONS.map(c => c.category))];

  const filteredCompetitions = selectedCategory === '全部' 
    ? COMPETITIONS 
    : COMPETITIONS.filter(c => c.category === selectedCategory);

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">竞赛报名中心</h1>
        <p className="text-gray-500 mb-8 max-w-2xl">
          请选择您感兴趣的竞赛进行报名。一旦报名成功，您可以在个人中心进行缴费和后续的材料提交。
        </p>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === cat 
                  ? 'bg-blue-600 text-white shadow-md' 
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
              <div className="w-full md:w-64 h-40 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                 <i className={`fas ${comp.category === '数学建模' ? 'fa-microchip' : 'fa-graduation-cap'} text-5xl text-blue-200`}></i>
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{comp.category}</span>
                  <span className="text-xs text-red-500 font-medium">截止日期: {comp.deadline}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{comp.title}</h3>
                <p className="text-gray-500 text-sm mb-6 leading-relaxed">{comp.description}</p>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">报名费</span>
                    <span className="text-lg font-bold text-gray-900">￥{comp.fee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">对象</span>
                    <span className="text-sm font-medium text-gray-700">全日制在校生</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-center items-center gap-3 w-full md:w-48">
                {isRegistered ? (
                  <div className="bg-green-50 text-green-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                    <i className="fas fa-check-circle"></i>
                    已加入竞赛
                  </div>
                ) : (
                  <button 
                    onClick={() => onRegister(comp.id)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition"
                  >
                    立即报名
                  </button>
                )}
                <button className="text-blue-600 text-xs font-semibold hover:underline">查看赛事章程</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompetitionList;
