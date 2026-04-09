import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { judgeApi } from '../services/api';
import { useSystem } from '../contexts/SystemContext';
import { JudgeSubmission, ScoringCriteria, CriteriaScore } from '../types';
import { API_BASE_URL } from '../constants';

const JudgeScoring: React.FC = () => {
  const { competitionId } = useParams<{ competitionId: string }>();
  const navigate = useNavigate();
  const { basePath } = useSystem();

  const [submissions, setSubmissions] = useState<JudgeSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [competitionTitle, setCompetitionTitle] = useState('');
  const [scoringCriteria, setScoringCriteria] = useState<ScoringCriteria[]>([]);

  // 评分弹窗状态
  const [scoringTarget, setScoringTarget] = useState<JudgeSubmission | null>(null);
  const [criteriaScores, setCriteriaScores] = useState<CriteriaScore[]>([]);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // 筛选
  const [filter, setFilter] = useState<'all' | 'scored' | 'unscored'>('all');

  useEffect(() => {
    if (competitionId) loadSubmissions();
  }, [competitionId]);

  const loadSubmissions = async () => {
    if (!competitionId) return;
    setLoading(true);
    try {
      const res = await judgeApi.getSubmissions(competitionId);
      if (res.success && res.data) {
        setCompetitionTitle(res.data.competition?.title || '');
        setScoringCriteria(res.data.competition?.scoringCriteria || []);
        setSubmissions(res.data.submissions || []);
      }
    } catch (e) {
      console.error('加载提交列表失败', e);
    } finally {
      setLoading(false);
    }
  };

  const openScoring = (sub: JudgeSubmission) => {
    setScoringTarget(sub);
    // 如果有已有评分，回填
    if (sub.myScore) {
      setCriteriaScores(sub.myScore.criteriaScores || scoringCriteria.map(c => ({ name: c.name, score: 0, maxScore: c.maxScore })));
      setComments(sub.myScore.comments || '');
    } else {
      setCriteriaScores(scoringCriteria.map(c => ({ name: c.name, score: 0, maxScore: c.maxScore })));
      setComments('');
    }
  };

  const closeScoring = () => {
    setScoringTarget(null);
    setCriteriaScores([]);
    setComments('');
  };

  const totalScore = criteriaScores.reduce((s, c) => s + c.score, 0);
  const maxTotal = criteriaScores.reduce((s, c) => s + c.maxScore, 0);

  const handleSubmitScore = async () => {
    if (!scoringTarget || !competitionId) return;
    setSubmitting(true);
    try {
      const res = await judgeApi.submitScore({
        registrationId: scoringTarget.registrationId,
        competitionId,
        totalScore,
        criteriaScores: criteriaScores.length > 0 ? criteriaScores : undefined,
        comments: comments.trim() || undefined,
      });
      if (res.success) {
        closeScoring();
        await loadSubmissions();
      } else {
        alert(res.message || '提交评分失败');
      }
    } catch (e: any) {
      alert(e.message || '提交评分失败');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubmissions = submissions.filter(s => {
    if (filter === 'scored') return s.myScore !== null;
    if (filter === 'unscored') return s.myScore === null;
    return true;
  });

  const scoredCount = submissions.filter(s => s.myScore).length;

  const getFileUrl = (url: string) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${API_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate(`${basePath}/judge`)}
          className="text-sm text-gray-500 hover:text-purple-600 transition mb-3 inline-flex items-center gap-1"
        >
          <i className="fas fa-arrow-left"></i> 返回评审工作台
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{competitionTitle || '竞赛评审'}</h1>
            <p className="text-sm text-gray-500 mt-1">
              共 {submissions.length} 份作品，已评 {scoredCount} 份
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(['all', 'unscored', 'scored'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  filter === f
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f === 'all' ? '全部' : f === 'unscored' ? '未评' : '已评'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <i className="fas fa-spinner fa-spin text-3xl text-purple-500"></i>
        </div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <i className="fas fa-inbox text-5xl text-gray-300 mb-4"></i>
          <h3 className="text-lg font-semibold text-gray-700">
            {filter === 'all' ? '暂无已提交的作品' : filter === 'unscored' ? '所有作品均已评分' : '暂无已评分的作品'}
          </h3>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredSubmissions.map((sub, idx) => (
            <div
              key={sub.registrationId}
              className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-gray-400">#{idx + 1}</span>
                    <h3 className="font-semibold text-gray-900 truncate">
                      {sub.paperSubmission?.paperTitle || '(未提交论文)'}
                    </h3>
                    {sub.myScore ? (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                        已评 {sub.myScore.totalScore}分
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700">
                        待评
                      </span>
                    )}
                  </div>

                  {/* 作者信息 */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 mb-2">
                    <span><i className="fas fa-user mr-1"></i>{sub.user.name}</span>
                    <span><i className="fas fa-building mr-1"></i>{sub.user.institution}</span>
                    {sub.user.title && <span><i className="fas fa-id-badge mr-1"></i>{sub.user.title}</span>}
                  </div>

                  {/* 论文摘要 */}
                  {sub.paperSubmission?.paperAbstract && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {sub.paperSubmission.paperAbstract}
                    </p>
                  )}

                  {/* 关键词 */}
                  {sub.paperSubmission?.paperKeywords && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {sub.paperSubmission.paperKeywords.split(/[,，;；]/).filter(Boolean).map((kw, i) => (
                        <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">
                          {kw.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 团队成员 */}
                  {sub.teamMembers && sub.teamMembers.length > 0 && (
                    <div className="text-sm text-gray-500 mb-2">
                      <i className="fas fa-users mr-1"></i>
                      团队: {sub.teamMembers.map(m => m.name).join('、')}
                    </div>
                  )}

                  {/* 文件列表 */}
                  {sub.paperSubmission && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {sub.paperSubmission.submissionFiles && sub.paperSubmission.submissionFiles.length > 0 ? (
                        sub.paperSubmission.submissionFiles.map((f, i) => (
                          <a
                            key={i}
                            href={getFileUrl(f.fileUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-sm text-gray-700 hover:text-blue-600 transition"
                            onClick={e => e.stopPropagation()}
                          >
                            <i className="fas fa-file-download"></i>
                            {f.fileName}
                          </a>
                        ))
                      ) : (
                        <a
                          href={getFileUrl(sub.paperSubmission.submissionFileUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-lg text-sm text-gray-700 hover:text-blue-600 transition"
                        >
                          <i className="fas fa-file-download"></i>
                          {sub.paperSubmission.submissionFileName}
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* 评分按钮 */}
                <div className="shrink-0 ml-4">
                  <button
                    onClick={() => openScoring(sub)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                      sub.myScore
                        ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    {sub.myScore ? '修改评分' : '评分'}
                  </button>
                </div>
              </div>

              {/* 已有评分详情 */}
              {sub.myScore && sub.myScore.criteriaScores && sub.myScore.criteriaScores.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap gap-3">
                    {sub.myScore.criteriaScores.map((cs, i) => (
                      <div key={i} className="text-sm">
                        <span className="text-gray-500">{cs.name}: </span>
                        <span className="font-semibold text-gray-800">{cs.score}</span>
                        <span className="text-gray-400">/{cs.maxScore}</span>
                      </div>
                    ))}
                  </div>
                  {sub.myScore.comments && (
                    <p className="text-sm text-gray-500 mt-1 italic">"{sub.myScore.comments}"</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 评分弹窗 */}
      {scoringTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={closeScoring}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* 弹窗头 */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">评分</h3>
                <button onClick={closeScoring} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times text-lg"></i>
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1 truncate">
                {scoringTarget.paperSubmission?.paperTitle || '未命名作品'} — {scoringTarget.user.name}
              </p>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* 维度评分 */}
              {criteriaScores.length > 0 ? (
                <div className="space-y-4">
                  {criteriaScores.map((cs, idx) => {
                    const criterion = scoringCriteria.find(c => c.name === cs.name);
                    return (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-sm font-medium text-gray-700">
                            {cs.name}
                            <span className="text-gray-400 font-normal ml-1">(满分 {cs.maxScore})</span>
                          </label>
                          <span className="text-sm font-bold text-purple-600">{cs.score}</span>
                        </div>
                        {criterion?.description && (
                          <p className="text-xs text-gray-400 mb-2">{criterion.description}</p>
                        )}
                        <input
                          type="range"
                          min={0}
                          max={cs.maxScore}
                          step={1}
                          value={cs.score}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setCriteriaScores(prev =>
                              prev.map((c, i) => i === idx ? { ...c, score: val } : c)
                            );
                          }}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                          <span>0</span>
                          <span>{cs.maxScore}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* 总分 */}
                  <div className="bg-purple-50 rounded-xl p-4 text-center">
                    <p className="text-sm text-purple-600 mb-1">总分</p>
                    <p className="text-3xl font-bold text-purple-700">
                      {totalScore} <span className="text-lg font-normal text-purple-400">/ {maxTotal}</span>
                    </p>
                  </div>
                </div>
              ) : (
                /* 无评分标准时，直接输入总分 */
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">总分</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={criteriaScores.length > 0 ? totalScore : (scoringTarget.myScore?.totalScore || 0)}
                    onChange={e => {
                      const val = Number(e.target.value);
                      // 无评分标准时用单个 criteria 存储
                      setCriteriaScores([{ name: '总分', score: val, maxScore: 100 }]);
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg font-semibold text-center"
                    placeholder="请输入分数"
                  />
                </div>
              )}

              {/* 评语 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">评语（选填）</label>
                <textarea
                  value={comments}
                  onChange={e => setComments(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
                  placeholder="请输入对该作品的评价..."
                />
              </div>
            </div>

            {/* 底部按钮 */}
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 rounded-b-2xl flex justify-end gap-3">
              <button
                onClick={closeScoring}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition"
              >
                取消
              </button>
              <button
                onClick={handleSubmitScore}
                disabled={submitting}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
              >
                {submitting && <i className="fas fa-spinner fa-spin"></i>}
                {scoringTarget.myScore ? '更新评分' : '提交评分'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JudgeScoring;
