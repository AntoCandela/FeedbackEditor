import type { Editor } from '@tiptap/core'

export function selectionOverlapsComment(editor: Editor): boolean {
  const { from, to } = editor.state.selection
  let overlaps = false
  editor.state.doc.nodesBetween(from, to, (node) => {
    if (node.marks?.some(mark => mark.type.name === 'comment')) {
      overlaps = true
    }
  })
  return overlaps
}
