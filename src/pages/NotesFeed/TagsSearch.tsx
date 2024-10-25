import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import styles from './NotesFeed.module.scss';
import { useNotes } from '@/contexts/NotesContext';

export const TagSearch = () => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const [indexedTags, setIndexedTags] = useState<string[]>([]);
  const { filterByTags, setFilteredParentNotesFileNames, selectedTags, setSelectedTags } = useNotes();

  useEffect(() => {
    const getIndexedTags = async () => {
      const indexedTags = await window.electron.ipcRenderer.invoke('get-indexed-tags');
      setIndexedTags(indexedTags);
    };
    getIndexedTags();
  }, []);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        suggestionsRef.current && 
        !suggestionsRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    
    if (value.trim()) {
      const filtered = indexedTags.filter(
        tag => 
          tag.toLowerCase().includes(value.toLowerCase()) && 
          !selectedTags.includes(tag)
      );
      setSuggestions(filtered);
      setIsOpen(true);
      setActiveIndex(-1); // Reset selection when input changes
    } else {
      setSuggestions([]);
      setIsOpen(false);
      setActiveIndex(-1);
    }
  };

  const addTag = (tag: string) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags(prev => {
        const newTags = [...prev, tag];
        filterByTags(newTags);
        return newTags;
      });
      setInputValue('');
      setSuggestions([]);
      setIsOpen(false);
      setActiveIndex(-1);
      inputRef.current?.focus();
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(prev => {
      const newTags = prev.filter(tag => tag !== tagToRemove);
      filterByTags(newTags);
      return newTags;
    });
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'Enter' && inputValue) {
        addTag(inputValue);
        return;
      }
      if (suggestions.length > 0) {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => {
          const nextIndex = prev < suggestions.length - 1 ? prev + 1 : -1;
          scrollIntoView(nextIndex);
          return nextIndex;
        });
        break;

      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => {
          const nextIndex = prev > -1 ? prev - 1 : suggestions.length - 1;
          scrollIntoView(nextIndex);
          return nextIndex;
        });
        break;

      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          addTag(suggestions[activeIndex]);
        } else if (inputValue) {
          addTag(inputValue);
        }
        break;

      case 'Escape':
        setIsOpen(false);
        setActiveIndex(-1);
        break;

      case 'Tab':
        if (activeIndex >= 0 && suggestions[activeIndex]) {
          e.preventDefault();
          addTag(suggestions[activeIndex]);
        }
        break;
    }
  };

  const scrollIntoView = (index: number) => {
    if (index >= 0 && suggestionsRef.current) {
      const element = suggestionsRef.current.children[index] as HTMLElement;
      if (element) {
        element.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  };

  return (
    <div className={styles['tag-search']}>
      <div className={styles['tag-search-container']}>
        <div className={styles['selected-tags']}>
          {selectedTags.map(tag => (
            <div key={tag} className={styles['tag']}>
              <span>{tag}</span>
              <button
                onClick={() => removeTag(tag)}
                className={styles['remove-tag']}
                aria-label={`Remove ${tag}`}
              >
                <X className={styles['remove-icon']} />
              </button>
            </div>
          ))}
          <div className={styles['input-container']}>
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Search tags..."
              className={styles['tag-input']}
              role="combobox"
              aria-expanded={isOpen}
              aria-controls="suggestions-list"
              aria-activedescendant={activeIndex >= 0 ? `suggestion-${activeIndex}` : undefined}
            />
            {isOpen && suggestions.length > 0 && (
              <div 
                ref={suggestionsRef}
                id="suggestions-list"
                role="listbox"
                className={styles['suggestions']}
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    id={`suggestion-${index}`}
                    role="option"
                    aria-selected={activeIndex === index}
                    onClick={() => addTag(suggestion)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`${styles['suggestion']} ${activeIndex === index ? styles['active'] : ''}`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
