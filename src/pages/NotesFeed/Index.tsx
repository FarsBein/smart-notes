import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import styles from './NotesFeed.module.scss';
import { Search, Cone, X, Trash2, Edit2, Save, X as Cancel } from 'lucide-react';


const NotesFeed: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSemanticSearch, setIsSemanticSearch] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    const handleNotesData = (notesData: Note[]) => {
      console.log('get-notes notesData:', notesData);
      setNotes(notesData);
      setFilteredNotes(notesData); // Initialize filtered notes
    };

    window.electron.ipcRenderer.send('get-notes');
    window.electron.ipcRenderer.on('notes-data', handleNotesData);

    return () => {
      window.electron.ipcRenderer.removeListener('notes-data', handleNotesData);
    };
  }, []);

  useEffect(() => {
    const handleSaveResult = (newNote: Note) => {
      console.log('new-note:', newNote);
      setNotes((prevNotes) => [newNote, ...prevNotes]);
      setFilteredNotes((prevNotes) => [newNote, ...prevNotes]);
    };

    window.electron.ipcRenderer.on('new-note', handleSaveResult);

    return () => {
      window.electron.ipcRenderer.removeListener('new-note', handleSaveResult);
    };
  }, []);

  useEffect(() => {
    const handleDeleteResult = (result: { success: boolean, fileName?: string, error?: string }) => {
      if (result.success) {
        setNotes((prevNotes) => prevNotes.filter(note => note.fileName !== result.fileName));
        setFilteredNotes((prevNotes) => prevNotes.filter(note => note.fileName !== result.fileName));
      } else {
        console.error('Failed to delete note:', result.error);
      }
    };

    window.electron.ipcRenderer.on('delete-note-result', handleDeleteResult);

    return () => {
      window.electron.ipcRenderer.removeListener('delete-note-result', handleDeleteResult);
    };
  }, []);

  useEffect(() => {
    const handleUpdateResult = (result: { success: boolean, fileName?: string, updatedAt?: string, error?: string }) => {
      if (result.success) {
        setNotes((prevNotes) => prevNotes.map(note => note.fileName === result.fileName ? { ...note, content: editContent, updatedAt: result.updatedAt } : note));
        setFilteredNotes((prevNotes) => prevNotes.map(note => note.fileName === result.fileName ? { ...note, content: editContent, updatedAt: result.updatedAt } : note));
        setEditingNote(null);
      } else {
        console.error('Failed to update note:', result.error);
      }
    };

    window.electron.ipcRenderer.on('update-note-result', handleUpdateResult);

    return () => {
      window.electron.ipcRenderer.removeListener('update-note-result', handleUpdateResult);
    };
  }, [editContent]);

  useEffect(() => {
    const handleSearchResults = (result: { success: boolean, notesData?: Note[], error?: string }) => {
      console.log('search-result:', result);
      if (result.success) {
        setFilteredNotes(result.notesData || []);
      } else {
        console.error('Error searching notes:', result.error);
      }
    };

    window.electron.ipcRenderer.on('search-result', handleSearchResults);

    return () => {
      window.electron.ipcRenderer.removeListener('search-result', handleSearchResults);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Update every minute
    return () => clearInterval(timer);
  }, []);

  const getRelativeTime = (date: string): string => {
    const now = new Date();
    const pastDate = new Date(date);
    const seconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);

    let interval = Math.floor(seconds / 31536000); // years
    if (interval >= 1) {
      return `${interval} year${interval !== 1 ? 's' : ''} ago`;
    }

    interval = Math.floor(seconds / 2592000); // months
    if (interval >= 1) {
      return `${interval} month${interval !== 1 ? 's' : ''} ago`;
    }

    interval = Math.floor(seconds / 604800); // weeks
    if (interval >= 1) {
      return `${interval} week${interval !== 1 ? 's' : ''} ago`;
    }

    interval = Math.floor(seconds / 86400); // days
    if (interval >= 1) {
      return `${interval} day${interval !== 1 ? 's' : ''} ago`;
    }

    interval = Math.floor(seconds / 3600); // hours
    if (interval >= 1) {
      return `${interval} hour${interval !== 1 ? 's' : ''} ago`;
    }

    interval = Math.floor(seconds / 60); // minutes
    if (interval >= 1) {
      return `${interval} minute${interval !== 1 ? 's' : ''} ago`;
    }

    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
  };

  const deleteNote = (fileName: string) => {
    window.electron.ipcRenderer.send('delete-note', fileName);
  };

  const startEditing = (fileName: string, content: string) => {
    setEditingNote(fileName);
    setEditContent(content);
  };

  const saveEdit = (fileName: string) => {
    window.electron.ipcRenderer.send('update-note', fileName, editContent);
  };

  const renderAttachment = (attachment: string, index: number) => {
    const parsedAttachment = JSON.parse(attachment);
    if (parsedAttachment.startsWith('attachments/') && (parsedAttachment.endsWith('.png') || parsedAttachment.endsWith('.jpg') || parsedAttachment.endsWith('.jpeg'))) {
      return (
        <img
          key={index}
          src={`safe-file://${parsedAttachment}`}
          alt="Attachment"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            console.error('Failed to load image:', parsedAttachment);
          }}
        />
      );
    } else {
      return <blockquote key={index}>{parsedAttachment}</blockquote>;
    }
  };

  const handleSearch = () => {
    if (isSemanticSearch) {
      window.electron.ipcRenderer.send('search-notes', searchQuery);
    } else {
      // Perform basic search locally
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = notes.filter(note =>
        note.content.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredNotes(filtered);
    }
  };

  const exitSearch = () => {
    setSearchQuery('');
    setFilteredNotes(notes); // Reset to original notes
  };


  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [editContent]);

  return (
    <div className={styles['notes-container-wrapper']}>
      <div className={styles['search-bar']}>
        <div className={styles['search-input-container']}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Search onClick={handleSearch} className={styles['search-icon']} />
          <Cone onClick={() => setIsSemanticSearch(!isSemanticSearch)} className={`${styles['semantic-search-icon']} ${isSemanticSearch ? styles['selected'] : ''}`}/>
          <X onClick={exitSearch} className={styles['search-icon']} />
        </div>
      </div>
      <div className={styles['note-divider']}></div>
      {filteredNotes.map((note, index) => (
        <>
          <div className={styles['notes-container']} key={index}>
            <div className={styles['note-legend']}>
              <div className={styles['note-legend-dot']} />
              {/* <div className={styles['note-legend-line']} /> */}
            </div>
            <div className={styles['note-content']}>
              <div className={styles['note-content-text']}>
                {editingNote === note.fileName ? (
                  <textarea
                    ref={textareaRef}
                    className={styles['note-content-textarea']}
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    spellCheck={true}
                  />
                ) : (
                  <ReactMarkdown>{note.content}</ReactMarkdown>
                )}
              </div>
              {note.attachments && note.attachments.length > 0 && (
                <div className={styles['note-attachments-container']}>
                  {note.attachments.map((attachment, i) => renderAttachment(attachment, i))}
                </div>
              )}
              <div className={styles['note-tags-container']}>
                {note.tags && note.tags.length > 0 && (
                  <div>{note.tags.map((tag: string, i: number) => <span key={i}>{tag}</span>)}</div>
                )}
                <div className={styles['note-date']}>{getRelativeTime(note.updatedAt)}</div>
              </div>
              <div className={`${styles['note-actions']} ${editingNote === note.fileName ? styles['editing'] : ''}`}>
                <button onClick={() => deleteNote(note.fileName)}>
                  <Trash2 size={16} /> Delete
                </button>
                {editingNote === note.fileName ? (
                  <>
                    <button onClick={() => saveEdit(note.fileName)}>
                      <Save size={16} /> Save
                    </button>
                    <button onClick={() => setEditingNote(null)}>
                      <Cancel size={16} /> Cancel
                    </button>
                  </>
                ) : (
                  <button onClick={() => startEditing(note.fileName, note.content)}>
                    <Edit2 size={16} /> Edit
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* <div className={styles['note-divider']}></div> */}
        </>
      ))}
    </div>
  );
};

export default NotesFeed;



