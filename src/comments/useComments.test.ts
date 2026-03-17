import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useComments } from './useComments'

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
})
