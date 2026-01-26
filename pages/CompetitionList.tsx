
import React, { useState, useEffect } from 'react';
import { Competition, RegistrationStatus, User } from '../types';
import { Language } from '../i18n';
import api from '../services/api';
import NotificationModal from '../components/NotificationModal';

interface CompetitionListProps {
  user: User | null;
  onRegister: (compId: string) => Promise<void>;
  hasRegistered: (compId: string) => boolean;
  getRegistrationStatus?: (compId: string) => RegistrationStatus | null;
  lang: Language;
}

const CompetitionList: React.FC<CompetitionListProps> = ({ user, onRegister, hasRegistered, getRegistrationStatus, lang }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>(lang === 'zh' ? '全部' : 'All');
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [notification, setNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    show: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: () => {},
  });
  const categories = [lang === 'zh' ? '全部' : 'All', ...new Set(competitions.map(c => c.category))];

  useEffect(() => {
    loadCompetitions();
  }, []);

  const loadCompetitions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.competition.getList({
        page: 1,
        pageSize: 100,
      });
      if (response.success && response.data) {
        // 映射后端数据到前端格式
        const mappedData = response.data.items || response.data;
        if (Array.isArray(mappedData)) {
          setCompetitions(mappedData);
        }
      } else {
        setError(response.message || (lang === 'zh' ? '加载竞赛列表失败' : 'Failed to load competitions'));
      }
    } catch (err: any) {
      console.error('Failed to load competitions:', err);
      setError(lang === 'zh' ? '网络错误，请稍后重试' : 'Network error, please try again');
    } finally {
      setLoading(false);
    }
  };

  const filteredCompetitions = selectedCategory === (lang === 'zh' ? '全部' : 'All')
    ? competitions 
    : competitions.filter(c => c.category === selectedCategory);

  const handleRegisterClick = async (compId: string) => {
    try {
      await onRegister(compId);
      // 报名成功后显示通知并跳转
      setNotification({
        show: true,
        title: lang === 'zh' ? '报名成功' : 'Registration Successful',
        message: lang === 'zh' 
          ? '您已成功报名！\n请前往个人中心完成缴费。' 
          : 'Registration successful!\nPlease proceed to payment in your dashboard.',
        type: 'success',
        onConfirm: () => {
          setNotification({ ...notification, show: false });
          window.location.href = '#/dashboard';
        },
      });
    } catch (error: any) {
      // 如果是已经报名的错误
      if (error.message?.includes('已经报名') || error.message?.includes('already registered')) {
        setNotification({
          show: true,
          title: lang === 'zh' ? '提示' : 'Notice',
          message: lang === 'zh' 
            ? '您已报名该竞赛，请前往个人中心进行缴费。' 
            : 'You have already registered. Please proceed to payment in your dashboard.',
          type: 'info',
          onConfirm: () => {
            setNotification({ ...notification, show: false });
            window.location.href = '#/dashboard';
          },
        });
      } else {
        setNotification({
          show: true,
          title: lang === 'zh' ? '报名失败' : 'Registration Failed',
          message: error.message || (lang === 'zh' ? '报名失败，请稍后重试' : 'Registration failed, please try again'),
          type: 'error',
          onConfirm: () => {
            setNotification({ ...notification, show: false });
          },
        });
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">{lang === 'zh' ? '竞赛中心' : 'Competition Center'}</h1>
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

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-500">{lang === 'zh' ? '加载中...' : 'Loading...'}</p>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl text-center">
          <i className="fas fa-exclamation-circle text-2xl mb-2"></i>
          <p>{error}</p>
          <button 
            onClick={loadCompetitions}
            className="mt-3 text-sm underline hover:no-underline"
          >
            {lang === 'zh' ? '重试' : 'Retry'}
          </button>
        </div>
      )}

      {!loading && !error && competitions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
          <p>{lang === 'zh' ? '暂无竞赛' : 'No competitions available'}</p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {filteredCompetitions.map(comp => {
          // 获取报名状态
          const registrationStatus = getRegistrationStatus ? getRegistrationStatus(comp.id) : null;
          // 只有已缴费或已提交才算"已报名成功"
          const isPaidOrSubmitted = registrationStatus === RegistrationStatus.PAID || 
                                    registrationStatus === RegistrationStatus.SUBMITTED ||
                                    registrationStatus === RegistrationStatus.UNDER_REVIEW ||
                                    registrationStatus === RegistrationStatus.REVIEWED ||
                                    registrationStatus === RegistrationStatus.AWARDED;
          // 是否在等待缴费
          const isPendingPayment = registrationStatus === RegistrationStatus.PENDING_PAYMENT;
          // 判断是否已过截止日期
          const isPastDeadline = comp.deadline ? new Date(comp.deadline) < new Date() : false;
          
          return (
            <div key={comp.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-6 hover:shadow-md transition">
              <div className="w-full md:w-64 h-40 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                {comp.coverImageUrl ? (
                  <img 
                    src={comp.coverImageUrl} 
                    alt={comp.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <i className={`fas ${comp.category === '教育技术' ? 'fa-laptop-code' : 'fa-book-open'} text-5xl text-indigo-200`}></i>
                )}
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">{comp.category}</span>
                  <span className={`text-xs font-medium ${isPastDeadline ? 'text-red-600' : 'text-red-500'}`}>
                    {lang === 'zh' ? '截止日期' : 'Deadline'}: {new Date(comp.deadline).toLocaleDateString('zh-CN')}
                    {isPastDeadline && <span className="ml-1">({lang === 'zh' ? '已截止' : 'Closed'})</span>}
                  </span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{comp.title}</h3>
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
                {/* 优先判断是否已截止 */}
                {isPastDeadline ? (
                  <div className="w-full bg-gray-100 text-gray-500 px-4 py-3 rounded-xl text-sm font-bold text-center border border-gray-200 cursor-not-allowed">
                    <i className="fas fa-lock mr-2"></i>
                    {lang === 'zh' ? '报名已截止' : 'Registration Closed'}
                  </div>
                ) : isPaidOrSubmitted ? (
                  <>
                    <div className="bg-green-50 text-green-600 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 w-full justify-center">
                      <i className="fas fa-check-circle"></i>
                      {lang === 'zh' ? '已报名成功' : 'Registered'}
                    </div>
                    <button 
                      onClick={() => window.location.href = '#/dashboard'}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium transition"
                    >
                      {lang === 'zh' ? '查看报名信息' : 'View Registration'}
                    </button>
                  </>
                ) : isPendingPayment ? (
                  <>
                    <div className="bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 w-full justify-center">
                      <i className="fas fa-clock"></i>
                      {lang === 'zh' ? '待缴费' : 'Pending Payment'}
                    </div>
                    <button 
                      onClick={() => window.location.href = '#/dashboard'}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-lg text-sm font-medium transition"
                    >
                      {lang === 'zh' ? '前往缴费' : 'Proceed to Payment'}
                    </button>
                  </>
                ) : !user ? (
                  <button 
                    onClick={() => window.location.href = '#/login'}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold shadow-lg shadow-indigo-200 transition"
                  >
                    {lang === 'zh' ? '登录后报名' : 'Login to Apply'}
                  </button>
                ) : (
                  <button 
                    onClick={() => handleRegisterClick(comp.id)}
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

      {/* Notification Modal */}
      <NotificationModal
        show={notification.show}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        confirmText={lang === 'zh' ? '确定' : 'OK'}
        onConfirm={notification.onConfirm}
      />
    </div>
  );
};

export default CompetitionList;
