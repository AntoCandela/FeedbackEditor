import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useToastState } from '../../src/toast/useToast'

describe('useToastState', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts with empty toast queue', () => {
    const { result } = renderHook(() => useToastState())
    expect(result.current.toasts).toEqual([])
  })

  it('shows a toast with message and type', () => {
    const { result } = renderHook(() => useToastState())
    act(() => {
      result.current.show('Copied!', 'success')
    })
    expect(result.current.toasts).toHaveLength(1)
    expect(result.current.toasts[0].message).toBe('Copied!')
    expect(result.current.toasts[0].type).toBe('success')
  })

  it('auto-dismisses info toasts after 3 seconds', () => {
    const { result } = renderHook(() => useToastState())
    act(() => {
      result.current.show('Info message', 'info')
    })
    expect(result.current.toasts).toHaveLength(1)
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.toasts).toHaveLength(0)
  })

  it('auto-dismisses success toasts after 3 seconds', () => {
    const { result } = renderHook(() => useToastState())
    act(() => {
      result.current.show('Success!', 'success')
    })
    expect(result.current.toasts).toHaveLength(1)
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.toasts).toHaveLength(0)
  })

  it('does NOT auto-dismiss error toasts', () => {
    const { result } = renderHook(() => useToastState())
    act(() => {
      result.current.show('Error occurred', 'error')
    })
    expect(result.current.toasts).toHaveLength(1)
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(result.current.toasts).toHaveLength(1)
  })

  it('manually dismisses a toast by id', () => {
    const { result } = renderHook(() => useToastState())
    let id: string
    act(() => {
      id = result.current.show('Dismiss me', 'error')
    })
    expect(result.current.toasts).toHaveLength(1)
    act(() => {
      result.current.dismiss(id!)
    })
    expect(result.current.toasts).toHaveLength(0)
  })

  it('limits to max 3 visible toasts', () => {
    const { result } = renderHook(() => useToastState())
    act(() => {
      result.current.show('First', 'error')
      result.current.show('Second', 'error')
      result.current.show('Third', 'error')
      result.current.show('Fourth', 'error')
    })
    expect(result.current.toasts).toHaveLength(3)
  })

  it('newest toast is first in array', () => {
    const { result } = renderHook(() => useToastState())
    act(() => {
      result.current.show('First', 'error')
    })
    act(() => {
      result.current.show('Second', 'error')
    })
    expect(result.current.toasts[0].message).toBe('Second')
    expect(result.current.toasts[1].message).toBe('First')
  })

  it('accepts custom duration', () => {
    const { result } = renderHook(() => useToastState())
    act(() => {
      result.current.show('Custom', 'info', 5000)
    })
    expect(result.current.toasts).toHaveLength(1)
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.toasts).toHaveLength(1)
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(result.current.toasts).toHaveLength(0)
  })
})
