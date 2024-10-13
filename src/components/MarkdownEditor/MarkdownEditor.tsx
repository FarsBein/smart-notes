import React, { useState, useRef, useEffect, ClipboardEvent } from 'react';
import styles from './MarkdownEditor.module.scss';

interface MarkdownEditorProps {
    content: string;
    setContent: React.Dispatch<React.SetStateAction<string>>;
    onSave?: () => void;
    onClearAttachments?: () => void;
    onClose?: () => void;
    handleClipboard?: (items: DataTransferItemList) => void;
    placeholder?: string;
    autoFocus?: boolean;
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
    content,
    setContent,
    onSave,
    onClearAttachments,
    onClose,
    handleClipboard,
    placeholder = "Enter your text here...",
    autoFocus = false,
}) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        adjustTextareaHeight();
        if (autoFocus) {
            textareaRef.current?.focus();
        }
    }, [content, autoFocus]);

    const adjustTextareaHeight = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(e.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && onSave) {
            e.preventDefault();
            onSave();
        } else if (e.key === 'Backspace' && e.shiftKey && onClearAttachments) {
            e.preventDefault();
            onClearAttachments();
        } else if (e.key === 'Escape' && onClose) {
            e.preventDefault();
            onClose();
        }
    };

    const handlePaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
        if (handleClipboard) {
            const items = e.clipboardData.items;
            handleClipboard(items);
        }
    };

    return (
        <textarea
            ref={textareaRef}
            value={content}
            className={styles.textarea}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            spellCheck={true}
        />
    );
};

export default MarkdownEditor;
