import type { Comment } from '../comments/types'

interface ParseResult {
  html: string
  comments: Comment[]
}

// Hoisted static regexes to avoid re-creation on every call (js-hoist-regexp)
const CODE_BLOCK_RE = /```[\s\S]*?```/g
const CODE_BLOCK_PLACEHOLDER_RE = /__CODE_BLOCK_(\d+)__/g
const SYSTEM_PROMPT_RE = /^\[SYSTEM:[\s\S]*?\]\s*\n*/m
const COMMENT_RE = /\{start-comment\}(.*?)\{end-comment:\s*(.*?)\}/g

function maskCodeBlocks(md: string): { masked: string; blocks: string[] } {
  const blocks: string[] = []
  const masked = md.replace(CODE_BLOCK_RE, (match) => {
    blocks.push(match)
    return `__CODE_BLOCK_${blocks.length - 1}__`
  })
  return { masked, blocks }
}

function unmaskCodeBlocks(text: string, blocks: string[]): string {
  return text.replace(CODE_BLOCK_PLACEHOLDER_RE, (_, index) => blocks[Number(index)])
}

function stripSystemPrompt(md: string): string {
  return md.replace(SYSTEM_PROMPT_RE, '')
}

export function parseMarkdown(md: string): ParseResult {
  const stripped = stripSystemPrompt(md)
  const { masked, blocks } = maskCodeBlocks(stripped)
  const comments: Comment[] = []

  // Reset lastIndex since these are global regexes reused across calls
  COMMENT_RE.lastIndex = 0
  const processed = masked.replace(COMMENT_RE, (_, highlighted: string, feedback: string) => {
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
