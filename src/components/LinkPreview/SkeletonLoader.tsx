import React from 'react';
import styles from './LinkPreview.module.scss';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className={styles.linkCard}>
      <div className={`${styles.skeleton} ${styles.skeletonImage}`} />
      <div className={styles.linkCardContent}>
        <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
        <div className={`${styles.skeleton} ${styles.skeletonDescription}`} />
        <div className={`${styles.skeleton} ${styles.skeletonMeta}`} />
      </div>
    </div>
  );
}; 