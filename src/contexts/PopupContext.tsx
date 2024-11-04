import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

interface PopupContextType {
  note: string;
  setNote: (note: string) => void;
  attachments: Attachment[];
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
  saveStatus: string;
  setSaveStatus: (status: string) => void;
  selectedHighlight: string;
  setSelectedHighlight: (highlight: string) => void;
  handleSave: () => void;
  handleCancel: () => void;
  isSaving: boolean;
  isValidUrl: (string: string) => boolean;
  handleImageFile: (file: File) => void;
  addAttachment: (type: Attachment['type'], content: string) => void;
  handleClipboard: (items: DataTransferItemList) => void;
  thread: {fileName: string, metadata: NoteMetadata, content: string}[];
  setThread: React.Dispatch<React.SetStateAction<{fileName: string, metadata: NoteMetadata, content: string}[]>>;
  handleThread: () => void;
  tagInput: string;
  setTagInput: React.Dispatch<React.SetStateAction<string>>;
}

const PopupContext = createContext<PopupContextType | undefined>(undefined);

export const PopupProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [note, setNote] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [saveStatus, setSaveStatus] = useState('');
  const [selectedHighlight, setSelectedHighlight] = useState<string>('None');
  const [isSaving, setIsSaving] = useState(false);
  const [thread, setThread] = useState<{fileName: string, metadata: NoteMetadata, content: string}[]>([]);
  const [tagInput, setTagInput] = useState<string>('');

  useEffect(() => {
    const ipc = window.electron.ipcRenderer;

    // for now we are not going to auto-populate the clipboard
    // ipc.send('get-recent-clipboard');
    // const handleRecentClipboardContent = (recentItems: Attachment[]) => {
    //   setAttachments(recentItems);
    // };
    // ipc.on('recent-clipboard-content', handleRecentClipboardContent);

    const handleSaveResult = (result: { success: boolean; error?: string }) => {
      if (result.success) {
        setSaveStatus('Saved!');
        setIsSaving(false);
        handleCancel();
      } else {
        setSaveStatus(`Failed to save note: ${result.error || 'Unknown error'}`);
        setIsSaving(false);
      }
    };

    
    ipc.on('new-notes-sent', handleSaveResult);

    return () => {
      // ipc.removeListener('recent-clipboard-content', handleRecentClipboardContent);
      ipc.removeListener('new-notes-sent', handleSaveResult);
    };
  }, [setAttachments, setSaveStatus]);

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      addAttachment('image', event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleClipboard = (items: DataTransferItemList) => {
    console.log('Clipboard items:', items);
    Array.from(items).forEach((item) => {
      console.log('Processing item:', item.type);
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) handleImageFile(file);
      } else if (item.type === 'text/plain') {
        item.getAsString((string) => {
          console.log('Clipboard string:', string);
          if (isValidUrl(string)) {
            addAttachment('url', string);
          }
        });
      }
    });
  };

  const addAttachment = (type: Attachment['type'], content: string) => {
    const newAttachment: Attachment = { type, content };
    setAttachments([...attachments, newAttachment]);
  };

  
  const handleSave = async () => {
    if (note.trim().length > 0) {
      const tagInputTrimmed = tagInput?.trim();
      const convertTagInputIntoArray = tagInputTrimmed ? tagInputTrimmed.split(' ') : [];

      if (thread.length > 0) { // if there is a thread, we are saving a reply
        const result = await window.electron.ipcRenderer.invoke('save-reply', note, attachments, thread[0].fileName, convertTagInputIntoArray, selectedHighlight);
        window.electron.ipcRenderer.invoke('update-main-window-with-new-notes', [...thread, {fileName: result.fileName, metadata: result.metadata, content: result.content}]);
      } else { // if there is no thread, we are saving a new note
        const isReply = false;
        const result = await window.electron.ipcRenderer.invoke('save-note', note, attachments, isReply, convertTagInputIntoArray, selectedHighlight);
        window.electron.ipcRenderer.invoke('update-main-window-with-new-notes', [{ fileName: result.fileName, content: result.content, metadata: result.metadata }]);
      }

      setIsSaving(true);
      setNote('');
      setAttachments([]);
    } else {
      if (thread.length > 0) {
        window.electron.ipcRenderer.invoke('update-main-window-with-new-notes', thread);
      }
    }

    handleCancel();
  };

  const handleThread = async () => {
    if (note.trim() === '') return;
    
    const tagInputTrimmed = tagInput?.trim();
    const convertTagInputIntoArray = tagInputTrimmed ? tagInputTrimmed.split(' ') : [];
    if (thread.length === 0) {
      const isReply = false;
      const result = await window.electron.ipcRenderer.invoke('save-note', note, attachments, isReply, convertTagInputIntoArray, selectedHighlight);
      setThread([...thread, {fileName: result.fileName, metadata: result.metadata, content: result.content}]);
    } else {
      const result = await window.electron.ipcRenderer.invoke('save-reply', note, attachments, thread[0].fileName, convertTagInputIntoArray, selectedHighlight);
      setThread([...thread, {fileName: result.fileName, metadata: result.metadata, content: result.content}]);
    }

    setNote('');
    setAttachments([]);
    setTagInput('');
  }


  const handleCancel = () => {
    setNote('');
    setAttachments([]);
    setTagInput('');
    setThread([]);
    setSelectedHighlight('None');
    setIsSaving(false);
    setSaveStatus('');

    window.electron.ipcRenderer.send('close-popup');
  };

  return (
    <PopupContext.Provider value={{
      note,
      setNote,
      attachments,
      setAttachments,
      saveStatus,
      setSaveStatus,
      selectedHighlight,
      setSelectedHighlight,
      handleSave,
      handleThread,
      handleCancel,
      isSaving,
      isValidUrl,
      handleImageFile,
      addAttachment,
      handleClipboard,
      thread,
      setThread,
      tagInput,
      setTagInput
    }}>
      {children}
    </PopupContext.Provider>
  );
};

export const usePopupContext = () => {
  const context = useContext(PopupContext);
  if (context === undefined) {
    throw new Error('usePopupContext must be used within a PopupProvider');
  }
  return context;
};
