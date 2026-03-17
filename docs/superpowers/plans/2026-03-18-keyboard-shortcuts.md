# Keyboard Shortcuts Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add keyboard shortcuts for copy (Cmd+Enter), add comment (Cmd+K), dismiss (Escape), version back (Cmd+Alt+Z), and version forward (Cmd+Alt+Shift+Z).

**Architecture:** Single `useKeyboardShortcuts` hook with a `keydown` listener on `document`. Tracks version navigation index via ref. Wired into App.tsx.

**Tech Stack:** React hooks, DOM keydown events

**Spec:** `docs/superpowers/specs/2026-03-18-keyboard-shortcuts-design.md`

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/editor/useKeyboardShortcuts.ts` | Hook: keydown listener with all 5 shortcuts + version nav state |
| `src/layout/App.tsx` | Wire the hook with editor, handlers, version history |

---

### Task 1: Create useKeyboardShortcuts Hook

**Files:**
- Create: `src/editor/useKeyboardShortcuts.ts`

- [ ] **Step 1: Create the hook**

Create `src/editor/useKeyboardShortcuts.ts`:
```typescript
import { useEffect, useRef, useCallback } from 'react'
import type { Editor } from '@tiptap/core'
import type { Version } from '../history/types'
import type { Comment } from '../comments/types'
import type { MarkdownStorage } from 'tiptap-markdown'

const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform)

function isModKey(e: KeyboardEvent): boolean {
  return isMac ? e.metaKey : e.ctrlKey
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
        const markdown = (editor.storage as unknown as { markdown: MarkdownStorage }).markdown?.getMarkdown?.() ?? ''
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
          // Restore comments — handled by caller if needed
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
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/editor/useKeyboardShortcuts.ts
git commit -m "feat: add useKeyboardShortcuts hook with 5 shortcuts"
```

---

### Task 2: Wire into App

**Files:**
- Modify: `src/layout/App.tsx`

- [ ] **Step 1: Wire the hook into App**

Read the current `src/layout/App.tsx` first. Then add:

1. Import at top:
```tsx
import { useKeyboardShortcuts } from '../editor/useKeyboardShortcuts'
```

2. After `const [showHistory, setShowHistory] = useState(false)`, add the hook call:
```tsx
useKeyboardShortcuts({
  editor,
  onCopy: handleCopy,
  onAddComment: handleAddComment,
  versions,
  onRevert: handleRevert,
  saveVersion,
  comments,
})
```

Note: `handleCopy`, `handleAddComment`, and `handleRevert` must be defined before this call. The current App.tsx already has `handleCopy` and `handleAddComment` defined before the JSX, but `handleRevert` is also defined before. Verify the ordering is correct — the hook call should go after all handler definitions.

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Run all tests**

Run: `npx vitest run`
Expected: All 29 tests pass

- [ ] **Step 4: Commit**

```bash
git add src/layout/App.tsx
git commit -m "feat: wire keyboard shortcuts into app"
```
