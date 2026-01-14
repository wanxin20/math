
import React, { useState } from 'react';
import { User } from '../types';
import { Language, translations } from '../i18n';
import api from '../services/api';

interface LoginProps {
  onLogin: (user: User) => void;
  lang: Language;
}

const Login: React.FC<LoginProps> = ({ onLogin, lang }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const lt = translations[lang].login;
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    email: '',
    institution: '',
    title: '',
    phone: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // 登录
        const response = await api.auth.login(formData.email, formData.password);
        if (response.success && response.data) {
          // 保存 token（后端返回的是 accessToken 驼峰命名）
          localStorage.setItem('math_token', response.data.accessToken);
          // 直接使用登录返回的用户信息
          if (response.data.user) {
            onLogin(response.data.user);
          }
        } else {
          setError(response.message || (lang === 'zh' ? '登录失败' : 'Login failed'));
        }
      } else {
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
            <input 
              type="password" 
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" 
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition text-lg mt-4"
          >
            {loading ? (lang === 'zh' ? '处理中...' : 'Processing...') : (isLogin ? lt.btnSubmitLogin : lt.btnSubmitSignUp)}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          {isLogin ? lt.noAccount : lt.hasAccount}
          <button 
            onClick={() => setIsLogin(!isLogin)}
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
