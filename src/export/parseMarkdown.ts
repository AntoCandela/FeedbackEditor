import type { Comment } from '../comments/types'

interface ParseResult {
  html: string
  comments: Comment[]
}

function maskCodeBlocks(md: string): { masked: string; blocks: string[] } {
  const blocks: string[] = []
  const masked = md.replace(/```[\s\S]*?```/g, (match) => {
    blocks.push(match)
    return `__CODE_BLOCK_${blocks.length - 1}__`
  })
  return { masked, blocks }
}

function unmaskCodeBlocks(text: string, blocks: string[]): string {
  return text.replace(/__CODE_BLOCK_(\d+)__/g, (_, index) => blocks[Number(index)])
}

function stripSystemPrompt(md: string): string {
  return md.replace(/^\[SYSTEM:[\s\S]*?\]\s*\n*/m, '')
}

export function parseMarkdown(md: string): ParseResult {
  const stripped = stripSystemPrompt(md)
  const { masked, blocks } = maskCodeBlocks(stripped)
  const comments: Comment[] = []

  const pattern = /\{start-comment\}(.*?)\{end-comment:\s*(.*?)\}/g
  const processed = masked.replace(pattern, (_, highlighted: string, feedback: string) => {
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
