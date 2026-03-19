import { useEditor as useTiptapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Link } from '@tiptap/extension-link'
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
      Table.configure({ resizable: false }),
      TableRow,
      TableCell,
      TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      Link.configure({ openOnClick: true, autolink: true }),
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
