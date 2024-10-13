import React, { useState, useEffect } from 'react';
import { ipcRenderer } from 'electron';
import { Minus, Square, X } from 'lucide-react';

const TitleBar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'short', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      setCurrentTime(now.toLocaleDateString('en-US', options));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const ipc = window.electron.ipcRenderer;

  const handleMinimize = () => {
    ipc.send('minimize-window');
  };

  const handleMaximize = () => {
    ipc.send('maximize-window');
  };

  const handleClose = () => {
    ipc.send('close-window');
  };

  return (
    <div className="title-bar">
      <div className="title">{currentTime}</div>
      <div className="title-bar-buttons">
        <button onClick={handleMinimize}><Minus size={17} /></button> 
        <button onClick={handleMaximize}><Square size={15} /></button>
        <button onClick={handleClose} className="close-button"><X size={17} /></button>
      </div>
    </div>
  );
};

export default TitleBar;