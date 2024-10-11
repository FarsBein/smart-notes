import React, { ChangeEvent, useState } from 'react';
import { Image, Code, Quote } from 'lucide-react';
import SearchDropdown from './SearchDropdown';
import { usePopupContext } from '../context/PopupContext';
import { Loader2 } from 'lucide-react';

const Footer: React.FC = () => {
  const { handleSave, handleCancel, setAttachments, attachments, saveStatus } = usePopupContext();
  const [tagInput, setTagInput] = useState('');
 

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

  return (
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
            <Image size={25} />
            <input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </label>
          {/* <button onClick={handleCodeSnippet} className="popup__action-btn">
            <Code size={20} />
          </button>
          <button onClick={handleQuote} className="popup__action-btn">
            <Quote size={20} />
          </button> */}
        </div>
        <button className="popup__post-btn" onClick={handleCancel}>Cancel</button>
        <button className="popup__post-btn" onClick={handleSave} disabled={!!saveStatus}>{saveStatus || 'Save'}</button>
      </div>
    </div>
  );
};

export default Footer;
