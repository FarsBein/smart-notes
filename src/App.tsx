import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Popup from './pages/PromptWindow/Index';
import NotesFeed from './pages/NotesFeed/Index';
import TitleBar from './components/TitleBar/TitleBar';
import BottomBar from './components/BottomBar/BottomBar';
import Sidebar from './components/Sidebar/Sidebar';
import styles from './App.module.scss';

const MainWindow: React.FC = () => {
  return (
    <div className={styles.container}>
      <TitleBar />
      <div className={styles.content}>
        <Sidebar />
        <NotesFeed />
      </div>
      <BottomBar />
    </div>
  );
};

const App: React.FC = () => {
  const location = useLocation();

  const isPopup = new URLSearchParams(window.location.search).get('view') === 'popup';

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
