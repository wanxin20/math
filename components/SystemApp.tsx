import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { setSystem, SystemType } from '../store/system';
import { SystemProvider } from '../contexts/SystemContext';
import Layout from './Layout';
import Home from '../pages/Home';
import Login from '../pages/Login';
import CompetitionList from '../pages/CompetitionList';
import Dashboard from '../pages/Dashboard';
import Resources from '../pages/Resources';
import AdminUsers from '../pages/AdminUsers';
import AdminResources from '../pages/AdminResources';
import AdminCompetitions from '../pages/AdminCompetitions';
import AdminCompetitionDetail from '../pages/AdminCompetitionDetail';
import AdminNews from '../pages/AdminNews';
import { User, UserRegistration, RegistrationStatus } from '../types';
import { Language } from '../i18n';
import api from '../services/api';

const STORAGE_KEYS = {
  user: (s: SystemType) => `${s}_user`,
  registrations: (s: SystemType) => `${s}_registrations`,
} as const;

interface SystemAppProps {
  system: SystemType;
}

/**
 * 单个系统内的应用：状态按 system 隔离（localStorage 前缀），
 * 子路由通过修改 location.pathname 匹配 /paper/xxx 或 /reform/xxx 的剩余部分。
 */
const SystemApp: React.FC<SystemAppProps> = ({ system }) => {
  const [user, setUser] = useState<User | null>(null);
  const [registrations, setRegistrations] = useState<UserRegistration[]>([]);
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem('math_lang');
    return (saved as Language) || 'zh';
  });

  const basePath = system === 'reform' ? '/reform' : '/paper';
  const location = useLocation();

  // 让后端与 api.ts 使用当前系统
  useEffect(() => {
    setSystem(system);
  }, [system]);

  // 从当前系统的 localStorage 恢复用户与报名
  useEffect(() => {
    const userKey = STORAGE_KEYS.user(system);
    const regsKey = STORAGE_KEYS.registrations(system);
    const savedUser = localStorage.getItem(userKey);
    const savedRegs = localStorage.getItem(regsKey);
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (_) {
        localStorage.removeItem(userKey);
      }
    }
    if (savedRegs) {
      try {
        setRegistrations(JSON.parse(savedRegs));
      } catch (_) {
        localStorage.removeItem(regsKey);
      }
    }
  }, [system]);

  useEffect(() => {
    if (user) loadUserRegistrations();
  }, [user]);

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
    const key = STORAGE_KEYS.user(system);
    if (user) localStorage.setItem(key, JSON.stringify(user));
    else localStorage.removeItem(key);
  }, [system, user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.registrations(system), JSON.stringify(registrations));
  }, [system, registrations]);

  useEffect(() => {
    localStorage.setItem('math_lang', lang);
  }, [lang]);

  const handleRegister = async (compId: string): Promise<void> => {
    if (!user) {
      throw new Error(lang === 'zh' ? '请先登录再进行报名。' : 'Please login first.');
    }
    if (registrations.some(r => r.competitionId === compId)) {
      throw new Error(lang === 'zh' ? '您已经报名过该竞赛' : 'You have already registered for this competition');
    }
    try {
      const response = await api.registration.create(compId);
      if (response.success) await loadUserRegistrations();
      else throw new Error(response.message || (lang === 'zh' ? '报名失败，请稍后重试' : 'Registration failed, please try again'));
    } catch (error: any) {
      if (error.response?.status === 409 || error.message?.includes('已经报名')) await loadUserRegistrations();
      throw new Error(error.response?.data?.message || error.message || (lang === 'zh' ? '报名失败，请稍后重试' : 'Registration failed, please try again'));
    }
  };

  const getRegistrationStatus = (compId: string): RegistrationStatus | null => {
    const reg = registrations.find(r => r.competitionId === compId);
    return reg ? reg.status : null;
  };

  const handlePay = async () => {
    await loadUserRegistrations();
  };

  const handleSubmitPaper = async () => {
    await loadUserRegistrations();
  };

  const handleLogout = () => {
    setUser(null);
    setRegistrations([]);
    localStorage.removeItem(`${system}_token`);
    localStorage.removeItem(STORAGE_KEYS.user(system));
    localStorage.removeItem(STORAGE_KEYS.registrations(system));
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <SystemProvider system={system}>
      <Layout user={user} onLogout={handleLogout} lang={lang} setLang={setLang}>
        <Routes>
          <Route path="/" element={<Home lang={lang} />} />
          <Route path="/login" element={user ? <Navigate to={`${basePath}/`} replace /> : <Login onLogin={setUser} lang={lang} />} />
          <Route path="/competitions" element={
            <CompetitionList
              user={user}
              onRegister={handleRegister}
              hasRegistered={(id) => registrations.some(r => r.competitionId === id)}
              getRegistrationStatus={getRegistrationStatus}
              lang={lang}
            />
          } />
          <Route path="/resources" element={<Resources user={user} lang={lang} />} />
          <Route path="/dashboard" element={
            user ? (
              <Dashboard 
                user={user} 
                registrations={registrations} 
                onPay={handlePay} 
                onSubmit={handleSubmitPaper} 
                onUpdateUser={handleUpdateUser}
                lang={lang} 
              />
            ) : (
              <Navigate to={`${basePath}/login`} replace />
            )
          } />
          <Route path="/admin/users" element={user?.role === 'admin' ? <AdminUsers /> : <Navigate to="/" replace />} />
          <Route path="/admin/resources" element={user?.role === 'admin' ? <AdminResources /> : <Navigate to="/" replace />} />
          <Route path="/admin/news" element={user?.role === 'admin' ? <AdminNews /> : <Navigate to="/" replace />} />
          <Route path="/admin/competitions" element={user?.role === 'admin' ? <AdminCompetitions /> : <Navigate to="/" replace />} />
          <Route path="/admin/competitions/:id" element={user?.role === 'admin' ? <AdminCompetitionDetail /> : <Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </SystemProvider>
  );
};

export default SystemApp;
