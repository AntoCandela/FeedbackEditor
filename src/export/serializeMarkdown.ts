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

function serializeNode(node: TiptapNode, comments: Comment[]): string {
  switch (node.type) {
    case 'doc':
      return (node.content ?? []).map(n => serializeNode(n, comments)).join('\n\n')

    case 'paragraph':
      return (node.content ?? []).map(n => serializeNode(n, comments)).join('')

    case 'heading': {
      const level = (node.attrs?.level as number) ?? 1
      const prefix = '#'.repeat(level)
      const content = (node.content ?? []).map(n => serializeNode(n, comments)).join('')
      return `${prefix} ${content}`
    }

    case 'bulletList':
      return (node.content ?? []).map(n => serializeNode(n, comments)).join('\n')

    case 'orderedList':
      return (node.content ?? []).map((n, i) => {
        const content = (n.content ?? []).map(c => serializeNode(c, comments)).join('')
        return `${i + 1}. ${content}`
      }).join('\n')

    case 'listItem': {
      const content = (node.content ?? []).map(n => serializeNode(n, comments)).join('')
      return `- ${content}`
    }

    case 'blockquote': {
      const content = (node.content ?? []).map(n => serializeNode(n, comments)).join('\n')
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
      return (node.content ?? []).map(n => serializeNode(n, comments)).join('')
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
