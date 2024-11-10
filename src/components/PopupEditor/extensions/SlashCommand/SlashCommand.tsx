import { Editor, Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import tippy from 'tippy.js'
import { Heading1, Heading2, List, ListOrdered, Quote, Code, Save, X, Paperclip, Clipboard, Link } from 'lucide-react'
import React from 'react'
import { ReactRenderer } from '@tiptap/react'
import styles from './CommandList.module.scss'
import { EditorProps } from '../../Editor'
import { getLinkAndSelectionFromWebpage } from './helperFunctions'

interface SuggestionItem {
  title: string;
  description: string;
  category: 'basic' | 'format' | 'list' | 'actions';
  icon: React.ReactNode;
  shortcut?: string;
  command: (editor: Editor, range: Range) => void;
}

interface CommandListProps {
  items: SuggestionItem[];
  command: (item: SuggestionItem) => void;
  query?: string;
}

interface CustomClipboardItem {
  source?: 'extension' | 'clipboard';
  type: string;
  kind: string;
  getAsFile: () => File | null;
  getAsString: (callback: (str: string) => void) => void;
}

interface CustomDataTransferList {
  length: number;
  item: (index: number) => CustomClipboardItem;
  [Symbol.iterator]: () => Generator<CustomClipboardItem>;
}

interface SelectedState {
  categoryIndex: number;
  itemIndex: number;
}

const CommandList = React.forwardRef((props: CommandListProps, ref: any) => {
  const [selected, setSelected] = React.useState<SelectedState>({ categoryIndex: 0, itemIndex: 0 });
  const { items, command, query } = props;
  const commandListRef = React.useRef<HTMLDivElement>(null);
  const selectedItemRef = React.useRef<HTMLButtonElement>(null);

  const filteredItems = React.useMemo(() => {
    if (!query) return items;
    return items.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.description.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
    );
  }, [items, query]);

  const groupedItems = React.useMemo(() => {
    return filteredItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, SuggestionItem[]>);
  }, [filteredItems]);

  const categories = Object.keys(groupedItems);

  // Ensure selected indices are valid
  React.useEffect(() => {
    if (categories.length === 0) return;
    
    setSelected(current => {
      const validCategoryIndex = Math.min(current.categoryIndex, categories.length - 1);
      const category = categories[validCategoryIndex];
      const categoryItems = groupedItems[category] || [];
      const validItemIndex = Math.min(current.itemIndex, categoryItems.length - 1);
      
      return {
        categoryIndex: validCategoryIndex,
        itemIndex: validItemIndex
      };
    });
  }, [categories, groupedItems]);

  // Update the auto-scroll effect
  React.useEffect(() => {
    const commandList = commandListRef.current;
    const selectedItem = selectedItemRef.current;

    if (!commandList || !selectedItem) return;

    const listTop = commandList.scrollTop;
    const listBottom = listTop + commandList.clientHeight;
    const itemTop = selectedItem.offsetTop;
    const itemBottom = itemTop + selectedItem.offsetHeight;

    if (itemTop < listTop) {
      // If item is above visible area
      commandList.scrollTop = itemTop;
    } else if (itemBottom > listBottom) {
      // If item is below visible area
      commandList.scrollTop = itemBottom - commandList.clientHeight;
    }
  }, [selected.categoryIndex, selected.itemIndex]);

  const selectItem = (categoryIndex: number, itemIndex: number) => {
    const category = categories[categoryIndex];
    const item = groupedItems[category]?.[itemIndex];
    if (item) command(item);
  };

  // Enhanced keyboard navigation
  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (categories.length === 0) return false;

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelected(current => {
          const currentCategory = categories[current.categoryIndex];
          const categoryItems = groupedItems[currentCategory] || [];
          
          if (current.itemIndex > 0) {
            return { ...current, itemIndex: current.itemIndex - 1 };
          } else if (current.categoryIndex > 0) {
            const prevCategory = categories[current.categoryIndex - 1];
            const prevCategoryItems = groupedItems[prevCategory] || [];
            return {
              categoryIndex: current.categoryIndex - 1,
              itemIndex: prevCategoryItems.length - 1
            };
          }
          return current;
        });
        return true;
      }
      
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelected(current => {
          const currentCategory = categories[current.categoryIndex];
          const categoryItems = groupedItems[currentCategory] || [];
          
          if (current.itemIndex < categoryItems.length - 1) {
            return { ...current, itemIndex: current.itemIndex + 1 };
          } else if (current.categoryIndex < categories.length - 1) {
            return {
              categoryIndex: current.categoryIndex + 1,
              itemIndex: 0
            };
          }
          return current;
        });
        return true;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        selectItem(selected.categoryIndex, selected.itemIndex);
        return true;
      }
      return false;
    },
  }));

  if (categories.length === 0) {
    return (
      <div className={styles.commandList}>
        <div className={styles.noResults}>No matching commands found</div>
      </div>
    );
  }

  return (
    <div className={styles.commandList} ref={commandListRef}>
      {categories.map((category, categoryIndex) => (
        <div key={category} className={styles.category}>
          <div className={styles.categoryTitle}>{category}</div>
          {groupedItems[category].map((item, itemIndex) => (
            <button
              key={item.title}
              ref={
                categoryIndex === selected.categoryIndex && 
                itemIndex === selected.itemIndex ? 
                selectedItemRef : null
              }
              className={`${styles.commandItem} ${
                categoryIndex === selected.categoryIndex && 
                itemIndex === selected.itemIndex ? styles.selected : ''
              }`}
              onClick={() => selectItem(categoryIndex, itemIndex)}
            >
              <div className={styles.commandIcon}>{item.icon}</div>
              <div className={styles.commandContent}>
                <div className={styles.commandTitle}>{item.title}</div>
                <div className={styles.commandDescription}>{item.description}</div>
              </div>
              {item.shortcut && (
                <div className={styles.commandShortcut}>{item.shortcut}</div>
              )}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
});

CommandList.displayName = 'CommandList'

const getSuggestionItems = (props: any) => [
  {
    title: 'Heading 1',
    description: 'Add a heading 1',
    category: 'format',
    icon: <Heading1 className={styles.icon} />,
    shortcut: 'Ctrl+1',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
    },
  },
  {
    title: 'Heading 2',
    description: 'Add a heading 2',
    category: 'format',
    icon: <Heading2 className={styles.icon} />,
    shortcut: 'Ctrl+2',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
    },
  },
  {
    title: 'Bullet List',
    description: 'Add a bullet list',
    category: 'list',
    icon: <List className={styles.icon} />,
    shortcut: 'Ctrl+3',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: 'Numbered List',
    description: 'Add a numbered list',
    category: 'list',
    icon: <ListOrdered className={styles.icon} />,
    shortcut: 'Ctrl+4',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: 'Blockquote',
    description: 'Add a blockquote',
    category: 'format',
    icon: <Quote className={styles.icon} />,
    shortcut: 'Ctrl+5',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: 'Code Block',
    description: 'Add a code block',
    category: 'format',
    icon: <Code className={styles.icon} />,
    shortcut: 'Ctrl+6',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: 'Save',
    description: 'Save the document',
    category: 'actions',
    icon: <Save className={styles.icon} />,
    shortcut: 'Ctrl+S',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).run()
      props.onSave?.()
    },
  },
  {
    title: 'Clear Attachments',
    description: 'Clear all attachments',
    category: 'actions',
    icon: <Paperclip className={styles.icon} />,
    shortcut: 'Ctrl+0',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).run()
      props.onClearAttachments?.()
    },
  },
  {
    title: 'Close',
    description: 'Close the editor',
    category: 'actions',
    icon: <X className={styles.icon} />,
    shortcut: 'Ctrl+W',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).run()
      props.onClose?.()
    },
  },
  {
    title: 'Paste from Clipboard',
    description: 'Paste content from the clipboard',
    category: 'actions',
    icon: <Clipboard className={styles.icon} />,
    shortcut: 'Ctrl+V',
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).run()
      navigator.clipboard.read()
        .then((clipboardItems) => {
          clipboardItems.forEach(async (clipboardItem) => {
            const types = clipboardItem.types;
            const items = await Promise.all(
              types.map(async (type) => {
                const blob = await clipboardItem.getType(type);
                const item: CustomClipboardItem = {
                  type,
                  kind: 'string',
                  getAsFile: () => new File([blob], 'pasted-file', { type }),
                  getAsString: (callback: (str: string) => void) => {
                    blob.text().then(callback);
                  },
                };
                return item;
              })
            );

            const customDataTransfer: CustomDataTransferList = {
              // source: 'extension',
              length: items.length,
              item: (i: number) => items[i],
              [Symbol.iterator]: function* () {
                for (let i = 0; i < this.length; i++) {
                  yield this.item(i);
                }
              },
            };

            props.onClipboard?.(customDataTransfer as unknown as DataTransferItemList);
          });
        })
        .catch((err) => {
          console.error('Failed to read clipboard:', err);
        });
    },
  },
  {
    title: 'Link and Selection from Webpage',
    description: 'Add a link and selection from the webpage',
    category: 'actions',
    icon: <Link className={styles.icon} />,
    shortcut: 'Ctrl+L',
    command: async ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).run()
      const link = await getLinkAndSelectionFromWebpage()

      const type = 'text/plain';
      const urlItem: CustomClipboardItem = {
        type,
        kind: 'string',
        getAsFile: () => null,
        getAsString: (callback: (str: string) => void) => {
          callback(link.url);
        },
      };

      const textItem: CustomClipboardItem = {
        type,
        kind: 'string',
        getAsFile: () => null,
        getAsString: (callback: (str: string) => void) => {
          callback(link.selectedText);
        },
      };

      const customDataTransfer: CustomDataTransferList = {
        length: 2,
        item: (i: number) => i === 0 ? urlItem : textItem,
        [Symbol.iterator]: function* () {
          for (let i = 0; i < this.length; i++) {
            yield this.item(i);
          }
        },
      };

      props.onClipboard?.(customDataTransfer as unknown as DataTransferItemList);
    },
  },
]



export const SlashCommands = Extension.create({
  name: 'slash-commands',
  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range })
        },
        render: () => {
          let component: ReactRenderer | null = null
          let popup: any | null = null

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(CommandList, {
                props,
                editor: props.editor,
              })

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              })
            },

            onUpdate: (props: any) => {
              component?.updateProps(props)

              popup?.[0].setProps({
                getReferenceClientRect: props.clientRect,
              })
            },

            onKeyDown: (props: any) => {
              if (props.event.key === 'Escape') {
                popup?.[0].hide()
                return true
              }

              return (component?.ref as any)?.onKeyDown?.(props)
            },

            onExit: () => {
              popup?.[0].destroy()
              component?.destroy()
            },
          }
        },
      },
      onSave: undefined as EditorProps['onSave'],
      onClearAttachments: undefined as EditorProps['onClearAttachments'],
      onClose: undefined as EditorProps['onClose'],
      onClipboard: undefined as EditorProps['onClipboard'],
    }
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => {
          return getSuggestionItems(this.options).filter(item =>
            item.title.toLowerCase().includes(query.toLowerCase())
          )
        },
      }),
    ]
  },
})