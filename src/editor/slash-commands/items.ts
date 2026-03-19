import type { Editor } from '@tiptap/core'
import {
  Heading1, Heading2, Heading3,
  List, ListOrdered, ListChecks,
  Table, Code2, Quote, Minus,
} from 'lucide-react'
import type { ComponentType } from 'react'

export interface SlashCommandItem {
  title: string
  description: string
  icon: ComponentType<{ size?: number }>
  command: (editor: Editor) => void
}

export const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: 'Heading 1',
    description: 'Large section heading',
    icon: Heading1,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium section heading',
    icon: Heading2,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small section heading',
    icon: Heading3,
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Bullet List',
    description: 'Unordered list with bullets',
    icon: List,
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Numbered List',
    description: 'Ordered list with numbers',
    icon: ListOrdered,
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'Task List',
    description: 'Checklist with checkboxes',
    icon: ListChecks,
    command: (editor) => editor.chain().focus().toggleTaskList().run(),
  },
  {
    title: 'Table',
    description: 'Insert a 3x3 table',
    icon: Table,
    command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: 'Code Block',
    description: 'Fenced code block',
    icon: Code2,
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'Blockquote',
    description: 'Indented quote block',
    icon: Quote,
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Divider',
    description: 'Horizontal line separator',
    icon: Minus,
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
]

export function filterCommands(query: string): SlashCommandItem[] {
  if (!query) return SLASH_COMMANDS
  const lower = query.toLowerCase()
  return SLASH_COMMANDS.filter(
    item => item.title.toLowerCase().includes(lower) || item.description.toLowerCase().includes(lower)
  )
}
