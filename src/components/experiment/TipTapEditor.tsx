// npm install @tiptap/react @tiptap/starter-kit turndown @types/turndown
import React, { useEffect, useState, useCallback } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import TurndownService from 'turndown';
import styles from './editor.module.scss';

// Define our slash commands
interface SlashCommand {
  title: string;
  command: (editor: any) => void;
  icon?: string;
}

const slashCommands: SlashCommand[] = [
  {
    title: 'Heading 1',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
    icon: 'H1'
  },
  {
    title: 'Bullet List',
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
    icon: '•'
  },
  {
    title: 'Numbered List',
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
    icon: '1.'
  },
  {
    title: 'Code Block',
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    icon: '<>'
  },
  // Add more commands as needed
];

// Custom extension for slash commands
const SlashCommands = Extension.create({
  name: 'slashCommands',
  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: any) => {
          props.command(editor);
          editor.commands.deleteRange(range);
        },
      },
    };
  },
});

export const TipTapEditor: React.FC = () => {
  const [showCommands, setShowCommands] = useState(false);
  const [commandsPosition, setCommandsPosition] = useState({ x: 0, y: 0 });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit,
      SlashCommands,
    ],
    content: `<p>Type / to see available commands...</p>`,
    onUpdate: ({ editor }) => {
      const { selection } = editor.state;
      const { $anchor } = selection;
      const currentLine = $anchor.nodeBefore?.textContent;

      if (currentLine?.endsWith('/')) {
        const coords = editor.view.coordsAtPos($anchor.pos);
        setCommandsPosition({ x: coords.left, y: coords.bottom });
        setShowCommands(true);
        setSelectedIndex(0);
      } else {
        setShowCommands(false);
      }
    },
  });

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!showCommands) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, slashCommands.length - 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        event.preventDefault();
        if (editor) {
          const command = slashCommands[selectedIndex];
          command.command(editor);
          setShowCommands(false);
        }
        break;
      case 'Escape':
        event.preventDefault();
        setShowCommands(false);
        break;
    }
  }, [showCommands, selectedIndex, editor]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      editor?.destroy();
    };
  }, [editor, handleKeyDown]);

  const handleExportMarkdown = () => {
    if (editor) {
      const html = editor.getHTML();
      const turndownService = new TurndownService();
      const markdown = turndownService.turndown(html);
      console.log('Markdown output:', markdown);
    }
  };

  // Cleanup editor when component unmounts
  useEffect(() => {
    return () => {
      editor?.destroy();
    };
  }, [editor]);

  return (
    <div className={styles.editor}>
      <h2>My TipTap Editor</h2>
      <EditorContent editor={editor} />
      
      {showCommands && (
        <div 
          className={styles.slashCommands}
          style={{ 
            left: commandsPosition.x,
            top: commandsPosition.y
          }}
        >
          {slashCommands.map((command, index) => (
            <div
              key={command.title}
              className={`${styles.commandItem} ${index === selectedIndex ? styles.selected : ''}`}
              onClick={() => {
                command.command(editor);
                setShowCommands(false);
              }}
            >
              {command.icon && <span>{command.icon}</span>}
              <span>{command.title}</span>
            </div>
          ))}
        </div>
      )}
      
      <button onClick={handleExportMarkdown}>Export to Markdown</button>
    </div>
  );
};