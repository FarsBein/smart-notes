import React, { useCallback, useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Trash2, Edit2, Save, X as Cancel, MessageSquare } from 'lucide-react';
import styles from './NotesFeed.module.scss';
import { useNotes } from '../../contexts/NotesContext';
import MarkdownEditor from '@/components/MarkdownEditor/MarkdownEditor';
import { useAttachment } from '@/hooks/useAttachment';
import { HighlightOption, HighlightPicker } from '@/components/HighlightPicker/HighlightPicker';

interface NoteItemProps {
  fileName: string;
  fileContent?: string;
  fileMetadata?: NoteMetadata;
  isLast?: boolean; // Used for ReplyItem to determine UI rendering
}
// TODO: Optimize this component so it doesn't re-render on a change of another note's content or metadata
const NoteItem: React.FC<NoteItemProps> = React.memo(({ fileName, fileContent, fileMetadata, isLast }) => {

  if (!fileContent || !fileMetadata) {
    console.error('fileContent:', fileContent);
    console.error('fileMetadata:', fileMetadata);
  }

  const { basicSearchQuery, setParentNotesFileNames, filterByTags, setSelectedTags, setAllNotesContent, setAllNotesMetadata } = useNotes();
  const { attachmentsComponent } = useAttachment();

  const [content, setContent] = useState<string>(fileContent);
  const [metadata, setMetadata] = useState<NoteMetadata>(fileMetadata);
  const [editing, setEditing] = useState<boolean>(false);
  const [editContent, setEditContent] = useState<string>(content);
  const [editTags, setEditTags] = useState<string>(metadata.tags.join(' ') + ' ');
  const [replyTags, setReplyTags] = useState<string>('');
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [replyContent, setReplyContent] = useState<string>('');
  const [selectedHighlight, setSelectedHighlight] = useState<string>('None');

  useEffect(() => {
    if (metadata.highlight) {
      setSelectedHighlight(metadata.highlight);
    }
  }, [metadata.highlight]);

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

  const handleReplyTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.endsWith(' ')) {
      const words = value.trim().split(/\s+/);
      words[words.length - 1] = words[words.length - 1].startsWith('#')
        ? words[words.length - 1]
        : '#' + words[words.length - 1];
      setReplyTags(words.join(' ') + ' ');
    } else {
      setReplyTags(value);
    }
  };

  const getRelativeTime = (date: string): string => {
    const now = new Date();
    const pastDate = new Date(date);
    const seconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return `${interval} year${interval !== 1 ? 's' : ''}`;
    }
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return `${interval} month${interval !== 1 ? 's' : ''}`;
    }
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return `${interval} day${interval !== 1 ? 's' : ''}`;
    }
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return `${interval} hour${interval !== 1 ? 's' : ''}`;
    }
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return `${interval} minute${interval !== 1 ? 's' : ''}`;
    }
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  };

  const handleTagClick = (tag: string) => {
    setSelectedTags(prev => {
      const newTags = [...prev, tag];
      filterByTags(newTags);
      return newTags;
    });
  };

  const isVisible = (basicSearchQuery: string, content: string) => !basicSearchQuery || (content && content.toLowerCase().includes(basicSearchQuery.toLowerCase()));

  const startEditing = () => {
    setEditing(true);
    setEditContent(content);
    setEditTags(metadata.tags.join(' ') + ' ');
  };

  const saveEdit = async () => {
    try {
      const newTags = editTags.trim().split(/\s+/).filter(tag => tag.startsWith('#'));
      await window.electron.ipcRenderer.invoke('update-note', fileName, editContent, newTags);
      setContent(editContent);
      setMetadata(prev => ({ ...prev, tags: newTags }));
      setEditing(false);
      return { content: editContent, tags: newTags };
    } catch (error) {
      console.error('Failed to update note:', error);
      return null;
    }
  };

  const deleteNote = async () => {
    try {
      if (metadata.isReply) {
        await window.electron.ipcRenderer.invoke('delete-reply', fileName);
        setParentNotesFileNames(prev => prev.filter(name => name !== fileName));

        setAllNotesContent(prev => {
          const newContent = { ...prev };
          delete newContent[fileName];
          return newContent;
        });
        setAllNotesMetadata(prev => {
          const newMetadata = {
            ...prev, [metadata.parentFileName]: {
              ...prev[metadata.parentFileName],
              replies: prev[metadata.parentFileName].replies.filter(replyFileName => replyFileName !== fileName),
            }
          };
          delete newMetadata[fileName];
          return newMetadata;
        });
      } else {
        await window.electron.ipcRenderer.invoke('delete-note', fileName);
        setParentNotesFileNames(prev => prev.filter(name => name !== fileName));
        setAllNotesContent(prev => {
          const newContent = { ...prev };
          delete newContent[fileName];
          return newContent;
        });
        setAllNotesMetadata(prev => {
          const newMetadata = { ...prev };
          delete newMetadata[fileName];
          return newMetadata;
        });
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const startReplying = () => {
    setIsReplying(true);
  };

  const cancelReply = () => {
    setIsReplying(false);
    setReplyContent('');
  };

  const addReply = async () => {
    try {
      const tags = replyTags.trim().split(/\s+/).filter(tag => tag.startsWith('#'));
      const parentFileName = metadata.isReply ? metadata.parentFileName : fileName;
      const newReplyFileName = await window.electron.ipcRenderer.invoke('save-reply', replyContent, [], parentFileName, tags, selectedHighlight);

      setAllNotesContent(prev => ({
        ...prev,
        [newReplyFileName]: replyContent,
      }));
      setAllNotesMetadata(prev => ({
        ...prev,
        [parentFileName || fileName]: {
          ...prev[parentFileName || fileName],
          replies: [...prev[parentFileName || fileName].replies, newReplyFileName],
        },
        [newReplyFileName]: {
          title: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          highlight: false,
          highlightColor: '',
          tags: tags,
          attachments: [],
          parentFileName,
          replies: [],
          isReply: true,
          isAI: false,
        },
      }));

      setIsReplying(false);
      setReplyContent('');
      setReplyTags('');
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  };

  const updateSelectedHighlight = useCallback((newHighlight: string) => {
    setSelectedHighlight(newHighlight);
    window.electron.ipcRenderer.invoke('update-highlight', fileName, newHighlight);
  }, [fileName]);

  if (!isVisible(basicSearchQuery, content)) {
    return null;
  }

  return (
    <>
      <div className={styles['notes-container']}>
        <div className={styles['note-legend']}>
          <HighlightPicker
            selectedHighlight={selectedHighlight}
            setSelectedHighlight={updateSelectedHighlight}
          />
          {!isLast && <div className={styles['note-legend-line']} />}
        </div>
        <div className={styles['note-content']}>
          <div className={styles['note-content-text']}>
            {editing ? (
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
                  <div className={styles['note-date']}>{getRelativeTime(metadata.updatedAt)}</div>
                  <div style={{ width: 'var(--spacing-3)' }}></div>
                  <div className={styles['note-tags']}>
                    {metadata.tags.length > 0
                      ? metadata.tags.map((tag, i) => (
                        <span onClick={() => handleTagClick(tag)} key={i}>
                          {tag}
                        </span>
                      ))
                      : <span style={{ height: 'var(--spacing-5)' }}></span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--spacing-1)', justifyContent: 'space-between' }}>
                  <ReactMarkdown>{content || ''}</ReactMarkdown>
                </div>
              </>
            )}
          </div>
          {attachmentsComponent(metadata.attachments)}
          <div className={`${styles['note-actions']} ${editing ? styles['editing'] : ''}`}>
            <button onClick={deleteNote}>
              <Trash2 size={16} /> Delete
            </button>
            {editing ? (
              <>
                <button onClick={saveEdit}>
                  <Save size={16} /> Save
                </button>
                <button onClick={() => setEditing(false)}>
                  <Cancel size={16} /> Cancel
                </button>
              </>
            ) : (
              <button onClick={startEditing}>
                <Edit2 size={16} /> Edit
              </button>
            )}
            <button onClick={startReplying}>
              <MessageSquare size={16} /> Reply
            </button>
          </div>
          {isReplying && (
            <div className={styles['reply-container']}>
              <MarkdownEditor content={replyContent} setContent={setReplyContent} />
              <input
                type="text"
                value={replyTags}
                onChange={handleReplyTagInputChange}
                placeholder="Enter tags..."
                className={styles['tag-input']}
              />
              <div className={styles['reply-actions']}>
                <button onClick={addReply}>
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
      {/* {metadata.replies.map((replyFileName, index) => (
        <NoteItem
          key={replyFileName}
          fileName={replyFileName}
          isLast={index === metadata.replies.length - 1}
        />
      ))} */}
    </>
  );
});

export default NoteItem;
