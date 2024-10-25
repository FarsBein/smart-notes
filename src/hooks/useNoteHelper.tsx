import { useEffect, useState } from 'react';
import { useNotes } from '../contexts/NotesContext';

export const useNotesHelper = () => {
    const { filterByTags, setSelectedTags } = useNotes();

    const [editingNote, setEditingNote] = useState<string | null>(null);
    const [editContent, setEditContent] = useState<string>('');
    const [editTags, setEditTags] = useState<string>('');

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

    const getRelativeTime = (date: string): string => {
        const now = new Date();
        const pastDate = new Date(date);
        const seconds = Math.floor((now.getTime() - pastDate.getTime()) / 1000);

        let interval = Math.floor(seconds / 31536000);
        if (interval >= 1) {
            return `${interval} yr${interval !== 1 ? 's' : ''} ago`;
        }
        interval = Math.floor(seconds / 2592000);
        if (interval >= 1) {
            return `${interval} mo${interval !== 1 ? 's' : ''} ago`;
        }
        interval = Math.floor(seconds / 86400);
        if (interval >= 1) {
            return `${interval} day${interval !== 1 ? 's' : ''} ago`;
        }
        interval = Math.floor(seconds / 3600);
        if (interval >= 1) {
            return `${interval} hr${interval !== 1 ? 's' : ''} ago`;
        }
        interval = Math.floor(seconds / 60);
        if (interval >= 1) {
            return `${interval} min${interval !== 1 ? 's' : ''} ago`;
        }
        return `${seconds} sec${seconds !== 1 ? 's' : ''} ago`;
    };

    const handleTagClick = (tag: string) => {
        setSelectedTags(prev => {
            const newTags = [...prev, tag];
            filterByTags(newTags);
            return newTags;
        });
    };

    const isVisible = (basicSearchQuery: string, content: string) => !basicSearchQuery || (content && content.toLowerCase().includes(basicSearchQuery.toLowerCase()));

    const startEditing = (fileName: string, content: string, tags: string[]) => {
        setEditingNote(fileName);
        setEditContent(content);
        setEditTags(tags.join(' ') || '');
    };

    const saveEdit = async (fileName: string) => {
        try {
            const newTags = editTags.trim().split(/\s+/).filter(tag => tag.startsWith('#'));
            await window.electron.ipcRenderer.invoke('update-note', fileName, editContent, newTags);
            setEditingNote(null);
            return { content: editContent, tags: newTags };
        } catch (error) {
            console.error('Failed to update note:', error);
            return null;
        }
    };

    return {
        editContent,
        setEditContent,
        editTags,
        setEditTags,
        editingNote,
        setEditingNote,
        handleTagInputChange,
        getRelativeTime,
        handleTagClick,
        isVisible,
        startEditing,
        saveEdit,
    };
};
