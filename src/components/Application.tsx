import React from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Popup from './Popup';


const App: React.FC = () => {
  return (
    <div className="p-3">
      <h1>Hello World!</h1>
      <p>Welcome to your Electron application.</p>
    </div>
  );
};


const Application: React.FC = () => {
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
