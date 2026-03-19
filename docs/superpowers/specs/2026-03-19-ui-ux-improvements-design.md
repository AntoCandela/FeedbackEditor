# FeedbackEditor UI/UX Improvements — Design Spec

**Date:** 2026-03-19
**Audience:** Content writers and editors reviewing AI-generated drafts
**Scope:** Visual refresh, onboarding, interaction improvements, responsive layout. No backend, no auth — pure frontend, runs on localhost.

---

## 1. Visual Foundation

### Typography

- **Headings:** Source Serif 4 (Google Fonts) — editorial, warm, distinctive
- **Body / UI:** DM Sans (Google Fonts) — geometric, clean, pairs well with serif headings
- **Type scale:** 12 / 14 / 16 / 18 / 24 / 32px
- **Body line height:** 1.6–1.7
- **Line length:** max 65–75 characters in editor area

### Color System (Light Mode Only)

All colors defined as CSS custom properties on `:root`. No dark mode.

| Token | Value | Purpose |
|-------|-------|---------|
| `--bg-primary` | `#FAFAF9` | Page background |
| `--bg-surface` | `#FFFFFF` | Cards, editor area |
| `--bg-surface-alt` | `#F5F5F4` | Sidebar background |
| `--border` | `#E7E5E4` | Borders, dividers |
| `--text-primary` | `#1C1917` | Body text |
| `--text-secondary` | `#78716C` | Muted text, labels |
| `--text-tertiary` | `#A8A29E` | Placeholder, timestamps |
| `--accent` | `#2563EB` | Primary interactive (onboarding steps) |
| `--accent-hover` | `#1D4ED8` | Hover state for accent |
| `--cta-bg` | `#1C1917` | Copy button background |
| `--cta-text` | `#FFFFFF` | Copy button text |
| `--comment-bg` | `#FEF3C7` | Comment highlight |
| `--comment-border` | `#F59E0B` | Comment highlight underline |
| `--comment-active-bg` | `#FDE68A` | Active comment highlight |
| `--comment-active-border` | `#D97706` | Active comment underline |
| `--success` | `#16A34A` | Success toast |
| `--danger` | `#DC2626` | Delete actions, error toast |

### Icons

Lucide React — consistent 1.5px stroke, tree-shakable imports. Replaces all text characters (`✎`, `✕`) and emoji (`📋`, `📥`) with proper SVG icons.

---

## 2. Header Toolbar

Refined header with this left-to-right layout:

**Left side:**
- Logo: "FeedbackEditor" in Source Serif 4, bold
- Comment count badge: pill-shaped, amber background (`--comment-bg`), shows "N comments" when count > 0, hidden when 0

**Right side (in order):**
- Sidebar toggle button (far-left of action group) — `PanelRight` Lucide icon, toggles comment sidebar
- History button — `Clock` Lucide icon + "History" label
- Copy button — dark background (`--cta-bg`), `Clipboard` icon + "Copy" + `⌘↵` hint

All buttons use ghost style (transparent bg, border) except Copy which uses the dark CTA style. SVG icons at 16px. Hover transitions 150ms ease-out.

### New Props Interface

```ts
interface HeaderToolbarProps {
  onCopy: () => void
  commentCount: number
  sidebarOpen: boolean
  onToggleSidebar: () => void
  historyButton: React.ReactNode
}
```

The `copied`, `copyError` props are removed — feedback is now handled by the toast system. The `sidebarOpen` and `onToggleSidebar` props drive the sidebar toggle button.

---

## 3. Onboarding

A 3-step tooltip walkthrough shown on first visit. Persisted to localStorage under key `feedbackeditor-onboarding:v1` with value `"done"`.

### Implementation

New module: `src/onboarding/`
- `useOnboarding.ts` — hook managing step state, localStorage check, dismiss logic
- `OnboardingTooltip.tsx` — positioned tooltip component
- `OnboardingOverlay.tsx` — semi-transparent backdrop + tooltip rendering

### Steps

1. **"Paste your content"** — tooltip anchored to the `.ProseMirror` editor container element, positioned centered-top with an arrow pointing up. Explains: paste AI-generated text as your starting point.
2. **"Select & comment"** — tooltip anchored to the `.ProseMirror` container, positioned center. Shows highlight visual example and `⌘K` shortcut.
3. **"Copy & send back"** — tooltip anchored to the Copy button element (`[data-testid="copy-button"]`), positioned below-left with arrow pointing up-right. Shows `⌘↵` shortcut. Final button says "Get started".

