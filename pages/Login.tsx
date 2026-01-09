
import React, { useState } from 'react';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    institution: '',
    password: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would hit an API
    onLogin({
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name || '参赛选手',
      email: formData.email || 'user@example.com',
      institution: formData.institution || '清华大学'
    });
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <div className="bg-white p-10 rounded-3xl shadow-2xl border border-gray-100">
        <div className="text-center mb-10">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center text-white text-3xl mx-auto mb-6">
            <i className="fas fa-lock"></i>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">{isLogin ? '欢迎回来' : '注册账户'}</h2>
          <p className="text-gray-500 mt-2">{isLogin ? '登录以管理您的竞赛项目' : '加入数学学术大家庭'}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">姓名</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  placeholder="请输入您的真实姓名"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">所属院校/机构</label>
                <input 
                  type="text" 
                  required
                  value={formData.institution}
                  onChange={(e) => setFormData({...formData, institution: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                  placeholder="如：清华大学"
                />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">电子邮箱</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition" 
              placeholder="name@university.edu.cn"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">密码</label>
            <input 
              type="password" 
              required
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition" 
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 transition text-lg"
          >
            {isLogin ? '立即登录' : '立即注册'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-gray-500">
          {isLogin ? '还没有账户？' : '已有账户？'}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-blue-600 font-bold ml-1 hover:underline"
          >
            {isLogin ? '现在注册' : '返回登录'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
