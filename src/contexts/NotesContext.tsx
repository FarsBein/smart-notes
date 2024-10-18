import React, { createContext, useState, useEffect, useContext } from 'react';

interface NotesContextType {
    filteredParentNotesFileNames: string[];
    setFilteredParentNotesFileNames: React.Dispatch<React.SetStateAction<string[] | null>>;
    basicSearchQuery: string;
    setBasicSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    parentNotesFileNames: string[];
    setParentNotesFileNames: React.Dispatch<React.SetStateAction<string[]>>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    
    const [filteredParentNotesFileNames, setFilteredParentNotesFileNames] = useState<string[] | null>(null);
    const [basicSearchQuery, setBasicSearchQuery] = useState<string>('');
    const [parentNotesFileNames, setParentNotesFileNames] = useState<string[]>([]);

    useEffect(() => {
        const initializeNoteIndex = async () => {
            const parentNotesFileNames = await window.electron.ipcRenderer.invoke('get-parent-notes-file-names');
            setParentNotesFileNames(parentNotesFileNames);
            console.log('parentNotesFileNames:', parentNotesFileNames);
        };

        initializeNoteIndex();
    }, []);

    useEffect(() => {
        const handleNewNote = async (newNoteFileName: string) => {
            setParentNotesFileNames(prevParentNotesFileNames => [newNoteFileName, ...prevParentNotesFileNames]);
        };

        window.electron.ipcRenderer.on('new-note', handleNewNote);

        return () => {
            window.electron.ipcRenderer.removeListener('new-note', handleNewNote);
        };
    }, []);

    useEffect(() => {
        const handleSearchResults = (result: { success: boolean, notesData?: NoteMetadata[], error?: string }) => {
            if (result.success) {
                setFilteredParentNotesFileNames(result.notesData?.map(note => note.fileName) || null);
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
        filteredParentNotesFileNames,
        setFilteredParentNotesFileNames,
        basicSearchQuery,
        setBasicSearchQuery,
        parentNotesFileNames,
        setParentNotesFileNames,
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
