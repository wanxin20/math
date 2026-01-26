
import React, { useState, useEffect } from 'react';
import { User, UserRegistration, RegistrationStatus } from '../types';
import { Language, translations } from '../i18n';
import api from '../services/api';
import { API_BASE_URL } from '../constants';
import NotificationModal from '../components/NotificationModal';

interface DashboardProps {
  user: User;
  registrations: UserRegistration[];
  onPay: (compId: string) => void;
  onSubmit: (compId: string, fileName: string) => void;
  lang: Language;
}

const Dashboard: React.FC<DashboardProps> = ({ user, registrations, onPay, onSubmit, lang }) => {
  const t = translations[lang].dashboard;
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  const [myRegistrations, setMyRegistrations] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingResources, setLoadingResources] = useState(false);
  
  // 微信支付相关状态
  const [paymentModal, setPaymentModal] = useState<{
    show: boolean;
    qrCodeUrl: string;
    registrationId: number;
    amount: number;
    description: string;
  } | null>(null);
  const [paymentPolling, setPaymentPolling] = useState(false);
  const [pollIntervalRef, setPollIntervalRef] = useState<NodeJS.Timeout | null>(null);
  const [notification, setNotification] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  }>({
    show: false,
    title: '',
    message: '',
    type: 'info',
  });

  // 微信支付：创建支付订单并显示二维码
  const handleWechatPay = async (compId: string) => {
    try {
      // 查找对应的报名记录
      const registration = myRegistrations.find(r => r.competitionId === compId);
      if (!registration || !registration.id) {
        alert(lang === 'zh' ? '找不到报名记录' : 'Registration not found');
        return;
      }

      // 调用后端创建微信支付订单
      const result = await api.payment.wechatCreate(registration.id);
      
      if (result.success && result.data) {
        // 显示支付二维码弹窗
        setPaymentModal({
          show: true,
          qrCodeUrl: result.data.codeUrl,
          registrationId: registration.id,
          amount: result.data.amount || registration.competition?.fee || 0,
          description: result.data.description || registration.competition?.title || '',
        });
        
        // 开始轮询支付状态
        startPaymentPolling(registration.id, compId);
      } else {
        alert(result.message || (lang === 'zh' ? '创建支付订单失败' : 'Failed to create payment order'));
      }
    } catch (error: any) {
      console.error('Wechat payment error:', error);
      alert(lang === 'zh' ? '创建支付订单失败，请重试' : 'Failed to create payment order, please try again');
    }
  };

  // 轮询支付状态
  const startPaymentPolling = (registrationId: number, compId: string) => {
    // 清除之前的轮询（如果有）
    if (pollIntervalRef) {
      clearInterval(pollIntervalRef);
    }
    
    setPaymentPolling(true);
    
    const pollInterval = setInterval(async () => {
      try {
        const result = await api.payment.wechatQuery(registrationId);
        
        if (result.success && result.data) {
          // 检查支付状态
          // orderStatus: 微信返回的状态 (SUCCESS/NOTPAY等)
          // paymentStatus: 数据库中的状态 (success/pending/failed/refunded)
          if (result.data.orderStatus === 'SUCCESS' && result.data.paymentStatus === 'success') {
            // 支付成功
            if (pollInterval) clearInterval(pollInterval);
            setPollIntervalRef(null);
            setPaymentPolling(false);
            setPaymentModal(null);
            
            // 从后端重新加载报名列表，确保状态同步
            await loadMyRegistrations();
            
            // 调用父组件的方法（更新localStorage）
            onPay(compId);
            
            // 显示支付成功通知
            setNotification({
              show: true,
              title: lang === 'zh' ? '支付成功' : 'Payment Successful',
              message: lang === 'zh' ? '您的支付已成功！\n请前往论文提交页面上传您的作品。' : 'Payment successful!\nPlease upload your paper.',
              type: 'success',
            });
          }
        }
      } catch (error) {
        console.error('Payment polling error:', error);
      }
    }, 3000); // 每3秒查询一次

    // 保存 interval ID
    setPollIntervalRef(pollInterval);

    // 5分钟后停止轮询
    setTimeout(() => {
      if (pollInterval) clearInterval(pollInterval);
      setPollIntervalRef(null);
      setPaymentPolling(false);
    }, 5 * 60 * 1000);
  };

  // 关闭支付弹窗
  const closePaymentModal = () => {
    // 清除轮询
    if (pollIntervalRef) {
      clearInterval(pollIntervalRef);
      setPollIntervalRef(null);
    }
    setPaymentModal(null);
    setPaymentPolling(false);
  };

  // 本地处理论文提交（连接真实API）
  const handleLocalSubmit = async (compId: string, file: File) => {
    try {
      // 查找对应的报名记录
      const registration = myRegistrations.find(r => r.competitionId === compId);
      if (!registration || !registration.id) {
        alert(lang === 'zh' ? '找不到报名记录' : 'Registration not found');
        return;
      }

      // 1. 上传文件
      const uploadResult = await api.upload.uploadFile(file);
      if (!uploadResult.success || !uploadResult.data) {
        alert(uploadResult.message || (lang === 'zh' ? '文件上传失败' : 'File upload failed'));
        return;
      }

      const { url: fileUrl, originalname, size, mimetype } = uploadResult.data;

      // 2. 提交论文记录
      const paperData = {
        registrationId: registration.id,
        paperTitle: originalname,
        submissionFileName: originalname,
        submissionFileUrl: fileUrl,
        submissionFileSize: size,
        submissionFileType: mimetype,
      };

      const submitResult = await api.paper.submit(paperData);
      if (!submitResult.success) {
        alert(submitResult.message || (lang === 'zh' ? '论文提交失败' : 'Paper submission failed'));
        return;
      }

      // 3. 从后端重新加载报名列表，确保状态同步
      await loadMyRegistrations();

      // 调用父组件的方法（更新localStorage）
      onSubmit(compId, originalname);

      alert(lang === 'zh' ? '论文上传成功！' : 'Paper uploaded successfully!');
    } catch (error: any) {
      console.error('Paper submission error:', error);
      alert(lang === 'zh' ? '论文上传失败，请重试' : 'Paper upload failed, please try again');
    }
  };

  // 查看论文
  const handleViewPaper = (fileUrl: string) => {
    if (fileUrl) {
      // 如果是相对路径，拼接基础URL（去掉/api/v1）
      const baseUrl = API_BASE_URL.replace(/\/api\/v1$/, '');
      const fullUrl = fileUrl.startsWith('http') 
        ? fileUrl 
        : `${baseUrl}${fileUrl}`;
      window.open(fullUrl, '_blank');
    }
  };

  useEffect(() => {
    loadMyRegistrations();
    loadResources();
    
    // 组件卸载时清除轮询
    return () => {
      if (pollIntervalRef) {
        clearInterval(pollIntervalRef);
      }
    };
  }, [pollIntervalRef]);


  const loadMyRegistrations = async () => {
    setLoading(true);
    try {
      const response = await api.registration.getMyRegistrations();
      if (response.success && response.data) {
        setMyRegistrations(Array.isArray(response.data) ? response.data : []);
      }
    } catch (error) {
      console.error('Failed to load registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadResources = async () => {
    setLoadingResources(true);
    try {
      const response = await api.resource.getList({ page: 1, pageSize: 10 });
      if (response.success && response.data) {
        const resourceData = response.data.items || response.data;
        setResources(Array.isArray(resourceData) ? resourceData : []);
      }
    } catch (error) {
      console.error('Failed to load resources:', error);
    } finally {
      setLoadingResources(false);
    }
  };

  // 直接使用myRegistrations（已经包含所有更新）
  const userCompetitions = myRegistrations;

  const getStatusText = (status: RegistrationStatus) => {
    switch(status) {
      case RegistrationStatus.PENDING_PAYMENT: return t.status.pending;
      case RegistrationStatus.PAID: return t.status.paid;
      case RegistrationStatus.SUBMITTED: return t.status.submitted;
      default: return '...';
    }
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{t.welcome}, {user.name}</h1>
          <p className="text-gray-500">{t.sub}</p>
        </div>
        <div className="flex gap-4 bg-gray-50 p-1 rounded-xl">
           <button onClick={() => setActiveTab('all')} className={`px-6 py-2 rounded-lg text-sm font-semibold ${activeTab === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>{t.all}</button>
           <button onClick={() => setActiveTab('pending')} className={`px-6 py-2 rounded-lg text-sm font-semibold ${activeTab === 'pending' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>{t.pending}</button>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-500">{lang === 'zh' ? '加载中...' : 'Loading...'}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {userCompetitions.length === 0 && !loading && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
              <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">{lang === 'zh' ? '暂无报名记录' : 'No registrations yet'}</p>
            </div>
          )}
          {userCompetitions.map(reg => {
            // 判断是否已过截止日期
            const deadline = reg.competition?.deadline;
            const isPastDeadline = deadline ? new Date(deadline) < new Date() : false;
            
            return (
            <div key={reg.competitionId || reg.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6">
              <div className="flex justify-between items-start md:items-center mb-6 gap-2 flex-wrap">
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 mb-1">
                    {reg.competition?.title || (lang === 'zh' ? '竞赛' : 'Competition')}
                  </h3>
                  {deadline && (
                    <div className="flex items-center gap-2 text-xs">
                      <i className="fas fa-clock text-gray-400"></i>
                      <span className="text-gray-500">
                        {lang === 'zh' ? '截止时间：' : 'Deadline: '}
                        <span className={isPastDeadline ? 'text-red-500 font-semibold' : 'text-gray-700'}>
                          {new Date(deadline).toLocaleDateString('zh-CN')}
                        </span>
                        {isPastDeadline && (
                          <span className="ml-2 text-red-500 font-semibold">
                            ({lang === 'zh' ? '已截止' : 'Closed'})
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold px-2 py-1 rounded bg-blue-50 text-blue-600 whitespace-nowrap">{getStatusText(reg.status)}</span>
              </div>
              
              <div className="flex justify-between gap-2 mb-8">
                 <div className="text-center flex-1">
                   <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center mx-auto mb-1"><i className="fas fa-check text-[10px]"></i></div>
                   <div className="text-[10px]">{t.steps.reg}</div>
                 </div>
                 <div className="text-center flex-1">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${reg.status !== RegistrationStatus.PENDING_PAYMENT ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}><i className="fas fa-credit-card text-[10px]"></i></div>
                   <div className="text-[10px]">{t.steps.pay}</div>
                 </div>
                 <div className="text-center flex-1">
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center mx-auto mb-1 ${reg.status === RegistrationStatus.SUBMITTED ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}><i className="fas fa-upload text-[10px]"></i></div>
                   <div className="text-[10px]">{t.steps.submit}</div>
                 </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl flex justify-between items-center">
                 {reg.status === RegistrationStatus.PENDING_PAYMENT && (
                   isPastDeadline ? (
                     <div className="text-gray-400 px-6 py-2 text-sm text-center w-full border border-gray-200 rounded-lg bg-gray-100 cursor-not-allowed">
                       <i className="fas fa-lock mr-2"></i>
                       {lang === 'zh' ? '报名已截止，无法支付' : 'Registration Closed'}
                     </div>
                   ) : (
                     <button 
                       onClick={() => handleWechatPay(reg.competitionId)} 
                       className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-bold w-full transition flex items-center justify-center gap-2"
                     >
                       <i className="fab fa-weixin"></i>
                       {lang === 'zh' ? '微信支付' : 'WeChat Pay'}
                     </button>
                   )
                 )}
                 {reg.status === RegistrationStatus.PAID && (
                   isPastDeadline ? (
                     <div className="text-gray-400 px-6 py-2 text-sm text-center w-full border border-gray-200 rounded-lg bg-gray-50">
                       <i className="fas fa-lock mr-2"></i>
                       {lang === 'zh' ? '已过提交截止时间' : 'Submission Closed'}
                     </div>
                   ) : (
                     <label className="cursor-pointer bg-white border border-blue-200 text-blue-600 px-6 py-2 rounded-lg text-sm font-bold w-full text-center hover:bg-blue-50 transition">
                       <input 
                         type="file" 
                         className="hidden" 
                         accept=".pdf,.doc,.docx,.zip"
                         onChange={(e) => e.target.files?.[0] && handleLocalSubmit(reg.competitionId, e.target.files[0])} 
                       />
                       {t.actions.upload}
                     </label>
                   )
                 )}
                 {reg.status === RegistrationStatus.SUBMITTED && (
                   <div className="flex flex-col gap-3 w-full">
                     <div className="flex flex-col md:flex-row items-start md:items-center justify-between w-full gap-2">
                       <div className="text-green-600 font-bold text-sm flex items-center gap-2 flex-1 min-w-0">
                         <i className="fas fa-check-circle flex-shrink-0"></i>
                         <span className="truncate">
                           {lang === 'zh' ? '已提交' : 'Submitted'}: {reg.paperSubmission?.paper_title || reg.paperSubmission?.paperTitle || reg.paperSubmission?.submission_file_name || reg.submissionFile || '论文.pdf'}
                         </span>
                       </div>
                       <button 
                         onClick={() => handleViewPaper(
                           reg.paperSubmission?.submission_file_url || 
                           reg.paperSubmission?.submissionFileUrl || 
                           reg.paperSubmission?.fileUrl
                         )}
                         className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition whitespace-nowrap flex-shrink-0"
                       >
                         <i className="fas fa-eye mr-1"></i>
                         {lang === 'zh' ? '查看论文' : 'View Paper'}
                       </button>
                     </div>
                     {!isPastDeadline && (
                       <label className="cursor-pointer bg-orange-50 border border-orange-200 text-orange-600 px-4 py-2 rounded-lg text-xs font-medium w-full text-center hover:bg-orange-100 transition">
                         <input 
                           type="file" 
                           className="hidden" 
                           accept=".pdf,.doc,.docx,.zip"
                           onChange={(e) => e.target.files?.[0] && handleLocalSubmit(reg.competitionId, e.target.files[0])} 
                         />
                         <i className="fas fa-redo mr-2"></i>
                         {lang === 'zh' ? '重新提交论文' : 'Resubmit Paper'}
                       </label>
                     )}
                   </div>
                 )}
              </div>
            </div>
          );
          })}
        </div>
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
             <h4 className="font-bold mb-4">{t.resources}</h4>
             {loadingResources ? (
               <div className="text-center py-4">
                 <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
               </div>
             ) : resources.length > 0 ? (
               <div className="space-y-2">
                 {resources.map((resource, i) => (
                   <div 
                     key={resource.id || i} 
                     className="text-xs p-2 hover:bg-gray-50 rounded cursor-pointer border-b last:border-0"
                     onClick={() => resource.id && api.resource.download(resource.id)}
                   >
                     <i className={`fas fa-file-${resource.type === 'pdf' ? 'pdf' : resource.type === 'doc' ? 'word' : 'alt'} mr-2`}></i>
                     {resource.name || resource.title}
                   </div>
                 ))}
               </div>
             ) : (
               <p className="text-sm text-gray-500 text-center py-4">
                 {lang === 'zh' ? '暂无资源' : 'No resources'}
               </p>
             )}
           </div>
        </div>
      </div>

      {/* 微信支付二维码弹窗 */}
      {paymentModal && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          onClick={closePaymentModal}
        >
          <div 
            className="bg-gradient-to-br from-white to-green-50 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 顶部装饰 */}
            <div className="h-2 bg-gradient-to-r from-green-400 via-green-500 to-green-600"></div>
            
            <div className="p-8 relative">
              <button
                onClick={closePaymentModal}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition"
              >
                <i className="fas fa-times text-lg"></i>
              </button>
              
              <div className="text-center">
                {/* 微信图标 */}
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6 animate-bounce">
                  <i className="fab fa-weixin text-green-600 text-5xl"></i>
                </div>
                
                <h3 className="text-3xl font-black text-gray-900 mb-2 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-green-700">
                  {lang === 'zh' ? '微信支付' : 'WeChat Pay'}
                </h3>
                
                <div className="bg-white/80 backdrop-blur rounded-2xl p-4 mb-6 border border-green-100">
                  <p className="text-gray-600 text-sm mb-2">
                    {paymentModal.description}
                  </p>
                  
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-500">{lang === 'zh' ? '应付金额' : 'Amount'}</span>
                    <div className="text-4xl font-black text-green-600">
                      ¥{paymentModal.amount}
                    </div>
                  </div>
                </div>
                
                {/* 二维码 */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border-4 border-green-200 inline-block mb-6 relative">
                  {paymentPolling && (
                    <div className="absolute inset-0 bg-white/90 rounded-2xl flex items-center justify-center">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-2"></div>
                        <p className="text-sm text-green-600 font-semibold">{lang === 'zh' ? '等待支付...' : 'Waiting...'}</p>
                      </div>
                    </div>
                  )}
                  <img 
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(paymentModal.qrCodeUrl)}`}
                    alt="Payment QR Code"
                    className="w-52 h-52"
                  />
                  <div className="absolute -bottom-3 -right-3 bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                    <i className="fas fa-qrcode mr-1"></i>
                    {lang === 'zh' ? '扫码' : 'SCAN'}
                  </div>
                </div>
                
                <div className="space-y-3 bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <div className="flex items-center justify-center gap-2 text-sm text-blue-700 font-semibold">
                    <i className="fas fa-info-circle"></i>
                    <span>{lang === 'zh' ? '请使用微信扫码支付' : 'Scan QR code with WeChat'}</span>
                  </div>
                  
                  <p className="text-xs text-blue-600">
                    {lang === 'zh' 
                      ? '支付完成后，页面将自动更新并跳转' 
                      : 'Page will update automatically after payment'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Modal */}
      <NotificationModal
        show={notification.show}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        confirmText={lang === 'zh' ? '确定' : 'OK'}
        onConfirm={() => setNotification({ ...notification, show: false })}
      />
    </div>
  );
};

export default Dashboard;
