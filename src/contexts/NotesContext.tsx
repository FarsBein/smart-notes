import React, { createContext, useState, useEffect, useContext } from 'react';

interface Note {
    fileName: string;
    content: string;
    updatedAt: string;
    attachments?: string[];
    tags?: string[];
}

interface NotesContextType {
    filteredNotes: NoteWithReplies[];
    setFilteredNotes: React.Dispatch<React.SetStateAction<NoteWithReplies[] | null>>;
    notes: NoteWithReplies[];
    setNotes: React.Dispatch<React.SetStateAction<NoteWithReplies[]>>;
    basicSearchQuery: string;
    setBasicSearchQuery: React.Dispatch<React.SetStateAction<string>>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    
    const [notes, setNotes] = useState<NoteWithReplies[]>(null);
    const [filteredNotes, setFilteredNotes] = useState<NoteWithReplies[] | null>(null);
    const [basicSearchQuery, setBasicSearchQuery] = useState<string>('');
    
    useEffect(() => {
        const initializeNoteIndex = async () => {
            const indexes = await window.electron.ipcRenderer.invoke('get-parent-indexes');
            setNotes(indexes);
        };

        initializeNoteIndex();
    }, []);

    useEffect(() => {
        const handleNewNote = async (newNote: NoteWithReplies) => {
            setNotes(prevNotes => [newNote, ...prevNotes]);
        };

        window.electron.ipcRenderer.on('new-note', handleNewNote);

        return () => {
            window.electron.ipcRenderer.removeListener('new-note', handleNewNote);
        };
    }, []);

    useEffect(() => {
        const handleSearchResults = (result: { success: boolean, notesData?: NoteWithReplies[], error?: string }) => {
            if (result.success) {
                setFilteredNotes(result.notesData || null);
            } else {
                console.error('Error searching notes:', result.error);
            }
        };

        window.electron.ipcRenderer.on('semantic-search-result', handleSearchResults);

        return () => {
            window.electron.ipcRenderer.removeListener('semantic-search-result', handleSearchResults);
        };
    }, []);

    const value = {
        filteredNotes,
        setFilteredNotes,
        notes,
        setNotes,
        basicSearchQuery,
        setBasicSearchQuery,
    };

    return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
};

export const useNotes = () => {
    const context = useContext(NotesContext);
    if (context === undefined) {
        throw new Error('useNotes must be used within a NotesProvider');
    }
    return context;
};
