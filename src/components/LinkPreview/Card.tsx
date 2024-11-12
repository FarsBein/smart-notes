import React from 'react';
import styles from './LinkPreview.module.scss';

interface CardProps {
  title?: string;
  description?: string;
  summary?: string;
  imageUrl?: string;
  url?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ 
  title,
  description,
  summary,
  imageUrl,
  url,
  onClick = () => {}
}) => {
  // Extract domain from URL
  const domain = url ? new URL(url).hostname.replace('www.', '') : '';

  return (
    <div className={styles.linkCard} onClick={onClick}>
      <div className={styles.linkCardImageContainer}>
        <img
          src={imageUrl}
          alt={domain}
          className={styles.linkCardImage}
        />
        <div className={styles.linkCardOverlay}>
          <button className={styles.linkCardDomain}>{domain}</button>
        </div>
      </div>
    </div>
  );
};
