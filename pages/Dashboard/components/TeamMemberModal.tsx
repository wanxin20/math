import React, { useState, useEffect } from 'react';
import { Language } from '../../../i18n';
import { TeamMember } from '../../../types';
import api from '../../../services/api';

interface TeamMemberModalProps {
  lang: Language;
  registrationId: number;
  /** 当前已有的成员列表（从父组件传入，避免重复请求） */
  initialMembers: TeamMember[];
  /** 是否允许编辑（状态锁定时为 false） */
  editable: boolean;
  onClose: () => void;
  onSaved: () => void;
}

const emptyMember = (): TeamMember => ({
  name: '',
  institution: '',
  title: '',
  phone: '',
  email: '',
});

const TeamMemberModal: React.FC<TeamMemberModalProps> = ({
  lang,
  registrationId,
  initialMembers,
  editable,
  onClose,
  onSaved,
}) => {
  const [members, setMembers] = useState<TeamMember[]>(
    initialMembers.length > 0 ? initialMembers.map(m => ({ ...m })) : [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = () => {
    setMembers([...members, emptyMember()]);
  };

  const handleRemove = (index: number) => {
    setMembers(members.filter((_, i) => i !== index));
  };

  const handleChange = (index: number, field: keyof TeamMember, value: string) => {
    const updated = [...members];
    (updated[index] as any)[field] = value;
    setMembers(updated);
  };

  const handleSave = async () => {
    setError('');

    // 校验必填字段
    for (let i = 0; i < members.length; i++) {
      if (!members[i].name.trim()) {
        setError(lang === 'zh' ? `第 ${i + 1} 位成员姓名不能为空` : `Member ${i + 1} name is required`);
        return;
      }
      if (!members[i].institution.trim()) {
        setError(lang === 'zh' ? `第 ${i + 1} 位成员学校/单位不能为空` : `Member ${i + 1} institution is required`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = members.map((m, i) => ({
        name: m.name.trim(),
        institution: m.institution.trim(),
        title: m.title?.trim() || undefined,
        phone: m.phone?.trim() || undefined,
        email: m.email?.trim() || undefined,
        sortOrder: i,
      }));
      const res = await api.registration.updateTeamMembers(registrationId, payload);
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
        {/* 头部 */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900">
            {lang === 'zh' ? '竞赛组成员管理' : 'Team Members'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <p className="text-sm text-gray-500">
            {lang === 'zh'
              ? '请填写竞赛组其他成员信息（组长为您本人，无需填写）。'
              : 'Enter other team members (you are the team leader by default).'}
          </p>

          {members.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <i className="fas fa-users text-4xl mb-3"></i>
              <p className="text-sm">{lang === 'zh' ? '暂无成员，点击下方按钮添加' : 'No members yet'}</p>
            </div>
          )}

          {members.map((member, index) => (
            <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700">
                  {lang === 'zh' ? `成员 ${index + 1}` : `Member ${index + 1}`}
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
                    value={member.name}
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
                    value={member.institution}
                    onChange={(e) => handleChange(index, 'institution', e.target.value)}
                    disabled={!editable}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                    placeholder={lang === 'zh' ? '请输入学校/单位' : 'Institution'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {lang === 'zh' ? '职称/年级' : 'Title/Grade'}
                  </label>
                  <input
                    type="text"
                    value={member.title || ''}
                    onChange={(e) => handleChange(index, 'title', e.target.value)}
                    disabled={!editable}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                    placeholder={lang === 'zh' ? '选填' : 'Optional'}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {lang === 'zh' ? '手机号' : 'Phone'}
                  </label>
                  <input
                    type="text"
                    value={member.phone || ''}
                    onChange={(e) => handleChange(index, 'phone', e.target.value)}
                    disabled={!editable}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm disabled:bg-gray-100"
                    placeholder={lang === 'zh' ? '选填' : 'Optional'}
                  />
                </div>
              </div>
            </div>
          ))}

          {editable && (
            <button
              onClick={handleAdd}
              className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition text-sm font-medium"
            >
              <i className="fas fa-plus mr-2"></i>
              {lang === 'zh' ? '添加成员' : 'Add Member'}
            </button>
          )}
        </div>

        {/* 底部按钮 */}
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

export default TeamMemberModal;
