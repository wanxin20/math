
import React, { useState } from 'react';
import { User } from '../types';
import { Language, translations } from '../i18n';
import api from '../services/api';
import { getSystem } from '../store/system';

interface LoginProps {
  onLogin: (user: User) => void;
  lang: Language;
}

const Login: React.FC<LoginProps> = ({ onLogin, lang }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [sendingCode, setSendingCode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const lt = translations[lang].login;

  // 验证密码强度
  const validatePasswordStrength = (password: string): boolean => {
    if (!password || password.length < 6) {
      return false;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasSpecialChar = /[^a-zA-Z0-9]/.test(password);

    const conditionsMet = [hasUpperCase, hasLowerCase, hasSpecialChar].filter(Boolean).length;
    return conditionsMet >= 2;
  };
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    institution: '',
    title: '',
    phone: '',
    password: ''
  });
  // 找回密码表单数据
  const [resetData, setResetData] = useState({
    email: '',
    code: '',
    newPassword: '',
    confirmNewPassword: ''
  });

  // 发送验证码(登录/注册)
  const handleSendCode = async () => {
    const email = isResettingPassword ? resetData.email : formData.email;
    if (!email) {
      setError(lang === 'zh' ? '请先输入邮箱地址' : 'Please enter email first');
      return;
    }

    setSendingCode(true);
    setError('');

    try {
      const response = await api.auth.sendVerificationCode(email);
      if (response.success) {
        setCodeSent(true);
        setCountdown(60);
        // 开始倒计时
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
        setError(response.message || (lang === 'zh' ? '发送失败' : 'Failed to send'));
      }
    } catch (err: any) {
      setError(err.message || (lang === 'zh' ? '发送失败，请稍后重试' : 'Failed to send, please try again'));
    } finally {
      setSendingCode(false);
    }
  };

  // 处理找回密码
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 验证两次密码是否一致
      if (resetData.newPassword !== resetData.confirmNewPassword) {
        setError(lt.passwordMismatch);
        setLoading(false);
        return;
      }

      // 验证密码强度
      if (!validatePasswordStrength(resetData.newPassword)) {
        setError(lt.passwordWeak);
        setLoading(false);
        return;
      }

      // 调用重置密码接口
      const response = await api.auth.resetPassword(
        resetData.email,
        resetData.code,
        resetData.newPassword
      );

      if (response.success) {
        alert(lt.resetSuccess);
        // 清空表单并返回登录页面
        setResetData({
          email: '',
          code: '',
          newPassword: '',
          confirmNewPassword: ''
        });
        setVerificationCode('');
        setCodeSent(false);
        setCountdown(0);
        setIsResettingPassword(false);
        setIsLogin(true);
      } else {
        setError(response.message || (lang === 'zh' ? '重置失败' : 'Reset failed'));
      }
    } catch (err: any) {
      setError(err.message || (lang === 'zh' ? '网络错误，请稍后重试' : 'Network error, please try again'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // 登录 - 不需要验证码
        const response = await api.auth.login(formData.email, formData.password);
        if (response.success && response.data) {
          // 保存 token（按当前系统 key 存储，与 api 请求一致）
          localStorage.setItem(`${getSystem()}_token`, response.data.accessToken);
          // 直接使用登录返回的用户信息
          if (response.data.user) {
            onLogin(response.data.user);
          }
        } else {
          setError(response.message || (lang === 'zh' ? '登录失败' : 'Login failed'));
        }
      } else {
        // 注册 - 需要验证码
        // 验证密码强度
        if (!validatePasswordStrength(formData.password)) {
          setError(lt.passwordWeak);
          setLoading(false);
          return;
        }

        // 验证密码是否一致
        if (formData.password !== confirmPassword) {
          setError(lt.passwordMismatch);
          setLoading(false);
          return;
        }

        // 验证邮箱验证码
        if (!verificationCode) {
          setError(lang === 'zh' ? '请输入验证码' : 'Please enter verification code');
          setLoading(false);
          return;
        }

        const verifyResponse = await api.auth.verifyCode(formData.email, verificationCode);
        if (!verifyResponse.success) {
          setError(verifyResponse.message || (lang === 'zh' ? '验证码错误' : 'Invalid verification code'));
          setLoading(false);
          return;
        }

        // 注册
        const response = await api.auth.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          institution: formData.institution,
          title: formData.title,
          phone: formData.phone,
        });
        if (response.success) {
          alert(lang === 'zh' ? '注册成功！请登录' : 'Registration successful! Please login');
          setIsLogin(true);
          setVerificationCode('');
          setCodeSent(false);
          setCountdown(0);
          setConfirmPassword('');
          setFormData({
            username: '',
            name: '',
            email: '',
            institution: '',
            title: '',
            phone: '',
            password: ''
          });
        } else {
          setError(response.message || (lang === 'zh' ? '注册失败' : 'Registration failed'));
        }
      }
    } catch (err: any) {
      setError(err.message || (lang === 'zh' ? '网络错误，请稍后重试' : 'Network error, please try again'));
    } finally {
      setLoading(false);
    }
  };

  // 渲染找回密码界面
  if (isResettingPassword) {
    return (
      <div className="max-w-md mx-auto py-12">
        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-gray-100 transition-all duration-300">
          <div className="text-center mb-10">
            <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-6 shadow-lg shadow-indigo-100">
              <i className="fas fa-key"></i>
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{lt.resetPasswordTitle}</h2>
            <p className="text-gray-500 mt-2 text-sm">{lt.resetPasswordSub}</p>
          </div>

          <form onSubmit={handleResetPassword} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">{lt.email}</label>
              <input 
                type="email" 
                required
                value={resetData.email}
                onChange={(e) => setResetData({...resetData, email: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" 
                placeholder={lt.emailPlaceholder}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">{lt.newPassword}</label>
              <div className="relative">
                <input 
                  type={showNewPassword ? "text" : "password"}
                  required
                  value={resetData.newPassword}
                  onChange={(e) => setResetData({...resetData, newPassword: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" 
                  placeholder={lt.newPasswordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  <i className={`fas ${showNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-1">{lt.passwordRequirement}</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">{lt.confirmPassword}</label>
              <div className="relative">
                <input 
                  type={showConfirmNewPassword ? "text" : "password"}
                  required
                  value={resetData.confirmNewPassword}
                  onChange={(e) => setResetData({...resetData, confirmNewPassword: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" 
                  placeholder={lt.confirmPasswordPlaceholder}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  <i className={`fas ${showConfirmNewPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">{lt.verificationCode}</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  required
                  value={resetData.code}
                  onChange={(e) => setResetData({...resetData, code: e.target.value})}
                  maxLength={6}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" 
                  placeholder={lt.verificationCodePlaceholder}
                />
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={sendingCode || countdown > 0}
                  className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-medium text-sm hover:bg-indigo-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition whitespace-nowrap"
                >
                  {sendingCode ? (lang === 'zh' ? '发送中...' : 'Sending...') : countdown > 0 ? `${countdown}s` : codeSent ? lt.resendCode : lt.sendCode}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition text-lg mt-4"
            >
              {loading ? (lang === 'zh' ? '处理中...' : 'Processing...') : lt.btnSubmitReset}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-gray-500">
            <button 
              onClick={() => {
                setIsResettingPassword(false);
                setResetData({ email: '', code: '', newPassword: '', confirmNewPassword: '' });
                setCodeSent(false);
                setCountdown(0);
                setError('');
              }}
              className="text-indigo-600 font-bold hover:underline focus:outline-none"
            >
              {lt.backToLogin}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 渲染登录/注册界面
  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white p-8 md:p-10 rounded-3xl shadow-2xl border border-gray-100 transition-all duration-300">
        <div className="text-center mb-10">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-6 shadow-lg shadow-indigo-100">
            <i className={`fas ${isLogin ? 'fa-lock' : 'fa-user-plus'}`}></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{isLogin ? lt.welcomeBack : lt.signUp}</h2>
          <p className="text-gray-500 mt-2 text-sm">{isLogin ? lt.loginSub : lt.signUpSub}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}
          
          {!isLogin && (
            <>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">{lt.name}</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" 
                    placeholder={lt.namePlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">{lt.institution}</label>
                  <input 
                    type="text" 
                    required
                    value={formData.institution}
                    onChange={(e) => setFormData({...formData, institution: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" 
                    placeholder={lt.instPlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">{lt.title}</label>
                  <input 
                    type="text" 
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" 
                    placeholder={lt.titlePlaceholder}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">{lt.phone}</label>
                  <input 
                    type="tel" 
                    required
                    pattern="[0-9]{11}"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" 
                    placeholder={lt.phonePlaceholder}
                  />
                </div>
              </div>
            </>
          )}
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">{lt.email}</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" 
              placeholder={lt.emailPlaceholder}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">{lt.password}</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" 
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {!isLogin && <p className="text-xs text-gray-500 mt-1 ml-1">{lt.passwordRequirement}</p>}
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">{lt.confirmPassword}</label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pr-12 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" 
                    placeholder={lt.confirmPasswordPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                  >
                    <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1 ml-1">{lt.verificationCode}</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    required
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    maxLength={6}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" 
                    placeholder={lt.verificationCodePlaceholder}
                  />
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={sendingCode || countdown > 0}
                    className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl font-medium text-sm hover:bg-indigo-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition whitespace-nowrap"
                  >
                    {sendingCode ? (lang === 'zh' ? '发送中...' : 'Sending...') : countdown > 0 ? `${countdown}s` : codeSent ? lt.resendCode : lt.sendCode}
                  </button>
                </div>
              </div>
            </>
          )}
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition text-lg mt-4"
          >
            {loading ? (lang === 'zh' ? '处理中...' : 'Processing...') : (isLogin ? lt.btnSubmitLogin : lt.btnSubmitSignUp)}
          </button>
        </form>

        {isLogin && (
          <div className="mt-4 text-center">
            <button 
              onClick={() => {
                setIsResettingPassword(true);
                setError('');
              }}
              className="text-indigo-600 text-sm hover:underline focus:outline-none"
            >
              {lt.forgotPassword}
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          {isLogin ? lt.noAccount : lt.hasAccount}
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-indigo-600 font-bold ml-1 hover:underline focus:outline-none"
          >
            {isLogin ? lt.switchSignUp : lt.switchLogin}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
