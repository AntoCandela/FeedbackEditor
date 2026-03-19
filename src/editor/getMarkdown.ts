import type { Editor } from '@tiptap/core'
import type { MarkdownStorage } from 'tiptap-markdown'

export function getMarkdown(editor: Editor): string {
  const storage = editor.storage as unknown as { markdown: MarkdownStorage }
  return storage.markdown?.getMarkdown?.() ?? ''
}
