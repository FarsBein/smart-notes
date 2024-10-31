import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Home, Settings, Mail, User, Bell } from 'lucide-react';
import styles from './RadialMenu.module.scss';

interface MenuItem {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

const RADIAL_MENU_RADIUS = 100; // Define a constant for the radius

export const RadialMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const pressTimer = useRef<NodeJS.Timeout | null>(null);

  const menuItems: MenuItem[] = [
    { icon: <Home className="w-6 h-6" />, label: 'Home', onClick: () => console.log('Home clicked') },
    { icon: <Settings className="w-6 h-6" />, label: 'Settings', onClick: () => console.log('Settings clicked') },
    { icon: <Mail className="w-6 h-6" />, label: 'Mail', onClick: () => console.log('Mail clicked') },
    { icon: <User className="w-6 h-6" />, label: 'Profile', onClick: () => console.log('Profile clicked') },
    { icon: <Bell className="w-6 h-6" />, label: 'Notifications', onClick: () => console.log('Notifications clicked') },
  ];

  const handleOpenMenu = useCallback((x: number, y: number) => {
    setIsOpen(true);
    setPosition({ x, y });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent | TouchEvent) => {
    e.preventDefault();
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    pressTimer.current = setTimeout(() => {
      handleOpenMenu(clientX, clientY);
    }, 200);
  }, [handleOpenMenu]);

  const handleMouseUp = useCallback(() => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }

    if (isOpen && selectedIndex !== null) {
      menuItems[selectedIndex].onClick();
    }

    setIsOpen(false);
    setSelectedIndex(null);
  }, [isOpen, selectedIndex, menuItems]);

  const handleMouseMove = useCallback((e: MouseEvent | TouchEvent) => {
    if (!isOpen) return;

    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    const deltaX = clientX - position.x;
    const deltaY = clientY - position.y;
    const angle = Math.atan2(deltaY, deltaX);
    const degrees = angle * (180 / Math.PI);
    const normalizedDegrees = degrees < 0 ? degrees + 360 : degrees;
    const itemAngle = 360 / menuItems.length;
    const index = Math.floor(((normalizedDegrees + itemAngle / 2) % 360) / itemAngle);
    console.log(index);
    setSelectedIndex(index);
  }, [isOpen, position, menuItems.length]);

  useEffect(() => {
    const handleGlobalMouseUp = (e: MouseEvent | TouchEvent) => handleMouseUp();
    const handleGlobalMouseMove = (e: MouseEvent | TouchEvent) => handleMouseMove(e);

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('touchend', handleGlobalMouseUp);
    document.addEventListener('touchmove', handleGlobalMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('touchend', handleGlobalMouseUp);
      document.removeEventListener('touchmove', handleGlobalMouseMove);
    };
  }, [handleMouseUp, handleMouseMove]);

  // Calculate menu positioning to prevent overflow
  const calculateMenuStyles = () => {
    const { innerWidth, innerHeight } = window;
    let left = position.x - RADIAL_MENU_RADIUS;
    let top = position.y - RADIAL_MENU_RADIUS;

    if (left < 0) left = 10;
    if (top < 0) top = 10;
    if (left + RADIAL_MENU_RADIUS * 2 > innerWidth) left = innerWidth - RADIAL_MENU_RADIUS * 2 - 10;
    if (top + RADIAL_MENU_RADIUS * 2 > innerHeight) top = innerHeight - RADIAL_MENU_RADIUS * 2 - 10;

    return { left, top };
  };

  return (
    <div 
      className={styles.container}
      onMouseDown={(e: React.MouseEvent) => handleMouseDown(e)}
      onTouchStart={(e: React.TouchEvent<Element>) => {
        const touchEvent = e.nativeEvent as unknown as TouchEvent;
        handleMouseDown(touchEvent);
      }}
    >
      <div>we are here</div>
      {isOpen && (
        <div
          className={styles.menu}
          style={calculateMenuStyles()}
        >
          <div className={styles.menuContent}>
            <div className={styles.backgroundCircle} />
            
            {menuItems.map((item, index) => {
              const angle = (360 / menuItems.length) * index;
              const selected = selectedIndex === index;
              
              return (
                <div
                  key={item.label}
                  className={`${styles.menuSection} ${selected ? styles.selected : ''}`}
                  style={{
                    transform: `rotate(${angle}deg)`,
                  }}
                >
                  <div
                    className={styles.menuIcon}
                    style={{
                      transform: `
                        translate(-50%, -50%)
                        rotate(${angle}deg)
                        translateY(-${RADIAL_MENU_RADIUS}px)
                        rotate(-${angle}deg)
                      `
                    }}
                  >
                    <div className={`${styles.iconWrapper} ${selected ? styles.selected : ''}`}>
                      {item.icon}
                      <div className={styles.iconLabel}>
                        {item.label}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className={styles.centerDot} />
          </div>
        </div>
      )}
    </div>
  );
};
