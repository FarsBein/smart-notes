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
  title: string,
  icon: React.ReactNode,
  command: (editor: Editor, range: Range) => void
}

interface CommandListProps {
  items: SuggestionItem[]
  command: (item: SuggestionItem) => void
  query?: string
}

interface CustomClipboardItem {
  type: string;
  kind: 'string';
  getAsFile: () => File | null;
  getAsString: (callback: (str: string) => void) => void;
}

interface CustomDataTransferList {
  length: number;
  item: (index: number) => CustomClipboardItem;
  [Symbol.iterator]: () => Generator<CustomClipboardItem>;
}

const CommandList = React.forwardRef((props: CommandListProps, ref: any) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const { items, command, query } = props

  const filteredItems = React.useMemo(() => {
    if (!query) return items
    return items.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase())
    )
  }, [items, query])

  const selectItem = (index: number) => {
    const item = filteredItems[index]
    if (item) command(item)
  }

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + filteredItems.length - 1) % filteredItems.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % filteredItems.length)
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }))

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [filteredItems.length])

  if (filteredItems.length === 0) {
    return (
      <div className={styles.commandList}>
        <div className={styles.commandItem}>No results found</div>
      </div>
    )
  }

  return (
    <div className={styles.commandList}>
      {filteredItems.map((item, index) => (
        <button
          key={index}
          className={`${styles.commandItem} ${index === selectedIndex ? styles.selected : ''
            }`}
          onClick={() => selectItem(index)}
        >
          {item.icon}
          <span>{item.title}</span>
        </button>
      ))}
    </div>
  )
})

CommandList.displayName = 'CommandList'

const getSuggestionItems = (props: any) => [
  {
    title: 'Heading 1',
    icon: <Heading1 className="w-4 h-4" />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run()
    },
  },
  {
    title: 'Heading 2',
    icon: <Heading2 className="w-4 h-4" />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run()
    },
  },
  {
    title: 'Bullet List',
    icon: <List className="w-4 h-4" />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run()
    },
  },
  {
    title: 'Numbered List',
    icon: <ListOrdered className="w-4 h-4" />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run()
    },
  },
  {
    title: 'Blockquote',
    icon: <Quote className="w-4 h-4" />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run()
    },
  },
  {
    title: 'Code Block',
    icon: <Code className="w-4 h-4" />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run()
    },
  },
  {
    title: 'Save',
    icon: <Save className="w-4 h-4" />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).run()
      props.onSave?.()
    },
  },
  {
    title: 'Clear Attachments',
    icon: <Paperclip className="w-4 h-4" />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).run()
      props.onClearAttachments?.()
    },
  },
  {
    title: 'Close',
    icon: <X className="w-4 h-4" />,
    command: ({ editor, range }: any) => {
      editor.chain().focus().deleteRange(range).run()
      props.onClose?.()
    },
  },
  {
    title: 'Paste from Clipboard',
    icon: <Clipboard className="w-4 h-4" />,
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
    icon: <Link className="w-4 h-4" />,
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