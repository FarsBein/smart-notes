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
    color?: string;
}

export const highlightOptions = {
    'None': '#3d3d3d',
    'Highlight': '#FFC300',
    'Idea': '#2C528C',
    'Todo': '#FF5733',
};

export const HighlightPicker: React.FC<HighlightPickerProps> = ({
    options = highlightOptions,
    selectedHighlight,
    setSelectedHighlight,
}) => {

    const [selectedColor, setSelectedColor] = useState<string>();

    useEffect(() => {
        setSelectedColor(options[selectedHighlight as keyof typeof options]);
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
                    {Object.entries(options).map(([key, value]) => (
                        <DropdownMenu.Item
                            key={key}
                            className={styles.dropdownItem}
                            onSelect={() => setSelectedHighlight(key)}
                        >
                            <div className={styles.colorOption}>
                                <div
                                    className={styles.colorCircle}
                                    style={{ backgroundColor: value }}
                                />
                                <span>{key}</span>
                            </div>
                        </DropdownMenu.Item>
                    ))}
                </DropdownMenu.Content>
            </DropdownMenu.Root>
        </div>
    );
};
