import React, { ChangeEvent, useState, KeyboardEvent } from 'react';
import { Image, Code, Quote, MessageCircle } from 'lucide-react';
import SearchDropdown from './SearchDropdown';
import { usePopupContext } from '../../contexts/PopupContext';
import styles from './PromptWindow.module.scss';

interface FooterProps {
  handleEditorSave: () => void;
}

const Footer: React.FC<FooterProps> = ({ handleEditorSave }) => {
  const {  handleCancel, setAttachments, attachments, saveStatus, handleThread, tagInput, setTagInput } = usePopupContext();
  
 
  const handleTagInputChange = (e: ChangeEvent<HTMLInputElement>) => {
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

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleEditorSave();
    } else if (e.key === 'Backspace' && e.shiftKey) {
      e.preventDefault();
      setAttachments([]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      window.electron.ipcRenderer.send('close-popup');
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

  

  return (
    <div className={styles['popup__footer']}>
      <div className={styles['popup__left-container']}>
        <SearchDropdown />
        <input
          className={styles['popup__tag-input']}
          type="text"
          placeholder="#"
          value={tagInput}
          onChange={handleTagInputChange}
          // @ts-ignore
          onKeyDown={handleKeyDown}
        />
      </div>
      
      <div className={styles['popup__buttons']}>
        <div className={styles['popup__actions']}>
          <label htmlFor="image-upload" className={styles['popup__action-btn']}>
            <Image size={25} />
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </label>
          {/* <button onClick={handleCodeSnippet} className={styles['popup__action-btn']}>
            <Code size={20} />
          </button>
          <button onClick={handleQuote} className={styles['popup__action-btn']}>
            <Quote size={20} />
          </button> */}
          {/* start thread button */}
          <button className={styles['popup__action-btn']} onClick={handleThread}>
            <MessageCircle size={20} />
          </button>
        </div>
        <button className={styles['popup__post-btn']} onClick={handleCancel}>Cancel</button>
        <button className={styles['popup__post-btn']} onClick={handleEditorSave} disabled={!!saveStatus}>{saveStatus || 'Save'}</button>
      </div>
    </div>
  );
};

export default Footer;
