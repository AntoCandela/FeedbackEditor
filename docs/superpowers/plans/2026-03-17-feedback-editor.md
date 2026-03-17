# FeedbackEditor Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone React web app that lets users annotate AI-generated markdown with inline comments and copy back annotated markdown for AI consumption.

**Architecture:** Domain-screaming folder structure (`comments/`, `editor/`, `export/`, `layout/`). Custom Tiptap comment mark stores `commentId`; feedback text lives in React state. Walk-and-inject serializer converts between Tiptap doc and markdown with `{start-comment}...{end-comment: feedback}` delimiters.

**Tech Stack:** React, Vite, Tiptap v2, tiptap-markdown, Tailwind CSS, Vitest

**Spec:** `docs/superpowers/specs/2026-03-17-feedback-editor-design.md`

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/comments/types.ts` | `Comment` interface definition |
| `src/comments/useComments.ts` | Comment state management hook (add, update, delete, active) |
| `src/comments/useComments.test.ts` | Tests for useComments hook |
| `src/comments/CommentMark.ts` | Custom Tiptap mark extension with `commentId` attribute |
| `src/comments/CommentCard.tsx` | Single comment card UI (snippet, feedback, edit/delete) |
| `src/comments/CommentSidebar.tsx` | Sidebar listing all comment cards |
| `src/export/systemPrompt.ts` | System prompt constant |
| `src/export/serializeMarkdown.ts` | Tiptap JSON doc → markdown with comment delimiters |
| `src/export/serializeMarkdown.test.ts` | Tests for serializer |
| `src/export/parseMarkdown.ts` | Markdown with delimiters → HTML + comment entries |
| `src/export/parseMarkdown.test.ts` | Tests for parser |
| `src/export/useCopyToClipboard.ts` | Clipboard copy hook with toast/fallback |
| `src/editor/useEditor.ts` | Tiptap editor configuration hook |
| `src/editor/EditorPanel.tsx` | Tiptap editor wrapper component |
| `src/editor/CommentBubbleMenu.tsx` | Bubble menu with "Add Comment" button |
| `src/layout/HeaderToolbar.tsx` | Top bar with Copy/Paste buttons |
| `src/layout/App.tsx` | Root layout composing all panels, state orchestration, modals |
| `src/main.tsx` | Vite entry point |
| `src/index.css` | Tailwind imports + comment highlight style |

Note: No `shared/` folder is needed. The `Comment` type in `comments/types.ts` is the only cross-domain type, imported directly by `export/` modules.

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js`, `postcss.config.js`, `index.html`, `src/main.tsx`, `src/index.css`, `src/layout/App.tsx`

- [ ] **Step 1: Scaffold Vite React TypeScript project**

Run:
```bash
npm create vite@latest . -- --template react-ts
```

- [ ] **Step 2: Install dependencies**

Run:
```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-bubble-menu tiptap-markdown
npm install -D tailwindcss @tailwindcss/postcss postcss vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react
```

- [ ] **Step 3: Configure Tailwind**

Create `src/index.css`:
```css
@import "tailwindcss";

.comment-highlight {
  background-color: #FFF3CD;
  cursor: pointer;
  border-bottom: 2px solid #F0C36D;
}

.comment-highlight.active {
  background-color: #FFE69C;
  border-bottom-color: #E0A800;
}
```

- [ ] **Step 4: Configure Vitest**

Add to `vite.config.ts`:
```typescript
/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
})
```

- [ ] **Step 5: Create minimal App shell**

Create `src/layout/App.tsx`:
```tsx
export default function App() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
        <h1 className="text-lg font-semibold text-gray-800">FeedbackEditor</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            Paste New Text
          </button>
          <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
            Copy with Comments
          </button>
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto">
          <p className="text-gray-400">Editor will go here</p>
        </div>
        <aside className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
          <p className="text-gray-400">Sidebar will go here</p>
        </aside>
      </main>
    </div>
  )
}
```

Update `src/main.tsx`:
```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './layout/App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 6: Verify the app runs**

Run: `npm run dev`
Expected: Browser shows the FeedbackEditor shell with header, empty editor area, and sidebar placeholder.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold Vite + React + Tailwind project with app shell"
```

---

### Task 2: Comment Types & State Hook

**Files:**
- Create: `src/comments/types.ts`, `src/comments/useComments.ts`, `src/comments/useComments.test.ts`

- [ ] **Step 1: Create Comment type**

Create `src/comments/types.ts`:
```typescript
export interface Comment {
  id: string
  text: string
  highlightedText: string
  createdAt: number
}
```

- [ ] **Step 2: Write failing tests for useComments**

