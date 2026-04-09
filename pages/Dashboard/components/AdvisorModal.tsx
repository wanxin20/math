import React, { useState } from 'react';
import { Language } from '../../../i18n';
import { Advisor } from '../../../types';
import api from '../../../services/api';

interface AdvisorModalProps {
  lang: Language;
  registrationId: number;
  initialAdvisors: Advisor[];
  editable: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const emptyAdvisor = (): Advisor => ({
  name: '',
  institution: '',
  title: '',
  phone: '',
  email: '',
});

const AdvisorModal: React.FC<AdvisorModalProps> = ({
  lang,
  registrationId,
  initialAdvisors,
  editable,
  onClose,
  onSaved,
}) => {
  const [advisors, setAdvisors] = useState<Advisor[]>(
    initialAdvisors.length > 0 ? initialAdvisors.map(a => ({ ...a })) : [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = () => {
    if (advisors.length >= 2) return;
    setAdvisors([...advisors, emptyAdvisor()]);
  };

  const handleRemove = (index: number) => {
    setAdvisors(advisors.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof Advisor, value: string) => {
    const updated = [...advisors];
    (updated[index] as any)[field] = value;
    setAdvisors(updated);
  };

  const handleSave = async () => {
    setError('');

    for (let i = 0; i < advisors.length; i++) {
      if (!advisors[i].name.trim()) {
        setError(lang === 'zh' ? `第 ${i + 1} 位指导老师姓名不能为空` : `Advisor ${i + 1} name is required`);
        return;
      }
      if (!advisors[i].institution.trim()) {
        setError(lang === 'zh' ? `第 ${i + 1} 位指导老师学校/单位不能为空` : `Advisor ${i + 1} institution is required`);
        return;
      }
      if (!advisors[i].phone.trim()) {
        setError(lang === 'zh' ? `第 ${i + 1} 位指导老师手机号不能为空` : `Advisor ${i + 1} phone is required`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = advisors.map((a, i) => ({
        name: a.name.trim(),
        institution: a.institution.trim(),
        title: a.title?.trim() || undefined,
        phone: a.phone.trim(),
        email: a.email?.trim() || undefined,
        sortOrder: i,
      }));
      const res = await api.registration.updateAdvisors(registrationId, payload);
      if (res.success) {
        onSaved();
        onClose();
      } else {
        setError(res.message || (lang === 'zh' ? '保存失败' : 'Save failed'));
      }
    } catch (err: any) {
      setError(err.message || (lang === 'zh' ? '网络错误' : 'Network error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">
            {lang === 'zh' ? '指导老师管理' : 'Advisors'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <p className="text-sm text-gray-500">
            {lang === 'zh'
              ? '请填写指导老师信息（最多2位），手机号为必填项。'
              : 'Enter advisor info (max 2). Phone number is required.'}
          </p>

          {advisors.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <i className="fas fa-chalkboard-teacher text-4xl mb-3"></i>
              <p className="text-sm">{lang === 'zh' ? '暂无指导老师，点击下方按钮添加' : 'No advisors yet'}</p>
            </div>
          )}

          {advisors.map((advisor, index) => (
            <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">
                  {lang === 'zh' ? `指导老师 ${index + 1}` : `Advisor ${index + 1}`}
                </span>
                {editable && (
                  <button
                    onClick={() => handleRemove(index)}
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    <i className="fas fa-trash-alt mr-1"></i>
                    {lang === 'zh' ? '删除' : 'Remove'}
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {lang === 'zh' ? '姓名' : 'Name'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={advisor.name}
                    onChange={(e) => handleChange(index, 'name', e.target.value)}
                    disabled={!editable}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                    placeholder={lang === 'zh' ? '请输入姓名' : 'Name'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {lang === 'zh' ? '学校/单位' : 'Institution'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={advisor.institution}
                    onChange={(e) => handleChange(index, 'institution', e.target.value)}
                    disabled={!editable}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                    placeholder={lang === 'zh' ? '请输入学校/单位' : 'Institution'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {lang === 'zh' ? '职称' : 'Title'}
                  </label>
                  <input
                    type="text"
                    value={advisor.title || ''}
                    onChange={(e) => handleChange(index, 'title', e.target.value)}
                    disabled={!editable}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                    placeholder={lang === 'zh' ? '选填' : 'Optional'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {lang === 'zh' ? '手机号' : 'Phone'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={advisor.phone}
                    onChange={(e) => handleChange(index, 'phone', e.target.value)}
                    disabled={!editable}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                    placeholder={lang === 'zh' ? '请输入手机号' : 'Phone'}
                  />
                </div>
              </div>
            </div>
          ))}

          {editable && advisors.length < 2 && (
            <button
              onClick={handleAdd}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition text-sm font-medium"
            >
              <i className="fas fa-plus mr-2"></i>
              {lang === 'zh' ? '添加指导老师' : 'Add Advisor'}
              <span className="text-gray-400 ml-2">({advisors.length}/2)</span>
            </button>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t">
          {editable ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {saving
                  ? (lang === 'zh' ? '保存中...' : 'Saving...')
                  : (lang === 'zh' ? '保存' : 'Save')}
              </button>
              <button
                onClick={onClose}
                className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50"
              >
                {lang === 'zh' ? '取消' : 'Cancel'}
              </button>
            </>
          ) : (
            <button
              onClick={onClose}
              className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50"
            >
              {lang === 'zh' ? '关闭' : 'Close'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvisorModal;
