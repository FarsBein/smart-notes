import React from 'react';
import { Search, Cone, X } from 'lucide-react';
import styles from './NotesFeed.module.scss';
import { useNotes } from '../../contexts/NotesContext';

const SearchBar: React.FC = () => {
  const {
    searchQuery,
    setSearchQuery,
    isSemanticSearch,
    setIsSemanticSearch,
    notes,
    setFilteredNotes,
  } = useNotes();

  const handleSearch = () => {
    if (isSemanticSearch) {
      window.electron.ipcRenderer.send('search-notes', searchQuery);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      const filtered = notes.filter(note =>
        note.content.toLowerCase().includes(lowerCaseQuery)
      );
      setFilteredNotes(filtered);
    }
  };

  const exitSearch = () => {
    setSearchQuery('');
    setFilteredNotes(notes);
  };

  return (
    <div className={styles['search-bar']}>
      <div className={styles['search-input-container']}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
        <Search onClick={handleSearch} className={styles['search-icon']} />
        <Cone
          onClick={() => setIsSemanticSearch(!isSemanticSearch)}
          className={`${styles['semantic-search-icon']} ${isSemanticSearch ? styles['selected'] : ''}`}
        />
        <X onClick={exitSearch} className={styles['search-icon']} />
      </div>
    </div>
  );
};

export default SearchBar;
