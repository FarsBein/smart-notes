import React, { useCallback, useEffect, useState } from 'react';
import { Dot } from 'lucide-react';
import styles from './NoteItem.module.scss';
import { useNotes } from '../../contexts/NotesContext';
import { useAttachment } from '@/hooks/UseAttachment/useAttachment';
import { HighlightPicker, highlightOptions } from '@/components/HighlightPicker/HighlightPicker';

import MarkdownViewer from '../NewMarkdownEditor/Viewer/MarkdownViewer';
import { Editor, EditorRef } from '../../components/NewMarkdownEditor/Editor';
import { useRef } from 'react';

interface NoteItemProps {
  fileName: string;
  fileContent: string;
  fileMetadata: NoteMetadata;
  isLast: boolean; // Used for ReplyItem to determine UI rendering
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
  // const [editContent, setEditContent] = useState<string>(content);
  const [editTags, setEditTags] = useState<string>(metadata.tags.join(' ') + ' ');
  const [replyTags, setReplyTags] = useState<string>('');
  // const [replyContent, setReplyContent] = useState<string>('');
  const [isReplying, setIsReplying] = useState<boolean>(false);
  const [selectedHighlight, setSelectedHighlight] = useState<string>('None');

  const editorRef = useRef<EditorRef>(null);
  const replyEditorRef = useRef<EditorRef>(null);

  useEffect(() => {
    if (metadata.highlight) {
      setSelectedHighlight(metadata.highlight);
    }
  }, [metadata.highlight]);

  // TODO duplicate code
  const getMarkdownFromEditor = async () => {
    try {
      if (editorRef.current) {
        const markdown = editorRef.current.getMarkdown();
        console.log('markdown:', markdown);
        return markdown;
      }
    } catch (error) {
      console.error('Failed to get markdown from editor:', error);
      return '';
    }
  };

  const getMarkdownFromReplyEditor = async () => {
    try {
      if (replyEditorRef.current) {
        const markdown = replyEditorRef.current.getMarkdown();
        console.log('markdown:', markdown);
        return markdown;
      }
    } catch (error) {
      console.error('Failed to get markdown from editor:', error);
      return '';
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

  // TODO: make it so it update every few seconds
  const getRelativeTime = (date: string): string => {
    const now = new Date();
    const pastDate = new Date(date);
    const seconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);

    let interval = Math.floor(seconds / 31536000);
    if (interval >= 1) {
      return `${interval} year${interval !== 1 ? 's' : ''} ago`;
    }
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
      return `${interval} month${interval !== 1 ? 's' : ''} ago`;
    }
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
      return `${interval} day${interval !== 1 ? 's' : ''} ago`;
    }
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
      return `${interval} hour${interval !== 1 ? 's' : ''} ago`;
    }
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
      return `${interval} minute${interval !== 1 ? 's' : ''} ago`;
    }
    return `${seconds} second${seconds !== 1 ? 's' : ''} ago`;
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
    setEditTags(metadata.tags.join(' ') + ' ');
    editorRef.current?.focus();
  };

  const saveEdit = async () => {
    try {
      const editContent = await getMarkdownFromEditor();
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
    // Add a small delay to ensure the reply container is rendered before ref is available
    setTimeout(() => {
      replyEditorRef.current?.focus();
    }, 100);
  };

  const cancelReply = () => {
    setIsReplying(false);
  };

  const addReply = async () => {
    try {
      // TODO UPDATE Meta data using result.metadata
      const replyContent = await getMarkdownFromReplyEditor();
      const tags = replyTags.trim().split(/\s+/).filter(tag => tag.startsWith('#'));
      const parentFileName = metadata.isReply ? metadata.parentFileName : fileName;
      const result = await window.electron.ipcRenderer.invoke('save-reply', replyContent, [], parentFileName, tags, selectedHighlight);
      const newReplyFileName = result.fileName;
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
      <div className={styles.container}>
        <div className={styles.legend}>
          <HighlightPicker
            selectedHighlight={selectedHighlight}
            setSelectedHighlight={updateSelectedHighlight}
          />
          {(!isLast || isReplying) && <div className={styles.legendLine} style={{ backgroundColor: highlightOptions[selectedHighlight as keyof typeof highlightOptions] }} />}
        </div>
        <div className={styles.content}>
          <div className={styles.contentText}>
            {editing ? (
              <>
                <Editor content={content} ref={editorRef} />
                <input
                  type="text"
                  value={editTags}
                  onChange={handleTagInputChange}
                  placeholder="Enter tags..."
                  className={styles.tagInput}
                />
              </>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 'var(--spacing-1)', justifyContent: 'space-between' }}>
                  <MarkdownViewer content={content || ''} />
                </div>
              </>
            )}
          </div>
          {attachmentsComponent(metadata.attachments)}
          <div className={styles.footerContainer}>
            <div className={styles.metadata}>
              <div className={styles.metadataTags}>
                <div className={styles.metadataDate}>{getRelativeTime(metadata.updatedAt)}</div>
                {metadata.tags.map((tag, i) => (
                  <React.Fragment key={i}>
                    <Dot size={8} className={styles.metadataDot} />
                    <span onClick={() => handleTagClick(tag)} key={i}>
                      {tag}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            </div>
            <div className={`${styles.actions} ${editing ? styles.editing : ''}`}>
              <button className={styles.actionsDelete} onClick={deleteNote}>
                Delete
              </button>
              {editing ? (
                <>
                  <button className={styles.actionsSave} onClick={saveEdit}>
                    Save
                  </button>
                  <button className={styles.actionsCancel} onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button className={styles.actionsEdit} onClick={startEditing}>
                  Edit
                </button>
              )}
              <button className={styles.actionsReply} onClick={startReplying}>
                Reply
              </button>
            </div>
          </div>

        </div>
      </div>
      <div style={{ height: 'var(--spacing-4)' }}></div>
      {isReplying && (
        <div className={styles.container}>

          <div className={styles.legend}>
            <HighlightPicker
              selectedHighlight={selectedHighlight}
              setSelectedHighlight={updateSelectedHighlight}
            />
            {!isLast && <div className={styles.legendLine} style={{ backgroundColor: highlightOptions[selectedHighlight as keyof typeof highlightOptions] }} />}
          </div>

          <div className={styles.content}>
            <div className={styles.contentText}>
              <Editor ref={replyEditorRef} />
              <input
                type="text"
                value={replyTags}
                onChange={handleReplyTagInputChange}
                placeholder="Enter tags..."
                className={styles.tagInput}
              />
            </div>

            <div className={styles.actions}>
              <button onClick={addReply} className={styles.actionsSave}>
                Submit Reply
              </button>
              <button onClick={cancelReply} className={styles.actionsCancel}>
                Cancel
              </button>
            </div>
          </div>

        </div>
      )}
      <div style={{ height: 'var(--spacing-4)' }}></div>
    </>
  );
});

export default NoteItem;
