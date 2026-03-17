import { describe, it, expect } from 'vitest'
import { parseMarkdown } from './parseMarkdown'

describe('parseMarkdown', () => {
  it('returns HTML and empty comments for plain markdown', () => {
    const result = parseMarkdown('# Hello\n\nSome text')
    expect(result.html).toContain('Hello')
    expect(result.comments).toEqual([])
  })

  it('extracts comments from delimiters', () => {
    const md = 'The {start-comment}old text{end-comment: Make it new} here.'
    const result = parseMarkdown(md)
    expect(result.comments).toHaveLength(1)
    expect(result.comments[0].text).toBe('Make it new')
    expect(result.comments[0].highlightedText).toBe('old text')
    expect(result.html).toContain('data-comment-id')
    expect(result.html).not.toContain('{start-comment}')
  })

  it('handles multiple comments', () => {
    const md = '{start-comment}first{end-comment: Fix 1} and {start-comment}second{end-comment: Fix 2}'
    const result = parseMarkdown(md)
    expect(result.comments).toHaveLength(2)
    expect(result.comments[0].highlightedText).toBe('first')
    expect(result.comments[1].highlightedText).toBe('second')
  })

  it('ignores delimiters inside fenced code blocks', () => {
    const md = '```\n{start-comment}code{end-comment: not a comment}\n```'
    const result = parseMarkdown(md)
    expect(result.comments).toEqual([])
  })

  it('handles malformed delimiters gracefully', () => {
    const md = 'Some {start-comment}unclosed text here.'
    const result = parseMarkdown(md)
    expect(result.comments).toEqual([])
    expect(result.html).toContain('{start-comment}')
  })

  it('strips the system prompt if present', () => {
    const md = '[SYSTEM: This document contains inline feedback comments.\nSome instructions.]\n\n# Title\n\nContent'
    const result = parseMarkdown(md)
    expect(result.html).not.toContain('[SYSTEM:')
    expect(result.html).toContain('Title')
  })

  it('assigns unique UUIDs to each comment', () => {
    const md = '{start-comment}a{end-comment: x} and {start-comment}b{end-comment: y}'
    const result = parseMarkdown(md)
    expect(result.comments[0].id).not.toBe(result.comments[1].id)
  })
})
