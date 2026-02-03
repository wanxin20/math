import React, { useState, useEffect, useRef } from 'react';
import { User, UserRegistration, RegistrationStatus } from '../types';
import { Language, translations } from '../i18n';
import api from '../services/api';
import { API_BASE_URL } from '../constants';
import NotificationModal from '../components/NotificationModal';

interface DashboardProps {
  user: User;
  registrations: UserRegistration[];
  onPay: (compId: string) => void;
  onSubmit: (compId: string, fileNameOrLabel: string) => void;
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

  // 待提交论文文件：选择后先放入列表，用户点击「确认提交」再上传
  const [pendingPaperFiles, setPendingPaperFiles] = useState<{ compId: string; files: File[] } | null>(null);
  const [submittingPaper, setSubmittingPaper] = useState(false);
  const addMoreFileInputRef = useRef<HTMLInputElement>(null);

  // 缴费前发票流程：ask -> 选「是」则 form -> 确认后进入支付
  const [invoiceFlow, setInvoiceFlow] = useState<{ step: 'ask' | 'form'; compId: string; registrationId: number } | null>(null);
  const [invoiceForm, setInvoiceForm] = useState({
    invoiceTitle: '',
    invoiceTaxNo: '',
    invoiceAddress: '',
    invoicePhone: '',
    invoiceEmail: '',
  });

  const closeInvoiceFlow = () => {
    setInvoiceFlow(null);
    setInvoiceForm({ invoiceTitle: '', invoiceTaxNo: '', invoiceAddress: '', invoicePhone: '', invoiceEmail: '' });
  };

  // 点击「微信支付」时先弹出「是否需要发票」
  const handlePayClick = (compId: string) => {
    const registration = myRegistrations.find(r => r.competitionId === compId);
    if (!registration?.id) return;
    setInvoiceFlow({ step: 'ask', compId, registrationId: registration.id });
  };

  // 选择「否」：直接进入支付
  const handleInvoiceNo = () => {
    if (!invoiceFlow) return;
    const { compId } = invoiceFlow;
    closeInvoiceFlow();
    handleWechatPay(compId);
  };

  // 选择「是」：显示发票表单
  const handleInvoiceYes = () => {
    if (!invoiceFlow) return;
    setInvoiceFlow({ ...invoiceFlow, step: 'form' });
  };

  // 提交发票信息并进入支付
  const handleInvoiceSubmit = async () => {
    if (!invoiceFlow) return;
    const { compId, registrationId } = invoiceFlow;
    const { invoiceTitle, invoiceTaxNo, invoiceAddress, invoicePhone, invoiceEmail } = invoiceForm;
    if (!invoiceTitle?.trim()) {
      alert(lang === 'zh' ? '请填写发票抬头' : 'Please enter invoice title');
      return;
    }
    try {
      const res = await api.registration.updateInvoice(registrationId, {
        needInvoice: true,
        invoiceTitle: invoiceTitle.trim(),
        invoiceTaxNo: invoiceTaxNo.trim() || undefined,
        invoiceAddress: invoiceAddress.trim() || undefined,
        invoicePhone: invoicePhone.trim() || undefined,
        invoiceEmail: invoiceEmail.trim() || undefined,
      });
      if (!res.success) {
        alert(res.message || (lang === 'zh' ? '保存发票信息失败' : 'Failed to save invoice'));
        return;
      }
      closeInvoiceFlow();
      handleWechatPay(compId);
    } catch (e) {
      console.error(e);
      alert(lang === 'zh' ? '保存发票信息失败，请重试' : 'Failed to save invoice, please try again');
    }
  };

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

  // 选择文件后放入待提交列表；若当前已有待提交且为同一竞赛，则追加
  const handlePaperFilesSelected = (compId: string, fileList: FileList | null, append = false) => {
    if (!fileList?.length) return;
    const newFiles = Array.from(fileList);
    setPendingPaperFiles((prev) => {
      if (append && prev?.compId === compId) {
        return { compId, files: [...prev.files, ...newFiles] };
      }
      return { compId, files: newFiles };
    });
  };

