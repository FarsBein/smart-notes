import React, { DragEvent } from 'react';

import { PopupProvider, usePopupContext } from '../../contexts/PopupContext';
import Header from './Header';
import TextArea from './TextArea';
import AttachmentList from './AttachmentList';
import Footer from './Footer';
import { Check, Loader2 } from 'lucide-react';
import styles from './PromptWindow.module.scss';

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
        <div className={styles['saving-container']}>
          <div className={styles['saving-content']}>
          <Loader2 className={styles['loading-icon']} size={16} />
          <p>Saving</p>
          </div>
        </div> :

        saveStatus ? 
        <div className={styles['save-status-container']}>
          <div className={styles['save-status-content']}>
            <Check className={styles['save-status']} size={18} />
            <p>{saveStatus}</p>
          </div>
        </div> : 
        
        <div className={styles['popup']} onDrop={handleDrop} onDragOver={handleDragOver}>
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