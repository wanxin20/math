import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
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
  };
  notes?: string;
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
}

const AdminCompetitionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      // 加载竞赛信息
      const compResponse = await api.competition.getDetail(id);
      if (compResponse.success && compResponse.data) {
        setCompetition(compResponse.data);
      }

      // 加载报名列表
      const regResponse = await api.registration.getByCompetitionId(id);
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
            onClick={() => navigate('/admin/competitions')}
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
            onClick={() => navigate('/admin/competitions')}
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
            <div className="text-sm text-gray-500">分类</div>
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

      {/* 报名列表 */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          报名列表 ({registrations.length}人)
        </h2>

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
                          <div className={`font-semibold ${reg.payment.paymentStatus === 'SUCCESS' ? 'text-green-600' : 'text-yellow-600'}`}>
                            {reg.payment.paymentStatus === 'SUCCESS' ? '已支付' : '待支付'}
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
                        </div>
                      ) : (
                        <span className="text-gray-400">未提交</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {reg.paperSubmission && (
                        <button
                          onClick={() => handleViewPaper(reg.paperSubmission!.submissionFileUrl)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium flex items-center gap-1"
                        >
                          <i className="fas fa-eye"></i>
                          查看论文
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCompetitionDetail;
