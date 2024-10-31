import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X } from 'lucide-react';
import styles from './ImageViewer.module.scss';

interface ImageViewerProps {
  src: string;
  alt: string;
  className?: string;
}

interface Position {
  x: number;
  y: number;
}

const ZOOM_STEP = 0.01;
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;

export const ImageViewer: React.FC<ImageViewerProps> = ({ src, alt, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [scrollPosition, setScrollPosition] = useState<number | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  const resetView = useCallback(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    resetView();
    setScrollPosition(window.scrollY);
    document.body.style.overflow = 'hidden';
  }, [resetView]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    document.body.style.overflow = '';
    if (scrollPosition !== null) {
      window.scrollTo(0, scrollPosition);
    }
  }, [scrollPosition]);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY * -ZOOM_STEP;
    setScale(prevScale => 
      Math.min(Math.max(MIN_SCALE, prevScale + delta), MAX_SCALE)
    );
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  }, [position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Attach non-passive wheel event listener
  // need to avoid background from scrolling and also you cant prevent default of passive listener
  useEffect(() => {
    const overlay = overlayRef.current;
    if (isOpen && overlay) {
      overlay.addEventListener('wheel', handleWheel, { passive: false });
      return () => {
        overlay.removeEventListener('wheel', handleWheel);
      };
    }
  }, [isOpen, handleWheel]);

  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (isOpen && e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleClose]);

  return (
    <>
      <img
        src={src}
        alt={alt}
        onClick={handleOpen}
        className={`${styles['image-viewer-trigger']} ${className}`}
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          console.error('Failed to load image:', src);
        }}
      />
      
      {isOpen && (
        <div 
          ref={overlayRef}
          className={styles['image-viewer-overlay']}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div className={styles['image-viewer-controls']}>
            <button
              onClick={resetView}
              className={styles['image-viewer-zoom']}
              aria-label="Reset zoom"
            >
              {Math.round(scale * 100)}%
            </button>
            <button
              onClick={handleClose}
              className={styles['image-viewer-close']}
              aria-label="Close viewer"
            >
              <X size={18} />
            </button>
          </div>
          
          <img
            src={src}
            alt={alt}
            style={{
              transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`
            }}
            className={`${styles['image-viewer-image']} ${
              isDragging ? styles['image-viewer-image--dragging'] : styles['image-viewer-image--draggable']
            }`}
            draggable={false}
          />
        </div>
      )}
    </>
  );
};