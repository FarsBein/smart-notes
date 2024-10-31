import React, { useEffect, useState } from 'react';
import styles from './NotesFeed.module.scss';
import { useNotes } from '../../contexts/NotesContext';
import SearchBar from './SearchBar';
import NoteItem from '../../components/NoteItem/NoteItem';
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

  console.log('parentNotesFileNames:', parentNotesFileNames);
  console.log('allNotesContent:', allNotesContent);

  return (
    <>
      {(filteredParentNotesFileNames ?? parentNotesFileNames).map((fileName: string) => (
        <React.Fragment key={fileName}>
          <NoteItem
            key={fileName}
            fileName={fileName}
            fileContent={allNotesContent[fileName]}
            fileMetadata={allNotesMetadata[fileName]}
            isLast={allNotesMetadata[fileName]?.replies.length === 0}
          />
          {allNotesMetadata[fileName]?.replies.map((replyFileName: string, index: number) => (
            allNotesContent[replyFileName] &&
            <NoteItem
              key={replyFileName}
              fileName={replyFileName}
              fileContent={allNotesContent[replyFileName]}
              fileMetadata={allNotesMetadata[replyFileName]}
              isLast={index === allNotesMetadata[fileName].replies.length - 1}
            />
          ))}
          <div style={{ height: 'var(--spacing-7)' }}></div>
        </React.Fragment>
      ))}
    </>
  );
}

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
