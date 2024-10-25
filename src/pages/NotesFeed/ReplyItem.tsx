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
    const { getRelativeTime, handleTagClick, isVisible } = useNotesHelper();

    const [content, setContent] = useState<string>('');
    const [editingNote, setEditingNote] = useState<string | null>(null);
    const [editContent, setEditContent] = useState<string>('');
    const [metadata, setMetadata] = useState<NoteMetadata | null>(null);
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [editTags, setEditTags] = useState<string>('');

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
            console.error('Failed to update reply content:', error);
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
                                <div className={styles['note-tags']}>
                                    {metadata?.tags.length > 0 ? metadata?.tags?.map((tag: string, i: number) => <span onClick={() => handleTagClick(tag)} key={i}>{tag}</span>) :  <span style={{ height: 'var(--spacing-5)' }}></span>}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--spacing-3)', justifyContent: 'space-between'}}>
                                <ReactMarkdown>{content || ''}</ReactMarkdown>
                                <div className={styles['note-date']}>{getRelativeTime(metadata?.updatedAt)}</div>
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
                            <button onClick={() => saveEdit(fileName)}>
                                <Save size={16} /> Save
                            </button>
                            <button onClick={() => setEditingNote(null)}>
                                <Cancel size={16} /> Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => startEditing(fileName, content)}>
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
