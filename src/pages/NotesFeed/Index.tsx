import React from 'react';
import styles from './NotesFeed.module.scss';
import { NotesProvider, useNotes } from '../../contexts/NotesContext';
import SearchBar from './SearchBar';
import NoteItem from './NoteItem';
import { useActionButtons } from '../../contexts/ActionButtons';

const NotesList: React.FC = () => {
  const { filteredNotes } = useNotes();

  return (
    <>
      {filteredNotes.map((note, index) => (
        <React.Fragment key={index}>
          <NoteItem note={note} />
          {/* <div className={styles['note-divider']}></div> */}
        </React.Fragment>
      ))}
    </>
  );
};

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