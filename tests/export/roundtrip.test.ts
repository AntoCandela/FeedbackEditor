import { describe, it, expect } from 'vitest'
import { serializeMarkdown } from '../../src/export/serializeMarkdown'
import { parseMarkdown } from '../../src/export/parseMarkdown'
import type { Comment } from '../../src/comments/types'

describe('serialize → parse roundtrip', () => {
  it('preserves comment feedback text through a roundtrip', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This is ' },
            {
              type: 'text',
              text: 'important',
              marks: [{ type: 'comment', attrs: { commentId: 'c1' } }],
            },
            { type: 'text', text: ' content.' },
          ],
        },
      ],
    }
    const comments: Comment[] = [
      { id: 'c1', text: 'Rephrase this section', highlightedText: 'important', createdAt: 1 },
    ]

    const serialized = serializeMarkdown(doc, comments)
    const parsed = parseMarkdown(serialized)

    expect(parsed.comments).toHaveLength(1)
    expect(parsed.comments[0].text).toBe('Rephrase this section')
    expect(parsed.comments[0].highlightedText).toBe('important')
  })

  it('preserves multiple comments through a roundtrip', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'first part',
              marks: [{ type: 'comment', attrs: { commentId: 'c1' } }],
            },
            { type: 'text', text: ' middle ' },
            {
              type: 'text',
              text: 'second part',
              marks: [{ type: 'comment', attrs: { commentId: 'c2' } }],
            },
          ],
        },
      ],
    }
    const comments: Comment[] = [
      { id: 'c1', text: 'Fix A', highlightedText: 'first part', createdAt: 1 },
      { id: 'c2', text: 'Fix B', highlightedText: 'second part', createdAt: 2 },
    ]

    const serialized = serializeMarkdown(doc, comments)
    const parsed = parseMarkdown(serialized)

    expect(parsed.comments).toHaveLength(2)
    expect(parsed.comments[0].text).toBe('Fix A')
    expect(parsed.comments[1].text).toBe('Fix B')
  })

  it('plain text without comments survives roundtrip', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'No comments here.' }],
        },
      ],
    }

    const serialized = serializeMarkdown(doc, [])
    const parsed = parseMarkdown(serialized)

    expect(parsed.comments).toHaveLength(0)
    expect(parsed.html).toContain('No comments here.')
  })
})
