
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import CompetitionList from './pages/CompetitionList';
import Dashboard from './pages/Dashboard';
import Resources from './pages/Resources';
import AIChat from './components/AIChat';
import { User, UserRegistration, RegistrationStatus } from './types';
import { Language, translations } from './i18n';

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
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedRegs) setRegistrations(JSON.parse(savedRegs));
  }, []);

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

  const handleRegister = (compId: string) => {
    if (!user) {
      alert(lang === 'zh' ? "请先登录再进行报名。" : "Please login first.");
      return;
    }
    const alreadyRegistered = registrations.some(r => r.competitionId === compId);
    if (alreadyRegistered) return;

    const newReg: UserRegistration = {
      competitionId: compId,
      status: RegistrationStatus.PENDING_PAYMENT
    };
    setRegistrations(prev => [...prev, newReg]);
    alert(lang === 'zh' ? "报名成功！请前往个人中心完成缴费。" : "Registration successful! Please proceed to payment.");
  };

  const handlePay = (compId: string) => {
    setRegistrations(prev => prev.map(r => 
      r.competitionId === compId ? { ...r, status: RegistrationStatus.PAID, paymentTime: new Date().toISOString() } : r
    ));
    alert(lang === 'zh' ? "模拟支付成功！" : "Simulated payment successful!");
  };

  const handleSubmitPaper = (compId: string, fileName: string) => {
    setRegistrations(prev => prev.map(r => 
      r.competitionId === compId ? { 
        ...r, 
        status: RegistrationStatus.SUBMITTED, 
        submissionFile: fileName, 
        submissionTime: new Date().toISOString() 
      } : r
    ));
    alert(lang === 'zh' ? `论文《${fileName}》提交成功！` : `Paper "${fileName}" submitted!`);
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
        </Routes>
      </Layout>
      <AIChat lang={lang} />
    </HashRouter>
  );
};

export default App;
