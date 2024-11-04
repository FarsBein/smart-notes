import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Popup from './pages/PromptWindow/Index';
import NotesFeed from './pages/NotesFeed/Index';
import TitleBar from './components/TitleBar/TitleBar';
import BottomBar from './components/BottomBar/BottomBar';

const MainWindow: React.FC = () => {
  return (
    <>
      <TitleBar />
      <NotesFeed />
      <BottomBar />
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
