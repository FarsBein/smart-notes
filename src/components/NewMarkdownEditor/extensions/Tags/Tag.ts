import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from 'prosemirror-state'
import { Decoration, DecorationSet } from 'prosemirror-view'

export const Tag = Extension.create({
  name: 'tag',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('tag'),
        props: {
          decorations: state => {
            const decorations: Decoration[] = []
            const doc = state.doc

            doc.descendants((node, pos) => {
              const text = node.text
              if (text) {
                let match
                const tagRegex = /#[^\s#]+/g
                while ((match = tagRegex.exec(text))) {
                  const start = pos + match.index
                  const end = start + match[0].length
                  decorations.push(
                    Decoration.inline(start, end, {
                      class: 'tag-highlight',
                    })
                  )
                }
              }
            })

            return DecorationSet.create(doc, decorations)
          },
        },
      }),
    ]
  },
}) 