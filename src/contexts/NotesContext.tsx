import React, { createContext, useState, useEffect, useContext } from 'react';
import NoteIndex from '../utils/NoteIndex';

interface Note {
    fileName: string;
    content: string;
    updatedAt: string;
    attachments?: string[];
    tags?: string[];
}

interface NotesContextType {
    noteIndex: NoteIndex;
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
    notes: NoteWithReplies[];
    setNotes: React.Dispatch<React.SetStateAction<NoteWithReplies[]>>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [noteIndex, setNoteIndex] = useState<NoteIndex | null>(null);
    const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [isSemanticSearch, setIsSemanticSearch] = useState(true);
    const [editingNote, setEditingNote] = useState<string | null>(null);
    const [editContent, setEditContent] = useState<string>('');
    const [notes, setNotes] = useState<NoteWithReplies[]>([]);
    useEffect(() => {
        const initializeNoteIndex = async () => {
            const indexes = await window.electron.ipcRenderer.invoke('get-parent-indexes');
            const newNoteIndex = new NoteIndex(indexes);
            setNoteIndex(newNoteIndex);
            setNotes(newNoteIndex.getAllParentNotes());
            console.log('noteIndex', newNoteIndex);
        };

        initializeNoteIndex();
    }, []);

    useEffect(() => {
        const handleNewNote = async (newNote: Note) => {
            if (noteIndex) {
                await noteIndex.updateNoteMetadata(newNote.fileName, newNote);
                setFilteredNotes(prevNotes => [newNote, ...prevNotes]);
            }
        };

        window.electron.ipcRenderer.on('new-note', handleNewNote);

        return () => {
            window.electron.ipcRenderer.removeListener('new-note', handleNewNote);
        };
    }, [noteIndex]);


    useEffect(() => {
        const handleDeleteReplyResult = async (result: { success: boolean, parentFileName?: string, replyFileName?: string, error?: string }) => {
            if (result.success && noteIndex && result.parentFileName && result.replyFileName) {
                const parentNote = noteIndex.getNoteMetadata(result.parentFileName);
                if (parentNote && parentNote.replies) {
                    const updatedReplies = parentNote.replies.filter(reply => reply.fileName !== result.replyFileName);
                    await noteIndex.updateNoteMetadata(result.parentFileName, { ...parentNote, replies: updatedReplies });
                    setFilteredNotes(prevNotes => prevNotes.map(note => 
                        note.fileName === result.parentFileName 
                            ? { ...note, replies: updatedReplies } 
                            : note
                    ));
                }
            } else {
                console.error('Failed to delete reply:', result.error);
            }
        };

        window.electron.ipcRenderer.on('delete-reply-result', handleDeleteReplyResult);

        return () => {
            window.electron.ipcRenderer.removeListener('delete-reply-result', handleDeleteReplyResult);
        };
    }, [noteIndex]);

    useEffect(() => {
        const handleUpdateResult = async (result: { success: boolean, fileName?: string, updatedAt?: string, error?: string }) => {
            if (result.success && noteIndex && result.fileName && result.updatedAt) {
                await noteIndex.updateContent(result.fileName, editContent);
                setFilteredNotes(prevNotes => prevNotes.map(note => 
                    note.fileName === result.fileName 
                        ? { ...note, content: editContent, updatedAt: result.updatedAt } 
                        : note
                ));
                setEditingNote(null);
            } else {
                console.error('Failed to update note:', result.error);
            }
        };

        window.electron.ipcRenderer.on('update-note-result', handleUpdateResult);

        return () => {
            window.electron.ipcRenderer.removeListener('update-note-result', handleUpdateResult);
        };
    }, [noteIndex, editContent]);

    useEffect(() => {
        const handleSearchResults = (result: { success: boolean, notesData?: Note[], error?: string }) => {
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
        noteIndex: noteIndex as NoteIndex, // Type assertion here
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
        notes,
        setNotes,
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
