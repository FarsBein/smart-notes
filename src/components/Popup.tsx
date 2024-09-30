import React, { useState, useEffect } from 'react';
import '../styles/global.scss';

// todo: move this to a shared interface file
interface Attachment {
  type: 'url' | 'image' | 'text' | 'none';
  content: string;
  timestamp: number;
}

const Popup: React.FC = () => {
  const [note, setNote] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    // Check for recent clipboard content when component mounts
    window.electron.ipcRenderer.send('get-recent-clipboard');

    const handleRecentClipboardContent = (recentItems: Attachment[]) => {
      setAttachments(recentItems);
    };

    window.electron.ipcRenderer.on('recent-clipboard-content', handleRecentClipboardContent);

    return () => {
      window.electron.ipcRenderer.removeListener('recent-clipboard-content', handleRecentClipboardContent);
    };
  }, []);

  useEffect(() => {
    const handleSaveResult = (result: any) => {
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

  const handleSave = () => {
    const currentTime = new Date().toLocaleString();
    const noteWithTimestamp = `${currentTime}\n\n${note}`;
    window.electron.ipcRenderer.send('save-note', noteWithTimestamp, attachments);
    setNote('');
    setAttachments([]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className='popup'>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} />
      {attachments.map((attachment, index) => (
        <div key={index}>
          {attachment.type === 'url' && (
            <div>
              Attached URL: {attachment.content} <button onClick={() => removeAttachment(index)}>X</button>
            </div>
          )}
          {attachment.type === 'image' && (
            <div>
              <img src={`data:image/png;base64,${attachment.content}`} alt="Clipboard" style={{maxWidth: '200px'}} />
              <button onClick={() => removeAttachment(index)}>X</button>
            </div>
          )}
          {attachment.type === 'text' && (
            <div>
              Attached Text: {attachment.content.substring(0, 50)}... <button onClick={() => removeAttachment(index)}>X</button>
            </div>
          )}
        </div>
      ))}
      <button onClick={handleSave}>Save Note</button>
      {saveStatus && <p>{saveStatus}</p>}
    </div>
  );
};

export default Popup;
