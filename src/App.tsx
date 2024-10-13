import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Popup from './pages/PromptWindow/Index';
import NotesFeed from './pages/NotesFeed/Index';
import TitleBar from './components/TitleBar';

const MainWindow: React.FC = () => {
  return (
    <>
      <TitleBar />
      <NotesFeed />
    </>
  );
};

const App: React.FC = () => {
  const location = useLocation();

  const isPopup = window.location.pathname.includes('popup');

  if (isPopup) {
    return <Popup />;
  }

  return (
    <Routes>
      <Route path="/" element={<MainWindow />} />
      <Route path="/popup" element={<Popup />} />
    </Routes>
  );
};

export default App;
