# Contributing to FeedbackEditor

Thanks for your interest in contributing! Here's how to get started.

## Setup

```bash
git clone https://github.com/AntoCandela/FeedbackEditor.git
cd FeedbackEditor
npm install
npm run dev
```

## Development Workflow

1. **Fork** the repo and create a branch from `master`
2. Run `npm run dev` to start the development server
3. Make your changes
4. Run `npm test` to make sure tests pass
5. Run `npm run lint` to check for lint errors
6. Open a **pull request** against `master`

## Project Structure

```
src/
├── comments/       Comment state, types, UI components
├── editor/         Tiptap editor setup, bubble menu, shortcuts, utilities
├── export/         Markdown serialization/parsing, clipboard, system prompt
├── history/        Version history with localStorage persistence
├── layout/         App shell and header toolbar
```

Each module follows a consistent pattern:
- `types.ts` — TypeScript interfaces
- `use*.ts` — React hooks (state/logic)
- `*.tsx` — UI components
- `*.test.ts` — Unit tests

## Guidelines

- **Keep it simple** — this is a focused tool, not a framework
- **TypeScript strict** — no `any` types, no `@ts-ignore`
- **Test your changes** — add tests for new logic in hooks and utilities
- **One PR per feature/fix** — keep pull requests focused and reviewable

## Reporting Issues

Open an issue on GitHub with:
- What you expected to happen
- What actually happened
- Steps to reproduce (if applicable)
