import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Trash2, Edit2, Save, X as Cancel, MessageSquare } from 'lucide-react';
import styles from './NotesFeed.module.scss';
import { useNotes } from '../../contexts/NotesContext';
import MarkdownEditor from '@/components/MarkdownEditor/MarkdownEditor';
import { useAttachment } from '@/hooks/useAttachment';
import { useNotesHelper } from '@/hooks/useNoteHelper';

interface ReplyItemProps {
    fileName: string;
    parentFileName: string;
    isLast: boolean;
    addReply: (replyContent: string, tags: string[]) => Promise<void>;
    deleteNote: (fileName: string, isReply: boolean) => Promise<void>;
}

interface NoteMetadata {
    tags: string[];
    updatedAt: string;
    attachments: string[];
    replies: string[];
    isReply: boolean;
}

const ReplyItem: React.FC<ReplyItemProps> = React.memo(({ fileName, parentFileName, isLast, addReply, deleteNote }) => {
    const { basicSearchQuery } = useNotes();
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
            } catch (error) {
                console.error('Error fetching reply content:', error);
            }
        }
        getContent();
    }, [fileName]);

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

    if (!isVisible(basicSearchQuery, content)) {
        return null;
    }

    const startReplying = () => {
        setIsReplying(true);
    };

    const cancelReply = () => {
        setIsReplying(false);
        setReplyContent('');
    };

    const submitReply = async () => {
        await addReply(replyContent, editTags.trim().split(/\s+/).filter(tag => tag.startsWith('#')));
        setIsReplying(false);
        setReplyContent('');
        setEditTags('');
    };

    return (
        <div className={styles['notes-container']}>
            <div className={styles['note-legend']}>
                <div className={styles['note-legend-dot']} />
                {!isLast ? <div className={styles['note-legend-line']} /> : null}
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
                                    {metadata?.tags.length > 0 ? metadata?.tags?.map((tag: string, i: number) => <span onClick={() => handleTagClick(tag)} key={i}>{tag}</span>) :  <span style={{ height: 'var(--spacing-5)' }}></span>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'space-between'}}>
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
                        <>
                            <button onClick={handleStartEditing}>
                                <Edit2 size={16} /> Edit
                            </button>
                            <button onClick={startReplying}>
                                <MessageSquare size={16} /> Reply
                            </button>
                        </>
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
                            <button onClick={submitReply}>
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
    );
});

export default ReplyItem;
