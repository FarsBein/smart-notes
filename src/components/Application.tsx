import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Popup from './Popup';
import NotesFeed from './NotesFeed';


const App: React.FC = () => {
  return (
    <div className="p-3">
      <h1>My Memory</h1>
      <NotesFeed />
    </div>
  );
};


const Application: React.FC = () => {
  // find better routing solution (try hash again)

  console.log('[App] : rendering routes');
  const location = useLocation();
  console.log('[App] location:', location);

  // Check if we're in a popup context
  const isPopup = window.location.pathname.includes('popup');

  if (isPopup) {
    return <Popup />;
  }


  return (
    <Routes>
      <Route path="/" element={<App />} />
      <Route path="/popup" element={<Popup />} />
    </Routes>
  );
};

export default Application;
