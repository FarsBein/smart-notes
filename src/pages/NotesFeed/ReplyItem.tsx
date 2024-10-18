import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Trash2, Edit2, Save, X as Cancel, MessageSquare } from 'lucide-react';
import styles from './NotesFeed.module.scss';
import { useNotes } from '../../contexts/NotesContext';
import MarkdownEditor from '@/components/MarkdownEditor/MarkdownEditor';

interface ReplyItemProps {
    fileName: string;
    parentFileName: string;
    isLast: boolean;
    addReply: (replyContent: string) => Promise<void>;
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

    const [content, setContent] = useState<string>('');
    const [editingNote, setEditingNote] = useState<string | null>(null);
    const [editContent, setEditContent] = useState<string>('');
    const [metadata, setMetadata] = useState<NoteMetadata | null>(null);
    const [isReplying, setIsReplying] = useState(false);
    const [replyContent, setReplyContent] = useState('');

    console.log('ReplyItem:', fileName, parentFileName, isLast);
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
    };

    const saveEdit = async (fileName: string) => {
        try {
            await window.electron.ipcRenderer.invoke('update-reply-content', fileName, editContent);
            setContent(editContent);
            setEditingNote(null);
        } catch (error) {
            console.error('Failed to update reply content:', error);
        }
    };

    const renderAttachment = (attachment: string, index: number) => {
        try {
            const parsedAttachment = JSON.parse(attachment);
            if (typeof parsedAttachment === 'string' && parsedAttachment.startsWith('attachments/') && 
                (parsedAttachment.endsWith('.png') || parsedAttachment.endsWith('.jpg') || parsedAttachment.endsWith('.jpeg'))) {
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
        } catch (error) {
            console.error('Failed to parse attachment:', error);
            return <blockquote key={index}>{attachment}</blockquote>;
        }
    };

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

    if (basicSearchQuery && content && !content.toLowerCase().includes(basicSearchQuery.toLowerCase())) {
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
        await addReply(replyContent);
        setIsReplying(false);
        setReplyContent('');
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
                        <MarkdownEditor content={editContent} setContent={setEditContent} />
                    ) : (
                        <ReactMarkdown>{content || ''}</ReactMarkdown>
                    )}
                </div>
                {metadata?.attachments?.map((attachment, i) => renderAttachment(attachment, i))}
                <div className={styles['note-tags-container']}>
                    {metadata?.tags?.map((tag: string, i: number) => <span key={i}>{tag}</span>)}
                    <div className={styles['note-date']}>{metadata?.updatedAt ? getRelativeTime(metadata.updatedAt) : ''}</div>
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