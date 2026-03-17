# FeedbackEditor Design Spec

## Problem

When collaborating with AI to write text (LinkedIn posts, articles, etc.), giving precise inline feedback is painful. Users resort to inserting bracketed comments beside the text, then explaining the convention to the AI. This is error-prone, ugly, and breaks the reading flow.

## Solution

A standalone React web app that lets users paste AI-generated markdown, add inline comments via a Google Docs-style sidebar, and copy back annotated markdown with structured comment delimiters the AI can parse.

## User Flow

1. Paste markdown from AI into the editor
2. Select text (double-click a word or drag a range)
3. Click "Add Comment" in the bubble menu
4. Type feedback in the sidebar comment card
5. Repeat for all feedback
6. Click "Copy with Comments" — annotated markdown + system prompt copied to clipboard
7. Paste into AI chat
8. Get revised text, paste back into editor, repeat

## Comment Delimiter Format

```
{start-comment}the highlighted text{end-comment: Your feedback here}
```

### System Prompt (prepended on every copy)

```
[SYSTEM: This document contains inline feedback comments.
Comments are marked with {start-comment} and {end-comment: feedback text} delimiters.
The text between {start-comment} and {end-comment} is the portion being commented on.
The text after the colon in {end-comment: ...} is the feedback/instruction.
Please revise the document according to the feedback, then return the clean
markdown without any comment delimiters.]
```

### Example Output

```markdown
[SYSTEM: This document contains inline feedback comments...]

# My LinkedIn Post

The future of AI is {start-comment}about replacing humans{end-comment: Too aggressive, reframe as augmentation not replacement} in every industry.

We need to {start-comment}think about{end-comment: Use a stronger verb like "embrace" or "prepare for"} what comes next.
```

## Tech Stack

- **React** with Vite for scaffolding
- **Tiptap v2** with custom Comment mark extension
- **tiptap-markdown** for markdown parsing/serialization
- **Tailwind CSS** for styling

## Architecture

Follows clean architecture principles: the folder structure screams the domain (`comments/`, `editor/`, `export/`), not the framework (`components/`, `hooks/`, `utils/`). Dependencies point inward — UI depends on domain logic, never the reverse.

### Folder Structure

```
src/
  comments/              # Comment domain
    CommentMark.ts         # Custom Tiptap mark extension
    CommentSidebar.tsx     # Sidebar UI component
    CommentCard.tsx        # Individual comment card
    useComments.ts         # Comment state management hook
    types.ts               # Comment type definitions

  editor/                # Editor domain
    EditorPanel.tsx        # Tiptap editor wrapper
    BubbleMenu.tsx         # Selection popup with "Add Comment"
    useEditor.ts           # Editor configuration hook

  export/                # Import/export domain
    serializeMarkdown.ts   # Tiptap doc -> markdown with delimiters
    parseMarkdown.ts       # Markdown with delimiters -> Tiptap doc
    systemPrompt.ts        # System prompt template constant
    useCopyToClipboard.ts  # Clipboard copy with toast feedback

  layout/                # App shell
    App.tsx                # Root layout: toolbar + editor + sidebar
    HeaderToolbar.tsx      # Copy/Paste buttons

  shared/                # Cross-cutting (minimal)
    types.ts               # Shared type definitions (if any)
```

### Key Design Decisions

**Comment data lives in two places by design:**
- `commentId` (UUID) is stored as a Tiptap mark attribute — it travels with the text
- Comment metadata (`text`, `createdAt`) is stored in React state via `useComments` hook

This separation follows the humble object pattern: the editor mark is a thin data carrier, while the comment business logic lives in React state where it is easy to test and manipulate.

**Custom serializer/parser instead of extending tiptap-markdown internals:**
- Export: walk the Tiptap JSON document tree, find comment marks, inject delimiters into the markdown string
- Import: regex-parse delimiters from raw markdown, convert to HTML spans, let Tiptap's `parseHTML` handle the rest

This keeps the serialization logic decoupled from tiptap-markdown's internals, making it resilient to library updates.

## UI Layout

