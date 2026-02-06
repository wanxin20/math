import React from 'react';
import { Language } from '../../../i18n';
import { PaymentModalState } from '../types';

interface PaymentModalProps {
  paymentModal: PaymentModalState;
  paymentPolling: boolean;
  lang: Language;
  onClose: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ paymentModal, paymentPolling, lang, onClose }) => {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-white to-green-50 rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部装饰 */}
        <div className="h-2 bg-gradient-to-r from-green-400 via-green-500 to-green-600"></div>

        <div className="p-8 relative">
          <button
            onClick={onClose}
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
              <p className="text-gray-600 text-sm mb-2">{paymentModal.description}</p>
              <div className="flex items-center justify-center gap-2">
                <span className="text-sm text-gray-500">{lang === 'zh' ? '应付金额' : 'Amount'}</span>
                <div className="text-4xl font-black text-green-600">¥{paymentModal.amount}</div>
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
  );
};

export default PaymentModal;
