import { Extension } from '@tiptap/core'
import { Suggestion, type SuggestionOptions } from '@tiptap/suggestion'
import { ReactRenderer } from '@tiptap/react'
import tippy, { type Instance } from 'tippy.js'
import { filterCommands, type SlashCommandItem } from './items'
import { SlashCommandList, type SlashCommandListRef } from './SlashCommandList'

type SuggestionProps = {
  editor: SuggestionOptions['editor']
  range: { from: number; to: number }
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
  clientRect?: (() => DOMRect | null) | null
}

export const SlashCommands = Extension.create({
  name: 'slashCommands',

  addOptions() {
    return {
      suggestion: {
        char: '/',
        command: ({ editor, range, props }: { editor: SuggestionProps['editor']; range: SuggestionProps['range']; props: SlashCommandItem }) => {
          editor.chain().focus().deleteRange(range).run()
          props.command(editor)
        },
        items: ({ query }: { query: string }) => filterCommands(query),
        render: () => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          let component: ReactRenderer<SlashCommandListRef, any> | null = null
          let popup: Instance[] | null = null

          return {
            onStart: (props: SuggestionProps) => {
              component = new ReactRenderer(SlashCommandList, {
                props: {
                  items: props.items,
                  command: props.command,
                },
                editor: props.editor,
              })

              if (!props.clientRect || !component) return

              popup = tippy('body', {
                getReferenceClientRect: props.clientRect as () => DOMRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              })
            },
            onUpdate: (props: SuggestionProps) => {
              component?.updateProps({
                items: props.items,
                command: props.command,
              })
              if (popup?.[0] && props.clientRect) {
                popup[0].setProps({
                  getReferenceClientRect: props.clientRect as () => DOMRect,
                })
              }
            },
            onKeyDown: (props: { event: KeyboardEvent }) => {
              if (props.event.key === 'Escape') {
                popup?.[0]?.hide()
                return true
              }
              return component?.ref?.onKeyDown(props) ?? false
            },
            onExit: () => {
              popup?.[0]?.destroy()
              component?.destroy()
            },
          }
        },
      } satisfies Partial<SuggestionOptions<SlashCommandItem>>,
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
})
