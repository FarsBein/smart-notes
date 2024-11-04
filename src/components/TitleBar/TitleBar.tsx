import React, { useState, useEffect } from 'react';
import { Dot, Folder, Minus, Search, Square, X } from 'lucide-react';
import { useActionButtons } from '../../contexts/ActionButtons';
import styles from './TitleBar.module.scss';
const TitleBar: React.FC = () => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const { setIsSearchOpen } = useActionButtons();
  const [numberOfNotes, setNumberOfNotes] = useState<number>(0);

  useEffect(() => {
    const getNumberOfNotes = async () => {
      const numberOfNotes = await window.electron.ipcRenderer.invoke('get-number-of-notes');
      setNumberOfNotes(numberOfNotes);
    };
    getNumberOfNotes();
  }, []);

  useEffect(() => {
    const timer = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'short',
        day: '2-digit',
      };
      setCurrentTime(now.toLocaleDateString('en-US', options));
    };
    timer();
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
    <div className={styles.titleBar}>
      
      <div className={styles.titleBarLeft}>
        <div>{numberOfNotes} entries</div>
        <Dot size={12} style={{ marginTop: '2px' }} />
        <div className={styles.title}>{currentTime}</div>
      </div>

      <div className={styles.titleBarActions}>
        <div className={styles.titleBarWindowControls}>
          <button onClick={handleMinimize}><Minus size={17} /></button>
          <button onClick={handleMaximize}><Square size={15} /></button>
          <button onClick={handleClose} className={styles.closeButton}><X size={17} /></button>
        </div>
      </div>
    </div>
  );
};

export default TitleBar;