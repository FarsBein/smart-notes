import React, { useEffect, useState, useRef } from 'react';
import styles from './NotesFeed.module.scss';
import { useNotes } from '../../contexts/NotesContext';
import SearchBar from './SearchBar';
import NoteItem from '../../components/NoteItem/NoteItem';
import { useActionButtons } from '../../contexts/ActionButtons';
import Notification from '../../components/Notification/Notification';
import BottomBar from '@/components/BottomBar/BottomBar';

const NotesList: React.FC = () => {
  const { parentNotesFileNames, filteredParentNotesFileNames, allNotesContent, allNotesMetadata } = useNotes();
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState<{fileName: string, content: string} | null>(null);
  const notesListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleNewNote = (newNote: { fileName: string, content: string }) => {
      setNotification(newNote);
    };

    window.electron.ipcRenderer.on('new-notes-sent', handleNewNote);
    return () => {
      window.electron.ipcRenderer.removeListener('new-notes-sent', handleNewNote);
    };
  }, []);

  const scrollToTop = () => {
    notesListRef.current?.scrollIntoView({ behavior: 'smooth'});
  };

  const isDataReady = () => {
    return parentNotesFileNames !== undefined && 
           allNotesContent !== undefined && 
           allNotesMetadata !== undefined;
  };

  useEffect(() => {
    if (isDataReady()) {
      setIsLoading(false);
    }
  }, [parentNotesFileNames, allNotesContent, allNotesMetadata]);

  
  console.log('parentNotesFileNames:', parentNotesFileNames);
  console.log('allNotesContent:', allNotesContent);
  const notesToDisplay = filteredParentNotesFileNames ?? parentNotesFileNames;

  if (isLoading) {
    return <div>Loading notes...</div>;
  }

  if (!notesToDisplay?.length) {
    return (
      <div style={{ 
        textAlign: 'center', 
        padding: 'var(--spacing-8)',
        color: 'var(--color-text-secondary)'
      }}>
        No notes yet. Press Ctrl+Shift+N to create your first note.
      </div>
    );
  }

  return (
    <div ref={notesListRef}>
      {notification && (
        <Notification
          message="New note created"
          onClose={() => setNotification(null)}
          onClick={scrollToTop}
        />
      )}
      {notesToDisplay.map((fileName: string) => {
        // Only render if we have both content and metadata
        if (!allNotesContent[fileName] || !allNotesMetadata[fileName]) {
          console.warn(`Missing data for note: ${fileName}`);
          return null;
        }

        return (
          <div className={styles.noteContainer} key={fileName}>
            <NoteItem
              key={fileName}
              fileName={fileName}
              fileContent={allNotesContent[fileName]}
              fileMetadata={allNotesMetadata[fileName]}
              isLast={!allNotesMetadata[fileName]?.replies?.length}
            />
            {allNotesMetadata[fileName]?.replies?.map((replyFileName: string, index: number) => {
              // Only render replies if we have both content and metadata
              if (!allNotesContent[replyFileName] || !allNotesMetadata[replyFileName]) {
                console.warn(`Missing data for reply: ${replyFileName}`);
                return null;
              }

              return (
                <NoteItem
                  key={replyFileName}
                  fileName={replyFileName}
                  fileContent={allNotesContent[replyFileName]}
                  fileMetadata={allNotesMetadata[replyFileName]}
                  isLast={index === allNotesMetadata[fileName].replies.length - 1}
                />
              );
            })}
            {/* <div className={styles.noteDivider}></div> */}
          </div>
        );
      })}
      <BottomBar scrollToTop={scrollToTop} />
    </div>
  );
};

const NotesFeed: React.FC = () => {
  const { isSearchOpen } = useActionButtons();

  return (
    <div className={styles.notesList}>
      {isSearchOpen && <SearchBar />}
      <NotesList />
    </div>
  );
};

export default NotesFeed;
