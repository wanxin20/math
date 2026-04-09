import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { judgeApi } from '../services/api';
import { useSystem } from '../contexts/SystemContext';
import { JudgeAssignedCompetition } from '../types';

const JudgeDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { basePath } = useSystem();
  const [competitions, setCompetitions] = useState<JudgeAssignedCompetition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await judgeApi.getAssignedCompetitions();
      if (res.success) {
        setCompetitions(res.data || []);
      }
    } catch (e) {
      console.error('加载评审任务失败', e);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, { text: string; color: string }> = {
      draft: { text: '草稿', color: 'bg-gray-100 text-gray-600' },
      open: { text: '进行中', color: 'bg-green-100 text-green-700' },
      closed: { text: '已截止', color: 'bg-yellow-100 text-yellow-700' },
      completed: { text: '已完成', color: 'bg-blue-100 text-blue-700' },
    };
    return map[status] || { text: status, color: 'bg-gray-100 text-gray-600' };
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-purple-600 p-2.5 rounded-xl">
            <i className="fas fa-gavel text-white text-lg"></i>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">评审工作台</h1>
            <p className="text-sm text-gray-500 mt-0.5">查看分配给您的竞赛评审任务，对参赛作品进行评分</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <i className="fas fa-spinner fa-spin text-3xl text-purple-500 mb-3"></i>
            <p className="text-gray-500">加载评审任务...</p>
          </div>
        </div>
      ) : competitions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <i className="fas fa-clipboard-list text-5xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">暂无评审任务</h3>
          <p className="text-gray-500">管理员尚未分配竞赛评审任务给您</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 统计卡片 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2.5 rounded-lg">
                  <i className="fas fa-tasks text-purple-600"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-500">分配竞赛</p>
                  <p className="text-2xl font-bold text-gray-900">{competitions.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2.5 rounded-lg">
                  <i className="fas fa-file-alt text-blue-600"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-500">待评作品</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {competitions.reduce((s, c) => s + c.totalSubmissions, 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2.5 rounded-lg">
                  <i className="fas fa-check-circle text-green-600"></i>
                </div>
                <div>
                  <p className="text-sm text-gray-500">已评完成</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {competitions.reduce((s, c) => s + c.scoredCount, 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 竞赛列表 */}
          {competitions.map((item) => {
            const status = getStatusLabel(item.competition.status);
            const progress = item.totalSubmissions > 0
              ? Math.round((item.scoredCount / item.totalSubmissions) * 100)
              : 0;

            return (
              <div
                key={item.assignmentId}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition cursor-pointer"
                onClick={() => navigate(`${basePath}/judge/scoring/${item.competition.id}`)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900 truncate">
                        {item.competition.title}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                        {status.text}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span><i className="fas fa-tag mr-1"></i>{item.competition.category}</span>
                      <span><i className="fas fa-calendar mr-1"></i>截止 {item.competition.deadline}</span>
                      <span><i className="fas fa-clock mr-1"></i>分配于 {new Date(item.assignedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <i className="fas fa-chevron-right text-gray-400 mt-2"></i>
                </div>

                {/* 评审进度 */}
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-gray-600">
                        评审进度: <span className="font-semibold text-gray-900">{item.scoredCount}</span> / {item.totalSubmissions}
                      </span>
                      <span className="font-semibold text-purple-600">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-purple-500 h-2.5 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                  <button
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`${basePath}/judge/scoring/${item.competition.id}`);
                    }}
                  >
                    {item.scoredCount >= item.totalSubmissions && item.totalSubmissions > 0 ? '查看评分' : '开始评审'}
                  </button>
                </div>

                {/* 评分标准预览 */}
                {item.competition.scoringCriteria && item.competition.scoringCriteria.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 mb-1.5">评分维度</p>
                    <div className="flex flex-wrap gap-2">
                      {item.competition.scoringCriteria.map((c, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-50 rounded text-xs text-gray-600">
                          {c.name} ({c.maxScore}分)
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JudgeDashboard;
