# FeedbackEditor

A rich-text editor for adding inline feedback comments to AI-generated content. Select any text, attach a comment, then copy the document with embedded feedback — ready to paste back into an LLM conversation.

Built with [Auto-k](https://autok.dev) as a showcase of what's possible with AI-assisted development.

## Features

- **Inline comments** — select text and add feedback via bubble menu or `Cmd+K`
- **Copy with comments** — exports markdown with `{start-comment}...{end-comment}` delimiters and a system prompt that tells the LLM how to apply the feedback
- **Version history** — automatic snapshots on copy/paste, stored in localStorage
- **Keyboard shortcuts** — `Cmd+Enter` to copy, `Cmd+K` to comment, `Cmd+Alt+Z` to navigate history

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## How to Copy Into Your Project

This is a self-contained React component. To use it in an existing project:

1. Copy the `src/` folder into your project
2. Install the dependencies:
   ```bash
   npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-bubble-menu tiptap-markdown
   ```
3. Import and render the `App` component from `src/layout/App.tsx`
4. Include the comment highlight styles from `src/index.css` (or add them to your own stylesheet)

The editor uses Tailwind CSS for styling. If your project doesn't use Tailwind, you'll need to either add it or replace the utility classes with your own CSS.

## Project Structure

```
src/
├── comments/       Comment state, types, and UI (sidebar + cards)
├── editor/         Tiptap editor setup, bubble menu, keyboard shortcuts
├── export/         Markdown serialization/parsing, clipboard, system prompt
├── history/        Version history with localStorage persistence
├── layout/         App shell and header toolbar
├── index.css       Tailwind imports + comment highlight styles
└── main.tsx        React entry point
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run test` | Run tests |
| `npm run lint` | Lint with ESLint |

## Tech Stack

- **React 19** + **TypeScript 5.9**
- **Tiptap 3** — headless rich-text editor
- **Tailwind CSS 4** — utility-first styling
- **Vite 8** — build tool
- **Vitest** — test runner

## License

MIT
