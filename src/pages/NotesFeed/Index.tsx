import React, { useEffect, useState } from 'react';
import styles from './NotesFeed.module.scss';
import { NotesProvider, useNotes } from '../../contexts/NotesContext';
import SearchBar from './SearchBar';
import NoteItem from './NoteItem';
import { useActionButtons } from '../../contexts/ActionButtons';

const NotesList: React.FC = () => {
  const { parentNotesFileNames, filteredParentNotesFileNames, allNotesContent, allNotesMetadata } = useNotes();
  const [isLoading, setIsLoading] = useState(true);

  const isDataReady = () => (
    parentNotesFileNames &&
    parentNotesFileNames.length > 0 &&
    Object.keys(allNotesContent).length > 0 && // TODO: handle empty allNotesContent no notes
    Object.keys(allNotesMetadata).length > 0
  );

  useEffect(() => {
    if (isDataReady()) {
      setIsLoading(false);
    }
  }, [parentNotesFileNames, allNotesContent, allNotesMetadata]);

  if (isLoading) {
    return <div>Loading notes...</div>;
  }

  return (
    <>
      {(filteredParentNotesFileNames ?? parentNotesFileNames).map((fileName: string) => (
        <React.Fragment key={fileName}>
          <NoteItem
            fileName={fileName}
            fileContent={allNotesContent[fileName]}
            fileMetadata={allNotesMetadata[fileName]}
          />
        </React.Fragment>
      ))}
    </>
  );
}


const NotesFeed: React.FC = () => {
  const { isSearchOpen } = useActionButtons();

  return (
    <NotesProvider>
      <div className={styles['notes-container-wrapper']}>
        {isSearchOpen && <SearchBar />}
        <NotesList />
      </div>
    </NotesProvider>
  );
};

export default NotesFeed;
