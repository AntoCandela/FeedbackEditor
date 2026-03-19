import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useComments } from '../../src/comments/useComments'

describe('useComments', () => {
  it('starts with empty comments', () => {
    const { result } = renderHook(() => useComments())
    expect(result.current.comments).toEqual([])
    expect(result.current.activeCommentId).toBeNull()
  })

  it('adds a comment', () => {
    const { result } = renderHook(() => useComments())
    act(() => {
      result.current.addComment('id-1', 'Fix this', 'some text')
    })
    expect(result.current.comments).toHaveLength(1)
    expect(result.current.comments[0]).toMatchObject({
      id: 'id-1',
      text: 'Fix this',
      highlightedText: 'some text',
    })
  })

  it('adds a comment with createdAt timestamp', () => {
    const before = Date.now()
    const { result } = renderHook(() => useComments())
    act(() => {
      result.current.addComment('id-1', 'Fix', 'text')
    })
    const after = Date.now()
    expect(result.current.comments[0].createdAt).toBeGreaterThanOrEqual(before)
    expect(result.current.comments[0].createdAt).toBeLessThanOrEqual(after)
  })

  it('updates a comment text', () => {
    const { result } = renderHook(() => useComments())
    act(() => {
      result.current.addComment('id-1', 'Fix this', 'some text')
    })
    act(() => {
      result.current.updateComment('id-1', 'Rewrite this')
    })
    expect(result.current.comments[0].text).toBe('Rewrite this')
  })

  it('update is a no-op for unknown id', () => {
    const { result } = renderHook(() => useComments())
    act(() => {
      result.current.addComment('id-1', 'Fix', 'text')
    })
    act(() => {
      result.current.updateComment('unknown', 'New text')
    })
    expect(result.current.comments[0].text).toBe('Fix')
  })

  it('deletes a comment', () => {
    const { result } = renderHook(() => useComments())
    act(() => {
      result.current.addComment('id-1', 'Fix this', 'some text')
    })
    act(() => {
      result.current.deleteComment('id-1')
    })
    expect(result.current.comments).toHaveLength(0)
  })

  it('clears activeCommentId when the active comment is deleted', () => {
    const { result } = renderHook(() => useComments())
    act(() => {
      result.current.addComment('id-1', 'Fix', 'text')
      result.current.setActiveCommentId('id-1')
    })
    act(() => {
      result.current.deleteComment('id-1')
    })
    expect(result.current.activeCommentId).toBeNull()
  })

  it('preserves activeCommentId when a different comment is deleted', () => {
    const { result } = renderHook(() => useComments())
    act(() => {
      result.current.addComment('id-1', 'Fix', 'text')
      result.current.addComment('id-2', 'Also fix', 'more text')
      result.current.setActiveCommentId('id-1')
    })
    act(() => {
      result.current.deleteComment('id-2')
    })
    expect(result.current.activeCommentId).toBe('id-1')
  })

  it('sets active comment id', () => {
    const { result } = renderHook(() => useComments())
    act(() => {
      result.current.setActiveCommentId('id-1')
    })
    expect(result.current.activeCommentId).toBe('id-1')
  })

  it('clears all comments', () => {
    const { result } = renderHook(() => useComments())
    act(() => {
      result.current.addComment('id-1', 'Fix', 'text')
      result.current.addComment('id-2', 'Also fix', 'more text')
    })
    act(() => {
      result.current.clearComments()
    })
    expect(result.current.comments).toHaveLength(0)
  })

  it('clearComments also resets activeCommentId', () => {
    const { result } = renderHook(() => useComments())
    act(() => {
      result.current.addComment('id-1', 'Fix', 'text')
      result.current.setActiveCommentId('id-1')
    })
    act(() => {
      result.current.clearComments()
    })
    expect(result.current.activeCommentId).toBeNull()
  })

  it('maintains order of multiple comments', () => {
    const { result } = renderHook(() => useComments())
    act(() => {
      result.current.addComment('a', 'First', 'text-a')
      result.current.addComment('b', 'Second', 'text-b')
      result.current.addComment('c', 'Third', 'text-c')
    })
    expect(result.current.comments.map(c => c.id)).toEqual(['a', 'b', 'c'])
  })
})
