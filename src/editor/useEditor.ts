import { useEditor as useTiptapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { CommentMark } from '../comments/CommentMark'

interface EditorOptions {
  content?: string
  onPaste?: () => void
}

export function useAppEditor(options: EditorOptions = {}) {
  const { content, onPaste } = options
  const editor = useTiptapEditor({
    extensions: [
      StarterKit,
      Markdown,
      CommentMark,
    ],
    content: content ?? '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-full',
      },
      handlePaste: () => {
        onPaste?.()
        return false
      },
    },
  })

  return editor
}
