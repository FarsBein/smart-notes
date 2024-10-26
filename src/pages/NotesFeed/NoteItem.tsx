import React, { useRef, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Trash2, Edit2, Save, X as Cancel, MessageSquare } from 'lucide-react';
import styles from './NotesFeed.module.scss';
import { useNotes } from '../../contexts/NotesContext';
import MarkdownEditor from '@/components/MarkdownEditor/MarkdownEditor';
import ReplyItem from './ReplyItem';
import { useAttachment } from '@/hooks/useAttachment';
import { useNotesHelper } from '@/hooks/useNoteHelper';

interface NoteItemProps {
  fileName: string;
}

const NoteItem: React.FC<NoteItemProps> = React.memo(({ fileName }) => {
  const { basicSearchQuery, setParentNotesFileNames } = useNotes();
  const { attachmentsComponent } = useAttachment();
  const { getRelativeTime, handleTagClick, isVisible, startEditing, saveEdit, editingNote, setEditingNote, editContent, setEditContent, editTags, setEditTags, handleTagInputChange } = useNotesHelper();

  const [content, setContent] = useState<string>('');
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

  const handleStartEditing = () => {
    startEditing(fileName, content, metadata?.tags || []);
  };

  const handleSaveEdit = async () => {
    const result = await saveEdit(fileName);
    if (result) {
      setContent(result.content);
      setMetadata(prevMetadata => ({ ...prevMetadata, tags: result.tags }));
    }
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

  if (!isVisible(basicSearchQuery, content)) {
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
                <div className={styles['note-tags-container']}>
                  <div className={styles['note-date']} >{getRelativeTime(metadata?.updatedAt)}</div>
                  <div style={{ width: 'var(--spacing-3)' }}></div>
                  <div className={styles['note-tags']}>
                    {metadata?.tags.length > 0 ? metadata?.tags?.map((tag: string, i: number) => <span onClick={() => handleTagClick(tag)} key={i}>{tag}</span>) : <span style={{ height: 'var(--spacing-5)' }}></span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-1)', justifyContent: 'space-between' }}>
                  <ReactMarkdown>{content || ''}</ReactMarkdown>
                </div>
              </>
            )}
          </div>
          {attachmentsComponent(metadata?.attachments)}
          <div className={`${styles['note-actions']} ${editingNote === fileName ? styles['editing'] : ''}`}>
            <button onClick={() => deleteNote(fileName, metadata?.isReply)}>
              <Trash2 size={16} /> Delete
            </button>
            {editingNote === fileName ? (
              <>
                <button onClick={handleSaveEdit}>
                  <Save size={16} /> Save
                </button>
                <button onClick={() => setEditingNote(null)}>
                  <Cancel size={16} /> Cancel
                </button>
              </>
            ) : (
              <button onClick={handleStartEditing}>
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
