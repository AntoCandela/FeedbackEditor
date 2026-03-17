# Keyboard Shortcuts (EPIC-3) Design Spec

## Problem

Power users want to stay on the keyboard. Currently every action requires clicking buttons — copy, add comment, navigate versions.

## Solution

A `useKeyboardShortcuts` hook that registers global keyboard shortcuts for the most common actions.

## Shortcuts

| Shortcut | Action | Condition |
|----------|--------|-----------|
| `Cmd+Enter` | Copy with comments | Always |
| `Cmd+K` | Add comment on selection | Only when text is selected and selection doesn't overlap existing comment |
| `Escape` | Dismiss bubble menu / deselect | When text is selected |
| `Cmd+Alt+Z` | Version back | When version history has entries |
| `Cmd+Alt+Shift+Z` | Version forward | When navigating back through versions |

Platform: `metaKey` on Mac, `ctrlKey` on Windows/Linux. Detect via `navigator.platform`.

## Version Navigation Logic

Track a `versionIndex` ref:
- Starts at `-1` meaning "current/unsaved state"
- **Cmd+Alt+Z:** If at `-1` (current), auto-save current state first, then set index to `0` and load `versions[0]`. Subsequent presses increment index and load `versions[index]`. Stop at `versions.length - 1`.
- **Cmd+Alt+Shift+Z:** Decrement index (min `-1`). Load `versions[index]`, or restore the auto-saved "current" state when back to `-1`.
- **Index resets to `-1`** when the user makes any edit or adds a comment (detected via editor `update` event).

The auto-saved "current" state is stored in a ref, not in the versions array — it's a temporary snapshot that only exists during navigation.

## Architecture

### New Files

```
src/
  editor/
    useKeyboardShortcuts.ts   # Hook: keydown listener with all shortcuts
```

### Modified Files

- `src/layout/App.tsx` — wire the hook with editor, handlers, and version history

### Hook Interface

```typescript
interface KeyboardShortcutDeps {
  editor: Editor | null
  onCopy: () => void
  onAddComment: (selectedText: string) => void
  versions: Version[]
  onRevert: (id: string) => void
  saveVersion: (markdown: string, comments: Comment[], trigger: 'copy' | 'paste') => void
  comments: Comment[]
}

function useKeyboardShortcuts(deps: KeyboardShortcutDeps): void
```

The hook registers a single `keydown` listener on `document` and dispatches to the appropriate handler based on the key combination. It cleans up on unmount.

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Cmd+K with no selection | No-op |
| Cmd+K with selection overlapping comment | No-op |
| Cmd+Alt+Z with no versions | No-op |
| Cmd+Alt+Shift+Z at current (index -1) | No-op |
| Cmd+Alt+Z at oldest version | No-op |

## Out of Scope

- Visual shortcut hints / tooltip overlays
- Customizable key bindings
- Shortcut cheat sheet panel

## Auto-K References

| ID | Name |
|----|------|
| EPIC-3 | Keyboard Shortcuts (v3) |
| US-9 | Copy with keyboard shortcut |
| US-10 | Add comment with keyboard shortcut |
| US-11 | Dismiss bubble menu with Escape |
| US-27 | Navigate version history backward |
| US-28 | Navigate version history forward |
