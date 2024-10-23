import React, { useEffect, useState } from 'react';
import styles from './NotesFeed.module.scss';
import { NotesProvider, useNotes } from '../../contexts/NotesContext';
import SearchBar from './SearchBar';
import NoteItem from './NoteItem';
import { useActionButtons } from '../../contexts/ActionButtons';

const NotesList: React.FC = () => {
  const { parentNotesFileNames, filteredParentNotesFileNames } = useNotes();

  if (!parentNotesFileNames) {
    return <div>Loading notes...</div>;
  }
  console.log('parentNotesFileNames:', parentNotesFileNames);

  return (
    <>
      {
      filteredParentNotesFileNames === null ? 
      parentNotesFileNames.map((fileName: string) => ( 
        <React.Fragment key={fileName}>
          <NoteItem fileName={fileName} />
          <div className={styles['note-divider']}></div>
        </React.Fragment>
      ))
      :
      filteredParentNotesFileNames.map((fileName: string) => (
        <React.Fragment key={fileName}>
          <NoteItem fileName={fileName} />
          <div className={styles['note-divider']}></div>
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
