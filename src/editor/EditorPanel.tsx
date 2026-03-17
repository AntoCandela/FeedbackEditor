import { EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/core'

interface EditorPanelProps {
  editor: Editor | null
}

export function EditorPanel({ editor }: EditorPanelProps) {
  if (!editor) return null

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <EditorContent editor={editor} />
    </div>
  )
}
