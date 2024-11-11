import React from 'react';
import styles from './LinkPreview.module.scss';
import { ArrowRightIcon } from 'lucide-react';

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
  return (
    <div className={styles.productCard} onClick={onClick}>
      <div className={styles.productCardContent}>
        <h3 className={styles.productCardTitle}>{title}</h3>
        <span className={styles.productCardDescription}>{description}</span>

        
        <div className={styles.productCardImageContainer}>
          <img
            src={imageUrl}
            alt={title}
            className={styles.productCardImage}
          />
        </div>
        
        
          <div className={styles.productCardFooter}>
            <button>summarize</button>
            <button>open</button>
          </div>
      </div>
    </div>
  );
};
