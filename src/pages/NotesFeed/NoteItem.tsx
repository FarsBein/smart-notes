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
  const { basicSearchQuery, setParentNotesFileNames, filterByTags, selectedTags, setSelectedTags } = useNotes();

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
        console.log('getContent get-all-info result:', result);
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
          className={styles['note-attachment-image']}
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
      return `${interval} yr${interval !== 1 ? 's' : ''} ago`;
    }

    interval = Math.floor(seconds / 2592000); // months
    if (interval >= 1) {
      return `${interval} mo${interval !== 1 ? 's' : ''} ago`;
    }

    interval = Math.floor(seconds / 604800); // weeks
    if (interval >= 1) {
      return `${interval} wk${interval !== 1 ? 's' : ''} ago`;
    }

    interval = Math.floor(seconds / 86400); // days
    if (interval >= 1) {
      return `${interval} day${interval !== 1 ? 's' : ''} ago`;
    }

    interval = Math.floor(seconds / 3600); // hours
    if (interval >= 1) {
      return `${interval} hr${interval !== 1 ? 's' : ''} ago`;
    }

    interval = Math.floor(seconds / 60); // minutes
    if (interval >= 1) {
      return `${interval} min${interval !== 1 ? 's' : ''} ago`;
    }

    return `${seconds} sec${seconds !== 1 ? 's' : ''} ago`;
  };

  const startReplying = () => {
    setIsReplying(true);
  };

  const cancelReply = () => {
    setIsReplying(false);
    setReplyContent('');
  };

  const addReply = async (replyContent: string, tags: string[]) => {
    try {
      const newReplyFileName = await window.electron.ipcRenderer.invoke('save-reply', replyContent, [], fileName, tags);
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

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => {
        const newTags = [...prev, tag];
        filterByTags(newTags);
        return newTags;
    });
  };

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
                <div className={styles['note-tags-container']}>
                  <div className={styles['note-tags']}>
                    {metadata?.tags.length > 0 ? metadata?.tags?.map((tag: string, i: number) => <span onClick={() => handleTagClick(tag)} key={i}>{tag}</span>) : <span style={{ height: 'var(--spacing-5)' }}></span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-1)', justifyContent: 'space-between' }}>
                  <ReactMarkdown>{content || ''}</ReactMarkdown>
                  <div className={styles['note-date']}>{getRelativeTime(metadata?.updatedAt)}</div>
                </div>
              </>
            )}
          </div>
          <div className={styles['note-attachments']}>
            {metadata?.attachments?.map((attachment, i) => renderAttachment(attachment, i))}
          </div>
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
              <input
                type="text"
                value={editTags}
                onChange={handleTagInputChange}
                placeholder="Enter tags..."
                className={styles['tag-input']}
              />
              <div className={styles['reply-actions']}>
                <button onClick={() => { addReply(replyContent, editTags.trim().split(/\s+/).filter(tag => tag.startsWith('#'))); setIsReplying(false); setReplyContent(''); setEditTags(''); }}>
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
