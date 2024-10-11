import React, { useState, useEffect, useRef, FC, KeyboardEvent, ChangeEvent, ClipboardEvent, DragEvent } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import '../styles/global.scss';
import SearchDropdown from './SearchDropdown';
import AttachmentInput from './AttachmentInput';
import { X, Paperclip, Code, Image, Quote } from 'lucide-react';

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

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAttachment: Attachment = {
          type: 'image',
          content: event.target?.result as string,
        };
        setAttachments([...attachments, newAttachment]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCodeSnippet = () => {
    const code = prompt('Enter your code snippet:');
    if (code) {
      const newAttachment: Attachment = {
        type: 'code',
        content: code,
      };
      setAttachments([...attachments, newAttachment]);
    }
  };

  const handleQuote = () => {
    const quote = prompt('Enter your quote:');
    if (quote) {
      const newAttachment: Attachment = {
        type: 'quote',
        content: quote,
      };
      setAttachments([...attachments, newAttachment]);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        e.preventDefault();
        const blob = item.getAsFile();
        if (blob) handleImageFile(blob);
      } else if (item.type === 'text/plain') {
        item.getAsString((string) => {
          if (isValidUrl(string)) {
            e.preventDefault();
            addAttachment('url', string);
          }
        });
      }
    }
  };

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      addAttachment('image', event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const addAttachment = (type: Attachment['type'], content: string) => {
    const newAttachment: Attachment = { type, content };
    setAttachments([...attachments, newAttachment]);
  };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const items = e.dataTransfer.items;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.indexOf('image') !== -1) {
        const file = item.getAsFile();
        if (file) handleImageFile(file);
      } else if (item.type === 'text/plain') {
        item.getAsString((string) => {
          if (isValidUrl(string)) {
            addAttachment('url', string);
          }
        });
      }
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className="popup" onDrop={handleDrop} onDragOver={handleDragOver}>
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
          onPaste={handlePaste}
          placeholder="Capture your thoughts here…"
          spellCheck={true}
        />
      </div>
      <AttachmentInput attachments={attachments} setAttachments={setAttachments} />
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
          <div className="popup__actions">
            <label htmlFor="image-upload" className="popup__action-btn">
              <Image size={20} />
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
            </label>
            <button onClick={handleCodeSnippet} className="popup__action-btn">
              <Code size={20} />
            </button>
            <button onClick={handleQuote} className="popup__action-btn">
              <Quote size={20} />
            </button>
          </div>
          <button className="popup__post-btn" onClick={handleCancel}>Cancel</button>
          <button className="popup__post-btn" onClick={handleSave}>Save</button>
        </div>
      </div>
      {saveStatus && <p>{saveStatus}</p>}
    </div>
  );
};

export default Popup;

