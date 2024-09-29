import React, { useState, useEffect } from 'react';
import '../styles/global.scss';

const Popup: React.FC = () => {
  const [note, setNote] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    console.log('Popup component called');
    const date = new Date();
    setCurrentDate(date.toLocaleDateString() + ' ' + date.toLocaleTimeString());
  }, []);

  useEffect(() => {
    const handleSaveResult = (result: { success: boolean; error: string }) => {
      console.log('[handleSaveResult] result:', result);
      if (result && typeof result === 'object' && 'success' in result) {
        if (result.success) {
          setSaveStatus('Note saved successfully!');
        } else {
          setSaveStatus(`Failed to save note: ${result.error || 'Unknown error'}`);
        }
      } else {
        setSaveStatus('Received unexpected response from main process');
      }
    };

    window.electron.ipcRenderer.on('save-note-result', handleSaveResult);

    return () => {
      window.electron.ipcRenderer.removeListener('save-note-result', handleSaveResult);
    };
  }, []);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
  };

  const handleSave = () => {
    if (window.electron && window.electron.ipcRenderer) {
      window.electron.ipcRenderer.send('save-note', note);
      setNote('');
    } else {
      console.error('Electron IPC is not available');
      // Handle the error appropriately in your UI
    }
  };

  return (
    <div className="popup">
      <textarea
        value={note}
        onChange={handleNoteChange}
        placeholder="Type your note here..."
        autoFocus
      />
      <div className="popup-footer">
        <span className="date">{currentDate}</span>
        <button onClick={handleSave}>Save</button>
      </div>
      {saveStatus && <p>{saveStatus}</p>}
    </div>
  );
};

export default Popup;