### Behavior

- Each step has: step number (blue circle), title, description, "N of 3" counter, Back/Next buttons
- "Skip" link on every step — dismisses immediately and saves to localStorage
- Subtle semi-transparent overlay behind tooltip (rgba(0,0,0,0.3))
- Non-blocking: clicking outside the tooltip dismisses onboarding
- "Get started" on step 3 saves to localStorage and starts the app experience
- Check `localStorage.getItem('feedbackeditor-onboarding:v1')` on mount — if `"done"`, skip entirely

### Accessibility

- Overlay uses `role="dialog"` and `aria-modal="true"`
- Focus is trapped within the tooltip while open (Tab cycles through Skip/Back/Next buttons)
- Tooltip has `aria-label` describing the current step
- Escape key dismisses onboarding (same as clicking outside)

---

## 4. Toast Notification System

Replaces inline "Copied!" text and the clipboard fallback modal.

### Implementation

New module: `src/toast/`
- `ToastProvider.tsx` — context provider wrapping the app, manages toast queue
- `ToastContainer.tsx` — renders active toasts, positioned bottom-right
- `useToast.ts` — hook returning `showToast(message, type, duration?)` function

### Toast Types

| Type | Icon | Color | Auto-dismiss |
|------|------|-------|--------------|
| `success` | `Check` | `--success` | 3 seconds |
| `info` | `Info` | `--accent` | 3 seconds |
| `error` | `AlertCircle` | `--danger` | Manual dismiss only |

### Usage Points

- **Copy success:** `showToast("Copied to clipboard", "success")`
- **Paste detected:** `showToast("Content saved to history", "info")`
- **Version restored:** `showToast("Version restored", "info")`
- **Clipboard denied:** `showToast("Clipboard access denied — use ⌘C to copy from preview", "error")`

### Behavior

- Slides in from bottom-right with 200ms ease-out
- Stacks vertically (newest on top) if multiple active
- Max 3 visible at once
- Each toast has a close button (X icon)
- Error toasts stay until manually dismissed

### Accessibility

- Toast container uses `aria-live="polite"` for info/success, `aria-live="assertive"` for errors
- Each toast has `role="status"`
- Close button has `aria-label="Dismiss notification"`

---

## 5. Paste Detection

Listen for paste events on the editor to auto-save a version snapshot.

### Implementation

Tiptap does not emit a `paste` event. Instead, add a `handlePaste` prop to the editor's `editorProps` in `useEditor.ts`:

```ts
editorProps: {
  handlePaste: (_view, _event, _slice) => {
    // Signal paste occurred; App.tsx reads this via a callback
    onPaste?.()
    return false // let Tiptap handle the actual paste
  },
}
```

`useAppEditor` accepts an optional `onPaste` callback. In `App.tsx`, the callback saves a version and shows a toast:

```ts
const handlePaste = useCallback(() => {
  if (!editor) return
  const markdown = getMarkdown(editor)
  saveVersion(markdown, commentsRef.current, 'paste')
  showToast("Content saved to history", "info")
}, [editor, saveVersion, showToast])
```

Debounce 500ms to avoid duplicate triggers from multi-fragment pastes. Uses the existing `useVersionHistory` hook.

---

## 6. Copy Preview Panel

An expandable panel showing what will be copied, so users understand the output before sending it.

### Implementation

New component: `src/export/CopyPreview.tsx`

### DOM Placement

Rendered between `<header>` and `<main>` in `App.tsx`. When expanded, it pushes `<main>` down (reduces editor height). This is intentional — the preview is a conscious action, not a persistent panel.

### Behavior

- Collapsed by default — a slim bar with "Preview output" toggle, sits between header and main content area
- Expands to show the serialized markdown with syntax highlighting:
  - `{start-comment}` and `{end-comment: ...}` delimiters highlighted in amber
  - `[SYSTEM: ...]` prompt highlighted in a muted color
  - Rest of the markdown in plain text
- Read-only, scrollable, max-height 200px
- Updates live as comments change
- "Copy" button inside the preview panel for direct clipboard access
- Collapse/expand with 200ms slide transition

---

## 7. Collapsible Sidebar

Toggle button in header (far-left of action group) to show/hide the comment sidebar.

**Note:** This section and Section 8 (Responsive Layout) are tightly coupled and should be implemented together. The sidebar rendering path differs by breakpoint.

### Implementation

