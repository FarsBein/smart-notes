import React, { useState, useEffect, useRef } from 'react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Auto-focus on the textarea when the component mounts
    textareaRef.current?.focus();

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
          // Close the window after a short delay
          setTimeout(() => {
            window.electron.ipcRenderer.send('close-popup');
          }, 1000);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      handleSave();
    }

     // Check if 'Backspace' and 'Shift' are pressed
    if (e.key === 'Backspace' && e.shiftKey) {
      e.preventDefault();
      setAttachments([]);
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      window.electron.ipcRenderer.send('close-popup');
    }
  };

  return (
    <div className='popup'>
      <textarea 
        ref={textareaRef}
        value={note} 
        onChange={(e) => setNote(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your note here..."
        spellCheck="true"
      />
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