Create `src/comments/useComments.test.ts`:
```typescript
import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useComments } from './useComments'

describe('useComments', () => {
  it('starts with empty comments', () => {
    const { result } = renderHook(() => useComments())
    expect(result.current.comments).toEqual([])
    expect(result.current.activeCommentId).toBeNull()
  })

  it('adds a comment', () => {
    const { result } = renderHook(() => useComments())
    act(() => {
      result.current.addComment('id-1', 'Fix this', 'some text')
    })
    expect(result.current.comments).toHaveLength(1)
    expect(result.current.comments[0]).toMatchObject({
      id: 'id-1',
      text: 'Fix this',
      highlightedText: 'some text',
    })
  })

  it('updates a comment text', () => {
    const { result } = renderHook(() => useComments())
    act(() => {
      result.current.addComment('id-1', 'Fix this', 'some text')
    })
    act(() => {
      result.current.updateComment('id-1', 'Rewrite this')
    })
    expect(result.current.comments[0].text).toBe('Rewrite this')
  })

  it('deletes a comment', () => {
    const { result } = renderHook(() => useComments())
    act(() => {
      result.current.addComment('id-1', 'Fix this', 'some text')
    })
    act(() => {
      result.current.deleteComment('id-1')
    })
    expect(result.current.comments).toHaveLength(0)
  })

  it('sets active comment id', () => {
    const { result } = renderHook(() => useComments())
    act(() => {
      result.current.setActiveCommentId('id-1')
    })
    expect(result.current.activeCommentId).toBe('id-1')
  })

  it('clears all comments', () => {
    const { result } = renderHook(() => useComments())
    act(() => {
      result.current.addComment('id-1', 'Fix', 'text')
      result.current.addComment('id-2', 'Also fix', 'more text')
    })
    act(() => {
      result.current.clearComments()
    })
    expect(result.current.comments).toHaveLength(0)
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/comments/useComments.test.ts`
Expected: FAIL — `useComments` not found

- [ ] **Step 4: Implement useComments hook**

Create `src/comments/useComments.ts`:
```typescript
import { useState, useCallback } from 'react'
import type { Comment } from './types'

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([])
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)

  const addComment = useCallback((id: string, text: string, highlightedText: string) => {
    setComments(prev => [...prev, { id, text, highlightedText, createdAt: Date.now() }])
  }, [])

  const updateComment = useCallback((id: string, text: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, text } : c))
  }, [])

  const deleteComment = useCallback((id: string) => {
    setComments(prev => prev.filter(c => c.id !== id))
    setActiveCommentId(prev => prev === id ? null : prev)
  }, [])

  const clearComments = useCallback(() => {
    setComments([])
    setActiveCommentId(null)
  }, [])

  return {
    comments,
    addComment,
    updateComment,
    deleteComment,
    clearComments,
    activeCommentId,
    setActiveCommentId,
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/comments/useComments.test.ts`
Expected: All 6 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/comments/types.ts src/comments/useComments.ts src/comments/useComments.test.ts
git commit -m "feat: add Comment types and useComments state hook with tests"
```

---

### Task 3: System Prompt & Markdown Serializer

**Files:**
- Create: `src/export/systemPrompt.ts`, `src/export/serializeMarkdown.ts`, `src/export/serializeMarkdown.test.ts`

- [ ] **Step 1: Create system prompt constant**

Create `src/export/systemPrompt.ts`:
```typescript
export const SYSTEM_PROMPT = `[SYSTEM: This document contains inline feedback comments.
Comments are marked with {start-comment} and {end-comment: feedback text} delimiters.
The text between {start-comment} and {end-comment} is the portion being commented on.
The text after the colon in {end-comment: ...} is the feedback/instruction.
Please revise the document according to the feedback, then return the clean
markdown without any comment delimiters.]`
```

- [ ] **Step 2: Write failing tests for serializeMarkdown**

Create `src/export/serializeMarkdown.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { serializeMarkdown } from './serializeMarkdown'
import { SYSTEM_PROMPT } from './systemPrompt'
import type { Comment } from '../comments/types'

