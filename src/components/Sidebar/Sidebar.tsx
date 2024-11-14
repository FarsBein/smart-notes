import React, { useEffect, useState } from 'react';
import { Inbox, Calendar, Bell, CheckSquare, List, Plus } from 'lucide-react';
import styles from './Sidebar.module.scss';

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
}

const sidebarItems: SidebarItem[] = [
  { icon: <Inbox size={18} />, label: 'Inbox' },
  { icon: <Calendar size={18} />, label: 'Today' },
  { icon: <Bell size={18} />, label: 'Updates' },
  { icon: <CheckSquare size={18} />, label: 'Tasks' },
  { icon: <List size={18} />, label: 'Lists' },
];

const SidebarSection: React.FC<{ title: string; items: SidebarItem[] }> = ({ title, items }) => (
  <div className={styles.section}>
    {title && <h3 className={styles.sectionTitle}>{title}</h3>}
    {items.map((item, index) => (
      <button key={index} className={styles.sidebarItem}>
        {item.icon}
        <span>{item.label}</span>
      </button>
    ))}
  </div>
);

const Sidebar: React.FC = () => {
  const [collections, setCollections] = useState<string[]>([]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await window.electron.ipcRenderer.invoke('get-indexed-tags');
        setCollections(Array.from(new Set(tags))); // Remove duplicates
      } catch (error) {
        console.error('Error fetching tags:', error);
      }
    };

    fetchTags();
  }, []);

  const handleNewCollection = () => {
    const name = prompt('Enter collection name:');
    if (name) {
      // Here you can add logic to create a new collection
      console.log('Creating new collection:', name);
    }
  };

  return (
    <aside className={styles.sidebar}>
      <div className={styles.sidebarContent}>
        <SidebarSection items={sidebarItems} title="" />
        
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Collections</h3>
          {collections.map((tag, index) => (
            <button key={index} className={styles.sidebarItem}>
              <List size={18} />
              <span>{tag}</span>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.bottomContainer}>
        <button 
          className={styles.newCollectionButton}
          onClick={handleNewCollection}
        >
          <Plus size={18} />
          <span>New Collection</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar; 