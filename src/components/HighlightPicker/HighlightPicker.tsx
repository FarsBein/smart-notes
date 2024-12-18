import React, { useEffect, useState } from 'react';
import styles from './HighlightPicker.module.scss';
import { useFloating, offset, flip, shift } from '@floating-ui/react';

export interface HighlightOption {
    name: string;
    color: string;
}

interface HighlightPickerProps {
    options?: HighlightOption[];
    selectedHighlight: string;
    setSelectedHighlight: (option: string) => void;
    color?: string;
}

export const highlightOptions = {
    'None': '#3d3d3d',
    'Highlight': '#FFD60A', 
    'Idea': '#0071E3', 
    'Todo': '#FF453A',
};

export const HighlightPicker: React.FC<HighlightPickerProps> = ({
    options = highlightOptions,
    selectedHighlight,
    setSelectedHighlight,
}) => {

    const [selectedColor, setSelectedColor] = useState<string>();
    const [isOpen, setIsOpen] = useState(false);

    const { refs, floatingStyles } = useFloating({
        open: isOpen,
        placement: 'bottom-end',
        middleware: [
            offset(5), // 5px gap between button and dropdown
            flip(), // flips to top if no space below
            shift(), // shifts horizontally if needed
        ],
    });

    useEffect(() => {
        setSelectedColor(options[selectedHighlight as keyof typeof options]);
    }, [selectedHighlight]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const floating = refs.floating.current;
            const reference = refs.reference.current;
            
            if (!floating || !reference) return;
            
            if (!floating.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, refs.floating, refs.reference]);

    return (
        <div className={styles.highlightPickerWrapper}>
            <button 
                ref={refs.setReference}
                className={styles.highlightButton}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div
                    className={styles.highlightColor}
                    style={{ backgroundColor: selectedColor }}
                />
            </button>

            {isOpen && (
                <div
                    ref={refs.setFloating}
                    className={styles.dropdownContent}
                    style={floatingStyles}
                >
                    {Object.entries(options).map(([key, value]) => (
                        <button
                            key={key}
                            className={styles.dropdownItem}
                            onClick={() => {
                                setSelectedHighlight(key);
                                setIsOpen(false);
                            }}
                        >
                            <div className={styles.colorOption}>
                                <div
                                    className={styles.colorCircle}
                                    style={{ backgroundColor: value }}
                                />
                                <span>{key}</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
