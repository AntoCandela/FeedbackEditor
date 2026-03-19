import { useEffect, useRef, useCallback } from 'react'
import type { Editor } from '@tiptap/core'
import type { Version } from '../history/types'
import type { Comment } from '../comments/types'
import { selectionOverlapsComment } from './selectionUtils'
import { getMarkdown } from './getMarkdown'

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)

function isModKey(e: KeyboardEvent): boolean {
  return isMac ? e.metaKey : e.ctrlKey
}

interface KeyboardShortcutDeps {
  editor: Editor | null
  onCopy: () => void
  onAddComment: (selectedText: string) => void
  versions: Version[]
  onRevert: (id: string) => void
  saveVersion: (markdown: string, comments: Comment[], trigger: 'copy' | 'paste') => void
  comments: Comment[]
}

export function useKeyboardShortcuts({
  editor,
  onCopy,
  onAddComment,
  versions,
  onRevert,
  saveVersion,
  comments,
}: KeyboardShortcutDeps) {
  const versionIndexRef = useRef(-1)
  const currentStateRef = useRef<{ markdown: string; comments: Comment[] } | null>(null)

  // Reset version index when user edits
  useEffect(() => {
    if (!editor) return
    const resetIndex = () => {
      versionIndexRef.current = -1
      currentStateRef.current = null
    }
    editor.on('update', resetIndex)
    return () => { editor.off('update', resetIndex) }
  }, [editor])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!editor) return

    // Cmd+Enter — copy with comments
    if (isModKey(e) && e.key === 'Enter') {
      e.preventDefault()
      onCopy()
      return
    }

    // Cmd+K — add comment on selection
    if (isModKey(e) && e.key === 'k') {
      e.preventDefault()
      const { from, to } = editor.state.selection
      if (from === to) return
      if (selectionOverlapsComment(editor)) return
      const text = editor.state.doc.textBetween(from, to)
      onAddComment(text)
      return
    }

    // Escape — dismiss / deselect
    if (e.key === 'Escape') {
      const { from, to } = editor.state.selection
      if (from !== to) {
        e.preventDefault()
        editor.commands.setTextSelection(to)
      }
      return
    }

    // Cmd+Alt+Z — version back
    if (isModKey(e) && e.altKey && !e.shiftKey && e.key === 'z') {
      e.preventDefault()
      if (versions.length === 0) return
      const currentIndex = versionIndexRef.current

      // First press: save current state
      if (currentIndex === -1) {
        const markdown = getMarkdown(editor)
        currentStateRef.current = { markdown, comments: structuredClone(comments) }
        versionIndexRef.current = 0
        onRevert(versions[0].id)
        return
      }

      // Subsequent presses: go further back
      const nextIndex = currentIndex + 1
      if (nextIndex >= versions.length) return
      versionIndexRef.current = nextIndex
      onRevert(versions[nextIndex].id)
      return
    }

    // Cmd+Alt+Shift+Z — version forward
    if (isModKey(e) && e.altKey && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault()
      const currentIndex = versionIndexRef.current
      if (currentIndex <= -1) return

      const nextIndex = currentIndex - 1
      if (nextIndex === -1) {
        // Restore the saved current state
        versionIndexRef.current = -1
        if (currentStateRef.current) {
          editor.commands.setContent(currentStateRef.current.markdown)
          currentStateRef.current = null
        }
        return
      }

      versionIndexRef.current = nextIndex
      onRevert(versions[nextIndex].id)
      return
    }
  }, [editor, onCopy, onAddComment, versions, onRevert, saveVersion, comments])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
