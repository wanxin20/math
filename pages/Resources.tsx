
import React from 'react';
import { TEMPLATES } from '../constants';

const Resources: React.FC = () => {
  return (
    <div className="space-y-12">
      <div className="text-center max-w-3xl mx-auto py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">学术资源中心</h1>
        <p className="text-gray-500 text-lg">
          我们为您准备了标准化的学术模板和竞赛规则文档。正确的格式是迈向卓越的第一步。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Sections */}
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="bg-blue-100 w-12 h-12 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
            <i className="fas fa-file-alt text-2xl"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">论文写作模板</h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            包含 Word 和 LaTeX 两个主流版本的标准排版格式，严格遵循学会竞赛规范。
          </p>
          <div className="space-y-4">
            {TEMPLATES.map((t, i) => (
              <div key={i} className="flex items-center justify-between group cursor-pointer">
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition">{t.name}</span>
                <i className="fas fa-download text-gray-300 group-hover:text-blue-600 transition"></i>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="bg-orange-100 w-12 h-12 rounded-2xl flex items-center justify-center text-orange-600 mb-6">
            <i className="fas fa-gavel text-2xl"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">竞赛章程 & 规则</h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            详细列出了参赛资格、学术诚信要求、奖项设置以及评审标准。
          </p>
          <div className="space-y-4 text-sm">
             <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
               <i className="fas fa-info-circle text-orange-500"></i>
               <span>2024年竞赛诚信守则.pdf</span>
             </div>
             <div className="p-3 bg-gray-50 rounded-xl flex items-center gap-3">
               <i className="fas fa-info-circle text-orange-500"></i>
               <span>评审流程白皮书.pdf</span>
             </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="bg-purple-100 w-12 h-12 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
            <i className="fas fa-video text-2xl"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-4">指导视频</h3>
          <p className="text-gray-500 text-sm mb-6 leading-relaxed">
            由资深专家录制的赛前辅导视频，包含历年优秀论文分析。
          </p>
          <button className="w-full bg-purple-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-purple-100">
            前往视频库
          </button>
        </div>
      </div>
    </div>
  );
};

export default Resources;
