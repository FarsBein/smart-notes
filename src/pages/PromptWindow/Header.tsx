import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { usePopupContext } from '../../context/PopupContext';
import styles from './PromptWindow.module.scss';

const highlightOptions = [
  { name: 'None', color: '#3d3d3d' },
  { name: 'Todo', color: '#FF5733' },
  { name: 'Highlight', color: '#FFC300' },
  { name: 'Idea', color: '#DAF7A6' },
];

const Header: React.FC = () => {
  const { selectedHighlight, setSelectedHighlight } = usePopupContext();

  return (
    <div className={styles['popup__header']}>
      <div className={styles['popup__date']}>
        {new Date().toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' })}
      </div>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className={styles['popup__highlight']} style={{ backgroundColor: selectedHighlight.color }}></button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className={styles['dropdown-menu-content']}>
            {highlightOptions.map((option) => (
              <DropdownMenu.Item
                key={option.name}
                className={styles['dropdown-menu-item']}
                onClick={() => setSelectedHighlight(option)}
              >
                <div className={styles['color-option']}>
                  <div className={styles['color-circle']} style={{ backgroundColor: option.color }}></div>
                  <span>{option.name}</span>
                </div>
              </DropdownMenu.Item>
            ))}
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
};

export default Header;
