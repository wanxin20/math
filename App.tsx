import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import PortalHome from './pages/portal/PortalHome';
import NewsList from './pages/portal/NewsList';
import NewsDetail from './pages/portal/NewsDetail';
import SystemApp from './components/SystemApp';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PortalHome />} />
        <Route path="/news" element={<NewsList />} />
        <Route path="/news/:id" element={<NewsDetail />} />
        <Route path="/paper/*" element={<SystemApp system="paper" />} />
        <Route path="/reform/*" element={<SystemApp system="reform" />} />
        <Route path="/contest/*" element={<SystemApp system="contest" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