describe('serializeMarkdown', () => {
  it('serializes plain text without comments', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello world' }],
        },
      ],
    }
    const result = serializeMarkdown(doc, [])
    expect(result).toContain('Hello world')
    expect(result).not.toContain('{start-comment}')
  })

  it('wraps commented text with delimiters', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'The future is ' },
            {
              type: 'text',
              text: 'about replacing humans',
              marks: [{ type: 'comment', attrs: { commentId: 'c1' } }],
            },
            { type: 'text', text: ' in every industry.' },
          ],
        },
      ],
    }
    const comments: Comment[] = [
      { id: 'c1', text: 'Too aggressive', highlightedText: 'about replacing humans', createdAt: 1 },
    ]
    const result = serializeMarkdown(doc, comments)
    expect(result).toContain('{start-comment}about replacing humans{end-comment: Too aggressive}')
  })

  it('prepends the system prompt when comments exist', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'some text',
              marks: [{ type: 'comment', attrs: { commentId: 'c1' } }],
            },
          ],
        },
      ],
    }
    const comments: Comment[] = [
      { id: 'c1', text: 'Fix', highlightedText: 'some text', createdAt: 1 },
    ]
    const result = serializeMarkdown(doc, comments)
    expect(result).toStartWith(SYSTEM_PROMPT)
  })

  it('does not prepend system prompt when no comments', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Clean text' }],
        },
      ],
    }
    const result = serializeMarkdown(doc, [])
    expect(result).not.toContain('[SYSTEM:')
  })

  it('handles headings', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'My Title' }],
        },
      ],
    }
    const result = serializeMarkdown(doc, [])
    expect(result).toContain('# My Title')
  })

  it('handles bold and italic marks alongside comments', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'bold text',
              marks: [
                { type: 'bold' },
                { type: 'comment', attrs: { commentId: 'c1' } },
              ],
            },
          ],
        },
      ],
    }
    const comments: Comment[] = [
      { id: 'c1', text: 'Rephrase', highlightedText: 'bold text', createdAt: 1 },
    ]
    const result = serializeMarkdown(doc, comments)
    expect(result).toContain('{start-comment}**bold text**{end-comment: Rephrase}')
  })

  it('skips orphan comment marks with no matching comment', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'orphan text',
              marks: [{ type: 'comment', attrs: { commentId: 'missing' } }],
            },
          ],
        },
      ],
    }
    const result = serializeMarkdown(doc, [])
    expect(result).toContain('orphan text')
    expect(result).not.toContain('{start-comment}')
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run src/export/serializeMarkdown.test.ts`
Expected: FAIL — `serializeMarkdown` not found

- [ ] **Step 4: Implement serializeMarkdown**

Create `src/export/serializeMarkdown.ts`:
```typescript
import type { Comment } from '../comments/types'
import { SYSTEM_PROMPT } from './systemPrompt'

interface TiptapNode {
  type: string
  content?: TiptapNode[]
  text?: string
  marks?: { type: string; attrs?: Record<string, unknown> }[]
  attrs?: Record<string, unknown>
}

function getCommentMark(node: TiptapNode) {
  return node.marks?.find(m => m.type === 'comment')
}

function getInlineMarkdown(node: TiptapNode): string {
  const text = node.text ?? ''
  if (!node.marks) return text

  let result = text
  const nonCommentMarks = node.marks.filter(m => m.type !== 'comment')
  for (const mark of nonCommentMarks) {
    if (mark.type === 'bold') result = `**${result}**`
    else if (mark.type === 'italic') result = `*${result}*`
    else if (mark.type === 'strike') result = `~~${result}~~`
    else if (mark.type === 'code') result = `\`${result}\``
    else if (mark.type === 'link') result = `[${result}](${mark.attrs?.href ?? ''})`
  }
  return result
}

function serializeNode(node: TiptapNode, comments: Comment[], depth = 0): string {
  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map(n => serializeNode(n, comments, depth)).join('\n\n')

    case 'paragraph':
      return (node.content ?? []).map(n => serializeNode(n, comments, depth)).join('')

    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1
      const prefix = '#'.repeat(level)
      const content = (node.content ?? []).map(n => serializeNode(n, comments, depth)).join('')
      return `${prefix} ${content}`
    }

    case 'bulletList':
      return (node.content ?? []).map(n => serializeNode(n, comments, depth)).join('\n')

    case 'orderedList':
      return (node.content ?? []).map((n, i) => serializeNode(n, comments, depth, i + 1)).join('\n')

    case 'listItem': {
      const prefix = depth > 0 ? '  '.repeat(depth) : ''
      const content = (node.content ?? []).map(n => serializeNode(n, comments, depth + 1)).join('')
      return `${prefix}- ${content}`
    }

    case 'blockquote': {
      const content = (node.content ?? []).map(n => serializeNode(n, comments, depth)).join('\n')
      return content.split('\n').map(line => `> ${line}`).join('\n')
    }

    case 'codeBlock': {
      const lang = (node.attrs?.language as string) ?? ''
      const content = (node.content ?? []).map(n => n.text ?? '').join('')
      return `\`\`\`${lang}\n${content}\n\`\`\``
    }

    case 'horizontalRule':
      return '---'

    case 'text': {
      const md = getInlineMarkdown(node)
      const commentMark = getCommentMark(node)
      if (!commentMark) return md

      const commentId = commentMark.attrs?.commentId as string
      const comment = comments.find(c => c.id === commentId)
      if (!comment) return md

      return `{start-comment}${md}{end-comment: ${comment.text}}`
    }

    default:
      return (node.content ?? []).map(n => serializeNode(n, comments, depth)).join('')
  }
}

export function serializeMarkdown(doc: TiptapNode, comments: Comment[]): string {
  const markdown = serializeNode(doc, comments)
  const hasComments = comments.length > 0 && markdown.includes('{start-comment}')
  if (hasComments) {
    return `${SYSTEM_PROMPT}\n\n${markdown}`
  }
  return markdown
}
```

Note: This is a simplified serializer covering the CommonMark subset from the spec. The `tiptap-markdown` library handles the full import; this custom serializer handles export with comment injection. During implementation, the serializer may need adjustments based on actual Tiptap JSON structures encountered.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run src/export/serializeMarkdown.test.ts`
Expected: All 7 tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/export/systemPrompt.ts src/export/serializeMarkdown.ts src/export/serializeMarkdown.test.ts
git commit -m "feat: add markdown serializer with comment delimiter injection"
```

---

### Task 4: Markdown Parser (Import)

**Files:**
- Create: `src/export/parseMarkdown.ts`, `src/export/parseMarkdown.test.ts`

- [ ] **Step 1: Write failing tests for parseMarkdown**

Create `src/export/parseMarkdown.test.ts`:
```typescript
import { describe, it, expect } from 'vitest'
import { parseMarkdown } from './parseMarkdown'

