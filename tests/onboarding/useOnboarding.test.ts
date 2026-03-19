import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useOnboarding } from '../../src/onboarding/useOnboarding'

const STORAGE_KEY = 'feedbackeditor-onboarding:v1'

describe('useOnboarding', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('starts active on first visit', () => {
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.active).toBe(true)
    expect(result.current.step).toBe(0)
  })

  it('is inactive if localStorage says done', () => {
    localStorage.setItem(STORAGE_KEY, 'done')
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.active).toBe(false)
  })

  it('advances to next step', () => {
    const { result } = renderHook(() => useOnboarding())
    act(() => {
      result.current.next()
    })
    expect(result.current.step).toBe(1)
  })

  it('goes back a step', () => {
    const { result } = renderHook(() => useOnboarding())
    act(() => {
      result.current.next()
    })
    act(() => {
      result.current.back()
    })
    expect(result.current.step).toBe(0)
  })

  it('does not go below step 0', () => {
    const { result } = renderHook(() => useOnboarding())
    act(() => {
      result.current.back()
    })
    expect(result.current.step).toBe(0)
  })

  it('dismiss saves to localStorage and deactivates', () => {
    const { result } = renderHook(() => useOnboarding())
    act(() => {
      result.current.dismiss()
    })
    expect(result.current.active).toBe(false)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('done')
  })

  it('finishing last step dismisses', () => {
    const { result } = renderHook(() => useOnboarding())
    act(() => {
      result.current.next()
    }) // step 1
    act(() => {
      result.current.next()
    }) // step 2
    act(() => {
      result.current.next()
    }) // finishes
    expect(result.current.active).toBe(false)
    expect(localStorage.getItem(STORAGE_KEY)).toBe('done')
  })

  it('totalSteps returns 3', () => {
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.totalSteps).toBe(3)
  })
})
