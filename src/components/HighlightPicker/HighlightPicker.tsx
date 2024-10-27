import React, { useEffect, useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import styles from './HighlightPicker.module.scss';

export interface HighlightOption {
    name: string;
    color: string;
}

interface HighlightPickerProps {
    options?: HighlightOption[];
    selectedHighlight: string;
    setSelectedHighlight: (option: string) => void;
}

const highlightOptions = [
    { name: 'None', color: '#3d3d3d' },
    { name: 'Highlight', color: '#FFC300' },
    { name: 'Idea', color: '#DAF7A6' },
    { name: 'Todo', color: '#FF5733' },
];

export const HighlightPicker: React.FC<HighlightPickerProps> = ({
    options = highlightOptions,
    selectedHighlight,
    setSelectedHighlight,
}) => {

    const [selectedColor, setSelectedColor] = useState<string>();

    useEffect(() => {
        setSelectedColor(options.find(option => option.name === selectedHighlight)?.color);
    }, [selectedHighlight]);

    return (
        <div className={styles.highlightPickerWrapper}>
            <DropdownMenu.Root>
                <DropdownMenu.Trigger className={styles.highlightButton}>
                    <div
                        className={styles.highlightColor}
                        style={{ backgroundColor: selectedColor }}
                    />
                </DropdownMenu.Trigger>

                <DropdownMenu.Content
                    className={styles.dropdownContent}
                    sideOffset={5}
                    align="end"
                    collisionPadding={10}
                    avoidCollisions={true}
                >
                    {options.map((option) => (
                        <DropdownMenu.Item
                            key={option.name}
                            className={styles.dropdownItem}
                            onSelect={() => setSelectedHighlight(option.name)}
                        >
                            <div className={styles.colorOption}>
                                <div
                                    className={styles.colorCircle}
                                    style={{ backgroundColor: option.color }}
                                />
                                <span>{option.name}</span>
                            </div>
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </div>
    );
};
