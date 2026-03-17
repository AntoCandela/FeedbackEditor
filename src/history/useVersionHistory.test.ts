import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useVersionHistory } from './useVersionHistory'

const STORAGE_KEY = 'feedbackeditor-versions'

describe('useVersionHistory', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts with empty versions', () => {
    const { result } = renderHook(() => useVersionHistory())
    expect(result.current.versions).toEqual([])
  })

  it('saves a version', () => {
    const { result } = renderHook(() => useVersionHistory())
    act(() => {
      result.current.saveVersion('# Hello', [], 'copy')
    })
    expect(result.current.versions).toHaveLength(1)
    expect(result.current.versions[0].markdown).toBe('# Hello')
    expect(result.current.versions[0].trigger).toBe('copy')
    expect(result.current.versions[0].comments).toEqual([])
  })

  it('prepends new versions (newest first)', () => {
    const { result } = renderHook(() => useVersionHistory())
    act(() => {
      result.current.saveVersion('First', [], 'copy')
    })
    act(() => {
      result.current.saveVersion('Second', [], 'paste')
    })
    expect(result.current.versions[0].markdown).toBe('Second')
    expect(result.current.versions[1].markdown).toBe('First')
  })

  it('persists to localStorage', () => {
    const { result } = renderHook(() => useVersionHistory())
    act(() => {
      result.current.saveVersion('Persisted', [], 'copy')
    })
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    expect(stored).toHaveLength(1)
    expect(stored[0].markdown).toBe('Persisted')
  })

  it('loads from localStorage on mount', () => {
    const existing = [{
      id: 'existing-1',
      markdown: 'Loaded',
      comments: [],
      timestamp: Date.now(),
      trigger: 'copy',
    }]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    const { result } = renderHook(() => useVersionHistory())
    expect(result.current.versions).toHaveLength(1)
    expect(result.current.versions[0].markdown).toBe('Loaded')
  })

  it('handles corrupt localStorage gracefully', () => {
    localStorage.setItem(STORAGE_KEY, 'not-valid-json')
    const { result } = renderHook(() => useVersionHistory())
    expect(result.current.versions).toEqual([])
  })

  it('loads a version by id', () => {
    const { result } = renderHook(() => useVersionHistory())
    act(() => {
      result.current.saveVersion('Target', [], 'copy')
    })
    const id = result.current.versions[0].id
    const version = result.current.loadVersion(id)
    expect(version?.markdown).toBe('Target')
  })

  it('returns undefined for unknown id', () => {
    const { result } = renderHook(() => useVersionHistory())
    expect(result.current.loadVersion('nonexistent')).toBeUndefined()
  })

  it('clears all history', () => {
    const { result } = renderHook(() => useVersionHistory())
    act(() => {
      result.current.saveVersion('One', [], 'copy')
      result.current.saveVersion('Two', [], 'paste')
    })
    act(() => {
      result.current.clearHistory()
    })
    expect(result.current.versions).toEqual([])
    expect(localStorage.getItem(STORAGE_KEY)).toBe('[]')
  })
})
