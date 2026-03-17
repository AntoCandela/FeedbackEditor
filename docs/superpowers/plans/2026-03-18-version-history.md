# Version History Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-save editor snapshots on copy/paste and let users browse and revert to previous versions from a header dropdown.

**Architecture:** New `history/` domain with `Version` type, `useVersionHistory` hook (localStorage-backed), and `VersionHistoryDropdown` component. Wired into App.tsx via save calls in handleCopy and a new revert handler.

**Tech Stack:** React, localStorage, Vitest

**Spec:** `docs/superpowers/specs/2026-03-18-version-history-design.md`

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/history/types.ts` | `Version` interface |
| `src/history/useVersionHistory.ts` | Hook: Version[] state + localStorage persistence |
| `src/history/useVersionHistory.test.ts` | Tests for the hook |
| `src/history/VersionHistoryDropdown.tsx` | Dropdown UI component listing versions |
| `src/history/formatRelativeTime.ts` | Helper to format timestamps as "2 min ago" |
| `src/layout/HeaderToolbar.tsx` | Add History button (modified) |
| `src/layout/App.tsx` | Wire version saves on copy, handle revert (modified) |

---

### Task 1: Version Types & History Hook

**Files:**
- Create: `src/history/types.ts`, `src/history/useVersionHistory.ts`, `src/history/useVersionHistory.test.ts`

- [ ] **Step 1: Create Version type**

Create `src/history/types.ts`:
```typescript
import type { Comment } from '../comments/types'

export interface Version {
  id: string
  markdown: string
  comments: Comment[]
  timestamp: number
  trigger: 'copy' | 'paste'
}
```

- [ ] **Step 2: Write failing tests for useVersionHistory**

Create `src/history/useVersionHistory.test.ts`:
```typescript
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useVersionHistory } from './useVersionHistory'

const STORAGE_KEY = 'feedbackeditor-versions'

describe('useVersionHistory', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with empty versions', () => {
    const { result } = renderHook(() => useVersionHistory())
    expect(result.current.versions).toEqual([])
  })

  it('saves a version', () => {
    const { result } = renderHook(() => useVersionHistory())
    act(() => {
      result.current.saveVersion('# Hello', [], 'copy')
    })
    expect(result.current.versions).toHaveLength(1)
    expect(result.current.versions[0].markdown).toBe('# Hello')
    expect(result.current.versions[0].trigger).toBe('copy')
    expect(result.current.versions[0].comments).toEqual([])
  })

  it('prepends new versions (newest first)', () => {
    const { result } = renderHook(() => useVersionHistory())
    act(() => {
      result.current.saveVersion('First', [], 'copy')
    })
    act(() => {
      result.current.saveVersion('Second', [], 'paste')
    })
    expect(result.current.versions[0].markdown).toBe('Second')
    expect(result.current.versions[1].markdown).toBe('First')
  })

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useVersionHistory())
    act(() => {
      result.current.saveVersion('Persisted', [], 'copy')
    })
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].markdown).toBe('Persisted')
  })

  it('loads from localStorage on mount', () => {
    const existing = [{
      id: 'existing-1',
      markdown: 'Loaded',
      comments: [],
      timestamp: Date.now(),
      trigger: 'copy',
    }]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    const { result } = renderHook(() => useVersionHistory())
    expect(result.current.versions).toHaveLength(1)
    expect(result.current.versions[0].markdown).toBe('Loaded')
  })

  it('handles corrupt localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json')
    const { result } = renderHook(() => useVersionHistory())
    expect(result.current.versions).toEqual([])
  })

  it('loads a version by id', () => {
    const { result } = renderHook(() => useVersionHistory())
    act(() => {
      result.current.saveVersion('Target', [], 'copy')
    })
    const id = result.current.versions[0].id
    const version = result.current.loadVersion(id)
    expect(version?.markdown).toBe('Target')
  })

  it('returns undefined for unknown id', () => {
    const { result } = renderHook(() => useVersionHistory())
    expect(result.current.loadVersion('nonexistent')).toBeUndefined()
  })

  it('clears all history', () => {
    const { result } = renderHook(() => useVersionHistory())
    act(() => {
      result.current.saveVersion('One', [], 'copy')
      result.current.saveVersion('Two', [], 'paste')
    })
    act(() => {
      result.current.clearHistory()
    })
    expect(result.current.versions).toEqual([])
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/history/useVersionHistory.test.ts`
Expected: FAIL — `useVersionHistory` not found

- [ ] **Step 4: Implement useVersionHistory hook**

Create `src/history/useVersionHistory.ts`:
```typescript
import { useState, useCallback } from 'react'
import type { Comment } from '../comments/types'
import type { Version } from './types'

const STORAGE_KEY = 'feedbackeditor-versions'

function loadFromStorage(): Version[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Version[]
  } catch {
    console.warn('FeedbackEditor: corrupt version history in localStorage, resetting.')
    return []
  }
}

function saveToStorage(versions: Version[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versions))
  } catch {
    console.warn('FeedbackEditor: localStorage full, dropping oldest versions.')
    // Drop oldest half and retry
    const trimmed = versions.slice(0, Math.ceil(versions.length / 2))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch {
      // Give up silently
    }
  }
}

