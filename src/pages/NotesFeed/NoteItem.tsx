import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Trash2, Edit2, Save, X as Cancel, MessageSquare } from 'lucide-react';
import styles from './NotesFeed.module.scss';
import { useNotes } from '../../contexts/NotesContext';
import MarkdownEditor from '@/components/MarkdownEditor/MarkdownEditor';
import ReplyItem from './ReplyItem';

interface NoteItemProps {
  fileName: string;
}

const NoteItem: React.FC<NoteItemProps> = React.memo(({ fileName }) => {
  const { basicSearchQuery, setParentNotesFileNames } = useNotes();

  const [content, setContent] = useState<string>('');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>('');
  const [editTags, setEditTags] = useState<string>('');
  const [metadata, setMetadata] = useState<NoteMetadata | null>(null);
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');

  useEffect(() => {
    async function getContent() {
      try {
        const result = await window.electron.ipcRenderer.invoke('get-all-info', fileName);
        setContent(result.content);
        setMetadata(result.metadata);
        console.log('result:', result);
      } catch (error) {
        console.error('Error fetching note content:', error);
      }
    }
    getContent();
  }, [fileName]);

  const deleteNote = async (fileName: string, isReply: boolean) => {
    try {
      if (isReply) {
        await window.electron.ipcRenderer.invoke('delete-reply', fileName);
        setMetadata(prevMetadata => ({ ...prevMetadata, replies: prevMetadata.replies.filter(replyFileName => replyFileName !== fileName) }));
      } else {
        await window.electron.ipcRenderer.invoke('delete-note', fileName);
        setParentNotesFileNames(prevParentNotesFileNames => prevParentNotesFileNames.filter(parentFileName => parentFileName !== fileName));
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const startEditing = (fileName: string, content: string) => {
    setEditingNote(fileName);
    setEditContent(content);
    setEditTags(metadata?.tags?.join(' ') || '');
  };

  const saveEdit = async (fileName: string) => {
    try {
      const newTags = editTags.trim().split(/\s+/).filter(tag => tag.startsWith('#'));
      await window.electron.ipcRenderer.invoke('update-note', fileName, editContent, newTags);
      setContent(editContent);
      setMetadata(prevMetadata => ({ ...prevMetadata, tags: newTags }));
      setEditingNote(null);
    } catch (error) {
      console.error('Failed to update note:', error);
    }
  };

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.endsWith(' ')) {
      const words = value.trim().split(/\s+/);
      words[words.length - 1] = words[words.length - 1].startsWith('#')
        ? words[words.length - 1]
        : '#' + words[words.length - 1];
      setEditTags(words.join(' ') + ' ');
    } else {
      setEditTags(value);
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

  const startReplying = () => {
    setIsReplying(true);
  };

  const cancelReply = () => {
    setIsReplying(false);
    setReplyContent('');
  };

  const addReply = async (replyContent: string) => {
    console.log('Adding reply:', replyContent);
    try {
      const newReplyFileName = await window.electron.ipcRenderer.invoke('save-reply', replyContent, [], fileName, []);
      setMetadata(prevMetadata => ({
        ...prevMetadata,
        replies: [...(prevMetadata?.replies || []), newReplyFileName]
      }));
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  };

  if (basicSearchQuery && content && !content.toLowerCase().includes(basicSearchQuery.toLowerCase())) {
    return null;
  }

  return (
    <>
      <div className={styles['notes-container']}>
        <div className={styles['note-legend']}>
          <div className={styles['note-legend-dot']} />
          {metadata?.replies?.length > 0 ? <div className={styles['note-legend-line']} /> : null}
        </div>
        <div className={styles['note-content']}>
          <div className={styles['note-content-text']}>
            {editingNote === fileName ? (
              <>
                <MarkdownEditor content={editContent} setContent={setEditContent} />
                <input
                  type="text"
                  value={editTags}
                  onChange={handleTagInputChange}
                  placeholder="Enter tags..."
                  className={styles['tag-input']}
                />
              </>
            ) : (
              <>
                <ReactMarkdown>{content || ''}</ReactMarkdown>
                <div className={styles['note-tags-container']}>
                  {metadata?.tags?.map((tag: string, i: number) => <span key={i}>{tag}</span>)}
          <div className={styles['note-date']}>{getRelativeTime(metadata?.updatedAt)}</div>
                </div>
              </>
            )}
          </div>
          {metadata?.attachments?.map((attachment, i) => renderAttachment(attachment, i))}
          <div className={`${styles['note-actions']} ${editingNote === fileName ? styles['editing'] : ''}`}>
            <button onClick={() => deleteNote(fileName, metadata?.isReply)}>
              <Trash2 size={16} /> Delete
            </button>
            {editingNote === fileName ? (
              <>
                <button onClick={() => saveEdit(fileName)}>
                  <Save size={16} /> Save
                </button>
                <button onClick={() => setEditingNote(null)}>
                  <Cancel size={16} /> Cancel
                </button>
              </>
            ) : (
              <button onClick={() => startEditing(fileName, content)}>
                <Edit2 size={16} /> Edit
              </button>
            )}
            {!metadata?.isReply && !editingNote && (
              <button onClick={startReplying}>
                <MessageSquare size={16} /> Reply
              </button>
            )}
          </div>
          {isReplying && (
            <div className={styles['reply-container']}>
              <MarkdownEditor content={replyContent} setContent={setReplyContent} />
              <div className={styles['reply-actions']}>
                <button onClick={() => { addReply(replyContent); setIsReplying(false); setReplyContent(''); }}>
                  <Save size={16} /> Submit Reply
                </button>
                <button onClick={cancelReply}>
                  <Cancel size={16} /> Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {metadata?.replies?.map((replyFileName: string, index: number) => (
        <ReplyItem 
          key={replyFileName} 
          fileName={replyFileName} 
          parentFileName={fileName}
          deleteNote={deleteNote}
          isLast={index === metadata.replies.length - 1}
          addReply={addReply}
        />
      ))}
    </>
  );
});

export default NoteItem;
