import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Typography from '@tiptap/extension-typography'
import Toolbar from './Toolbar/Toolbar'
import styles from './Editor.module.scss'
import { forwardRef, useImperativeHandle } from 'react'
import { generateMarkdown } from './utils/markdownOutput'
import { parseMarkdown } from './utils/markdownInput'
import { Tag, SlashCommands } from './extensions'
import { Plugin } from 'prosemirror-state'
import { Extension } from '@tiptap/core'

export interface EditorProps {
  content?: string;
  onSave?: () => void;
  onClearAttachments?: () => void;
  onClose?: () => void;
  onClipboard?: (items: DataTransferItemList) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export interface EditorRef {
  getMarkdown: () => string;
  focus: () => void;
}

export const Editor = forwardRef<EditorRef, EditorProps>(({ 
  content, 
  onSave, 
  onClearAttachments, 
  onClose, 
  onClipboard,
  placeholder,
  autoFocus 
}, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || 'Type "/" for commands...',
        showOnlyWhenEditable: true,
        emptyEditorClass: styles.isEmpty,
      }),
      Typography,
      SlashCommands.configure({
        onSave,
        onClearAttachments,
        onClose,
        onClipboard,
      }),
      Tag,
      Extension.create({
        name: 'customPasteHandler',
        addProseMirrorPlugins() {
          return [
            new Plugin({
              props: {
                handlePaste: (view, event) => {
                  if (event.clipboardData) {
                    onClipboard?.(event.clipboardData.items);
                  }
                  return false; // Let TipTap handle the default paste behavior
                },
              },
            }),
          ];
        },
      }),
    ],
    content: content ? parseMarkdown(content) : '',
    editorProps: {
      attributes: {
        class: styles.prose,
      },
    },
    autofocus: autoFocus ? 'end' : false,
  })

  useImperativeHandle(ref, () => ({
    getMarkdown: () => {
      if (editor) {
        const html = editor.getHTML();
        return generateMarkdown(html);
      }
      return '';
    },
    focus: () => {
      if (editor) {
        // Add a small delay to ensure the editor is mounted
        setTimeout(() => {
          editor.commands.focus('end'); 
        }, 0);
      }
    },
  }));

  const handleWrapperClick = (e: React.MouseEvent) => {
    // Only focus if clicking directly on the wrapper (not on existing content)
    if (e.target === e.currentTarget) {
      editor?.commands.focus('end');
    }
  };

  if (!editor) return null

  return (
    <div 
      className={styles.editorWrapper} 
      onClick={handleWrapperClick}
    >
      {editor && (
        <BubbleMenu className={styles.bubbleMenu} editor={editor}>
          <Toolbar editor={editor} />
        </BubbleMenu>
      )}
      <EditorContent editor={editor} />
    </div>
  )
})

Editor.displayName = 'Editor';