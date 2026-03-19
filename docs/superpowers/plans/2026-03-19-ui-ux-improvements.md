# UI/UX Improvements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform FeedbackEditor from a functional prototype into a polished content-editing tool with onboarding, toast notifications, collapsible sidebar, copy preview, paste detection, and responsive layout.

**Architecture:** Layer improvements bottom-up: CSS foundation first, then standalone new modules (toast, onboarding), then refactor existing components to use them. Each task produces working, testable software.

**Tech Stack:** React 19, TypeScript, Tiptap 3, Tailwind CSS 4, Vite 8, Vitest, Lucide React, @fontsource

**Spec:** `docs/superpowers/specs/2026-03-19-ui-ux-improvements-design.md`

---

## File Map

### New Files
| File | Responsibility |
|------|---------------|
| `src/toast/types.ts` | Toast type definitions |
| `src/toast/useToast.ts` | Toast state hook — queue, show, dismiss, auto-dismiss timers |
| `src/toast/ToastProvider.tsx` | React context provider wrapping app |
| `src/toast/ToastContainer.tsx` | Renders toast stack, positioned bottom-right |
| `src/onboarding/steps.ts` | Step definitions (title, description, anchor selector) |
| `src/onboarding/useOnboarding.ts` | Step state, localStorage persistence, dismiss |
| `src/onboarding/OnboardingTooltip.tsx` | Positioned tooltip with step content |
| `src/onboarding/OnboardingOverlay.tsx` | Backdrop + tooltip orchestration |
| `src/export/CopyPreview.tsx` | Expandable panel showing serialized output |
| `tests/toast/useToast.test.ts` | Toast hook unit tests |
| `tests/onboarding/useOnboarding.test.ts` | Onboarding hook unit tests |
| `tests/export/copyPreview.test.ts` | CopyPreview component tests |

### Modified Files
| File | Changes |
|------|---------|
| `package.json` | Add lucide-react, @fontsource-variable/source-serif-4, @fontsource-variable/dm-sans |
| `src/main.tsx` | Import fontsource CSS, wrap in ToastProvider |
| `src/index.css` | CSS custom properties, font families, comment highlight migration, animations |
| `src/layout/App.tsx` | Wire toast, sidebar toggle, paste detection, copy preview, onboarding; remove fallback modal |
| `src/layout/HeaderToolbar.tsx` | New props interface, Lucide icons, sidebar toggle, comment badge |
| `src/comments/CommentCard.tsx` | Lucide icons, text labels, active border style, animation |
| `src/comments/CommentSidebar.tsx` | Collapsible support, overlay mode for mobile |
| `src/editor/useEditor.ts` | Add onPaste callback via handlePaste editorProp |
| `src/editor/EditorPanel.tsx` | Updated padding, prose max-width |
| `src/export/useCopyToClipboard.ts` | Simplify to just copy() that succeeds or throws |
| `src/history/VersionHistoryDropdown.tsx` | Replace emoji with Lucide icons |

---

## Task 1: Install Dependencies and Visual Foundation

**Files:**
- Modify: `package.json`
- Modify: `src/main.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Install dependencies**

Run: `npm install lucide-react @fontsource-variable/source-serif-4 @fontsource-variable/dm-sans`

- [ ] **Step 2: Import fonts in main.tsx**

Add to top of `src/main.tsx`:
```ts
import '@fontsource-variable/source-serif-4'
import '@fontsource-variable/dm-sans'
```

- [ ] **Step 3: Replace entire src/index.css with CSS custom properties and font families**

```css
@import "tailwindcss";

:root {
  --bg-primary: #FAFAF9;
  --bg-surface: #FFFFFF;
  --bg-surface-alt: #F5F5F4;
  --border: #E7E5E4;
  --text-primary: #1C1917;
  --text-secondary: #78716C;
  --text-tertiary: #A8A29E;
  --accent: #2563EB;
  --accent-hover: #1D4ED8;
  --cta-bg: #1C1917;
  --cta-text: #FFFFFF;
  --comment-bg: #FEF3C7;
  --comment-border: #F59E0B;
  --comment-active-bg: #FDE68A;
  --comment-active-border: #D97706;
  --success: #16A34A;
  --danger: #DC2626;
  --font-heading: 'Source Serif 4 Variable', Georgia, serif;
  --font-body: 'DM Sans Variable', system-ui, sans-serif;
}

