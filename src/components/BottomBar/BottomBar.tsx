import React from 'react';
import styles from './BottomBar.module.scss';
import { Folder, Search } from 'lucide-react';
import { useActionButtons } from '@/contexts/ActionButtons';

const BottomBar: React.FC<{ scrollToTop: () => void }> = ({ scrollToTop }) => {
    const { setIsSearchOpen } = useActionButtons();

    const handleSearchClick = () => {
        scrollToTop();
        setIsSearchOpen(prev => !prev);
    };

    return (
        <div className={styles.bottomBar}>
            <div className={styles.titleBarIcons}>
                <button>
                    <Folder size={20} strokeWidth={4} />
                </button>
                <button onClick={handleSearchClick}>
                    <Search size={20} strokeWidth={4} />
                </button>
            </div>
        </div>
    );
};

export default BottomBar; 