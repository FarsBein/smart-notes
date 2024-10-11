import React, { DragEvent } from 'react';
import '../styles/global.scss';
import { PopupProvider, usePopupContext } from '../context/PopupContext';
import Header from './Header';
import TextArea from './TextArea';
import AttachmentList from './AttachmentList';
import Footer from './Footer';
import { Check, Loader2 } from 'lucide-react';

const PopupContent: React.FC = () => {
  const { attachments, setAttachments, isSaving, saveStatus, handleClipboard } = usePopupContext();

  

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const items = e.dataTransfer.items;

    handleClipboard(items);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
        isSaving ? 
        <div className="saving-container">
          <div className="saving-content">
          <Loader2 className="loading-icon" size={16} />
          <p>Saving</p>
          </div>
        </div> :

        saveStatus ? 
        <div className="save-status-container">
          <div className="save-status-content">
            <Check className="save-status" size={18} />
            <p>{saveStatus}</p>
          </div>
        </div> : 
        
        <div className="popup" onDrop={handleDrop} onDragOver={handleDragOver}>
          <Header />
          <TextArea />
          <AttachmentList attachments={attachments} setAttachments={setAttachments} />
          <Footer />  
        </div>
  );
};

const Popup: React.FC = () => {
  return (
    <PopupProvider>
      <PopupContent />
    </PopupProvider>
  );
};

export default Popup;