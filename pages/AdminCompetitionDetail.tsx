import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import api, { judgeApi } from '../services/api';
import { TeamMember, ScoringCriteria, ScoreSummaryItem } from '../types';
import { useSystem } from '../contexts/SystemContext';
import { API_BASE_URL } from '../constants';

interface Registration {
  id: number;
  userId: string;
  user?: {
    id: string;
    name: string;
    email: string;
    institution: string;
    title: string;
  };
  competitionId: string;
  status: string;
  registrationTime: string;
  payment?: {
    paymentAmount: number;
    paymentStatus: string;
    paymentTime?: string;
    paymentMethod?: string;
  };
  paperSubmission?: {
    id: number;
    paperTitle: string;
    submissionFileName: string;
    submissionFileUrl: string;
    submissionFileSize: number;
    submissionTime: string;
    /** 多文件列表 */
    submissionFiles?: Array<{ fileName: string; fileUrl: string; size?: number; mimetype?: string }>;
  };
  teamMembers?: TeamMember[];
  notes?: string;
  rejectionReason?: string;
}

interface Competition {
  id: string;
  title: string;
  description: string;
  category: string;
  fee: number;
  deadline: string;
  currentParticipants: number;
  status: string;
  scoringCriteria?: ScoringCriteria[] | null;
}

interface AssignedJudge {
  assignmentId: number;
  judge: { id: string; name: string; email: string; institution: string };
  scoredCount: number;
  assignedAt: string;
}

type TabKey = 'registrations' | 'judges' | 'scores';

const AdminCompetitionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { basePath, system } = useSystem();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  /** 当前展开下拉的操作行（报名记录 id）；下拉通过 portal 挂到 body，不随表格裁剪 */
  const [openDropdownRegId, setOpenDropdownRegId] = useState<number | null>(null);
  const [dropdownAnchor, setDropdownAnchor] = useState<{ left: number; top: number } | null>(null);
  
  /** 退回对话框状态 */
  const [rejectDialog, setRejectDialog] = useState<{
    show: boolean;
    registrationId: number | null;
    userName: string;
  }>({
    show: false,
    registrationId: null,
    userName: '',
  });
  const [rejectReason, setRejectReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // 标签页
  const [activeTab, setActiveTab] = useState<TabKey>('registrations');

  // 评委管理
  const [assignedJudges, setAssignedJudges] = useState<AssignedJudge[]>([]);
  const [allJudges, setAllJudges] = useState<Array<{ id: string; name: string; email: string; institution: string }>>([]);
  const [selectedJudgeId, setSelectedJudgeId] = useState('');
  const [assigningJudge, setAssigningJudge] = useState(false);

  // 评分标准
  const [editingCriteria, setEditingCriteria] = useState<ScoringCriteria[]>([]);
  const [showCriteriaEditor, setShowCriteriaEditor] = useState(false);
  const [savingCriteria, setSavingCriteria] = useState(false);

  // 评分汇总
  const [scoreSummary, setScoreSummary] = useState<ScoreSummaryItem[]>([]);

  const closeDropdown = () => {
    setOpenDropdownRegId(null);
    setDropdownAnchor(null);
  };

  const handleExportExcel = async () => {
    if (!id) return;
    setExporting(true);
    try {
      const result = await api.registration.exportExcel(id);
      if (result.success) {
        alert('导出成功，请查看下载文件。');
      } else {
        alert(result.message || '导出失败');
      }
    } catch (e) {
      console.error(e);
      alert('导出失败');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const [compResponse, regResponse] = await Promise.all([
        api.competition.getDetail(id),
        api.registration.getByCompetitionId(id),
      ]);
      if (compResponse.success && compResponse.data) {
        setCompetition(compResponse.data);
      }
      if (regResponse.success && regResponse.data) {
        setRegistrations(Array.isArray(regResponse.data) ? regResponse.data : []);
      }
    } catch (error) {
      console.error('加载数据失败:', error);
      alert('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  // 切换 tab 时加载对应数据
  useEffect(() => {
    if (!id) return;
    if (activeTab === 'judges') loadJudgesData();
    if (activeTab === 'scores') loadScoresData();
  }, [activeTab, id]);

  const loadJudgesData = async () => {
    if (!id) return;
    try {
      const [judgesRes, allJudgesRes] = await Promise.all([
        judgeApi.adminGetJudgesForCompetition(id),
        judgeApi.adminGetAllJudges(),
      ]);
      if (judgesRes.success) setAssignedJudges(judgesRes.data || []);
      if (allJudgesRes.success) setAllJudges(allJudgesRes.data || []);
    } catch (e) {
      console.error('加载评委数据失败', e);
    }
  };

  const loadScoresData = async () => {
    if (!id) return;
    try {
      const res = await judgeApi.adminGetScores(id);
      if (res.success) setScoreSummary(res.data || []);
    } catch (e) {
      console.error('加载评分数据失败', e);
    }
  };

  const handleAssignJudge = async () => {
    if (!id || !selectedJudgeId) return;
    setAssigningJudge(true);
    try {
      const res = await judgeApi.adminAssignJudge(selectedJudgeId, id);
      if (res.success) {
        setSelectedJudgeId('');
        await loadJudgesData();
      } else {
        alert(res.message || '分配失败');
      }
    } catch (e: any) {
      alert(e.message || '分配失败');
    } finally {
      setAssigningJudge(false);
    }
  };

  const handleRemoveJudge = async (assignmentId: number) => {
    if (!confirm('确定移除该评委？')) return;
    try {
      const res = await judgeApi.adminRemoveAssignment(assignmentId);
      if (res.success) await loadJudgesData();
      else alert(res.message || '移除失败');
    } catch (e: any) {
      alert(e.message || '移除失败');
    }
  };

  const handleOpenCriteriaEditor = () => {
    setEditingCriteria(competition?.scoringCriteria || [{ name: '', maxScore: 100, description: '' }]);
    setShowCriteriaEditor(true);
  };

  const handleSaveCriteria = async () => {
    if (!id) return;
    const valid = editingCriteria.filter(c => c.name.trim());
    if (valid.length === 0) {
      alert('请至少填写一个评分维度');
      return;
    }
    setSavingCriteria(true);
    try {
      const res = await judgeApi.adminUpdateScoringCriteria(id, valid);
      if (res.success) {
        setShowCriteriaEditor(false);
        await loadData();
      } else {
        alert(res.message || '保存失败');
      }
    } catch (e: any) {
      alert(e.message || '保存失败');
    } finally {
      setSavingCriteria(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { text: string; color: string }> = {
      'PENDING_PAYMENT': { text: '待支付', color: 'bg-yellow-100 text-yellow-800' },
      'PAID': { text: '已支付', color: 'bg-blue-100 text-blue-800' },
      'SUBMITTED': { text: '已提交', color: 'bg-green-100 text-green-800' },
    };
    const info = statusMap[status] || { text: status, color: 'bg-gray-100 text-gray-800' };
    return <span className={`px-2 py-1 rounded text-xs font-semibold ${info.color}`}>{info.text}</span>;
  };

  const handleViewPaper = (fileUrl: string) => {
    if (fileUrl) {
      const baseUrl = API_BASE_URL.replace(/\/api\/v1$/, '');
      const fullUrl = fileUrl.startsWith('http') 
        ? fileUrl 
        : `${baseUrl}${fileUrl}`;
      window.open(fullUrl, '_blank');
    }
  };

  /** 打开退回对话框 */
  const handleOpenRejectDialog = (registrationId: number, userName: string) => {
    setRejectDialog({
      show: true,
      registrationId,
      userName,
    });
    setRejectReason('');
    closeDropdown();
  };

  /** 关闭退回对话框 */
  const handleCloseRejectDialog = () => {
    setRejectDialog({
      show: false,
      registrationId: null,
      userName: '',
    });
    setRejectReason('');
  };

  /** 确认退回 */
  const handleConfirmReject = async () => {
    if (!rejectDialog.registrationId) return;

    setRejecting(true);
    try {
      const result = await api.registration.rejectSubmission(
        rejectDialog.registrationId, 
        rejectReason.trim() || undefined
      );
      if (result.success) {
        alert('论文已退回，用户可以重新上传');
        handleCloseRejectDialog();
        await loadData(); // 重新加载数据
      } else {
        alert(result.message || '退回失败');
      }
    } catch (error) {
      console.error('退回失败:', error);
      alert('退回失败，请重试');
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <i className="fas fa-exclamation-circle text-6xl text-red-500 mb-4"></i>
          <p className="text-gray-600">竞赛不存在</p>
          <button 
            onClick={() => navigate(basePath + '/admin/competitions')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            返回列表
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigate(basePath + '/admin/competitions')}
            className="text-indigo-600 hover:text-indigo-800 flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i>
            返回列表
          </button>
          <h1 className="text-2xl font-bold text-gray-900">竞赛详情</h1>
          <div className="w-20"></div> {/* 占位 */}
        </div>

        {/* 竞赛基本信息 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
          <div>
            <div className="text-sm text-gray-500">竞赛名称</div>
            <div className="font-semibold text-gray-900">{competition.title}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">论文类型</div>
            <div className="font-semibold text-gray-900">{competition.category}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">报名人数</div>
            <div className="font-semibold text-indigo-600 text-xl">{registrations.length}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">评审费</div>
            <div className="font-semibold text-gray-900">¥{competition.fee}</div>
          </div>
        </div>
      </div>

      {/* 标签页切换 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="flex border-b border-gray-200 px-6">
          {([
            { key: 'registrations' as TabKey, label: '报名列表', icon: 'fa-list' },
            ...(system === 'contest' ? [
              { key: 'judges' as TabKey, label: '评委管理', icon: 'fa-gavel' },
              { key: 'scores' as TabKey, label: '评分汇总', icon: 'fa-chart-bar' },
            ] : []),
          ]).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-3.5 text-sm font-medium border-b-2 transition flex items-center gap-2 ${
                activeTab === tab.key
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <i className={`fas ${tab.icon}`}></i>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 评委管理 Tab */}
      {activeTab === 'judges' && (
        <div className="space-y-6">
          {/* 评分标准配置 */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">
                <i className="fas fa-sliders-h mr-2 text-indigo-500"></i>评分标准
              </h2>
              <button
                onClick={handleOpenCriteriaEditor}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
              >
                {competition?.scoringCriteria?.length ? '修改标准' : '设置标准'}
              </button>
            </div>
            {competition?.scoringCriteria && competition.scoringCriteria.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {competition.scoringCriteria.map((c, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                    <div className="font-semibold text-gray-800 mb-1">{c.name}</div>
                    <div className="text-2xl font-bold text-indigo-600">{c.maxScore}<span className="text-sm text-gray-400 font-normal">分</span></div>
                    {c.description && <p className="text-xs text-gray-500 mt-1">{c.description}</p>}
                  </div>
                ))}
                <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-sm text-indigo-500">满分</div>
                    <div className="text-2xl font-bold text-indigo-700">
                      {competition.scoringCriteria.reduce((s, c) => s + c.maxScore, 0)}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <i className="fas fa-ruler-combined text-3xl mb-2"></i>
                <p>尚未设置评分标准，请点击"设置标准"进行配置</p>
              </div>
            )}
          </div>

          {/* 评委分配 */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              <i className="fas fa-user-plus mr-2 text-indigo-500"></i>分配评委
            </h2>
            <div className="flex gap-3 mb-6">
              <select
                value={selectedJudgeId}
                onChange={e => setSelectedJudgeId(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">选择评委...</option>
                {allJudges
                  .filter(j => !assignedJudges.some(a => a.judge.id === j.id))
                  .map(j => (
                    <option key={j.id} value={j.id}>{j.name} ({j.institution}) - {j.email}</option>
                  ))}
              </select>
              <button
                onClick={handleAssignJudge}
                disabled={!selectedJudgeId || assigningJudge}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 text-sm font-medium whitespace-nowrap"
              >
                {assigningJudge ? '分配中...' : '分配'}
              </button>
            </div>

            {assignedJudges.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <i className="fas fa-users text-3xl mb-2"></i>
                <p>暂无已分配的评委</p>
                <p className="text-xs mt-1">请先在"用户管理"中将用户角色设为"评委"，然后在此处分配</p>
              </div>
            ) : (
              <div className="space-y-3">
                {assignedJudges.map(a => (
                  <div key={a.assignmentId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
                        {a.judge.name[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{a.judge.name}</div>
                        <div className="text-xs text-gray-500">{a.judge.institution} · {a.judge.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">已评 <span className="font-semibold text-indigo-600">{a.scoredCount}</span> 份</span>
                      <button
                        onClick={() => handleRemoveJudge(a.assignmentId)}
                        className="text-red-500 hover:text-red-700 text-sm"
                        title="移除评委"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 评分汇总 Tab */}
      {activeTab === 'scores' && (
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              <i className="fas fa-chart-bar mr-2 text-indigo-500"></i>评分汇总
            </h2>
            <button onClick={loadScoresData} className="text-sm text-indigo-600 hover:text-indigo-800">
              <i className="fas fa-sync-alt mr-1"></i>刷新
            </button>
          </div>

          {scoreSummary.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <i className="fas fa-chart-line text-4xl mb-3"></i>
              <p>暂无评分数据</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">作者</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">论文标题</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">评委数</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">平均分</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">各评委评分</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[...scoreSummary]
                    .sort((a, b) => (b.avgScore || 0) - (a.avgScore || 0))
                    .map((item) => (
                    <tr key={item.registrationId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">
                        <div className="font-semibold text-gray-800">{item.user.name}</div>
                        <div className="text-xs text-gray-500">{item.user.institution}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate">
                        {item.paperTitle}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {item.judgeCount}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.avgScore !== null ? (
                          <span className="text-lg font-bold text-indigo-600">{item.avgScore}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.scores.length > 0 ? (
                          <div className="space-y-1">
                            {item.scores.map(s => (
                              <div key={s.id} className="flex items-center gap-2">
                                <span className="text-gray-500 text-xs w-16 truncate">{s.judgeName}</span>
                                <span className="font-semibold text-gray-800">{s.totalScore}</span>
                                {s.comments && (
                                  <span className="text-xs text-gray-400 truncate max-w-[150px]" title={s.comments}>
                                    "{s.comments}"
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">暂无评分</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 评分标准编辑弹窗 */}
      {showCriteriaEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              <i className="fas fa-sliders-h mr-2 text-indigo-500"></i>配置评分标准
            </h3>
            <p className="text-sm text-gray-500 mb-4">设置评委打分的维度和每项满分值。评委将按各维度分别打分。</p>

            <div className="space-y-3 mb-4">
              {editingCriteria.map((c, idx) => (
                <div key={idx} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={c.name}
                      onChange={e => {
                        const arr = [...editingCriteria];
                        arr[idx] = { ...arr[idx], name: e.target.value };
                        setEditingCriteria(arr);
                      }}
                      placeholder="维度名称（如：创新性）"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    />
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={c.maxScore}
                        onChange={e => {
                          const arr = [...editingCriteria];
                          arr[idx] = { ...arr[idx], maxScore: Number(e.target.value) || 0 };
                          setEditingCriteria(arr);
                        }}
                        placeholder="满分"
                        min={1}
                        className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={c.description || ''}
                        onChange={e => {
                          const arr = [...editingCriteria];
                          arr[idx] = { ...arr[idx], description: e.target.value };
                          setEditingCriteria(arr);
                        }}
                        placeholder="描述（选填）"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingCriteria(prev => prev.filter((_, i) => i !== idx))}
                    className="text-red-400 hover:text-red-600 mt-2"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => setEditingCriteria(prev => [...prev, { name: '', maxScore: 10, description: '' }])}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition mb-4"
            >
              <i className="fas fa-plus mr-1"></i> 添加维度
            </button>

            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <span className="text-sm text-gray-500">
                总分：{editingCriteria.reduce((s, c) => s + (c.maxScore || 0), 0)} 分
              </span>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCriteriaEditor(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveCriteria}
                  disabled={savingCriteria}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 text-sm font-medium"
                >
                  {savingCriteria ? '保存中...' : '保存'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 报名列表 Tab */}
      {activeTab === 'registrations' && <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-gray-900">
            报名列表 ({registrations.length}人)
          </h2>
          <button
            type="button"
            disabled={exporting || registrations.length === 0}
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className={`fas fa-file-excel ${exporting ? 'animate-pulse' : ''}`}></i>
            {exporting ? '导出中…' : '导出 Excel'}
          </button>
        </div>

        {registrations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
            <p>暂无报名记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    报名时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    支付信息
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    论文提交
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    竞赛组成员
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="font-semibold">{reg.user?.name || '未知用户'}</div>
                      <div className="text-xs text-gray-500">{reg.user?.email}</div>
                      <div className="text-xs text-gray-500">{reg.user?.institution}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(reg.registrationTime).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(reg.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {reg.payment ? (
                        <div>
                          <div className={`font-semibold ${reg.payment.paymentStatus === 'success' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {reg.payment.paymentStatus === 'success' ? '已支付' : '待支付'}
                          </div>
                          {reg.payment.paymentTime && (
                            <div className="text-xs text-gray-500">
                              {new Date(reg.payment.paymentTime).toLocaleString('zh-CN')}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {reg.paperSubmission ? (
                        <div className="max-w-xs">
                          <div className="font-semibold text-gray-900 truncate" title={reg.paperSubmission.paperTitle || reg.paperSubmission.submissionFileName}>
                            {reg.paperSubmission.paperTitle || reg.paperSubmission.submissionFileName}
                          </div>
                          {reg.paperSubmission.submissionTime && (
                            <div className="text-xs text-gray-500">
                              {new Date(reg.paperSubmission.submissionTime).toLocaleString('zh-CN')}
                            </div>
                          )}
                          {reg.paperSubmission.submissionFiles?.length ? (
                            <div className="text-xs text-gray-500 mt-1">
                              {reg.paperSubmission.submissionFiles.length} 个文件
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-gray-400">未提交</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {reg.teamMembers && reg.teamMembers.length > 0 ? (
                        <div className="max-w-xs">
                          {reg.teamMembers.map((m, i) => (
                            <div key={m.id} className="text-xs text-gray-600">
                              <span className="font-medium text-gray-800">{m.name}</span>
                              <span className="text-gray-400 ml-1">({m.institution})</span>
                            </div>
                          ))}
                          <div className="text-xs text-gray-400 mt-1">{reg.teamMembers.length} 人</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {reg.paperSubmission && (
                          <button
                            type="button"
                            onClick={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect();
                              if (openDropdownRegId === reg.id) {
                                closeDropdown();
                              } else {
                                setOpenDropdownRegId(reg.id);
                                setDropdownAnchor({ left: rect.left, top: rect.bottom + 4 });
                              }
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-medium text-sm"
                          >
                            <i className="fas fa-folder-open"></i>
                            查看文件
                            <i className={`fas fa-chevron-down text-xs transition-transform ${openDropdownRegId === reg.id ? 'rotate-180' : ''}`}></i>
                          </button>
                        )}
                        {reg.status === 'SUBMITTED' && (
                          <button
                            type="button"
                            onClick={() => handleOpenRejectDialog(reg.id, reg.user?.name || '未知用户')}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 font-medium text-sm"
                            title="退回论文让用户重新上传"
                          >
                            <i className="fas fa-undo"></i>
                            退回
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>}

      {/* 退回对话框 */}
      {rejectDialog.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[10000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <i className="fas fa-exclamation-triangle text-orange-500"></i>
              退回论文
            </h3>
            
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">用户：</span>{rejectDialog.userName}
              </p>
              <p className="text-sm text-amber-700 mt-2">
                <i className="fas fa-info-circle mr-1"></i>
                退回后，用户可以重新上传论文，无需再次缴费。
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                退回原因 <span className="text-gray-400 text-xs">(选填)</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="例如：论文格式不符合要求，请按照模板重新排版后上传"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm min-h-[100px] resize-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                <i className="fas fa-info-circle mr-1"></i>
                如不填写原因，用户将看到"论文已被退回，请重新上传"的提示
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCloseRejectDialog}
                disabled={rejecting}
                className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={rejecting}
                className="flex-1 py-2.5 px-4 rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {rejecting ? '退回中...' : '确认退回'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 下拉框通过 portal 挂到 body，脱离竞赛卡片；点击空白遮罩关闭 */}
      {openDropdownRegId != null && dropdownAnchor && typeof document !== 'undefined' && createPortal(
        (() => {
          const reg = registrations.find((r) => r.id === openDropdownRegId);
          const ps = reg?.paperSubmission;
          return (
            <>
              <div
                className="fixed inset-0 z-[9998]"
                aria-hidden
                onClick={closeDropdown}
              />
              <div
                className="fixed z-[9999] min-w-[200px] max-w-[320px] py-1 bg-white border border-gray-200 rounded-lg shadow-xl"
                style={{ left: dropdownAnchor.left, top: dropdownAnchor.top }}
                onClick={(e) => e.stopPropagation()}
              >
                {ps?.submissionFiles?.length ? (
                  ps.submissionFiles.map((f, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        handleViewPaper(f.fileUrl);
                        closeDropdown();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                    >
                      <i className="fas fa-file-alt text-gray-400 flex-shrink-0"></i>
                      <span className="truncate">{f.fileName || `文件${i + 1}`}</span>
                    </button>
                  ))
                ) : ps ? (
                  <button
                    type="button"
                    onClick={() => {
                      handleViewPaper(ps.submissionFileUrl);
                      closeDropdown();
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 flex items-center gap-2"
                  >
                    <i className="fas fa-file-alt text-gray-400 flex-shrink-0"></i>
                    <span className="truncate">{ps.submissionFileName || '查看论文'}</span>
                  </button>
                ) : null}
              </div>
            </>
          );
        })(),
        document.body
      )}
    </div>
  );
};

export default AdminCompetitionDetail;