describe('parseMarkdown', () => {
  it('returns HTML and empty comments for plain markdown', () => {
    const result = parseMarkdown('# Hello\n\nSome text')
    expect(result.html).toContain('Hello')
    expect(result.comments).toEqual([])
  })

  it('extracts comments from delimiters', () => {
    const md = 'The {start-comment}old text{end-comment: Make it new} here.'
    const result = parseMarkdown(md)
    expect(result.comments).toHaveLength(1)
    expect(result.comments[0].text).toBe('Make it new')
    expect(result.comments[0].highlightedText).toBe('old text')
    expect(result.html).toContain('data-comment-id')
    expect(result.html).not.toContain('{start-comment}')
  })

  it('handles multiple comments', () => {
    const md = '{start-comment}first{end-comment: Fix 1} and {start-comment}second{end-comment: Fix 2}'
    const result = parseMarkdown(md)
    expect(result.comments).toHaveLength(2)
    expect(result.comments[0].highlightedText).toBe('first')
    expect(result.comments[1].highlightedText).toBe('second')
  })

  it('ignores delimiters inside fenced code blocks', () => {
    const md = '```\n{start-comment}code{end-comment: not a comment}\n```'
    const result = parseMarkdown(md)
    expect(result.comments).toEqual([])
  })

  it('handles malformed delimiters gracefully', () => {
    const md = 'Some {start-comment}unclosed text here.'
    const result = parseMarkdown(md)
    expect(result.comments).toEqual([])
    expect(result.html).toContain('{start-comment}')
  })

  it('strips the system prompt if present', () => {
    const md = '[SYSTEM: This document contains inline feedback comments.\nSome instructions.]\n\n# Title\n\nContent'
    const result = parseMarkdown(md)
    expect(result.html).not.toContain('[SYSTEM:')
    expect(result.html).toContain('Title')
  })

  it('assigns unique UUIDs to each comment', () => {
    const md = '{start-comment}a{end-comment: x} and {start-comment}b{end-comment: y}'
    const result = parseMarkdown(md)
    expect(result.comments[0].id).not.toBe(result.comments[1].id)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/export/parseMarkdown.test.ts`
Expected: FAIL — `parseMarkdown` not found

- [ ] **Step 3: Implement parseMarkdown**

Create `src/export/parseMarkdown.ts`:
```typescript
import type { Comment } from '../comments/types'

interface ParseResult {
  html: string
  comments: Comment[]
}

function maskCodeBlocks(md: string): { masked: string; blocks: string[] } {
  const blocks: string[] = []
  const masked = md.replace(/```[\s\S]*?```/g, (match) => {
    blocks.push(match)
    return `__CODE_BLOCK_${blocks.length - 1}__`
  })
  return { masked, blocks }
}

function unmaskCodeBlocks(text: string, blocks: string[]): string {
  return text.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => blocks[Number(index)])
}

function stripSystemPrompt(md: string): string {
  return md.replace(/^\[SYSTEM:[\s\S]*?\]\s*\n*/m, '')
}

export function parseMarkdown(md: string): ParseResult {
  const stripped = stripSystemPrompt(md)
  const { masked, blocks } = maskCodeBlocks(stripped)
  const comments: Comment[] = []

  const pattern = /\{start-comment\}(.*?)\{end-comment:\s*(.*?)\}/g
  const processed = masked.replace(pattern, (_, highlighted: string, feedback: string) => {
    const id = crypto.randomUUID()
    comments.push({
      id,
      text: feedback,
      highlightedText: highlighted,
      createdAt: Date.now(),
    })
    return `<span data-comment-id="${id}">${highlighted}</span>`
  })

  const unmasked = unmaskCodeBlocks(processed, blocks)

  return { html: unmasked, comments }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/export/parseMarkdown.test.ts`
Expected: All 7 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/export/parseMarkdown.ts src/export/parseMarkdown.test.ts
git commit -m "feat: add markdown parser with comment delimiter extraction"
```

---

### Task 5: Custom Comment Mark Extension

**Files:**
- Create: `src/comments/CommentMark.ts`

- [ ] **Step 1: Create the CommentMark Tiptap extension**

Create `src/comments/CommentMark.ts`:
```typescript
import { Mark, mergeAttributes } from '@tiptap/core'

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    comment: {
      setComment: (commentId: string) => ReturnType
      unsetComment: () => ReturnType
    }
  }
}

export const CommentMark = Mark.create({
  name: 'comment',

  addAttributes() {
    return {
      commentId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-comment-id'),
        renderHTML: (attributes) => ({
          'data-comment-id': attributes.commentId,
        }),
      },
    }
  },

  parseHTML() {
    return [{ tag: 'span[data-comment-id]' }]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ class: 'comment-highlight' }, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setComment: (commentId: string) => ({ commands }) => {
        return commands.setMark(this.name, { commentId })
      },
      unsetComment: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      },
    }
  },
})
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `npx tsc --noEmit`
Expected: No errors (or only pre-existing unrelated ones)

- [ ] **Step 3: Commit**

```bash
git add src/comments/CommentMark.ts
git commit -m "feat: add custom Tiptap CommentMark extension"
```

---

### Task 6: Editor Panel & Hook

**Files:**
- Create: `src/editor/useEditor.ts`, `src/editor/EditorPanel.tsx`

- [ ] **Step 1: Create useEditor hook**

Create `src/editor/useEditor.ts`:
```typescript
import { useEditor as useTiptapEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Markdown } from 'tiptap-markdown'
import { CommentMark } from '../comments/CommentMark'

export function useAppEditor(content?: string) {
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
    },
  })

  return editor
}
```

- [ ] **Step 2: Create EditorPanel component**

Create `src/editor/EditorPanel.tsx`:
```tsx
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
```

- [ ] **Step 3: Wire into App and verify rendering**

Update `src/layout/App.tsx`:
```tsx
import { useAppEditor } from '../editor/useEditor'
import { EditorPanel } from '../editor/EditorPanel'
import { useComments } from '../comments/useComments'

const SAMPLE_MARKDOWN = `# Welcome to FeedbackEditor

Select any text and click **Add Comment** to leave feedback.

This is a simple markdown editor for annotating AI-generated text.`

export default function App() {
  const editor = useAppEditor(SAMPLE_MARKDOWN)
  const {
    comments, addComment, updateComment, deleteComment, clearComments,
    activeCommentId, setActiveCommentId,
  } = useComments()

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold text-gray-800">FeedbackEditor</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            Paste New Text
          </button>
          <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
            Copy with Comments
          </button>
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden">
        <EditorPanel editor={editor} />
        <aside className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
          <p className="text-gray-400">Sidebar will go here</p>
        </aside>
      </main>
    </div>
  )
}
```

Run: `npm run dev`
Expected: Editor renders markdown content with formatting (headings, bold, etc.)

- [ ] **Step 4: Commit**

```bash
git add src/editor/useEditor.ts src/editor/EditorPanel.tsx src/layout/App.tsx
git commit -m "feat: add Tiptap editor panel with markdown support"
```

---

### Task 7: Bubble Menu & Add Comment Flow

**Files:**
- Create: `src/editor/CommentBubbleMenu.tsx`
- Modify: `src/layout/App.tsx`

- [ ] **Step 1: Create CommentBubbleMenu component**

Create `src/editor/CommentBubbleMenu.tsx`:
```tsx
import { BubbleMenu } from '@tiptap/react'
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
      tippyOptions={{ duration: 150 }}
      shouldShow={({ editor: e }) => {
        const { from, to } = e.state.selection
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
```

- [ ] **Step 2: Wire onAddComment into App**

Update `src/layout/App.tsx` — add the handler and bubble menu:
```tsx
import { CommentBubbleMenu } from '../editor/CommentBubbleMenu'

// Inside App component, add this handler:
const handleAddComment = (selectedText: string) => {
  if (!editor) return
  const id = crypto.randomUUID()
  editor.chain().focus().setComment(id).run()
  addComment(id, '', selectedText)
  setActiveCommentId(id)
}

// In the JSX, add CommentBubbleMenu inside <main> after EditorPanel:
{editor && (
  <CommentBubbleMenu editor={editor} onAddComment={handleAddComment} />
)}
```

- [ ] **Step 3: Manually test the flow**

Run: `npm run dev`
1. Type or paste text in editor
2. Select a word (double-click) or range
3. Verify bubble menu appears with "Add Comment"
4. Click it — text should turn yellow
Expected: Yellow highlight appears on selected text

- [ ] **Step 4: Commit**

```bash
git add src/editor/CommentBubbleMenu.tsx src/layout/App.tsx
git commit -m "feat: add bubble menu with Add Comment action"
```

---

### Task 8: Comment Card & Sidebar

**Files:**
- Create: `src/comments/CommentCard.tsx`, `src/comments/CommentSidebar.tsx`
- Modify: `src/layout/App.tsx`

- [ ] **Step 1: Create CommentCard component**

Create `src/comments/CommentCard.tsx`:
```tsx
import { useState, useEffect, useRef } from 'react'
import type { Comment } from './types'

interface CommentCardProps {
  comment: Comment
  isActive: boolean
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
  onClick: (id: string) => void
}

export function CommentCard({ comment, isActive, onUpdate, onDelete, onClick }: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(!comment.text)
  const [draft, setDraft] = useState(comment.text)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isEditing])

  const handleSave = () => {
    onUpdate(comment.id, draft)
    setIsEditing(false)
  }

  return (
    <div
      onClick={() => onClick(comment.id)}
      className={`p-3 mb-2 rounded border cursor-pointer transition-colors ${
        isActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <p className="text-xs text-gray-500 mb-1 truncate italic">
        "{comment.highlightedText}"
      </p>
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() } }}
          className="w-full text-sm p-1 border border-gray-300 rounded resize-none focus:outline-none focus:border-blue-400"
          rows={2}
          placeholder="Type your feedback..."
        />
      ) : (
        <p className="text-sm text-gray-800">{comment.text || <span className="text-gray-400">No feedback yet</span>}</p>
      )}
      <div className="flex justify-end gap-1 mt-1">
        {!isEditing && (
          <button
            onClick={e => { e.stopPropagation(); setIsEditing(true) }}
            className="text-xs text-gray-400 hover:text-blue-600 p-1"
            title="Edit"
          >
            ✎
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDelete(comment.id) }}
          className="text-xs text-gray-400 hover:text-red-600 p-1"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create CommentSidebar component**

Create `src/comments/CommentSidebar.tsx`:
```tsx
import type { Comment } from './types'
import { CommentCard } from './CommentCard'

interface CommentSidebarProps {
  comments: Comment[]
  activeCommentId: string | null
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
  onClickComment: (id: string) => void
}

export function CommentSidebar({
  comments,
  activeCommentId,
  onUpdate,
  onDelete,
  onClickComment,
}: CommentSidebarProps) {
  return (
    <aside className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
      <h2 className="text-sm font-semibold text-gray-600 mb-3">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>
      {comments.length === 0 ? (
        <p className="text-sm text-gray-400">
          Select text and click "Add Comment" to start.
        </p>
      ) : (
        comments.map(comment => (
          <CommentCard
            key={comment.id}
            comment={comment}
            isActive={comment.id === activeCommentId}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onClick={onClickComment}
          />
        ))
      )}
    </aside>
  )
}
```

- [ ] **Step 3: Wire sidebar into App**

Update `src/layout/App.tsx` — replace sidebar placeholder and add handlers:
```tsx
import { CommentSidebar } from '../comments/CommentSidebar'

// Add these handlers inside App component:
const handleDeleteComment = (id: string) => {
  deleteComment(id)
  if (!editor) return
  const { doc } = editor.state
  doc.descendants((node, pos) => {
    if (node.marks?.some(m => m.type.name === 'comment' && m.attrs.commentId === id)) {
      editor.chain().focus().setTextSelection({ from: pos, to: pos + node.nodeSize }).unsetMark('comment').run()
    }
  })
}

const handleClickSidebarComment = (id: string) => {
  setActiveCommentId(id)
  if (!editor) return
  const { doc } = editor.state
  doc.descendants((node, pos) => {
    if (node.marks?.some(m => m.type.name === 'comment' && m.attrs.commentId === id)) {
      editor.chain().focus().setTextSelection({ from: pos, to: pos + node.nodeSize }).run()
      return false
    }
  })
}

// Replace the <aside> placeholder with:
<CommentSidebar
  comments={comments}
  activeCommentId={activeCommentId}
  onUpdate={updateComment}
  onDelete={handleDeleteComment}
  onClickComment={handleClickSidebarComment}
/>
```

- [ ] **Step 4: Manually test the full comment flow**

Run: `npm run dev`
1. Paste text, select a word, add a comment
2. Verify comment card appears in sidebar with focus on text input
3. Type feedback, press Enter
4. Click the sidebar card — editor should scroll to highlight
5. Click the highlighted text — sidebar should scroll to card
6. Edit a comment, delete a comment

Expected: Full bidirectional navigation and CRUD works

- [ ] **Step 5: Commit**

```bash
git add src/comments/CommentCard.tsx src/comments/CommentSidebar.tsx src/layout/App.tsx
git commit -m "feat: add comment sidebar with cards, edit, delete, and navigation"
```

---

### Task 9: Copy & Paste Toolbar

**Files:**
- Create: `src/export/useCopyToClipboard.ts`, `src/layout/HeaderToolbar.tsx`
- Modify: `src/layout/App.tsx`

- [ ] **Step 1: Create useCopyToClipboard hook**

Create `src/export/useCopyToClipboard.ts`:
```typescript
import { useState, useCallback } from 'react'

interface CopyState {
  copied: boolean
  error: string | null
}

export function useCopyToClipboard() {
  const [state, setState] = useState<CopyState>({ copied: false, error: null })

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setState({ copied: true, error: null })
      setTimeout(() => setState({ copied: false, error: null }), 2000)
    } catch {
      setState({ copied: false, error: 'Clipboard access denied. Please copy manually.' })
    }
  }, [])

  return { ...state, copy }
}
```

- [ ] **Step 2: Create HeaderToolbar component**

Create `src/layout/HeaderToolbar.tsx`:
```tsx
interface HeaderToolbarProps {
  onCopy: () => void
  onPaste: () => void
  copied: boolean
  copyError: string | null
  commentCount: number
}

