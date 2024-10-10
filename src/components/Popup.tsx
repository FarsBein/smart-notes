import React, { useState, useEffect, useRef, FC, KeyboardEvent } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import '../styles/global.scss';
import SearchDropdown from './SearchDropdown';

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

// Define highlight options
const highlightOptions = [
  { name: 'None', color: '#3d3d3d' },
  { name: 'Todo', color: '#FF5733' },
  { name: 'Highlight', color: '#FFC300' },
  { name: 'Idea', color: '#DAF7A6' },
];

const Popup: FC = () => {
  const [note, setNote] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [tagInput, setTagInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [selectedHighlight, setSelectedHighlight] = useState(highlightOptions[0]);

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

  const handleCancel = () => {
    window.electron.ipcRenderer.send('close-popup');
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
    <div className="popup">
      <div className="popup__header">
        <div className="popup__date">
          {new Date().toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' })}
        </div>
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="popup__highlight" style={{ backgroundColor: selectedHighlight.color }}></button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="dropdown-menu-content">
              {highlightOptions.map((option) => (
                <DropdownMenu.Item
                  key={option.name}
                  className="dropdown-menu-item"
                  onClick={() => setSelectedHighlight(option)}
                >
                  <div className="color-option">
                    <div className="color-circle" style={{ backgroundColor: option.color }}></div>
                    <span>{option.name}</span>
                  </div>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
      <div className="popup__content">
        <textarea
          ref={textareaRef}
          className="popup__textarea"
          value={note}
          onChange={handleNoteChange}
          onKeyDown={handleKeyDown}
          placeholder="Capture your thoughts here…"
          spellCheck={true}
        />
      </div>
      <div className="popup__footer">
        <div className="popup__left-container">
          <SearchDropdown />
          <input
            className="popup__tag-input"
            type="text"
            placeholder="#"
            value={tagInput}
            onChange={handleTagInputChange}
          />
        </div>
        <div className="popup__buttons">
          <button className="popup__post-btn" onClick={handleCancel}>Cancel</button>
          <button className="popup__post-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
      {saveStatus && <p>{saveStatus}</p>}
    </div>
  );
};

export default Popup;

