import React from 'react';
import { Language } from '../../../i18n';
import { ConfirmDialogState } from '../types';

interface ConfirmDialogProps {
  confirmDialog: ConfirmDialogState;
  lang: Language;
  onClose: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ confirmDialog, lang, onClose }) => {
  if (!confirmDialog.show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all animate-fadeIn">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-exclamation-triangle text-orange-500 text-2xl"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmDialog.title}</h3>
          <p className="text-gray-600">{confirmDialog.message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-300 text-gray-700 font-bold hover:bg-gray-50 transition"
          >
            {confirmDialog.cancelText || (lang === 'zh' ? '取消' : 'Cancel')}
          </button>
          <button
            onClick={() => {
              confirmDialog.onConfirm();
              onClose();
            }}
            className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold hover:from-orange-600 hover:to-red-600 transition shadow-lg"
          >
            {confirmDialog.confirmText || (lang === 'zh' ? '确认' : 'Confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
