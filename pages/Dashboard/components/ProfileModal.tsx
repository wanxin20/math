import React from 'react';
import { Language } from '../../../i18n';

interface ProfileModalProps {
  lang: Language;
  profileForm: {
    name: string;
    institution: string;
    title: string;
    phone: string;
  };
  updatingProfile: boolean;
  onFormChange: (form: { name: string; institution: string; title: string; phone: string }) => void;
  onSave: () => void;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  lang,
  profileForm,
  updatingProfile,
  onFormChange,
  onSave,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">{lang === 'zh' ? '编辑个人信息' : 'Edit Profile'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{lang === 'zh' ? '姓名' : 'Name'}</label>
            <input
              type="text"
              value={profileForm.name}
              onChange={(e) => onFormChange({ ...profileForm, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{lang === 'zh' ? '所属单位' : 'Institution'}</label>
            <input
              type="text"
              value={profileForm.institution}
              onChange={(e) => onFormChange({ ...profileForm, institution: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{lang === 'zh' ? '职称/职务' : 'Title'}</label>
            <input
              type="text"
              value={profileForm.title}
              onChange={(e) => onFormChange({ ...profileForm, title: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{lang === 'zh' ? '手机号' : 'Phone'}</label>
            <input
              type="text"
              value={profileForm.phone}
              onChange={(e) => onFormChange({ ...profileForm, phone: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-4 py-2"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              onClick={onSave}
              disabled={updatingProfile}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
            >
              {updatingProfile ? (lang === 'zh' ? '更新中...' : 'Updating...') : (lang === 'zh' ? '保存' : 'Save')}
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

export default ProfileModal;
