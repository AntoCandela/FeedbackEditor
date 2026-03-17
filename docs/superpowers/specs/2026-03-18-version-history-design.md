# Version History (EPIC-2) Design Spec

## Problem

Users iterate multiple rounds of feedback with AI — paste text, comment, copy, get revised text, paste again. Currently there is no way to see previous versions or go back if a revision goes wrong.

## Solution

Auto-save editor snapshots on copy and paste events. Provide a dropdown in the header to browse versions and revert to any previous state.

## Data Model

```typescript
interface Version {
  id: string           // UUID
  markdown: string     // Raw markdown content (no comment delimiters)
  comments: Comment[]  // Snapshot of comments at save time
  timestamp: number    // Date.now()
  trigger: 'copy' | 'paste'  // What caused the version to be saved
}
```

- Stored as `Version[]` in `localStorage` under key `feedbackeditor-versions`
- Loaded on mount, saved on every change
- Ordered newest-first

## Auto-Save Triggers

**On copy (before serialization):**
1. Capture current editor markdown content via `editor.storage.markdown.getMarkdown()`
2. Snapshot current `comments` array
3. Save as version with `trigger: 'copy'`

**On paste (Tiptap paste event):**
1. Before replacing editor content, capture the *previous* content + comments
2. Save as version with `trigger: 'paste'`

## Revert Flow

1. User clicks a version in the dropdown
2. Current state is auto-saved as a new version (safety net, `trigger: 'copy'`)
3. Editor content is replaced with the selected version's markdown
4. Comment state is replaced with the selected version's comments
5. Comment marks are re-applied to the editor via the existing parseMarkdown flow or direct setContent
6. Toast confirms: "Reverted to version from [relative time]"

## UI

### Header Changes

Add a "History" button between the title and the "Copy with Comments" button. Clicking it toggles the version history dropdown.

### Version History Dropdown

```
┌─────────────────────────────────────────┐
│  Version History (N versions)     [✕]   │
├─────────────────────────────────────────┤
│  📋 Copied — 2 min ago (3 comments)    │
│  📥 Pasted — 8 min ago (0 comments)    │
│  📋 Copied — 15 min ago (5 comments)   │
├─────────────────────────────────────────┤
│  [Clear History]                        │
└─────────────────────────────────────────┘
```

- Appears as a dropdown panel below the header, overlaying the editor
- Each row: trigger icon (📋 copy / 📥 paste), relative timestamp, comment count
- Clicking a row triggers the revert flow
- "Clear History" at the bottom with `confirm()` dialog
- Panel closes after selecting a version or clicking ✕
- Empty state: "No versions saved yet. Versions are created when you copy or paste."

### Toasts

- "Version saved" — brief flash on copy/paste (reuses existing toast mechanism)
- "Reverted to version from [time]" — on revert

## Architecture

### New Files

```
src/
  history/
    types.ts                    # Version interface
    useVersionHistory.ts        # Hook: Version[] state + localStorage
    useVersionHistory.test.ts   # Tests for the hook
    VersionHistoryDropdown.tsx  # Dropdown UI component
```

### Modified Files

- `src/layout/HeaderToolbar.tsx` — add History button
- `src/layout/App.tsx` — wire useVersionHistory, save on copy/paste, handle revert

### Dependency Direction

- `history/` depends on `comments/types.ts` (imports Comment interface)
- `layout/` depends on `history/` (uses hook and dropdown)
- `history/` does NOT depend on `editor/` or `export/` — it receives data, doesn't fetch it

### useVersionHistory Hook

```typescript
interface UseVersionHistory {
  versions: Version[]
  saveVersion: (markdown: string, comments: Comment[], trigger: 'copy' | 'paste') => void
  loadVersion: (id: string) => Version | undefined
  clearHistory: () => void
}
```

- On mount: load from `localStorage`, parse JSON, handle corrupt/missing data gracefully
- On every `versions` change: serialize to `localStorage`
- `saveVersion`: prepend new version, persist
- `loadVersion`: find by id, return the version object (App handles the actual editor loading)
- `clearHistory`: empty the array, persist

## Error Handling

| Scenario | Behavior |
|----------|----------|
| localStorage full | Silently drop the oldest versions to make room. Log a console warning. |
| Corrupt localStorage data | Reset to empty array. Log a console warning. |
| Version not found on revert | No-op. Should not happen with well-formed UI. |

## Supported Markdown

Same CommonMark subset as v1 (headings, paragraphs, bold, italic, strikethrough, links, images, inline code, fenced code blocks, blockquotes, ordered/unordered lists).

## Requirements Reference

| ID | Name | Type |
|----|------|------|
| REQ-10 | Version snapshot on copy and paste | functional |
| REQ-11 | localStorage persistence for versions | functional |
| REQ-12 | Auto-save before revert | functional |
| REQ-13 | Simple version toggle | functional |

## Out of Scope

- Side-by-side diff view
- Version branching
- Export/import version history
- Version naming/labeling

## Auto-K References

| ID | Name | Type |
|----|------|------|
| EPIC-2 | Version History (v2) | epic |
| US-6 | View version history | user_story |
| US-7 | Compare versions side by side | user_story (simplified to toggle) |
| US-8 | Revert to previous version | user_story |
| REQ-10..13 | Version requirements | requirement |
| DES-8 | Version Data Model | design_fragment |
| DES-9 | useVersionHistory Hook | design_fragment |
| DES-10 | Version History Dropdown | design_fragment |
