import React from 'react';
import { usePopupContext } from '../../contexts/PopupContext';
import MarkdownEditor from '../../components/MarkdownEditor/MarkdownEditor';
import styles from './PromptWindow.module.scss';

const TextArea: React.FC = () => {
  const { note, setNote, handleSave, setAttachments, handleClipboard } = usePopupContext();

  const handleClearAttachments = () => {
    setAttachments([]);
  };

  const handleClose = () => {
    window.electron.ipcRenderer.send('close-popup');
  };

  return (
    <div className={styles['popup__content']}>
      <MarkdownEditor
        content={note}
        setContent={setNote}
        onSave={handleSave}
        onClearAttachments={handleClearAttachments}
        onClose={handleClose}
        handleClipboard={handleClipboard}
        placeholder="Capture your thoughts here…"
        autoFocus={true}
      />
    </div>
  );
};

export default TextArea;
