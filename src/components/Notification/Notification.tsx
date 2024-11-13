import React, { useEffect, useState } from 'react';
import styles from './Notification.module.scss';

interface NotificationProps {
  message: string;
  onClose: () => void;
  onClick: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, onClose, onClick }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const handleClick = () => {
    onClick();
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div 
      className={`${styles.notification} ${isVisible ? styles.visible : ''}`}
      onClick={handleClick}
    >
      <span>{message}</span>
    </div>
  );
};

export default Notification; 