export function useVersionHistory() {
  const [versions, setVersions] = useState<Version[]>(loadFromStorage)

  const saveVersion = useCallback((markdown: string, comments: Comment[], trigger: 'copy' | 'paste') => {
    const version: Version = {
      id: crypto.randomUUID(),
      markdown,
      comments: structuredClone(comments),
      timestamp: Date.now(),
      trigger,
    }
    setVersions(prev => {
      const next = [version, ...prev]
      saveToStorage(next)
      return next
    })
  }, [])

  const loadVersion = useCallback((id: string): Version | undefined => {
    return versions.find(v => v.id === id)
  }, [versions])

  const clearHistory = useCallback(() => {
    setVersions([])
    saveToStorage([])
  }, [])

  return { versions, saveVersion, loadVersion, clearHistory }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/history/useVersionHistory.test.ts`
Expected: All 9 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/history/types.ts src/history/useVersionHistory.ts src/history/useVersionHistory.test.ts
git commit -m "feat: add Version types and useVersionHistory hook with localStorage"
```

---

### Task 2: Relative Time Formatter

**Files:**
- Create: `src/history/formatRelativeTime.ts`

- [ ] **Step 1: Create the helper**

Create `src/history/formatRelativeTime.ts`:
```typescript
export function formatRelativeTime(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
```

- [ ] **Step 2: Commit**

```bash
git add src/history/formatRelativeTime.ts
git commit -m "feat: add relative time formatter for version history"
```

---

### Task 3: Version History Dropdown

**Files:**
- Create: `src/history/VersionHistoryDropdown.tsx`

- [ ] **Step 1: Create the dropdown component**

Create `src/history/VersionHistoryDropdown.tsx`:
```tsx
import type { Version } from './types'
import { formatRelativeTime } from './formatRelativeTime'

interface VersionHistoryDropdownProps {
  versions: Version[]
  onSelect: (id: string) => void
  onClear: () => void
  onClose: () => void
}

export function VersionHistoryDropdown({ versions, onSelect, onClear, onClose }: VersionHistoryDropdownProps) {
  const handleClear = () => {
    if (confirm('Clear all version history? This cannot be undone.')) {
      onClear()
    }
  }

  return (
    <div className="absolute top-full right-0 mt-1 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">
          Version History {versions.length > 0 && `(${versions.length})`}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm"
        >
          ✕
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {versions.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">
            No versions saved yet. Versions are created when you copy or paste.
          </p>
        ) : (
          versions.map(version => (
            <button
              key={version.id}
              onClick={() => onSelect(version.id)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {version.trigger === 'copy' ? '📋' : '📥'}
                </span>
                <span className="text-sm text-gray-700">
                  {version.trigger === 'copy' ? 'Copied' : 'Pasted'}
                </span>
                <span className="text-xs text-gray-400">
                  — {formatRelativeTime(version.timestamp)}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 ml-6">
                {version.comments.length} comment{version.comments.length !== 1 ? 's' : ''}
              </p>
            </button>
          ))
        )}
      </div>
      {versions.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100">
          <button
            onClick={handleClear}
            className="text-xs text-gray-400 hover:text-red-600"
          >
            Clear History
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/history/VersionHistoryDropdown.tsx
git commit -m "feat: add version history dropdown component"
```

---

### Task 4: Wire into Header and App

**Files:**
- Modify: `src/layout/HeaderToolbar.tsx`, `src/layout/App.tsx`

- [ ] **Step 1: Update HeaderToolbar to include History button**

Replace `src/layout/HeaderToolbar.tsx`:
```tsx
interface HeaderToolbarProps {
  onCopy: () => void
  copied: boolean
  copyError: string | null
  commentCount: number
  historyButton: React.ReactNode
}

export function HeaderToolbar({ onCopy, copied, copyError, commentCount, historyButton }: HeaderToolbarProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
      <h1 className="text-lg font-semibold text-gray-800">FeedbackEditor</h1>
      <div className="flex items-center gap-3">
        {copied && (
          <span className="text-sm text-green-600">Copied!</span>
        )}
        {copyError && (
          <span className="text-sm text-red-600">{copyError}</span>
        )}
        {historyButton}
        <button
          onClick={onCopy}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Copy with Comments {commentCount > 0 && `(${commentCount})`}
        </button>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Wire version history into App.tsx**

Update `src/layout/App.tsx`:

Add imports:
```tsx
import { useState } from 'react'
import { useVersionHistory } from '../history/useVersionHistory'
import { VersionHistoryDropdown } from '../history/VersionHistoryDropdown'
```

Add inside the App component (after `useCopyToClipboard`):
```tsx
const { versions, saveVersion, loadVersion, clearHistory } = useVersionHistory()
const [showHistory, setShowHistory] = useState(false)

const handleRevert = (id: string) => {
  const version = loadVersion(id)
  if (!version || !editor) return
  // Auto-save current state before reverting
  const currentMarkdown = editor.storage.markdown?.getMarkdown?.() ?? ''
  saveVersion(currentMarkdown, comments, 'copy')
  // Load the selected version
  editor.commands.setContent(version.markdown)
  // Clear current comments and restore version's comments
  comments.forEach(c => deleteComment(c.id))
  version.comments.forEach(c => addComment(c.id, c.text, c.highlightedText))
  setShowHistory(false)
}
```

Update `handleCopy` to save version before copying:
```tsx
const handleCopy = () => {
  if (!editor) return
  // Save version before copy
  const currentMarkdown = editor.storage.markdown?.getMarkdown?.() ?? ''
  saveVersion(currentMarkdown, comments, 'copy')
  const markdown = serializeMarkdown(editor.getJSON(), comments)
  copy(markdown)
}
```

Update the HeaderToolbar JSX to pass the history button:
```tsx
<HeaderToolbar
  onCopy={handleCopy}
  copied={copied}
  copyError={copyError}
  commentCount={comments.length}
  historyButton={
    <div className="relative">
      <button
        onClick={() => setShowHistory(!showHistory)}
        className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
      >
        History {versions.length > 0 && `(${versions.length})`}
      </button>
      {showHistory && (
        <VersionHistoryDropdown
          versions={versions}
          onSelect={handleRevert}
          onClear={clearHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  }
/>
```

- [ ] **Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Run all tests**

Run: `npx vitest run`
Expected: All tests pass (existing 20 + new 9 = 29)

- [ ] **Step 5: Commit**

```bash
git add src/layout/HeaderToolbar.tsx src/layout/App.tsx
git commit -m "feat: wire version history into header and app with save/revert"
```

---

### Task 5: Final Verification

**Files:** All

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All 29 tests pass

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: version history integration verification"
```