body {
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--bg-primary);
}

.comment-highlight {
  background-color: var(--comment-bg);
  cursor: pointer;
  border-bottom: 2px solid var(--comment-border);
  border-radius: 2px;
}

.comment-highlight.active {
  background-color: var(--comment-active-bg);
  border-bottom-color: var(--comment-active-border);
}
```

- [ ] **Step 4: Verify existing tests still pass**

Run: `npm test`
Expected: All 60 tests pass.

- [ ] **Step 5: Verify dev server works with new fonts**

Run: `npm run dev` — confirm app loads with DM Sans body and warm background.

- [ ] **Step 6: Commit**

Stage: `package.json package-lock.json src/main.tsx src/index.css`
Message: `feat: add visual foundation — fonts, color tokens, CSS custom properties`

---

## Task 2: Toast Notification System

**Files:**
- Create: `src/toast/types.ts`
- Create: `src/toast/useToast.ts`
- Create: `src/toast/ToastProvider.tsx`
- Create: `src/toast/ToastContainer.tsx`
- Create: `tests/toast/useToast.test.ts`
- Modify: `src/index.css` (toast animation)

- [ ] **Step 1: Create toast type definitions**

Create `src/toast/types.ts`:
```ts
export type ToastType = 'success' | 'info' | 'error'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}
```

- [ ] **Step 2: Write failing test for useToast**

Create `tests/toast/useToast.test.ts` with tests for: empty initial state, show a toast, auto-dismiss info after 3s, auto-dismiss success after 3s, no auto-dismiss for error, manual dismiss, max 3 toasts, newest first, custom duration.

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/toast/useToast.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement useToast hook**

Create `src/toast/useToast.ts` exporting `useToastState()` with `show(message, type, duration?)`, `dismiss(id)`, and `toasts` state. Max 3 toasts. Error toasts have no auto-dismiss. Info/success auto-dismiss at 3000ms.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/toast/useToast.test.ts`
Expected: All pass.

- [ ] **Step 6: Implement ToastProvider and ToastContainer**

Create `src/toast/ToastProvider.tsx` — React context providing `showToast` function. Wraps `useToastState` and renders `ToastContainer`.

Create `src/toast/ToastContainer.tsx` — renders toast stack at bottom-right. Uses Lucide `Check`, `Info`, `AlertCircle`, `X` icons. Each toast has colored left border, `role="status"`, dismiss button with `aria-label="Dismiss notification"`. Use two `aria-live` regions: `aria-live="polite"` container for info/success toasts, `aria-live="assertive"` container for error toasts (per spec accessibility requirements).

- [ ] **Step 7: Add toast-enter animation to index.css**

Append `@keyframes toast-enter` (fade-in + slide-up, 200ms ease-out) and `.toast-enter` class.

- [ ] **Step 8: Run all tests**

Run: `npm test`
Expected: All pass (existing 60 + new toast tests).

- [ ] **Step 9: Commit**

Stage: `src/toast/ tests/toast/ src/index.css`
Message: `feat: add toast notification system with auto-dismiss and queue`

---

## Task 3: Simplify useCopyToClipboard

**Files:**
- Modify: `src/export/useCopyToClipboard.ts`

- [ ] **Step 1: Simplify the hook**

Replace contents — remove all state (`copied`, `error`, `fallbackText`). The hook now only exposes `copy(text: string): Promise<void>` which calls `navigator.clipboard.writeText`. No try/catch — let the caller handle errors via toast.

- [ ] **Step 2: Run all tests**

Run: `npm test`
Expected: All pass.

- [ ] **Step 3: Commit**

