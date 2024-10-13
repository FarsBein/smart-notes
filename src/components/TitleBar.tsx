import React, { useState, useEffect } from 'react';
import { ipcRenderer } from 'electron';
import { Folder, Minus, Search, Square, X } from 'lucide-react';
import { useActionButtons } from '../contexts/ActionButtons';

const TitleBar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const { setIsSearchOpen } = useActionButtons();

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

      <div className="title-bar-actions">

        <div className="title-bar-icons">
          <button>
            <Folder size={20} />
          </button>
          <button onClick={() => setIsSearchOpen(prev => !prev)}>
            <Search size={20} />
          </button>
        </div>

        <div className="title-bar-window-controls">
          <button onClick={handleMinimize}><Minus size={17} /></button>
          <button onClick={handleMaximize}><Square size={15} /></button>
          <button onClick={handleClose} className="close-button"><X size={17} /></button>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;