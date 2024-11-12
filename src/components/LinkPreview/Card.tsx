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
  onClick = () => { }
}) => {
  const domain = url ? new URL(url).hostname.replace('www.', '') : '';

  return (
    <div className={styles.linkCard} onClick={onClick}>
      <div className={styles.linkCardImageContainer}>
        <img
          src={imageUrl}
          alt={title}
          className={styles.linkCardImage}
        />
      </div>
      <div className={styles.linkCardContent}>
        <h2 className={styles.linkCardTitle}>{title}</h2>
        <p className={styles.linkCardDescription}>{description}</p>
        <div className={styles.linkCardMeta}>
          <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
            alt={domain}
          />
          <span>{domain}</span>
        </div>
      </div>
    </div>
  );
};
