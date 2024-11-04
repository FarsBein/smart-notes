import React, { useRef } from 'react';
import { usePopupContext } from '../../contexts/PopupContext';
import { Editor, EditorRef } from '../../components/PopupEditor/Editor';
import styles from './PromptWindow.module.scss';

const TextArea: React.FC = () => {
  const { note, setNote, handleSave, setAttachments, handleClipboard } = usePopupContext();
  const editorRef = useRef<EditorRef>(null);

  const handleClearAttachments = () => {
    setAttachments([]);
  };

  const handleClose = () => {
    window.electron.ipcRenderer.send('close-popup');
  };

  const handleEditorSave = () => {
    if (editorRef.current) {
      const markdown = editorRef.current.getMarkdown();
      setNote(markdown);
      handleSave();
    }
  };

  return (
    <div className={styles['popup__content']}>
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
    </div>
  );
};

export default TextArea;
