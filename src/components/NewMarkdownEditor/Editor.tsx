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

interface EditorProps {
  content: string;
}

export interface EditorRef {
  getMarkdown: () => string;
}

export const Editor = forwardRef<EditorRef, EditorProps>(({ content }, ref) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Type "/" for commands...',
      }),
      Typography,
      SlashCommands,
      Tag,
    ],
    content: parseMarkdown(content),
    editorProps: {
      attributes: {
        class: styles.prose,
      },
    },
  })

  useImperativeHandle(ref, () => ({
    getMarkdown: () => {
      if (editor) {
        const html = editor.getHTML();
        return generateMarkdown(html);
      }
      return '';
    },
  }));

  if (!editor) return null

  return (
    <div className={styles.editorWrapper}>
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


// usage example
// import { useRef } from 'react';
// import { Editor, EditorRef } from '../../components/NewMarkdownEditor/Editor';
//   const editorRef = useRef<EditorRef>(null);
//   const [content, setContent] = useState<string>('# nice');
//   const saveEdit = async () => {
//     try {
//       if (editorRef.current) {
//         const markdown = editorRef.current.getMarkdown();
//         console.log('markdown:', markdown);
//         setContent(markdown);
//       }
//     } catch (error) {
//       console.error('Failed to save edit:', error);
//     }
//   };
//   return (
//       <>
//         <Editor 
//           ref={editorRef}
//           content={content} 
//         />
//         <div className={styles.actions}>
//           <button onClick={saveEdit}>Save</button>
//         </div>
//       </>
//   );