export function HeaderToolbar({ onCopy, onPaste, copied, copyError, commentCount }: HeaderToolbarProps) {
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
        <button
          onClick={onPaste}
          className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
        >
          Paste New Text
        </button>
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

- [ ] **Step 3: Wire toolbar into App**

Update `src/layout/App.tsx`:
```tsx
import { useState } from 'react'
import { HeaderToolbar } from './HeaderToolbar'
import { serializeMarkdown } from '../export/serializeMarkdown'
import { parseMarkdown } from '../export/parseMarkdown'
import { useCopyToClipboard } from '../export/useCopyToClipboard'

// Inside App component:
const { copied, error: copyError, copy } = useCopyToClipboard()
const [showPasteModal, setShowPasteModal] = useState(false)
const [pasteText, setPasteText] = useState('')

const handleCopy = () => {
  if (!editor) return
  const markdown = serializeMarkdown(editor.getJSON(), comments)
  copy(markdown)
}

const handlePasteClick = () => {
  if (comments.length > 0) {
    const confirmed = confirm(`You have ${comments.length} comments. Pasting new text will remove them. Continue?`)
    if (!confirmed) return
  }
  setPasteText('')
  setShowPasteModal(true)
}

const handlePasteConfirm = () => {
  if (!editor || !pasteText.trim()) return
  const result = parseMarkdown(pasteText)
  clearComments()
  editor.commands.setContent(result.html)
  result.comments.forEach(c => addComment(c.id, c.text, c.highlightedText))
  setShowPasteModal(false)
}

// Replace the <header> with:
<HeaderToolbar
  onCopy={handleCopy}
  onPaste={handlePasteClick}
  copied={copied}
  copyError={copyError}
  commentCount={comments.length}
/>

// Add paste modal at end of JSX (before closing </div>):
{showPasteModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] flex flex-col">
      <h3 className="text-lg font-semibold mb-3">Paste New Text</h3>
      <textarea
        value={pasteText}
        onChange={e => setPasteText(e.target.value)}
        className="flex-1 min-h-[300px] p-3 border border-gray-300 rounded font-mono text-sm resize-none focus:outline-none focus:border-blue-400"
        placeholder="Paste your markdown here..."
        autoFocus
      />
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={() => setShowPasteModal(false)} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Cancel</button>
        <button onClick={handlePasteConfirm} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Import</button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 4: Manually test end-to-end flow**

Run: `npm run dev`
1. Paste markdown text
2. Add 2-3 comments
3. Click "Copy with Comments"
4. Verify toast shows "Copied!"
5. Paste clipboard into a text editor — verify system prompt + delimiters are present
6. Click "Paste New Text" — verify confirm dialog appears
7. Paste the same text back — verify comments are restored from delimiters

Expected: Full round-trip works

- [ ] **Step 5: Commit**

```bash
git add src/export/useCopyToClipboard.ts src/layout/HeaderToolbar.tsx src/layout/App.tsx
git commit -m "feat: add copy/paste toolbar with clipboard support and toast"
```

---

### Task 10: Editor-Sidebar Click Navigation

**Files:**
- Modify: `src/layout/App.tsx`, `src/editor/EditorPanel.tsx`

- [ ] **Step 1: Add click handler on highlighted spans**

Update `src/editor/EditorPanel.tsx` to accept an `onClickComment` prop. Add a click event listener to the editor container that checks if the click target is a `.comment-highlight` element. If so, extract the `data-comment-id` and call `onClickComment(id)`.

```tsx
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
    <div className="flex-1 p-6 overflow-y-auto" onClick={handleClick}>
      <EditorContent editor={editor} />
    </div>
  )
}
```

- [ ] **Step 2: Add active highlight class**

Update the comment mark's rendered class to include `active` when the `activeCommentId` matches. This can be done via Tiptap's `addNodeView` or by toggling classes via DOM after `activeCommentId` changes. Simplest approach: use a `useEffect` in App that queries all `.comment-highlight` spans and toggles the `active` class.

```tsx
useEffect(() => {
  const container = document.querySelector('.ProseMirror')
  if (!container) return
  container.querySelectorAll('.comment-highlight').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-comment-id') === activeCommentId)
  })
}, [activeCommentId])
```

- [ ] **Step 3: Add scroll-to-comment in sidebar**

Add `id` attributes to comment cards (`comment-card-{id}`) and scroll into view when `activeCommentId` changes:

```tsx
useEffect(() => {
  if (activeCommentId) {
    document.getElementById(`comment-card-${activeCommentId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
}, [activeCommentId])
```

- [ ] **Step 4: Manually test bidirectional navigation**

Run: `npm run dev`
1. Add a few comments on different paragraphs
2. Click highlighted text → sidebar card gets focus outline and scrolls into view
3. Click sidebar card → editor scrolls to highlighted text with active styling

Expected: Smooth bidirectional navigation

- [ ] **Step 5: Commit**

```bash
git add src/editor/EditorPanel.tsx src/layout/App.tsx src/comments/CommentCard.tsx
git commit -m "feat: add bidirectional click navigation between editor and sidebar"
```

---

### Task 11: Polish & Edge Cases

**Files:**
- Modify: `src/layout/App.tsx`, `src/index.css`

- [ ] **Step 1: Update useCopyToClipboard with fallback text**

Update `src/export/useCopyToClipboard.ts` to expose the fallback text when clipboard fails:
```typescript
import { useState, useCallback } from 'react'

interface CopyState {
  copied: boolean
  error: string | null
  fallbackText: string | null
}

export function useCopyToClipboard() {
  const [state, setState] = useState<CopyState>({ copied: false, error: null, fallbackText: null })

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setState({ copied: true, error: null, fallbackText: null })
      setTimeout(() => setState({ copied: false, error: null, fallbackText: null }), 2000)
    } catch {
      setState({ copied: false, error: 'Clipboard access denied. Copy from below.', fallbackText: text })
    }
  }, [])

  const clearFallback = useCallback(() => {
    setState({ copied: false, error: null, fallbackText: null })
  }, [])

  return { ...state, copy, clearFallback }
}
```

- [ ] **Step 2: Add clipboard fallback modal to App**

Add to `src/layout/App.tsx` JSX (alongside paste modal):
```tsx
const { copied, error: copyError, copy, fallbackText, clearFallback } = useCopyToClipboard()

// In JSX:
{fallbackText && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] flex flex-col">
      <h3 className="text-lg font-semibold mb-2">Copy Manually</h3>
      <p className="text-sm text-gray-500 mb-3">Clipboard access was denied. Select all text below and copy with Ctrl+C / Cmd+C.</p>
      <textarea
        readOnly
        value={fallbackText}
        className="flex-1 min-h-[300px] p-3 border border-gray-300 rounded font-mono text-sm resize-none"
        onFocus={e => e.target.select()}
        autoFocus
      />
      <div className="flex justify-end mt-4">
        <button onClick={clearFallback} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Close</button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 3: Add orphan cleanup logic**

Add a `useEffect` to `src/layout/App.tsx` that reconciles editor marks and React state on each editor update. This handles orphan marks (mark in editor with no state entry) and orphan comments (state entry with no editor mark):

```tsx
// Add to App component:
useEffect(() => {
  if (!editor) return

  const handler = () => {
    // Collect all commentIds present in the editor
    const editorIds = new Set<string>()
    editor.state.doc.descendants((node) => {
      node.marks?.forEach(mark => {
        if (mark.type.name === 'comment' && mark.attrs.commentId) {
          editorIds.add(mark.attrs.commentId as string)
        }
      })
    })

    // Remove orphan comments from state (no matching mark in editor)
    const stateIds = new Set(comments.map(c => c.id))
    for (const comment of comments) {
      if (!editorIds.has(comment.id)) {
        deleteComment(comment.id)
      }
    }

    // Remove orphan marks from editor (no matching state entry)
    editor.state.doc.descendants((node, pos) => {
      node.marks?.forEach(mark => {
        if (mark.type.name === 'comment' && !stateIds.has(mark.attrs.commentId as string)) {
          editor.chain().setTextSelection({ from: pos, to: pos + node.nodeSize }).unsetMark('comment').run()
        }
      })
    })
  }

  editor.on('update', handler)
  return () => { editor.off('update', handler) }
}, [editor, comments, deleteComment])
```

Note: `handleDeleteComment` was already implemented in Task 8 Step 3. This effect handles orphans that arise from other operations (e.g., undo, external content changes).

- [ ] **Step 4: Test all edge cases**

Run: `npm run dev`
1. Delete a comment — verify highlight removed
2. Try to add overlapping comment — verify button disabled
3. Paste empty text — verify editor accepts it
4. Copy with no comments — verify no system prompt
5. Paste text with delimiters back — verify comments restored

Expected: All edge cases handled cleanly

- [ ] **Step 5: Run all tests**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add paste modal, clipboard fallback, and edge case handling"
```

---

### Task 12: Final Integration Test & Cleanup

**Files:**
- All files

- [ ] **Step 1: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 2: Run TypeScript check**

Run: `npx tsc --noEmit`
Expected: No type errors

- [ ] **Step 3: Run the app and test full flow**

Run: `npm run dev`
Full flow test:
1. Open app — see empty editor with sidebar showing "Select text and click 'Add Comment' to start"
2. Click "Paste New Text" — modal opens, paste markdown, click confirm
3. Editor renders the markdown beautifully
4. Double-click a word — bubble menu appears
5. Click "Add Comment" — word highlights yellow, sidebar card appears with text input focused
6. Type feedback, press Enter
7. Select a phrase, add another comment
8. Click "Copy with Comments" — see "Copied!" toast
9. Paste into external text editor — verify system prompt + delimiters
10. Click "Paste New Text" — confirm dialog warns about existing comments
11. Paste the copied text back — verify comments are restored from delimiters
12. Edit a comment in sidebar — verify it works
13. Delete a comment — verify highlight and card removed

Expected: Everything works end-to-end

- [ ] **Step 4: Build for production**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: final integration verification and cleanup"
```