Stage: `src/export/useCopyToClipboard.ts`
Message: `refactor: simplify useCopyToClipboard — toast handles feedback`

---

## Task 4: Redesign Comment Cards

**Files:**
- Modify: `src/comments/CommentCard.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Update CommentCard with Lucide icons and refined styles**

Replace `✎` with Lucide `Pencil` (14px) + "edit" text label. Replace `✕` with Lucide `X` (14px) + "delete" text label. Active card uses 4px left accent border (`--accent`) instead of full border color change. Use CSS custom property colors throughout. Add hover transitions.

- [ ] **Step 2: Add comment-card-enter animation to index.css**

Append `@keyframes comment-card-enter` (fade-in + slide-down 4px, 200ms ease-out) and `.comment-card` class.

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: All pass.

- [ ] **Step 4: Commit**

Stage: `src/comments/CommentCard.tsx src/index.css`
Message: `feat: redesign comment cards — Lucide icons, text labels, animation`

---

## Task 5: Redesign Header Toolbar

**Files:**
- Modify: `src/layout/HeaderToolbar.tsx`
- Modify: `src/history/VersionHistoryDropdown.tsx`

- [ ] **Step 1: Rewrite HeaderToolbar with new props interface**

New interface: `{ onCopy, commentCount, sidebarOpen, onToggleSidebar, historyButton }`. Logo in `--font-heading`. Comment count badge (amber pill, hidden when 0). Sidebar toggle button (far-left of actions) with `PanelRight`/`PanelRightClose` icons, `aria-expanded`, `aria-label`. Copy button dark CTA style with `Clipboard` icon + `⌘↵` hint + `data-testid="copy-button"`.

- [ ] **Step 2: Update VersionHistoryDropdown**

Replace `📋`/`📥` emoji with Lucide `Clipboard`/`ClipboardPaste` icons. Replace `✕` with Lucide `X`.

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: All pass.

- [ ] **Step 4: Commit**

Stage: `src/layout/HeaderToolbar.tsx src/history/VersionHistoryDropdown.tsx`
Message: `feat: redesign header toolbar — Lucide icons, sidebar toggle, comment badge`

---

## Task 6: Editor Area and Collapsible Sidebar

**Files:**
- Modify: `src/editor/EditorPanel.tsx`
- Modify: `src/comments/CommentSidebar.tsx`
- Modify: `src/index.css`

- [ ] **Step 1: Update EditorPanel styling**

Increase padding (px-8 py-6). Add `max-w-prose mx-auto` wrapper. Background `--bg-primary`.

- [ ] **Step 2: Add editor typography styles to index.css**

`.ProseMirror` gets `font-family: var(--font-body)`, `line-height: 1.7`, `max-width: 65ch`. Headings get `font-family: var(--font-heading)`.

- [ ] **Step 3: Update CommentSidebar for collapsible and overlay support**

New props: `open`, `overlay?`, `onClose?`. When `!open && !overlay` return null. When `overlay && open`, render with fixed positioning + backdrop + slide-in animation. Desktop/tablet: sidebar uses `overflow: hidden` + `width` transition (320px to 0px) — NOT `transform: translateX` — so the editor flex-grows to fill without layout gaps. Sidebar width 320px desktop, 240px tablet via CSS media query.

- [ ] **Step 4: Add responsive breakpoints and animations to index.css**

Append CSS with three explicit breakpoints:

```css
/* Sidebar collapse transition (desktop/tablet — width-based, not transform) */
.sidebar-collapsible {
  transition: width 200ms ease-out;
  overflow: hidden;
}

/* Overlay slide-in animation (mobile) */
@keyframes sidebar-slide-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.sidebar-slide-in { animation: sidebar-slide-in 200ms ease-out; }

/* Tablet: narrower sidebar */
@media (max-width: 1023px) {
  .sidebar-collapsible { width: 240px; }
}

