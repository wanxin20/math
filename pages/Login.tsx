
import React, { useState } from 'react';
import { User } from '../types';
import { Language, translations } from '../i18n';

interface LoginProps {
  onLogin: (user: User) => void;
  lang: Language;
}

const Login: React.FC<LoginProps> = ({ onLogin, lang }) => {
  const [isLogin, setIsLogin] = useState(true);
  const lt = translations[lang].login;
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institution: '',
    title: '',
    phone: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name || (lang === 'zh' ? '教师' : 'Teacher'),
      email: formData.email || 'teacher@school.edu.cn',
      institution: formData.institution || (lang === 'zh' ? 'XXXX学校' : 'XXXX School'),
      title: formData.title || (lang === 'zh' ? '中级教师' : 'Intermediate Teacher'),
      phone: formData.phone || '13800000000'
    });
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
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm" 
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 transition text-lg mt-4"
          >
            {isLogin ? lt.btnSubmitLogin : lt.btnSubmitSignUp}
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
