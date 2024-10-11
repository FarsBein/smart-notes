import React, { useRef, useEffect, ClipboardEvent } from 'react';
import { usePopupContext } from '../context/PopupContext';
import '../styles/global.scss';

const TextArea: React.FC = () => {
  const { note, setNote, handleSave, setAttachments, handleClipboard } = usePopupContext();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [note]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
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

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const items = e.clipboardData.items;

    handleClipboard(items);
  };

  return (
    <div className="popup__content">
      <textarea
        ref={textareaRef}
        className="popup__textarea"
        value={note}
        onChange={handleNoteChange}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        placeholder="Capture your thoughts here…"
        spellCheck={true}
      />
    </div>
  );
};

export default TextArea;
