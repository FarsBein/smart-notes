import { Extension } from '@tiptap/core'
import Suggestion from '@tiptap/suggestion'
import tippy from 'tippy.js'
import { Heading1, Heading2, List, ListOrdered, Quote, Code } from 'lucide-react'
import React from 'react'
import { ReactRenderer } from '@tiptap/react'
import styles from './CommandList.module.scss'

const CommandList = React.forwardRef((props: any, ref: any) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const { items, command } = props

  const selectItem = (index: number) => {
    const item = items[index]
    if (item) command(item)
  }

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length)
        return true
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % items.length)
        return true
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }))

  return (
    <div className={styles.commandList}>
      {items.map((item: any, index: number) => (
        <button
          key={index}
          className={`${styles.commandItem} ${
            index === selectedIndex ? styles.selected : ''
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

const getSuggestionItems = () => [
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
      },
    }
  },
  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ]
  },
}).configure({
  suggestion: {
    items: getSuggestionItems,
    render: () => {
      let reactRenderer: any
      let popup: any

      return {
        onStart: (props: any) => {
          reactRenderer = new ReactRenderer(CommandList, {
            props,
            editor: props.editor,
          })

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: reactRenderer.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          })
        },
        onUpdate(props: any) {
          reactRenderer.updateProps(props)
          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          })
        },
        onKeyDown(props: any) {
          if (props.event.key === 'Escape') {
            popup[0].hide()
            return true
          }
          return reactRenderer.ref?.onKeyDown(props)
        },
        onExit() {
          popup[0].destroy()
          reactRenderer.destroy()
        },
      }
    },
  },
})