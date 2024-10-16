import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Trash2, Edit2, Save, X as Cancel } from 'lucide-react';
import styles from './NotesFeed.module.scss';
import { useNotes } from '../../contexts/NotesContext';
import MarkdownEditor from '@/components/MarkdownEditor/MarkdownEditor';

interface NoteItemProps {
  note: NoteWithReplies;
}

const NoteItem: React.FC<NoteItemProps> = React.memo(({ note }) => {
  const {setNotes, basicSearchQuery} = useNotes();

  const [content, setContent] = useState<string>('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');

  useEffect(() => {
    async function getContent() {
      try {
        const noteContent = await window.electron.ipcRenderer.invoke('get-content', note.fileName);
        setContent(noteContent);
      } catch (error) {
        console.error('Error fetching note content:', error);
      }
    }
    getContent();
  }, [note]);

  const deleteNote = async (fileName: string) => {
    try {
      await window.electron.ipcRenderer.invoke('delete-note', fileName);
      setNotes(prevNotes => prevNotes.filter(note => note.fileName !== fileName));
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const startEditing = (fileName: string, content: string) => {
    setEditingNote(fileName);
    setEditContent(content);
  };

  const saveEdit = async (fileName: string) => {
    try {
      await window.electron.ipcRenderer.invoke('update-content', fileName, editContent);
      setContent(editContent);
      setEditingNote(null);
    } catch (error) {
      console.error('Failed to update note content:', error);
    }
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


  if (basicSearchQuery && content && !content.toLowerCase().includes(basicSearchQuery.toLowerCase())) {
    return null;
  }

  return (
    <div className={styles['notes-container']}>
      <div className={styles['note-legend']}>
        <div className={styles['note-legend-dot']} />
      </div>
      <div className={styles['note-content']}>
        <div className={styles['note-content-text']}>
          {editingNote === note.fileName ? (
            <MarkdownEditor content={editContent} setContent={setEditContent} />
          ) : (
            <ReactMarkdown>{content}</ReactMarkdown>
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
            <button onClick={() => startEditing(note.fileName, content)}>
              <Edit2 size={16} /> Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default NoteItem;
