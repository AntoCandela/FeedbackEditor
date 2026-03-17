import { BubbleMenu } from '@tiptap/react/menus'
import type { Editor } from '@tiptap/core'

interface CommentBubbleMenuProps {
  editor: Editor
  onAddComment: (selectedText: string) => void
}

function selectionOverlapsComment(editor: Editor): boolean {
  const { from, to } = editor.state.selection
  let overlaps = false
  editor.state.doc.nodesBetween(from, to, (node) => {
    if (node.marks?.some(mark => mark.type.name === 'comment')) {
      overlaps = true
    }
  })
  return overlaps
}

export function CommentBubbleMenu({ editor, onAddComment }: CommentBubbleMenuProps) {
  const hasOverlap = selectionOverlapsComment(editor)

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ from, to }) => {
        return from !== to
      }}
    >
      <button
        onClick={() => {
          const { from, to } = editor.state.selection
          const text = editor.state.doc.textBetween(from, to)
          onAddComment(text)
        }}
        disabled={hasOverlap}
        className={`px-3 py-1.5 text-sm rounded shadow-lg border ${
          hasOverlap
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
            : 'bg-white text-gray-800 hover:bg-blue-50 hover:text-blue-700'
        }`}
      >
        Add Comment
      </button>
    </BubbleMenu>
  )
}
