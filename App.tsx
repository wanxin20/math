import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import PortalHome from './pages/portal/PortalHome';
import ScientistAward from './pages/portal/ScientistAward';
import ScientistAdmin from './pages/portal/ScientistAdmin';
import SystemApp from './components/SystemApp';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PortalHome />} />
        <Route path="/scientist" element={<ScientistAward />} />
        <Route path="/scientist/admin" element={<ScientistAdmin />} />
        <Route path="/paper/*" element={<SystemApp system="paper" />} />
        <Route path="/reform/*" element={<SystemApp system="reform" />} />
        <Route path="/contest/*" element={<SystemApp system="contest" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
