import { EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/core'

interface EditorPanelProps {
  editor: Editor | null
  onClickComment?: (commentId: string) => void
}

export function EditorPanel({ editor, onClickComment }: EditorPanelProps) {
  if (!editor) return null

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    const commentEl = target.closest('.comment-highlight') as HTMLElement | null
    if (commentEl && onClickComment) {
      const id = commentEl.getAttribute('data-comment-id')
      if (id) onClickComment(id)
    }
  }

  return (
    <div
      className="flex-1 px-8 py-6 overflow-y-auto"
      style={{ background: 'var(--bg-primary)' }}
      onClick={handleClick}
    >
      <div className="max-w-prose mx-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
