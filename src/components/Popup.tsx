import React, { useState, useEffect, useRef, FC, KeyboardEvent } from 'react';
import '../styles/global.scss';
import inbox from '../assets/Inbox.png';

const AttachmentItem: FC<{ attachment: Attachment; index: number; remove: (index: number) => void }> = ({ attachment, index, remove }) => (
  <div key={index}>
    {attachment.type === 'url' && (
      <div>
        Attached URL: {attachment.content}{' '}
        <button onClick={() => remove(index)}>X</button>
      </div>
    )}
    {attachment.type === 'image' && (
      <div>
        <img
          src={`data:image/png;base64,${attachment.content}`}
          alt="Clipboard"
          style={{ maxWidth: '200px' }}
        />
        <button onClick={() => remove(index)}>X</button>
      </div>
    )}
    {attachment.type === 'text' && (
      <div>
        Attached Text: {attachment.content.substring(0, 50)}...{' '}
        <button onClick={() => remove(index)}>X</button>
      </div>
    )}
  </div>
);

const Popup: FC = () => {
  const [note, setNote] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [tagInput, setTagInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    const ipc = window.electron.ipcRenderer;

    // Auto-focus on the textarea when the component mounts
    textareaRef.current?.focus();

    // Request recent clipboard content
    ipc.send('get-recent-clipboard');

    const handleRecentClipboardContent = (recentItems: Attachment[]) => {
      setAttachments(recentItems);
    };

    const handleSaveResult = (result: { success: boolean; error?: string }) => {
      if (result.success) {
        setSaveStatus('Note saved successfully!');
        // Close the window after a short delay
        setTimeout(() => {
          ipc.send('close-popup');
        }, 500);
      } else {
        setSaveStatus(`Failed to save note: ${result.error || 'Unknown error'}`);
      }
    };

    ipc.on('recent-clipboard-content', handleRecentClipboardContent);
    ipc.on('save-note-result', handleSaveResult);

    // Call adjustTextareaHeight on mount
    adjustTextareaHeight();

    return () => {
      ipc.removeListener('recent-clipboard-content', handleRecentClipboardContent);
      ipc.removeListener('save-note-result', handleSaveResult);
    };
  }, []);

  const handleSave = () => {
    window.electron.ipcRenderer.send('save-note', note, attachments);
    setNote('');
    setAttachments([]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Backspace' && e.shiftKey) {
      e.preventDefault();
      setAttachments([]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      window.electron.ipcRenderer.send('close-popup');
    }
  };

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
    adjustTextareaHeight();
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.endsWith(' ')) {
      // Split the input by spaces
      const words = value.trim().split(/\s+/);
      // Add '#' to the last word if it doesn't already start with '#'
      words[words.length - 1] = words[words.length - 1].startsWith('#') 
        ? words[words.length - 1] 
        : '#' + words[words.length - 1];
      // Join the words back together
      setTagInput(words.join(' ') + ' ');
    } else {
      setTagInput(value);
    }
  };

  return (
    <div className='popup'>
      <div className='popup-header'>
        <div className='popup-header-date'>{new Date().toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' })}</div>
      </div>
      <div className='popup-content'>
        <div className='popup-content-highlight'></div>
        <textarea
          ref={textareaRef}
          value={note}
          onChange={handleNoteChange}
          onKeyDown={handleKeyDown}
          placeholder="Capture your thoughts here…"
          spellCheck={true}
        />
      </div>

      {/* {attachments.map((attachment, index) => (
        <AttachmentItem
          key={index}
          attachment={attachment}
          index={index}
          remove={removeAttachment}
        />
      ))} */}
      <div className='popup-footer'>
        <div className='popup-footer-tag-container'>
          <img src={inbox} className='popup-footer-inbox' alt="inbox" />
          <input 
            className='popup-footer-tag' 
            type="text" 
            placeholder="#" 
            value={tagInput}
            onChange={handleTagInputChange}
          />
        </div>
        <button onClick={handleSave}>Post</button>
        {saveStatus && <p>{saveStatus}</p>}
      </div>
    </div>
  );
};

export default Popup;