```
+-----------------------------------------------------+
|  FeedbackEditor    [Copy with Comments] [Paste New]  |
+-----------------------------------+-----------------+
|                                   |                 |
|   Editor Panel (~70%)             | Comment         |
|   - Rendered markdown             | Sidebar (~30%)  |
|   - Yellow highlights on          | - Comment cards |
|     commented text                | - Click to nav  |
|   - Bubble menu on selection      | - Edit/delete   |
|                                   |                 |
+-----------------------------------+-----------------+
```

### Visual Style

- Clean, minimal — white editor background, light gray sidebar
- Yellow highlight (`#FFF3CD`) for commented text
- Subtle accent connecting highlighted text to its sidebar card
- Toast notification on successful copy

### Interactions

| Action | Result |
|--------|--------|
| Double-click word | Selects word, bubble menu appears with "Add Comment" |
| Drag to select range | Same bubble menu behavior |
| Click "Add Comment" | New comment card in sidebar with focus on text input, text highlighted yellow |
| Click highlighted text | Corresponding sidebar card scrolls into view with focus outline |
| Click sidebar card | Editor scrolls to highlighted text |
| Edit comment in sidebar | Updates comment text in state |
| Delete comment | Removes highlight and sidebar card |
| "Copy with Comments" | Serializes to markdown + system prompt, copies to clipboard, shows toast |
| "Paste New Text" | Warns if unsaved comments, clears editor, parses new markdown with any existing delimiters |

## Component Specifications

### CommentMark (Tiptap Extension)

```typescript
// Custom mark with commentId attribute
Mark.create({
  name: 'comment',
  addAttributes() {
    return { commentId: { default: null } }
  },
  parseHTML() {
    return [{ tag: 'span[data-comment-id]' }]
  },
  renderHTML({ HTMLAttributes }) {
    return ['span', {
      class: 'comment-highlight',
      'data-comment-id': HTMLAttributes.commentId
    }, 0]
  }
})
```

### useComments Hook

```typescript
interface Comment {
  id: string           // UUID, matches mark's commentId
  text: string         // The feedback text
  highlightedText: string  // Snippet of commented text (for sidebar display)
  createdAt: number
}

interface UseComments {
  comments: Comment[]
  addComment: (id: string, text: string, highlightedText: string) => void
  updateComment: (id: string, text: string) => void
  deleteComment: (id: string) => void
  activeCommentId: string | null
  setActiveCommentId: (id: string | null) => void
}
```

### Serializer (Export)

1. Get markdown from `editor.storage.markdown.getMarkdown()`
2. Walk the Tiptap document JSON to find all comment mark positions
3. Map positions to their markdown string offsets
4. Inject `{start-comment}` and `{end-comment: feedback}` at the correct positions
5. Prepend system prompt
6. Return final string

### Parser (Import)

1. Regex-match all `{start-comment}...{end-comment: ...}` patterns
2. Extract highlighted text and feedback for each
3. Replace delimiters with `<span data-comment-id="UUID">highlighted text</span>`
4. Generate comment entries for React state
5. Feed HTML to Tiptap editor
6. Return comment entries to populate `useComments`

## Future Milestones (Out of Scope for v1)

- **Version History (EPIC-2):** Track paste iterations, compare before/after, revert to previous versions
- **AI Integration:** Direct API calls to AI from within the editor
- **Collaborative Editing:** Multiple users commenting on the same document

## Auto-K References

| ID | Name | Type |
|----|------|------|
| PER-1 | AI Power User | persona |
| GOAL-1 | Streamline AI text feedback | project_goal |
| EPIC-1 | Core Editor (v1) | epic |
| EPIC-2 | Version History (v2) | epic (proposed) |
| US-1 | Paste and view markdown | user_story |
| US-2 | Add inline comments | user_story |
| US-3 | View comments in sidebar | user_story |
| US-4 | Copy annotated markdown | user_story |
| US-5 | Edit and delete comments | user_story |
| REQ-1..9 | Functional & non-functional requirements | requirement |
| DES-1..7 | Design fragments | design_fragment |
