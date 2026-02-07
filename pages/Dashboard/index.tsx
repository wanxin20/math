import React, { useState, useEffect } from 'react';
import { RegistrationStatus } from '../../types';
import { translations } from '../../i18n';
import api from '../../services/api';
import NotificationModal from '../../components/NotificationModal';
import { useSystem } from '../../contexts/SystemContext';
import { systemConfig } from '../../store/system';

import { DashboardProps, NotificationState, ConfirmDialogState } from './types';
import { useDashboardData } from './hooks/useDashboardData';
import { usePayment } from './hooks/usePayment';
import { usePaperSubmission } from './hooks/usePaperSubmission';
import { useProfile } from './hooks/useProfile';
import { usePassword } from './hooks/usePassword';

import RegistrationCard from './components/RegistrationCard';
import PaymentModal from './components/PaymentModal';
import InvoiceModals from './components/InvoiceModals';
import ProfileModal from './components/ProfileModal';
import PasswordModal from './components/PasswordModal';
import ConfirmDialog from './components/ConfirmDialog';

const Dashboard: React.FC<DashboardProps> = ({ user, registrations, onPay, onSubmit, onUpdateUser, lang }) => {
  const t = translations[lang].dashboard;
  const { system } = useSystem();
  const cfg = systemConfig[system];

  // 共享状态：通知和确认对话框
  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    title: '',
    message: '',
    type: 'info',
  });

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    show: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // 数据加载
  const {
    activeTab,
    setActiveTab,
    myRegistrations,
    resources,
    loading,
    loadingResources,
    loadMyRegistrations,
    loadResources,
  } = useDashboardData();

  // 支付和发票
  const {
    paymentModal,
    paymentPolling,
    invoiceFlow,
    invoiceForm,
    setInvoiceForm,
    closeInvoiceFlow,
    startInvoiceFlow,
    handlePayClick,
    handleInvoiceNo,
    handleInvoiceYes,
    handleInvoiceSubmit,
    closePaymentModal,
  } = usePayment({ myRegistrations, loadMyRegistrations, onPay, setNotification, lang });

  // 论文提交
  const {
    submittingPaper,
    uploadProgress,
    handlePaperFilesSelected,
    handleSubmitClick,
    handleDeleteSavedFile,
    handleViewPaper,
  } = usePaperSubmission({
    myRegistrations,
    loadMyRegistrations,
    onSubmit,
    setNotification,
    setConfirmDialog,
    startInvoiceFlow,
    lang,
  });

  // 个人信息
  const {
    showProfileModal,
    setShowProfileModal,
    profileForm,
    setProfileForm,
    updatingProfile,
    handleOpenProfileModal,
    handleUpdateProfile,
  } = useProfile({ user, setNotification, onUpdateUser, lang });

  // 密码修改
  const {
    showPasswordModal,
    setShowPasswordModal,
    passwordForm,
    setPasswordForm,
    sendingCode,
    codeSent,
    countdown,
    changingPassword,
    openPasswordModal,
    handleSendPasswordCode,
    handleChangePassword,
  } = usePassword({ user, setNotification, lang });

  // 初始化加载
  useEffect(() => {
    loadMyRegistrations();
    loadResources();
  }, []);

  const userCompetitions = myRegistrations;

  const getStatusText = (status: RegistrationStatus) => {
    switch (status) {
      case RegistrationStatus.PENDING_SUBMISSION: return lang === 'zh' ? '待提交' : 'Pending Submission';
      case RegistrationStatus.PENDING_PAYMENT: return lang === 'zh' ? '待支付' : 'Pending Payment';
      case RegistrationStatus.SUBMITTED: return lang === 'zh' ? '已提交' : 'Submitted';
      case RegistrationStatus.UNDER_REVIEW: return lang === 'zh' ? '评审中' : 'Under Review';
      case RegistrationStatus.REVIEWED: return lang === 'zh' ? '已评审' : 'Reviewed';
      case RegistrationStatus.AWARDED: return lang === 'zh' ? '已获奖' : 'Awarded';
      default: return '...';
    }
  };

  return (
    <div className="space-y-8">
      {/* 顶部欢迎区域 */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">{t.welcome}, {user.name}</h1>
          <p className="text-gray-500">{t.sub}</p>
          <div className="mt-4 space-x-2">
            <button
              onClick={handleOpenProfileModal}
              className="text-sm text-indigo-600 hover:underline"
            >
              <i className="fas fa-edit mr-1"></i>
              {lang === 'zh' ? '编辑个人信息' : 'Edit Profile'}
            </button>
            <button
              onClick={openPasswordModal}
              className="text-sm text-indigo-600 hover:underline"
            >
              <i className="fas fa-key mr-1"></i>
              {lang === 'zh' ? '修改密码' : 'Change Password'}
            </button>
          </div>
        </div>
        <div className="flex gap-4 bg-gray-50 p-1 rounded-xl">
          <button onClick={() => setActiveTab('all')} className={`px-6 py-2 rounded-lg text-sm font-semibold ${activeTab === 'all' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>{t.all}</button>
          <button onClick={() => setActiveTab('pending')} className={`px-6 py-2 rounded-lg text-sm font-semibold ${activeTab === 'pending' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}>{t.pending}</button>
        </div>
      </div>

      {/* 加载状态 */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-500">{lang === 'zh' ? '加载中...' : 'Loading...'}</p>
        </div>
      )}

      {/* 主内容区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 报名列表 */}
        <div className="lg:col-span-2 space-y-6">
          {userCompetitions.length === 0 && !loading && (
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-12 text-center">
              <i className="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
              <p className="text-gray-500">{lang === 'zh' ? '暂无报名记录' : 'No registrations yet'}</p>
            </div>
          )}
          {userCompetitions.map((reg, index) => (
            <RegistrationCard
              key={reg.competitionId || reg.id}
              reg={reg}
              regIndex={index}
              lang={lang}
              submittingPaper={submittingPaper}
              uploadProgress={uploadProgress}
              getStatusText={getStatusText}
              onPaperFilesSelected={handlePaperFilesSelected}
              onSubmitClick={handleSubmitClick}
              onPayClick={handlePayClick}
              onDeleteSavedFile={handleDeleteSavedFile}
              onViewPaper={handleViewPaper}
            />
          ))}
        </div>

        {/* 侧边栏：资源下载 */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h4 className="font-bold mb-4">{system === 'paper' ? (lang === 'zh' ? '申请表下载' : 'Application Form') : t.resources}</h4>
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

      {/* 发票弹窗 */}
      <InvoiceModals
        invoiceFlow={invoiceFlow}
        invoiceForm={invoiceForm}
        lang={lang}
        onInvoiceFormChange={setInvoiceForm}
        onInvoiceYes={handleInvoiceYes}
        onInvoiceNo={handleInvoiceNo}
        onInvoiceSubmit={handleInvoiceSubmit}
        onClose={closeInvoiceFlow}
      />

      {/* 微信支付弹窗 */}
      {paymentModal && (
        <PaymentModal
          paymentModal={paymentModal}
          paymentPolling={paymentPolling}
          lang={lang}
          onClose={closePaymentModal}
        />
      )}

      {/* 确认对话框 */}
      <ConfirmDialog
        confirmDialog={confirmDialog}
        lang={lang}
        onClose={() => setConfirmDialog({ ...confirmDialog, show: false })}
      />

      {/* 通知弹窗 */}
      <NotificationModal
        show={notification.show}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        confirmText={lang === 'zh' ? '确定' : 'OK'}
        onConfirm={() => setNotification({ ...notification, show: false })}
      />

      {/* 编辑个人信息弹窗 */}
      {showProfileModal && (
        <ProfileModal
          lang={lang}
          profileForm={profileForm}
          updatingProfile={updatingProfile}
          onFormChange={setProfileForm}
          onSave={handleUpdateProfile}
          onClose={() => setShowProfileModal(false)}
        />
      )}

      {/* 修改密码弹窗 */}
      {showPasswordModal && (
        <PasswordModal
          lang={lang}
          passwordForm={passwordForm}
          sendingCode={sendingCode}
          codeSent={codeSent}
          countdown={countdown}
          changingPassword={changingPassword}
          onFormChange={setPasswordForm}
          onSendCode={handleSendPasswordCode}
          onChangePassword={handleChangePassword}
          onClose={() => setShowPasswordModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;