- New state in `App.tsx`: `const [sidebarOpen, setSidebarOpen] = useState(loadSidebarPref)`
- Persisted to localStorage under key `feedbackeditor-sidebar:v1`
- Desktop/tablet: sidebar is inline with `width` transition (320px → 0px), editor flex-grows to fill. Uses `overflow: hidden` + `width` transition rather than `transform` to avoid layout gaps.
- Mobile (<768px): sidebar renders as a fixed overlay sheet from the right with backdrop
- Comment count badge in header remains visible regardless of sidebar state
- Toggle button icon changes: `PanelRight` when closed, `PanelRightClose` when open

---

## 8. Responsive Layout

Three breakpoints following mobile-first approach:

### Desktop (≥1024px)
- Side-by-side: editor + sidebar (320px fixed width)
- Full header with all labels visible

### Tablet (768–1023px)
- Side-by-side: editor + narrower sidebar (240px)
- Header compresses: shorter logo, smaller button labels

### Mobile (<768px)
- Editor takes full width
- Sidebar becomes a slide-over sheet from the right (overlay, not inline)
- Header: icon-only buttons except Copy
- Bubble menu stays functional

### Implementation

- CSS media queries in `index.css` for layout shifts
- Sidebar component accepts an `overlay` prop for mobile mode
- Mobile sidebar has a backdrop overlay for dismiss-on-click

---

## 9. Comment Card Refinements

Improve the existing `CommentCard.tsx`:

- Replace `✎` with Lucide `Pencil` icon (14px)
- Replace `✕` with Lucide `X` icon (14px)
- Add text labels next to icons: "edit", "delete"
- Delete button uses `--danger` color on hover
- Card entrance animation: fade-in + slide-down, 200ms
- Active card: left blue border accent (4px) instead of full border color change
- Better spacing: 12px padding, 8px gap between cards

---

## 10. Editor Area Improvements

- Increased padding: 32px horizontal, 24px vertical
- Serif font for headings rendered in editor (Source Serif 4)
- Sans font for body text (DM Sans)
- Warm off-white background (`--bg-primary`)
- Prose max-width: 65ch for readability
- Comment highlights: softer amber with 2px bottom border, rounded corners on highlight spans

---

## New Module Structure

```
src/
├── onboarding/
│   ├── useOnboarding.ts
│   ├── OnboardingTooltip.tsx
│   └── OnboardingOverlay.tsx
├── toast/
│   ├── ToastProvider.tsx
│   ├── ToastContainer.tsx
│   └── useToast.ts
├── export/
│   └── CopyPreview.tsx          (new)
└── ... (existing modules unchanged)
```

---

## Dependencies to Add

- `lucide-react` — SVG icon library
- `@fontsource-variable/source-serif-4` — self-hosted heading font (works offline)
- `@fontsource-variable/dm-sans` — self-hosted body font (works offline)

Fonts are imported in `main.tsx` rather than loaded via Google Fonts `<link>`, ensuring the app works fully offline on localhost without relying on external CDNs.

---

## What Stays the Same

- Core editor logic (Tiptap, CommentMark) — `useEditor.ts` gains an `onPaste` callback but keeps the same extension setup
- Comment CRUD logic (useComments)
- Markdown serialization/parsing
- Version history logic (useVersionHistory)
- Keyboard shortcuts (useKeyboardShortcuts)
- All existing tests continue to pass

## What Gets Refactored

- **`useCopyToClipboard.ts`** — simplified. The `copied`, `error`, and `fallbackText` state are removed; the hook now only exposes `copy(text: string): Promise<void>` which either succeeds or throws. Success/error feedback is handled by the toast system in the caller. The fallback modal in `App.tsx` (lines 198-217) is removed entirely.
- **`HeaderToolbar.tsx`** — new props interface (see Section 2). Removes `copied`/`copyError` props.
- **`index.css`** — comment highlight colors migrate from hardcoded hex to CSS custom properties using the Tailwind amber palette (`--comment-bg`, `--comment-border`, etc.). This is an intentional migration from the current `#FFF3CD`/`#F0C36D` values.

---

## Testing Strategy

New tests for new modules:
- `tests/onboarding/useOnboarding.test.ts` — localStorage read/write, step progression, skip
- `tests/toast/useToast.test.ts` — show/dismiss/auto-dismiss/queue behavior
- `tests/export/copyPreview.test.ts` — serialization output matches preview content

Existing tests remain unchanged. All current tests (7 files, 60 test cases) must continue passing.
