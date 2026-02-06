import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { Language } from '../../../i18n';
import { NotificationState, PaymentModalState, InvoiceFlowState, InvoiceFormData } from '../types';

interface UsePaymentParams {
  myRegistrations: any[];
  loadMyRegistrations: () => Promise<void>;
  onPay: (compId: string) => void;
  setNotification: (n: NotificationState) => void;
  lang: Language;
}

export function usePayment({ myRegistrations, loadMyRegistrations, onPay, setNotification, lang }: UsePaymentParams) {
  const [paymentModal, setPaymentModal] = useState<PaymentModalState | null>(null);
  const [paymentPolling, setPaymentPolling] = useState(false);
  const [pollIntervalRef, setPollIntervalRef] = useState<NodeJS.Timeout | null>(null);

  const [invoiceFlow, setInvoiceFlow] = useState<InvoiceFlowState | null>(null);
  const [invoiceForm, setInvoiceForm] = useState<InvoiceFormData>({
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

  /** 开始发票流程（从外部调用，如提交确认后） */
  const startInvoiceFlow = (compId: string, registrationId: number) => {
    setInvoiceFlow({ step: 'ask', compId, registrationId });
  };

  /** 点击「微信支付」时先弹出「是否需要发票」 */
  const handlePayClick = (compId: string) => {
    const registration = myRegistrations.find(r => r.competitionId === compId);
    if (!registration?.id) return;
    setInvoiceFlow({ step: 'ask', compId, registrationId: registration.id });
  };

  /** 选择「否」：直接进入支付 */
  const handleInvoiceNo = () => {
    if (!invoiceFlow) return;
    const { compId } = invoiceFlow;
    closeInvoiceFlow();
    handleWechatPay(compId);
  };

  /** 选择「是」：显示发票表单 */
  const handleInvoiceYes = () => {
    if (!invoiceFlow) return;
    setInvoiceFlow({ ...invoiceFlow, step: 'form' });
  };

  /** 提交发票信息并进入支付 */
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

  /** 微信支付：创建支付订单并显示二维码 */
  const handleWechatPay = async (compId: string) => {
    try {
      const registration = myRegistrations.find(r => r.competitionId === compId);
      if (!registration || !registration.id) {
        alert(lang === 'zh' ? '找不到报名记录' : 'Registration not found');
        return;
      }

      const result = await api.payment.wechatCreate(registration.id);

      if (result.success && result.data) {
        setPaymentModal({
          show: true,
          qrCodeUrl: result.data.codeUrl,
          registrationId: registration.id,
          amount: result.data.amount || registration.competition?.fee || 0,
          description: result.data.description || registration.competition?.title || '',
        });
        startPaymentPolling(registration.id, compId);
      } else {
        alert(result.message || (lang === 'zh' ? '创建支付订单失败' : 'Failed to create payment order'));
      }
    } catch (error: any) {
      console.error('Wechat payment error:', error);
      alert(lang === 'zh' ? '创建支付订单失败，请重试' : 'Failed to create payment order, please try again');
    }
  };

  /** 轮询支付状态 */
  const startPaymentPolling = (registrationId: number, compId: string) => {
    if (pollIntervalRef) {
      clearInterval(pollIntervalRef);
    }

    setPaymentPolling(true);

    const pollInterval = setInterval(async () => {
      try {
        const result = await api.payment.wechatQuery(registrationId);

        if (result.success && result.data) {
          if (result.data.orderStatus === 'SUCCESS' && result.data.paymentStatus === 'success') {
            if (pollInterval) clearInterval(pollInterval);
            setPollIntervalRef(null);
            setPaymentPolling(false);
            setPaymentModal(null);

            await loadMyRegistrations();
            onPay(compId);

            setNotification({
              show: true,
              title: lang === 'zh' ? '提交成功' : 'Submission Successful',
              message: lang === 'zh' ? '支付成功，论文已成功提交！' : 'Payment completed, paper submitted successfully!',
              type: 'success',
            });
          }
        }
      } catch (error) {
        console.error('Payment polling error:', error);
      }
    }, 3000);

    setPollIntervalRef(pollInterval);

    // 5分钟后停止轮询
    setTimeout(() => {
      if (pollInterval) clearInterval(pollInterval);
      setPollIntervalRef(null);
      setPaymentPolling(false);
    }, 5 * 60 * 1000);
  };

  /** 关闭支付弹窗 */
  const closePaymentModal = () => {
    if (pollIntervalRef) {
      clearInterval(pollIntervalRef);
      setPollIntervalRef(null);
    }
    setPaymentModal(null);
    setPaymentPolling(false);
  };

  // 组件卸载时清除轮询
  useEffect(() => {
    return () => {
      if (pollIntervalRef) {
        clearInterval(pollIntervalRef);
      }
    };
  }, [pollIntervalRef]);

  return {
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
  };
}
