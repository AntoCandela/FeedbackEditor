import { describe, it, expect } from 'vitest'
import { serializeMarkdown } from '../../src/export/serializeMarkdown'
import { SYSTEM_PROMPT } from '../../src/export/systemPrompt'
import type { Comment } from '../../src/comments/types'

function makeComment(id: string, text: string, highlightedText: string): Comment {
  return { id, text, highlightedText, createdAt: 1 }
}

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
    const comments = [makeComment('c1', 'Too aggressive', 'about replacing humans')]
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
    const comments = [makeComment('c1', 'Fix', 'some text')]
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

  it('handles h2 and h3 headings', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'Sub' }] },
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: 'SubSub' }] },
      ],
    }
    const result = serializeMarkdown(doc, [])
    expect(result).toContain('## Sub')
    expect(result).toContain('### SubSub')
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
    const comments = [makeComment('c1', 'Rephrase', 'bold text')]
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

  it('handles bullet lists', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 1' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Item 2' }] }] },
          ],
        },
      ],
    }
    const result = serializeMarkdown(doc, [])
    expect(result).toContain('- Item 1')
    expect(result).toContain('- Item 2')
  })

  it('handles ordered lists', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'orderedList',
          content: [
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'First' }] }] },
            { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Second' }] }] },
          ],
        },
      ],
    }
    const result = serializeMarkdown(doc, [])
    expect(result).toContain('1. First')
    expect(result).toContain('2. Second')
  })

  it('handles blockquotes', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Quoted text' }] }],
        },
      ],
    }
    const result = serializeMarkdown(doc, [])
    expect(result).toContain('> Quoted text')
  })

  it('handles code blocks', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'codeBlock',
          attrs: { language: 'js' },
          content: [{ type: 'text', text: 'const x = 1' }],
        },
      ],
    }
    const result = serializeMarkdown(doc, [])
    expect(result).toContain('```js\nconst x = 1\n```')
  })

  it('handles horizontal rules', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: 'Above' }] },
        { type: 'horizontalRule' },
        { type: 'paragraph', content: [{ type: 'text', text: 'Below' }] },
      ],
    }
    const result = serializeMarkdown(doc, [])
    expect(result).toContain('---')
  })

  it('handles strikethrough and code marks', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'deleted', marks: [{ type: 'strike' }] },
            { type: 'text', text: ' and ' },
            { type: 'text', text: 'code', marks: [{ type: 'code' }] },
          ],
        },
      ],
    }
    const result = serializeMarkdown(doc, [])
    expect(result).toContain('~~deleted~~')
    expect(result).toContain('`code`')
  })

  it('handles empty document', () => {
    const doc = { type: 'doc', content: [] }
    const result = serializeMarkdown(doc, [])
    expect(result).toBe('')
  })
})