/* Mobile: icon-only header, overlay sidebar */
@media (max-width: 767px) {
  .header-label { display: none; }
  .header-actions { gap: 4px; }
}
```

The `.header-label` class will be applied to button text labels in HeaderToolbar so they hide on mobile while keeping icons visible.

- [ ] **Step 5: Run all tests**

Run: `npm test`
Expected: All pass.

- [ ] **Step 6: Commit**

Stage: `src/editor/EditorPanel.tsx src/comments/CommentSidebar.tsx src/index.css`
Message: `feat: editor typography, collapsible sidebar with overlay mode`

---

## Task 7: Paste Detection

**Files:**
- Modify: `src/editor/useEditor.ts`

- [ ] **Step 1: Add onPaste callback to useAppEditor**

Change signature from `useAppEditor(content?: string)` to `useAppEditor(options?: { content?: string; onPaste?: () => void })`. Add `handlePaste` to `editorProps` that calls `onPaste?.()` and returns `false` (lets Tiptap handle the paste).

- [ ] **Step 2: Run all tests**

Run: `npm test`
Expected: All pass.

- [ ] **Step 3: Commit**

Stage: `src/editor/useEditor.ts`
Message: `feat: add onPaste callback to editor via handlePaste editorProp`

---

## Task 8: Copy Preview Panel

**Files:**
- Create: `src/export/CopyPreview.tsx`
- Create: `tests/export/copyPreview.test.ts`

- [ ] **Step 1: Write failing test for CopyPreview**

Create `tests/export/copyPreview.test.ts` with tests for: renders nothing when no content, renders "Preview output" toggle, highlights `{start-comment}` delimiters in output, highlights `[SYSTEM:` prompt, calls onCopy when copy button clicked.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/export/copyPreview.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement CopyPreview component**

Collapsed by default — slim bar with "Preview output" toggle between header and main. Uses `ChevronDown`/`ChevronRight` Lucide icons. Expanded shows serialized markdown in a `<pre>` with `max-height: 200px`. Comment delimiters highlighted in amber (`--comment-bg`), system prompt in muted color (`--bg-surface-alt`). Copy button inside panel. Collapse/expand with 200ms transition.

- [ ] **Step 4: Run all tests**

Run: `npm test`
Expected: All pass (including new copyPreview tests).

- [ ] **Step 5: Commit**

Stage: `src/export/CopyPreview.tsx tests/export/copyPreview.test.ts`
Message: `feat: add copy preview panel with syntax-highlighted delimiters`

---

## Task 9: Onboarding System

**Files:**
- Create: `src/onboarding/steps.ts`
- Create: `src/onboarding/useOnboarding.ts`
- Create: `src/onboarding/OnboardingTooltip.tsx`
- Create: `src/onboarding/OnboardingOverlay.tsx`
- Create: `tests/onboarding/useOnboarding.test.ts`

- [ ] **Step 1: Create step definitions**

Create `src/onboarding/steps.ts` with 3 steps: "Paste your content" (anchor: `.ProseMirror`), "Select & comment" (anchor: `.ProseMirror`, shortcut: `⌘K`), "Copy & send back" (anchor: `[data-testid="copy-button"]`, shortcut: `⌘↵`).

- [ ] **Step 2: Write failing tests for useOnboarding**

Create `tests/onboarding/useOnboarding.test.ts` with tests for: starts active on first visit, inactive if localStorage done, next/back navigation, back does not go below 0, dismiss saves to localStorage, finishing last step dismisses, totalSteps returns 3.

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx vitest run tests/onboarding/useOnboarding.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement useOnboarding hook**

Create `src/onboarding/useOnboarding.ts`. Reads `feedbackeditor-onboarding:v1` from localStorage. Returns `{ active, step, totalSteps, next, back, dismiss }`. `next()` advances step or dismisses on last. `dismiss()` saves to localStorage.

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/onboarding/useOnboarding.test.ts`
Expected: All pass.

- [ ] **Step 6: Implement OnboardingTooltip component**

Create `src/onboarding/OnboardingTooltip.tsx`. Receives step data + anchorRect. Renders positioned tooltip with step number (blue circle), title, description, shortcut kbd, step counter, Skip/Back/Next buttons. `role="dialog"`, `aria-modal="true"`, `aria-label`. **Focus trapping required:** on mount, focus the first button inside the tooltip. Add a `keydown` handler that traps Tab within the tooltip buttons (Skip, Back, Next) — when Tab reaches the last button, wrap to the first; when Shift+Tab reaches the first, wrap to the last.

- [ ] **Step 7: Implement OnboardingOverlay component**

Create `src/onboarding/OnboardingOverlay.tsx`. Uses `useOnboarding`. Calculates anchor rect via `getBoundingClientRect`. Semi-transparent backdrop. Escape key dismisses. Click outside dismisses. Updates anchor on resize.

- [ ] **Step 8: Run all tests**

Run: `npm test`
Expected: All pass.

- [ ] **Step 9: Commit**

Stage: `src/onboarding/ tests/onboarding/`
Message: `feat: add 3-step onboarding with localStorage persistence`

---

## Task 10: Wire Everything Into App.tsx

**Files:**
- Modify: `src/main.tsx`
- Modify: `src/layout/App.tsx`

- [ ] **Step 1: Wrap app in ToastProvider in main.tsx**

In `src/main.tsx`, import `ToastProvider` from `./toast/ToastProvider` and wrap `<App />`.

- [ ] **Step 2: Update App.tsx with all integrations**

Key changes to `src/layout/App.tsx`:

1. Import `useToast`, `CopyPreview`, `OnboardingOverlay`
2. Add `sidebarOpen` state persisted to `feedbackeditor-sidebar:v1` localStorage key
3. Add `toggleSidebar` callback
4. Get `showToast` from `useToast()`
5. Add debounced `handlePaste` callback (500ms) that saves version + shows toast
6. Update `useAppEditor` call to `useAppEditor({ content: SAMPLE_MARKDOWN, onPaste: handlePaste })`
7. Simplify `useCopyToClipboard` destructuring to just `{ copy }`
8. Update `handleCopy` to use try/catch with toast for success/error
9. Update `handleRevert` to show toast on restore
10. Remove `fallbackText` modal JSX entirely
11. Add `<CopyPreview>` between `<header>` and `<main>` using `serializeMarkdown` output
12. Update `<HeaderToolbar>` props to new interface
13. Update `<CommentSidebar>` props: add `open={sidebarOpen}`, `onClose={() => setSidebarOpen(false)}`. For mobile overlay mode, detect viewport width via `window.matchMedia('(max-width: 767px)')` and pass `overlay={isMobile}` — use a simple `useState` + `useEffect` with `matchMedia` listener, no external hook library needed
14. Add `<OnboardingOverlay />` at end of component
15. Add `.header-label` class to button text labels in HeaderToolbar so they auto-hide on mobile via CSS

- [ ] **Step 3: Run all tests**

Run: `npm test`
Expected: All pass.

- [ ] **Step 4: Run lint and typecheck**

Run: `npm run lint` then `npx tsc -b --noEmit`
Expected: Clean — zero errors, zero warnings.

- [ ] **Step 5: Manual smoke test**

Run: `npm run dev`. Verify in browser:
- Onboarding shows on first visit (clear localStorage to test)
- Comments work (select text, add, edit, delete)
- Copy shows success toast
- Paste shows info toast + version saved
- Sidebar toggles open/closed, persists across refresh
- Copy preview panel expands/collapses with highlighted delimiters
- History dropdown works with Lucide icons
- Keyboard shortcuts still work (Cmd+Enter, Cmd+K, Cmd+Alt+Z)

- [ ] **Step 6: Commit**

Stage: `src/main.tsx src/layout/App.tsx`
Message: `feat: wire toast, sidebar toggle, paste detection, preview, onboarding`

---

## Task 11: Final Verification and Push

- [ ] **Step 1: Run full CI-equivalent checks**

Run: `npm run lint && npx tsc -b --noEmit && npm test && npm run build`
All must pass.

- [ ] **Step 2: Push to GitHub**

Run: `git push`
Pre-push hook runs typecheck + tests automatically.
