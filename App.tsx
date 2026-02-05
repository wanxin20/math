import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import SystemSelect from './pages/SystemSelect';
import SystemApp from './components/SystemApp';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<SystemSelect />} />
        <Route path="/paper/*" element={<SystemApp system="paper" />} />
        <Route path="/reform/*" element={<SystemApp system="reform" />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
