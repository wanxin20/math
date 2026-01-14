
import React, { useState, useEffect } from 'react';
import { User, UserRegistration, RegistrationStatus } from '../types';
import { Language, translations } from '../i18n';
import api from '../services/api';

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

  // 调用后端API进行模拟支付
  const handleLocalPay = async (compId: string) => {
    try {
      // 查找对应的报名记录
      const registration = myRegistrations.find(r => r.competitionId === compId);
      if (!registration || !registration.id) {
        alert(lang === 'zh' ? '找不到报名记录' : 'Registration not found');
        return;
      }

      // 调用后端模拟支付API
      const result = await api.payment.mockPayment(registration.id);
      
      if (result.success) {
        // 更新本地状态
        setMyRegistrations(prev => prev.map(reg => 
          reg.competitionId === compId ? { 
            ...reg, 
            status: RegistrationStatus.PAID,
            payment: { paymentTime: new Date().toISOString() }
          } : reg
        ));
        
        // 同时调用父组件的方法（更新localStorage）
        onPay(compId);
        
        alert(lang === 'zh' ? '模拟支付成功！' : 'Payment successful!');
      } else {
        alert(result.message || (lang === 'zh' ? '支付失败' : 'Payment failed'));
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      alert(lang === 'zh' ? '支付失败，请重试' : 'Payment failed, please try again');
    }
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

      // 3. 更新本地状态
      setMyRegistrations(prev => prev.map(reg => 
        reg.competitionId === compId ? { 
          ...reg, 
          status: RegistrationStatus.SUBMITTED,
          paperSubmission: {
            title: originalname,
            submissionTime: new Date().toISOString(),
            fileUrl: fileUrl,
          }
        } : reg
      ));

      // 同时调用父组件的方法（更新localStorage）
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
      window.open(fileUrl, '_blank');
    }
  };

  useEffect(() => {
    loadMyRegistrations();
    loadResources();
  }, []);


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
          {userCompetitions.map(reg => (
            <div key={reg.competitionId || reg.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">
                  {reg.competition?.title || reg.competitionId || (lang === 'zh' ? '竞赛' : 'Competition')}
                </h3>
                <span className="text-xs font-bold px-2 py-1 rounded bg-blue-50 text-blue-600">{getStatusText(reg.status)}</span>
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
                   <button onClick={() => handleLocalPay(reg.competitionId)} className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-bold w-full">{t.actions.payNow}</button>
                 )}
                 {reg.status === RegistrationStatus.PAID && (
                   <label className="cursor-pointer bg-white border border-blue-200 text-blue-600 px-6 py-2 rounded-lg text-sm font-bold w-full text-center">
                     <input 
                       type="file" 
                       className="hidden" 
                       accept=".pdf,.doc,.docx,.zip"
                       onChange={(e) => e.target.files?.[0] && handleLocalSubmit(reg.competitionId, e.target.files[0])} 
                     />
                     {t.actions.upload}
                   </label>
                 )}
                 {reg.status === RegistrationStatus.SUBMITTED && (
                   <div className="flex items-center justify-between w-full gap-2">
                     <div className="text-green-600 font-bold text-sm flex items-center gap-2">
                       <i className="fas fa-check-circle"></i>
                       {lang === 'zh' ? '已提交' : 'Submitted'}: {reg.paperSubmission?.title || reg.submissionFile}
                     </div>
                     <button 
                       onClick={() => handleViewPaper(reg.paperSubmission?.fileUrl || reg.paperSubmission?.submissionFileUrl)}
                       className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition"
                     >
                       <i className="fas fa-eye mr-1"></i>
                       {lang === 'zh' ? '查看论文' : 'View Paper'}
                     </button>
                   </div>
                 )}
              </div>
            </div>
          ))}
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
    </div>
  );
};

export default Dashboard;