  // 确认提交：上传待提交列表中的全部文件
  const handleLocalSubmit = async (compId: string, files: FileList | File[]) => {
    const fileList = Array.from(files?.length ? files : []);
    if (fileList.length === 0) return;

    setSubmittingPaper(true);
    try {
      const registration = myRegistrations.find(r => r.competitionId === compId);
      if (!registration || !registration.id) {
        alert(lang === 'zh' ? '找不到报名记录' : 'Registration not found');
        return;
      }

      const uploaded: Array<{ fileName: string; fileUrl: string; size?: number; mimetype?: string }> = [];
      for (const file of fileList) {
        const uploadResult = await api.upload.uploadFile(file);
        if (!uploadResult.success || !uploadResult.data) {
          alert(uploadResult.message || (lang === 'zh' ? '文件上传失败' : 'File upload failed'));
          return;
        }
        const { url: fileUrl, originalname, size, mimetype } = uploadResult.data;
        uploaded.push({ fileName: originalname, fileUrl, size, mimetype });
      }

      const first = uploaded[0];
      const paperData = {
        registrationId: registration.id as number,
        paperTitle: fileList.length === 1 ? first.fileName : (lang === 'zh' ? `论文（${fileList.length} 个文件）` : `Paper (${fileList.length} files)`),
        submissionFiles: uploaded,
      };

      const submitResult = await api.paper.submit(paperData as Parameters<typeof api.paper.submit>[0]);
      if (!submitResult.success) {
        alert(submitResult.message || (lang === 'zh' ? '论文提交失败' : 'Paper submission failed'));
        return;
      }

      setPendingPaperFiles(null);
      await loadMyRegistrations();
      onSubmit(compId, fileList.length === 1 ? first.fileName : `${fileList.length} files`);
      alert(lang === 'zh' ? '论文上传成功！' : 'Paper uploaded successfully!');
    } catch (error: any) {
      console.error('Paper submission error:', error);
      alert(lang === 'zh' ? '论文上传失败，请重试' : 'Paper upload failed, please try again');
    } finally {
      setSubmittingPaper(false);
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
                       onClick={() => handlePayClick(reg.competitionId)} 
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
                   ) : pendingPaperFiles?.compId === reg.competitionId ? (
                    <div className="space-y-2 w-full">
                      <p className="text-sm text-gray-600">
                        {lang === 'zh' ? `已选 ${pendingPaperFiles.files.length} 个文件，可继续添加或点击下方提交` : `${pendingPaperFiles.files.length} file(s) selected`}
                      </p>
                      <ul className="text-xs text-gray-500 list-disc list-inside max-h-20 overflow-y-auto">
                        {pendingPaperFiles.files.map((f, i) => (
                          <li key={i} className="truncate">{f.name}</li>
                        ))}
                      </ul>
                      <input
                        ref={addMoreFileInputRef}
                        type="file"
                        className="hidden"
                        multiple
                        accept=".pdf,.doc,.docx,.zip"
                        onChange={(e) => { handlePaperFilesSelected(reg.competitionId, e.target.files, true); e.target.value = ''; }}
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={submittingPaper}
                          onClick={() => addMoreFileInputRef.current?.click()}
                          className="px-4 py-2 rounded-lg text-sm font-medium border border-blue-300 text-blue-600 hover:bg-blue-50"
                        >
                          <i className="fas fa-plus mr-1"></i>
                          {lang === 'zh' ? '继续添加文件' : 'Add more files'}
                        </button>
                        <button
                          type="button"
                          disabled={submittingPaper}
                          onClick={() => handleLocalSubmit(reg.competitionId, pendingPaperFiles.files)}
                          className="flex-1 min-w-[100px] bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold"
                        >
                          {submittingPaper ? (lang === 'zh' ? '上传中…' : 'Uploading…') : (lang === 'zh' ? '确认提交' : 'Submit')}
                        </button>
                        <button
                          type="button"
                          disabled={submittingPaper}
                          onClick={() => setPendingPaperFiles(null)}
                          className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                          {lang === 'zh' ? '取消' : 'Cancel'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer bg-white border border-blue-200 text-blue-600 px-6 py-2 rounded-lg text-sm font-bold w-full text-center hover:bg-blue-50 transition block">
                      <input 
                        type="file" 
                        className="hidden" 
                        multiple
                        accept=".pdf,.doc,.docx,.zip"
                        onChange={(e) => { handlePaperFilesSelected(reg.competitionId, e.target.files); e.target.value = ''; }} 
                      />
                      {t.actions.upload}
                      <span className="block text-xs font-normal text-gray-500 mt-0.5">{lang === 'zh' ? '可多选，选完后点「确认提交」' : 'Select files, then click Submit'}</span>
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
                      <div className="flex flex-wrap gap-2 flex-shrink-0">
                        {(() => {
                          const ps = reg.paperSubmission as any;
                          const files = (ps?.submissionFiles || ps?.submission_files) && Array.isArray(ps?.submissionFiles || ps?.submission_files) ? (ps.submissionFiles || ps.submission_files) : null;
                          if (files?.length) {
                            return files.map((f: { fileName?: string; fileUrl: string }, i: number) => (
                              <button
                                key={i}
                                onClick={() => handleViewPaper(f.fileUrl)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition whitespace-nowrap"
                              >
                                <i className="fas fa-eye mr-1"></i>
                                {f.fileName || `${lang === 'zh' ? '文件' : 'File'} ${i + 1}`}
                              </button>
                            ));
                          }
                          const singleUrl = ps?.submission_file_url || ps?.submissionFileUrl || ps?.fileUrl;
                          return (
                            <button
                              onClick={() => handleViewPaper(singleUrl)}
                              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 transition whitespace-nowrap"
                            >
                              <i className="fas fa-eye mr-1"></i>
                              {lang === 'zh' ? '查看论文' : 'View Paper'}
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                    {!isPastDeadline && (
                      pendingPaperFiles?.compId === reg.competitionId ? (
                        <div className="space-y-2 w-full">
                          <p className="text-sm text-gray-600">
                            {lang === 'zh' ? `已选 ${pendingPaperFiles.files.length} 个文件，可继续添加或提交` : `${pendingPaperFiles.files.length} file(s) selected`}
                          </p>
                          <ul className="text-xs text-gray-500 list-disc list-inside max-h-16 overflow-y-auto">
                            {pendingPaperFiles.files.map((f, i) => (
                              <li key={i} className="truncate">{f.name}</li>
                            ))}
                          </ul>
                          <input
                            ref={addMoreFileInputRef}
                            type="file"
                            className="hidden"
                            multiple
                            accept=".pdf,.doc,.docx,.zip"
                            onChange={(e) => { handlePaperFilesSelected(reg.competitionId, e.target.files, true); e.target.value = ''; }}
                          />
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              disabled={submittingPaper}
                              onClick={() => addMoreFileInputRef.current?.click()}
                              className="px-4 py-2 rounded-lg text-sm font-medium border border-orange-300 text-orange-600 hover:bg-orange-50"
                            >
                              <i className="fas fa-plus mr-1"></i>
                              {lang === 'zh' ? '继续添加文件' : 'Add more files'}
                            </button>
                            <button
                              type="button"
                              disabled={submittingPaper}
                              onClick={() => handleLocalSubmit(reg.competitionId, pendingPaperFiles.files)}
                              className="flex-1 min-w-[100px] bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
                            >
                              {submittingPaper ? (lang === 'zh' ? '上传中…' : 'Uploading…') : (lang === 'zh' ? '确认提交' : 'Submit')}
                            </button>
                            <button
                              type="button"
                              disabled={submittingPaper}
                              onClick={() => setPendingPaperFiles(null)}
                              className="px-4 py-2 rounded-lg text-sm border border-gray-300 text-gray-700 hover:bg-gray-50"
                            >
                              {lang === 'zh' ? '取消' : 'Cancel'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className="cursor-pointer bg-orange-50 border border-orange-200 text-orange-600 px-4 py-2 rounded-lg text-xs font-medium w-full text-center hover:bg-orange-100 transition block">
                          <input 
                            type="file" 
                            className="hidden" 
                            multiple
                            accept=".pdf,.doc,.docx,.zip"
                            onChange={(e) => { handlePaperFilesSelected(reg.competitionId, e.target.files); e.target.value = ''; }} 
                          />
                          <i className="fas fa-redo mr-2"></i>
                          {lang === 'zh' ? '重新提交论文（可多选，选完后点确认提交）' : 'Resubmit (select files, then Submit)'}
                        </label>
                      )
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
      {/* 缴费前：是否要发票 */}
      {invoiceFlow?.step === 'ask' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeInvoiceFlow}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{lang === 'zh' ? '是否需要发票？' : 'Do you need an invoice?'}</h3>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleInvoiceYes}
                className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
              >
                {lang === 'zh' ? '是' : 'Yes'}
              </button>
              <button
                type="button"
                onClick={handleInvoiceNo}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                {lang === 'zh' ? '否' : 'No'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 缴费前：填写发票信息 */}
      {invoiceFlow?.step === 'form' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={closeInvoiceFlow}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full my-8 p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{lang === 'zh' ? '填写发票信息' : 'Invoice Information'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'zh' ? '发票抬头' : 'Invoice title'} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={invoiceForm.invoiceTitle}
                  onChange={(e) => setInvoiceForm((f) => ({ ...f, invoiceTitle: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder={lang === 'zh' ? '单位或个人名称' : 'Company or name'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'zh' ? '纳税人识别号/税号' : 'Tax ID'}</label>
                <input
                  type="text"
                  value={invoiceForm.invoiceTaxNo}
                  onChange={(e) => setInvoiceForm((f) => ({ ...f, invoiceTaxNo: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder={lang === 'zh' ? '选填' : 'Optional'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'zh' ? '地址' : 'Address'}</label>
                <input
                  type="text"
                  value={invoiceForm.invoiceAddress}
                  onChange={(e) => setInvoiceForm((f) => ({ ...f, invoiceAddress: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder={lang === 'zh' ? '选填' : 'Optional'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'zh' ? '联系电话' : 'Phone'}</label>
                <input
                  type="text"
                  value={invoiceForm.invoicePhone}
                  onChange={(e) => setInvoiceForm((f) => ({ ...f, invoicePhone: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder={lang === 'zh' ? '选填' : 'Optional'}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{lang === 'zh' ? '邮箱（接收电子发票）' : 'Email (e-invoice)'}</label>
                <input
                  type="email"
                  value={invoiceForm.invoiceEmail}
                  onChange={(e) => setInvoiceForm((f) => ({ ...f, invoiceEmail: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder={lang === 'zh' ? '选填' : 'Optional'}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={closeInvoiceFlow}
                className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
              >
                {lang === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleInvoiceSubmit}
                className="flex-1 py-3 px-4 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
              >
                {lang === 'zh' ? '确认并支付' : 'Confirm & Pay'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-6">
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
                <div className="bg-white p-6 rounded-2xl shadow-lg border-4 border-green-200 inline-block mb-4 relative">
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
                
                {/* 支付状态提示 */}
                {paymentPolling && (
                  <div className="flex items-center justify-center gap-2 mb-6 text-green-600">
                    <div className="animate-spin rounded-full h-5 w-5 border-3 border-green-600 border-t-transparent"></div>
                    <p className="text-sm font-semibold">{lang === 'zh' ? '等待支付中...' : 'Waiting for payment...'}</p>
                  </div>
                )}
                
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
