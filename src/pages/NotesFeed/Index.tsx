import React, { useEffect, useState } from 'react';
import styles from './NotesFeed.module.scss';
import { NotesProvider, useNotes } from '../../contexts/NotesContext';
import SearchBar from './SearchBar';
import NoteItem from './NoteItem';
import { useActionButtons } from '../../contexts/ActionButtons';

const NotesList: React.FC = () => {
  const { notes } = useNotes();

  if (!notes) {
    return <div>Loading notes...</div>;
  }

  return (
    <>
      {notes.length > 0 ? notes.map((note: NoteWithReplies) => (
        <React.Fragment key={note.fileName}>
          <NoteItem note={note} />
          {note.replies.map((reply, index) => (
            <React.Fragment key={index}>
              <NoteItem note={reply as NoteWithReplies} />
            </React.Fragment>
          ))}
          {/* <div className={styles['note-divider']}></div> */}
        </React.Fragment>
      )) : <div>No notes found</div>}
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
