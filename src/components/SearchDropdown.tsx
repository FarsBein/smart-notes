import React, { useState, useEffect, useRef, KeyboardEvent  } from 'react';
import '../styles/global.scss';
import inbox from '../assets/Inbox.png';

type Option = {
  id: string;
  label: string;
//   icon: string;
};

const initialOptions: Option[] = [
  { id: 'family', label: 'Family'},
  { id: 'finances', label: 'Finances'},
];

const SearchDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [displayTerm, setDisplayTerm] = useState('Inbox');
  const [options, setOptions] = useState<Option[]>(initialOptions);
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const filtered = options.filter((option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredOptions(filtered);
    setSelectedIndex(-1);
  }, [searchTerm, options]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleOptionSelect = (option: Option) => {
    setDisplayTerm(option.label);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleAddNewOption = () => {
    const newOption: Option = {
      id: `new-${searchTerm}`,
      label: searchTerm
    };
    setOptions([...options, newOption]);
    handleOptionSelect(newOption);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }

    if (isOpen) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prevIndex) => 
            prevIndex < filteredOptions.length - 1 ? prevIndex + 1 : prevIndex
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prevIndex) => (prevIndex > -1 ? prevIndex - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < filteredOptions.length) {
            handleOptionSelect(filteredOptions[selectedIndex]);
          } else if (searchTerm) {
            handleAddNewOption();
          }
          break;
        case 'Escape':
          setIsOpen(false);
          break;
      }
    }
  };

  useEffect(() => {
    if (isOpen && listRef.current) {
      const selectedElement = listRef.current.children[selectedIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex, isOpen]);

  return (
    <div 
      className="search-dropdown-container" 
      ref={dropdownRef}
      onKeyDown={handleKeyDown}
    >
      <div 
        className="popup__sort-inbox" 
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls="dropdown-list"
        aria-haspopup="listbox"
      >
        <img src={inbox} className="popup__inbox-icon" alt="inbox" />
        <div>{displayTerm}</div>
      </div>
      {isOpen && (
        <div className="dropdown-content">
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={handleInputChange}
            placeholder="Search..."
            autoFocus
          />
          <ul 
            className="dropdown-list" 
            role="listbox" 
            id="dropdown-list"
            ref={listRef}
          >
            {filteredOptions.map((option, index) => (
              <li
                key={option.id}
                onClick={() => handleOptionSelect(option)}
                className={index === selectedIndex ? 'selected' : ''}
                role="option"
                aria-selected={index === selectedIndex}
              >
                {option.label}
              </li>
            ))}
            {searchTerm && (
              <li
                className={`new-project ${
                  selectedIndex === filteredOptions.length ? 'selected' : ''
                }`}
                onClick={handleAddNewOption}
                role="option"
                aria-selected={selectedIndex === filteredOptions.length}
              >
                <span className="icon">+</span>
                {searchTerm}
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchDropdown;