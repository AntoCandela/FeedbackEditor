import { describe, it, expect } from 'vitest'
import { serializeMarkdown } from './serializeMarkdown'
import { SYSTEM_PROMPT } from './systemPrompt'
import type { Comment } from '../comments/types'

describe('serializeMarkdown', () => {
  it('serializes plain text without comments', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello world' }],
        },
      ],
    }
    const result = serializeMarkdown(doc, [])
    expect(result).toContain('Hello world')
    expect(result).not.toContain('{start-comment}')
  })

  it('wraps commented text with delimiters', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'The future is ' },
            {
              type: 'text',
              text: 'about replacing humans',
              marks: [{ type: 'comment', attrs: { commentId: 'c1' } }],
            },
            { type: 'text', text: ' in every industry.' },
          ],
        },
      ],
    }
    const comments: Comment[] = [
      { id: 'c1', text: 'Too aggressive', highlightedText: 'about replacing humans', createdAt: 1 },
    ]
    const result = serializeMarkdown(doc, comments)
    expect(result).toContain('{start-comment}about replacing humans{end-comment: Too aggressive}')
  })

  it('prepends the system prompt when comments exist', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'some text',
              marks: [{ type: 'comment', attrs: { commentId: 'c1' } }],
            },
          ],
        },
      ],
    }
    const comments: Comment[] = [
      { id: 'c1', text: 'Fix', highlightedText: 'some text', createdAt: 1 },
    ]
    const result = serializeMarkdown(doc, comments)
    expect(result.startsWith(SYSTEM_PROMPT)).toBe(true)
  })

  it('does not prepend system prompt when no comments', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Clean text' }],
        },
      ],
    }
    const result = serializeMarkdown(doc, [])
    expect(result).not.toContain('[SYSTEM:')
  })

  it('handles headings', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'My Title' }],
        },
      ],
    }
    const result = serializeMarkdown(doc, [])
    expect(result).toContain('# My Title')
  })

  it('handles bold and italic marks alongside comments', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'bold text',
              marks: [
                { type: 'bold' },
                { type: 'comment', attrs: { commentId: 'c1' } },
              ],
            },
          ],
        },
      ],
    }
    const comments: Comment[] = [
      { id: 'c1', text: 'Rephrase', highlightedText: 'bold text', createdAt: 1 },
    ]
    const result = serializeMarkdown(doc, comments)
    expect(result).toContain('{start-comment}**bold text**{end-comment: Rephrase}')
  })

  it('skips orphan comment marks with no matching comment', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'orphan text',
              marks: [{ type: 'comment', attrs: { commentId: 'missing' } }],
            },
          ],
        },
      ],
    }
    const result = serializeMarkdown(doc, [])
    expect(result).toContain('orphan text')
    expect(result).not.toContain('{start-comment}')
  })
})
