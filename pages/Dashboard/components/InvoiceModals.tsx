import React from 'react';
import { Language } from '../../../i18n';
import { InvoiceFlowState, InvoiceFormData } from '../types';

interface InvoiceModalsProps {
  invoiceFlow: InvoiceFlowState | null;
  invoiceForm: InvoiceFormData;
  lang: Language;
  onInvoiceFormChange: (form: InvoiceFormData) => void;
  onInvoiceYes: () => void;
  onInvoiceNo: () => void;
  onInvoiceSubmit: () => void;
  onClose: () => void;
}

const InvoiceModals: React.FC<InvoiceModalsProps> = ({
  invoiceFlow,
  invoiceForm,
  lang,
  onInvoiceFormChange,
  onInvoiceYes,
  onInvoiceNo,
  onInvoiceSubmit,
  onClose,
}) => {
  if (!invoiceFlow) return null;

  // 是否需要发票
  if (invoiceFlow.step === 'ask') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {lang === 'zh' ? '是否需要发票？' : 'Do you need an invoice?'}
          </h3>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onInvoiceYes}
              className="flex-1 py-3 px-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            >
              {lang === 'zh' ? '是' : 'Yes'}
            </button>
            <button
              type="button"
              onClick={onInvoiceNo}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
            >
              {lang === 'zh' ? '否' : 'No'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 填写发票信息
  if (invoiceFlow.step === 'form') {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full my-8 p-6" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            {lang === 'zh' ? '填写发票信息' : 'Invoice Information'}
          </h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'zh' ? '发票抬头' : 'Invoice title'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={invoiceForm.invoiceTitle}
                onChange={(e) => onInvoiceFormChange({ ...invoiceForm, invoiceTitle: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder={lang === 'zh' ? '单位或个人名称' : 'Company or name'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'zh' ? '纳税人识别号/税号' : 'Tax ID'}
              </label>
              <input
                type="text"
                value={invoiceForm.invoiceTaxNo}
                onChange={(e) => onInvoiceFormChange({ ...invoiceForm, invoiceTaxNo: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder={lang === 'zh' ? '选填' : 'Optional'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'zh' ? '地址' : 'Address'}
              </label>
              <input
                type="text"
                value={invoiceForm.invoiceAddress}
                onChange={(e) => onInvoiceFormChange({ ...invoiceForm, invoiceAddress: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder={lang === 'zh' ? '选填' : 'Optional'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'zh' ? '联系电话' : 'Phone'}
              </label>
              <input
                type="text"
                value={invoiceForm.invoicePhone}
                onChange={(e) => onInvoiceFormChange({ ...invoiceForm, invoicePhone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder={lang === 'zh' ? '选填' : 'Optional'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {lang === 'zh' ? '邮箱（接收电子发票）' : 'Email (e-invoice)'}
              </label>
              <input
                type="email"
                value={invoiceForm.invoiceEmail}
                onChange={(e) => onInvoiceFormChange({ ...invoiceForm, invoiceEmail: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder={lang === 'zh' ? '选填' : 'Optional'}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50"
            >
              {lang === 'zh' ? '取消' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={onInvoiceSubmit}
              className="flex-1 py-3 px-4 rounded-xl bg-green-600 text-white font-semibold hover:bg-green-700"
            >
              {lang === 'zh' ? '确认并支付' : 'Confirm & Pay'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default InvoiceModals;
