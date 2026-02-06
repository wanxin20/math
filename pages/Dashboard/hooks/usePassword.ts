import { useState } from 'react';
import api from '../../../services/api';
import { User } from '../../../types';
import { Language } from '../../../i18n';
import { NotificationState } from '../types';

interface UsePasswordParams {
  user: User;
  setNotification: (n: NotificationState) => void;
  lang: Language;
}

export function usePassword({ user, setNotification, lang }: UsePasswordParams) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    email: user.email || '',
    code: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [sendingCode, setSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [changingPassword, setChangingPassword] = useState(false);

  /** 打开修改密码弹窗 */
  const openPasswordModal = () => {
    setPasswordForm({
      email: user.email || '',
      code: '',
      newPassword: '',
      confirmPassword: '',
    });
    setShowPasswordModal(true);
  };

  /** 发送修改密码的验证码 */
  const handleSendPasswordCode = async () => {
    if (!passwordForm.email) {
      setNotification({
        show: true,
        title: lang === 'zh' ? '错误' : 'Error',
        message: lang === 'zh' ? '请输入邮箱地址' : 'Please enter email',
        type: 'error',
      });
      return;
    }

    setSendingCode(true);
    try {
      const response = await api.auth.sendVerificationCode(passwordForm.email);
      if (response.success) {
        setCodeSent(true);
        setCountdown(60);
        const timer = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setCodeSent(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setNotification({
          show: true,
          title: lang === 'zh' ? '发送失败' : 'Send Failed',
          message: response.message || (lang === 'zh' ? '验证码发送失败' : 'Failed to send code'),
          type: 'error',
        });
      }
    } catch (error: any) {
      setNotification({
        show: true,
        title: lang === 'zh' ? '错误' : 'Error',
        message: error.message || (lang === 'zh' ? '发送失败，请重试' : 'Failed to send, please try again'),
        type: 'error',
      });
    } finally {
      setSendingCode(false);
    }
  };

  /** 修改密码 */
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setNotification({
        show: true,
        title: lang === 'zh' ? '错误' : 'Error',
        message: lang === 'zh' ? '两次输入的密码不一致' : 'Passwords do not match',
        type: 'error',
      });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setNotification({
        show: true,
        title: lang === 'zh' ? '错误' : 'Error',
        message: lang === 'zh' ? '密码至少6位' : 'Password must be at least 6 characters',
        type: 'error',
      });
      return;
    }

    setChangingPassword(true);
    try {
      const response = await api.user.changePassword(
        passwordForm.email,
        passwordForm.code,
        passwordForm.newPassword,
      );
      if (response.success) {
        setNotification({
          show: true,
          title: lang === 'zh' ? '成功' : 'Success',
          message: lang === 'zh' ? '密码已修改' : 'Password changed successfully',
          type: 'success',
        });
        setShowPasswordModal(false);
        setPasswordForm({
          email: user.email || '',
          code: '',
          newPassword: '',
          confirmPassword: '',
        });
      } else {
        setNotification({
          show: true,
          title: lang === 'zh' ? '修改失败' : 'Change Failed',
          message: response.message || (lang === 'zh' ? '修改失败，请重试' : 'Failed to change, please try again'),
          type: 'error',
        });
      }
    } catch (error: any) {
      setNotification({
        show: true,
        title: lang === 'zh' ? '错误' : 'Error',
        message: error.message || (lang === 'zh' ? '修改失败，请重试' : 'Failed to change, please try again'),
        type: 'error',
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return {
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
  };
}
