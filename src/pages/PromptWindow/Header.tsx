import React from 'react';
import { usePopupContext } from '../../contexts/PopupContext';
import styles from './PromptWindow.module.scss';
import { HighlightPicker } from '../../components/HighlightPicker/HighlightPicker';

const Header: React.FC = () => {
  const { selectedHighlight, setSelectedHighlight } = usePopupContext();

  return (
    <div className={styles['popup__header']}>
      <div className={styles['popup__date']}>
        {new Date().toLocaleString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: 'numeric' })}
      </div>
      <HighlightPicker
        selectedHighlight={selectedHighlight}
        setSelectedHighlight={setSelectedHighlight}
      />
    </div>
  );
};

export default Header;
