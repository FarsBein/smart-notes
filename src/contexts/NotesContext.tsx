import React, { createContext, useState, useEffect, useContext } from 'react';

interface Note {
    fileName: string;
    content: string;
    updatedAt: string;
    attachments?: string[];
    tags?: string[];
}

interface NotesContextType {
    notes: Note[];
    setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
    filteredNotes: Note[];
    setFilteredNotes: React.Dispatch<React.SetStateAction<Note[]>>;
    searchQuery: string;
    setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    isSemanticSearch: boolean;
    setIsSemanticSearch: React.Dispatch<React.SetStateAction<boolean>>;
    editingNote: string | null;
    setEditingNote: React.Dispatch<React.SetStateAction<string | null>>;
    editContent: string;
    setEditContent: React.Dispatch<React.SetStateAction<string>>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSemanticSearch, setIsSemanticSearch] = useState(true);
    const [editingNote, setEditingNote] = useState<string | null>(null);
    const [editContent, setEditContent] = useState<string>('');

    useEffect(() => {
        const handleNotesData = (notesData: Note[]) => {
            console.log('get-notes notesData:', notesData);
            setNotes(notesData);
            setFilteredNotes(notesData); // Initialize filtered notes
        };

        window.electron.ipcRenderer.send('get-notes');
        window.electron.ipcRenderer.on('notes-data', handleNotesData);

        return () => {
            window.electron.ipcRenderer.removeListener('notes-data', handleNotesData);
        };
    }, []);

    useEffect(() => {
        const handleSaveResult = (newNote: Note) => {
            console.log('new-note:', newNote);
            setNotes((prevNotes) => [newNote, ...prevNotes]);
            setFilteredNotes((prevNotes) => [newNote, ...prevNotes]);
        };

        window.electron.ipcRenderer.on('new-note', handleSaveResult);

        return () => {
            window.electron.ipcRenderer.removeListener('new-note', handleSaveResult);
        };
    }, []);

    useEffect(() => {
        const handleDeleteResult = (result: { success: boolean, fileName?: string, error?: string }) => {
            if (result.success) {
                setNotes((prevNotes) => prevNotes.filter(note => note.fileName !== result.fileName));
                setFilteredNotes((prevNotes) => prevNotes.filter(note => note.fileName !== result.fileName));
            } else {
                console.error('Failed to delete note:', result.error);
            }
        };

        window.electron.ipcRenderer.on('delete-note-result', handleDeleteResult);

        return () => {
            window.electron.ipcRenderer.removeListener('delete-note-result', handleDeleteResult);
        };
    }, []);

    // handle delete reply
    useEffect(() => {
        const handleDeleteReplyResult = (result: { success: boolean, parentFileName?: string, replyFileName?: string, error?: string }) => {
            console.log('delete-reply-result:', result);
            setNotes((prevNotes) => prevNotes.map((note: Note) => {
                if (note.fileName === result.parentFileName) {
                    return { ...note, replies: note.replies.filter((reply: Note) => reply.fileName !== result.replyFileName) };
                }
                return note;
            }));
        };

        window.electron.ipcRenderer.on('delete-reply-result', handleDeleteReplyResult);

        return () => {
            window.electron.ipcRenderer.removeListener('delete-reply-result', handleDeleteReplyResult);
        };
    }, []);

    useEffect(() => {
        const handleUpdateResult = (result: { success: boolean, fileName?: string, updatedAt?: string, error?: string }) => {
            if (result.success) {
                setNotes((prevNotes) => prevNotes.map(note => note.fileName === result.fileName ? { ...note, content: editContent, updatedAt: result.updatedAt } : note));
                setFilteredNotes((prevNotes) => prevNotes.map(note => note.fileName === result.fileName ? { ...note, content: editContent, updatedAt: result.updatedAt } : note));
                setEditingNote(null);
            } else {
                console.error('Failed to update note:', result.error);
            }
        };

        window.electron.ipcRenderer.on('update-note-result', handleUpdateResult);

        return () => {
            window.electron.ipcRenderer.removeListener('update-note-result', handleUpdateResult);
        };
    }, [editContent]);

    useEffect(() => {
        const handleSearchResults = (result: { success: boolean, notesData?: Note[], error?: string }) => {
            console.log('search-result:', result);
            if (result.success) {
                setFilteredNotes(result.notesData || []);
            } else {
                console.error('Error searching notes:', result.error);
            }
        };

        window.electron.ipcRenderer.on('search-result', handleSearchResults);

        return () => {
            window.electron.ipcRenderer.removeListener('search-result', handleSearchResults);
        };
    }, []);


    const value = {
        notes,
        setNotes,
        filteredNotes,
        setFilteredNotes,
        searchQuery,
        setSearchQuery,
        isSemanticSearch,
        setIsSemanticSearch,
        editingNote,
        setEditingNote,
        editContent,
        setEditContent,
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

