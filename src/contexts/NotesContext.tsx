import React, { createContext, useState, useEffect, useContext } from 'react';
import { useActionButtons } from './ActionButtons';

interface NotesContextType {
    filteredParentNotesFileNames: string[];
    setFilteredParentNotesFileNames: React.Dispatch<React.SetStateAction<string[] | null>>;
    basicSearchQuery: string;
    setBasicSearchQuery: React.Dispatch<React.SetStateAction<string>>;
    parentNotesFileNames: string[];
    setParentNotesFileNames: React.Dispatch<React.SetStateAction<string[]>>;
    filterByTags: (tags: string[]) => void;
    selectedTags: string[];
    setSelectedTags: React.Dispatch<React.SetStateAction<string[]>>;
    allNotesContent: Record<string, string>;
    setAllNotesContent: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    allNotesMetadata: Record<string, NoteMetadata>;
    setAllNotesMetadata: React.Dispatch<React.SetStateAction<Record<string, NoteMetadata>>>;
}

const NotesContext = createContext<NotesContextType | undefined>(undefined);

export const NotesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    
    const [filteredParentNotesFileNames, setFilteredParentNotesFileNames] = useState<string[] | null>(null);
    const [basicSearchQuery, setBasicSearchQuery] = useState<string>('');
    const [parentNotesFileNames, setParentNotesFileNames] = useState<string[]>([]);
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const {setIsSearchOpen} = useActionButtons();
    const [allNotesContent, setAllNotesContent] = useState<Record<string, string>>({});
    const [allNotesMetadata, setAllNotesMetadata] = useState<Record<string, NoteMetadata>>({});

    useEffect(() => {
        const initializeNoteIndex = async () => {
            try {
                const parentNotesFileNames = await window.electron.ipcRenderer.invoke('get-parent-notes-file-names') || [];
                setParentNotesFileNames(parentNotesFileNames);

                const allNotesContent = await window.electron.ipcRenderer.invoke('get-all-notes-content') || {};
                setAllNotesContent(allNotesContent);

                const allNotesMetadata = await window.electron.ipcRenderer.invoke('get-all-notes-metadata') || {};
                setAllNotesMetadata(allNotesMetadata);

                console.log('initializeNoteIndex parentNotesFileNames:', parentNotesFileNames);
                console.log('initializeNoteIndex allNotesContent:', allNotesContent);
                console.log('initializeNoteIndex allNotesMetadata:', allNotesMetadata);
            } catch (error) {
                console.error('Error initializing note index:', error);
                // Set default empty values
                setParentNotesFileNames([]);
                setAllNotesContent({});
                setAllNotesMetadata({});
            }
        };

        initializeNoteIndex();
    }, []);

    useEffect(() => {
        const handleNewNote = (newNote: { fileName: string, content: string, metadata: NoteMetadata }) => {
            setParentNotesFileNames(prevParentNotesFileNames => [newNote.fileName, ...prevParentNotesFileNames]);
            setAllNotesContent(prevAllNotesContent => ({ ...prevAllNotesContent, [newNote.fileName]: newNote.content }));
            setAllNotesMetadata(prevAllNotesMetadata => ({ ...prevAllNotesMetadata, [newNote.fileName]: newNote.metadata }));
        };

        window.electron.ipcRenderer.on('new-note', handleNewNote);

        return () => {
            window.electron.ipcRenderer.removeListener('new-note', handleNewNote);
        };
    }, []);

    useEffect(() => {
        const handleUpdateMainWindowWithNewNotes = (newNotes: {fileName: string, content: string, metadata: NoteMetadata}[]) => {
            setParentNotesFileNames(prevParentNotesFileNames => [...newNotes.filter(note => !note.metadata.isReply).map(note => note.fileName), ...prevParentNotesFileNames]);
            setAllNotesContent(prevAllNotesContent => ({ ...prevAllNotesContent, ...newNotes.reduce((acc, note) => ({ ...acc, [note.fileName]: note.content }), {}) }));
            setAllNotesMetadata(prevAllNotesMetadata => ({ ...prevAllNotesMetadata, ...newNotes.reduce((acc, note) => ({ ...acc, [note.fileName]: note.metadata }), {}) }));
            console.log('handleUpdateMainWindowWithNewNotes newNotes:', newNotes);
        };

        window.electron.ipcRenderer.on('new-notes-sent', handleUpdateMainWindowWithNewNotes);
        return () => {
            window.electron.ipcRenderer.removeListener('new-notes-sent', handleUpdateMainWindowWithNewNotes);
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


    const filterByTags = async (tags: string[]) => {
        setIsSearchOpen(true);
        console.log('filterByTags tags:', tags);
        const filenamesThatContainsTags = await window.electron.ipcRenderer.invoke('get-filenames-that-contains-tags', tags);
        console.log('filterByTags filenamesThatContainsTags:', filenamesThatContainsTags);
        setFilteredParentNotesFileNames(filenamesThatContainsTags);
    };

    const value = {
        filteredParentNotesFileNames,
        setFilteredParentNotesFileNames,
        basicSearchQuery,
        setBasicSearchQuery,
        parentNotesFileNames,
        setParentNotesFileNames,
        filterByTags,
        selectedTags,
        setSelectedTags,
        allNotesContent,
        setAllNotesContent,
        allNotesMetadata,
        setAllNotesMetadata,
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
