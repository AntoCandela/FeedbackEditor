import { describe, it, expect } from 'vitest'
import { formatRelativeTime } from '../../src/history/formatRelativeTime'

describe('formatRelativeTime', () => {
  it('returns "just now" for timestamps less than 60 seconds ago', () => {
    expect(formatRelativeTime(Date.now())).toBe('just now')
    expect(formatRelativeTime(Date.now() - 30_000)).toBe('just now')
  })

  it('returns minutes for timestamps 1-59 minutes ago', () => {
    expect(formatRelativeTime(Date.now() - 60_000)).toBe('1 min ago')
    expect(formatRelativeTime(Date.now() - 5 * 60_000)).toBe('5 min ago')
    expect(formatRelativeTime(Date.now() - 59 * 60_000)).toBe('59 min ago')
  })

  it('returns hours for timestamps 1-23 hours ago', () => {
    expect(formatRelativeTime(Date.now() - 60 * 60_000)).toBe('1h ago')
    expect(formatRelativeTime(Date.now() - 12 * 60 * 60_000)).toBe('12h ago')
    expect(formatRelativeTime(Date.now() - 23 * 60 * 60_000)).toBe('23h ago')
  })

  it('returns days for timestamps 24+ hours ago', () => {
    expect(formatRelativeTime(Date.now() - 24 * 60 * 60_000)).toBe('1d ago')
    expect(formatRelativeTime(Date.now() - 7 * 24 * 60 * 60_000)).toBe('7d ago')
  })
})
