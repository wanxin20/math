import { useState } from 'react';
import api from '../../../services/api';
import { User } from '../../../types';
import { Language } from '../../../i18n';
import { NotificationState } from '../types';

interface UseProfileParams {
  user: User;
  setNotification: (n: NotificationState) => void;
  onUpdateUser?: (user: User) => void;
  lang: Language;
}

export function useProfile({ user, setNotification, onUpdateUser, lang }: UseProfileParams) {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: user.name || '',
    institution: user.institution || '',
    title: user.title || '',
    phone: user.phone || '',
  });
  const [updatingProfile, setUpdatingProfile] = useState(false);

  /** 打开编辑个人信息模态框，获取最新用户信息 */
  const handleOpenProfileModal = async () => {
    try {
      const response = await api.user.getProfile();
      if (response.success && response.data) {
        const userData = response.data;
        setProfileForm({
          name: userData.name || '',
          institution: userData.institution || '',
          title: userData.title || '',
          phone: userData.phone || '',
        });
      } else {
        setProfileForm({
          name: user.name || '',
          institution: user.institution || '',
          title: user.title || '',
          phone: user.phone || '',
        });
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      setProfileForm({
        name: user.name || '',
        institution: user.institution || '',
        title: user.title || '',
        phone: user.phone || '',
      });
    }
    setShowProfileModal(true);
  };

  /** 更新个人信息 */
  const handleUpdateProfile = async () => {
    setUpdatingProfile(true);
    try {
      const response = await api.user.updateProfile(profileForm);
      if (response.success) {
        setNotification({
          show: true,
          title: lang === 'zh' ? '成功' : 'Success',
          message: lang === 'zh' ? '个人信息已更新' : 'Profile updated successfully',
          type: 'success',
        });
        setShowProfileModal(false);

        if (onUpdateUser && response.data) {
          onUpdateUser(response.data);
        }
      } else {
        setNotification({
          show: true,
          title: lang === 'zh' ? '更新失败' : 'Update Failed',
          message: response.message || (lang === 'zh' ? '更新失败，请重试' : 'Failed to update, please try again'),
          type: 'error',
        });
      }
    } catch (error: any) {
      setNotification({
        show: true,
        title: lang === 'zh' ? '错误' : 'Error',
        message: error.message || (lang === 'zh' ? '更新失败，请重试' : 'Failed to update, please try again'),
        type: 'error',
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  return {
    showProfileModal,
    setShowProfileModal,
    profileForm,
    setProfileForm,
    updatingProfile,
    handleOpenProfileModal,
    handleUpdateProfile,
  };
}
