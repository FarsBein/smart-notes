import React, { DragEvent, useRef, useState, useEffect } from 'react';

import { PopupProvider, usePopupContext } from '../../contexts/PopupContext';
import Header from './Header';
import AttachmentList from './AttachmentList';
import Footer from './Footer';
import { Check, Loader2 } from 'lucide-react';
import styles from './PromptWindow.module.scss';
import NoteItem from '../../components/NoteItem/NoteItem';
import { Editor, EditorRef } from '@/components/PopupEditor/Editor';

const PopupContent: React.FC = () => {
  const { attachments, setAttachments, isSaving, saveStatus, handleClipboard, thread, note, setNote, handleSave } = usePopupContext();

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const items = e.dataTransfer.items;

    handleClipboard(items);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const editorRef = useRef<EditorRef>(null);

  const handleClearAttachments = () => {
    setAttachments([]);
  };

  const handleClose = () => {
    window.electron.ipcRenderer.send('close-popup');
  };

  const handleEditorSave = () => {
    const markdown = editorRef.current?.getMarkdown();
    if (markdown) {
      setNote(markdown);
    }
  };

  useEffect(() => {
    if (note) {
      handleSave();
    }
  }, [note]);

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
          <div className={styles['popup__thread']}>
            {thread.map(({ fileName, metadata, content }) => (
              metadata && content && <NoteItem key={fileName} fileName={fileName} fileContent={content} fileMetadata={metadata} isLast={false} />
            ))}
            {thread.length > 0 && <div style={{ marginTop: 'var(--spacing-5)' }}></div>}
          </div>
          <div className={styles['popup__editor']}>
            <Editor
              ref={editorRef}
              content={note}
              onSave={handleEditorSave}
              onClearAttachments={handleClearAttachments}
              onClose={handleClose}
              onClipboard={handleClipboard}
              placeholder="Capture your thoughts here…"
              autoFocus={true}
            />
            <AttachmentList attachments={attachments} setAttachments={setAttachments} />
            <Footer handleEditorSave={handleEditorSave} />
          </div>
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