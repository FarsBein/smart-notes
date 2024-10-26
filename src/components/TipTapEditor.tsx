// npm install @tiptap/react @tiptap/starter-kit turndown @types/turndown
import React, { useEffect } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TurndownService from 'turndown';

const TipTapEditor: React.FC = () => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: `<p>Start editing...</p>`,
  });

  // Update the export function
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
    <div>
      <h2>My TipTap Editor</h2>
      <EditorContent editor={editor} />
      <button onClick={handleExportMarkdown}>Export to Markdown</button>
    </div>
  );
};

export default TipTapEditor;
