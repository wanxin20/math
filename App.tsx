
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import CompetitionList from './pages/CompetitionList';
import Dashboard from './pages/Dashboard';
import Resources from './pages/Resources';
import AdminUsers from './pages/AdminUsers';
import AdminResources from './pages/AdminResources';
import AdminCompetitions from './pages/AdminCompetitions';
import AdminCompetitionDetail from './pages/AdminCompetitionDetail';
import AdminNews from './pages/AdminNews';
import { User, UserRegistration, RegistrationStatus } from './types';
import { Language, translations } from './i18n';
import api from './services/api';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('math_lang');
    return (saved as Language) || 'zh';
  });

  const t = translations[lang];

  useEffect(() => {
    const savedUser = localStorage.getItem('math_user');
    const savedRegs = localStorage.getItem('math_registrations');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      // 如果用户已登录，从后端加载最新的报名数据
      loadUserRegistrations();
    }
    if (savedRegs) setRegistrations(JSON.parse(savedRegs));
  }, []);

  // 加载用户报名列表
  const loadUserRegistrations = async () => {
    try {
      const regsResponse = await api.registration.getMyRegistrations();
      if (regsResponse.success && regsResponse.data) {
        const mappedRegs: UserRegistration[] = regsResponse.data.map((reg: any) => ({
          competitionId: reg.competitionId,
          status: reg.status,
          paymentTime: reg.payment?.paymentTime,
          submissionFile: reg.paperSubmission?.title,
          submissionTime: reg.paperSubmission?.submissionTime,
        }));
        setRegistrations(mappedRegs);
      }
    } catch (error) {
      console.error('Failed to load registrations:', error);
    }
  };

  useEffect(() => {
    if (user) localStorage.setItem('math_user', JSON.stringify(user));
    else localStorage.removeItem('math_user');
  }, [user]);

  useEffect(() => {
    localStorage.setItem('math_registrations', JSON.stringify(registrations));
  }, [registrations]);

  useEffect(() => {
    localStorage.setItem('math_lang', lang);
  }, [lang]);

  const handleRegister = async (compId: string) => {
    if (!user) {
      alert(lang === 'zh' ? "请先登录再进行报名。" : "Please login first.");
      return;
    }
    const alreadyRegistered = registrations.some(r => r.competitionId === compId);
    if (alreadyRegistered) {
      alert(lang === 'zh' ? "您已经报名过该竞赛" : "You have already registered for this competition");
      return;
    }

    try {
      // 调用真实的报名API
      const response = await api.registration.create(compId);
      
      if (response.success) {
        // 报名成功后，重新加载用户的报名列表
        await loadUserRegistrations();
        alert(lang === 'zh' ? "报名成功！请前往个人中心完成缴费。" : "Registration successful! Please proceed to payment.");
      } else {
        alert(response.message || (lang === 'zh' ? "报名失败，请稍后重试" : "Registration failed, please try again"));
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      // 如果是 409 冲突错误（已报名），也刷新报名列表以同步状态
      if (error.response?.status === 409 || error.message?.includes('已经报名')) {
        await loadUserRegistrations();
      }
      alert(error.response?.data?.message || error.message || (lang === 'zh' ? "报名失败，请稍后重试" : "Registration failed, please try again"));
    }
  };

  const handlePay = async (compId: string) => {
    // 从后端重新加载报名列表，确保状态同步
    await loadUserRegistrations();
  };

  const handleSubmitPaper = async (compId: string, fileName: string) => {
    // 从后端重新加载报名列表，确保状态同步
    await loadUserRegistrations();
  };

  const handleLogout = () => {
    setUser(null);
    setRegistrations([]);
    localStorage.clear();
  };

  return (
    <HashRouter>
      <Layout user={user} onLogout={handleLogout} lang={lang} setLang={setLang}>
        <Routes>
          <Route path="/" element={<Home lang={lang} />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={setUser} lang={lang} />} />
          <Route path="/competitions" element={
            <CompetitionList 
              user={user} 
              onRegister={handleRegister} 
              hasRegistered={(id) => registrations.some(r => r.competitionId === id)} 
              lang={lang}
            />
          } />
          <Route path="/resources" element={<Resources lang={lang} />} />
          <Route path="/dashboard" element={
            user ? (
              <Dashboard 
                user={user} 
                registrations={registrations} 
                onPay={handlePay} 
                onSubmit={handleSubmitPaper}
                lang={lang}
              />
            ) : <Navigate to="/login" />
          } />
          {/* 管理员路由 */}
          <Route path="/admin/users" element={
            user && user.role === 'admin' ? <AdminUsers /> : <Navigate to="/" />
          } />
          <Route path="/admin/resources" element={
            user && user.role === 'admin' ? <AdminResources /> : <Navigate to="/" />
          } />
          <Route path="/admin/news" element={
            user && user.role === 'admin' ? <AdminNews /> : <Navigate to="/" />
          } />
          <Route path="/admin/competitions" element={
            user && user.role === 'admin' ? <AdminCompetitions /> : <Navigate to="/" />
          } />
          <Route path="/admin/competitions/:id" element={
            user && user.role === 'admin' ? <AdminCompetitionDetail /> : <Navigate to="/" />
          } />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
