import React from 'react';
import { Language } from '../../../i18n';

interface PasswordModalProps {
  lang: Language;
  passwordForm: {
    email: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
  };
  sendingCode: boolean;
  codeSent: boolean;
  countdown: number;
  changingPassword: boolean;
  onFormChange: (form: { email: string; code: string; newPassword: string; confirmPassword: string }) => void;
  onSendCode: () => void;
  onChangePassword: () => void;
  onClose: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({
  lang,
  passwordForm,
  sendingCode,
  codeSent,
  countdown,
  changingPassword,
  onFormChange,
  onSendCode,
  onChangePassword,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">{lang === 'zh' ? '修改密码' : 'Change Password'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{lang === 'zh' ? '邮箱' : 'Email'}</label>
            <input
              type="email"
              value={passwordForm.email}
              disabled
              className="w-full border border-gray-300 rounded-lg px-4 py-2 bg-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{lang === 'zh' ? '邮箱验证码' : 'Verification Code'}</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={passwordForm.code}
                onChange={(e) => onFormChange({ ...passwordForm, code: e.target.value })}
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
                placeholder={lang === 'zh' ? '请输入验证码' : 'Enter code'}
              />
              <button
                onClick={onSendCode}
                disabled={sendingCode || codeSent}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap"
              >
                {sendingCode ? (lang === 'zh' ? '发送中' : 'Sending') : codeSent ? `${countdown}s` : (lang === 'zh' ? '发送验证码' : 'Send Code')}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{lang === 'zh' ? '新密码' : 'New Password'}</label>
            <input
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => onFormChange({ ...passwordForm, newPassword: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder={lang === 'zh' ? '至少6位' : 'At least 6 characters'}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{lang === 'zh' ? '确认新密码' : 'Confirm Password'}</label>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => onFormChange({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
              placeholder={lang === 'zh' ? '再次输入新密码' : 'Enter password again'}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={onChangePassword}
              disabled={changingPassword}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {changingPassword ? (lang === 'zh' ? '修改中...' : 'Changing...') : (lang === 'zh' ? '确认修改' : 'Confirm')}
            </button>
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50"
            >
              {lang === 'zh' ? '取消' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
