import React, { useState } from 'react';
import { Search, Cone, X } from 'lucide-react';
import styles from './NotesFeed.module.scss';
import { useNotes } from '../../contexts/NotesContext';

const SearchBar: React.FC = () => {
  const {
    setFilteredParentNotesFileNames,
    setBasicSearchQuery,
    parentNotesFileNames,
  } = useNotes();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSemanticSearch, setIsSemanticSearch] = useState<boolean>(true);

  const handleSearch = async () => {
    if (isSemanticSearch) {
      const similarNotes = await window.electron.ipcRenderer.invoke('semantic-search', searchQuery);
      setFilteredParentNotesFileNames(similarNotes);
    } else {
      const lowerCaseQuery = searchQuery.toLowerCase();
      setBasicSearchQuery(lowerCaseQuery);
    }
  };

  const exitSearch = () => {
    setSearchQuery('');
    setBasicSearchQuery('');
    setFilteredParentNotesFileNames(null);
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
