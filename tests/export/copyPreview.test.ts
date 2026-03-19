import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { createElement } from 'react'
import { CopyPreview } from '../../src/export/CopyPreview'

function renderPreview(props: {
  markdown: string
  onCopy: () => void
  hasComments: boolean
}) {
  return render(createElement(CopyPreview, props))
}

describe('CopyPreview', () => {
  it('renders nothing when markdown is empty and hasComments is false', () => {
    const { container } = renderPreview({
      markdown: '',
      onCopy: vi.fn(),
      hasComments: false,
    })
    expect(container.innerHTML).toBe('')
  })

  it('renders "Preview output" toggle button', () => {
    renderPreview({ markdown: 'hello', onCopy: vi.fn(), hasComments: true })
    expect(screen.getByRole('button', { name: /preview output/i })).toBeTruthy()
  })

  it('does not show preview content when collapsed', () => {
    renderPreview({ markdown: 'hello', onCopy: vi.fn(), hasComments: true })
    expect(screen.queryByText('hello')).toBeNull()
  })

  it('shows preview content when toggle clicked', () => {
    renderPreview({ markdown: 'hello world', onCopy: vi.fn(), hasComments: true })
    fireEvent.click(screen.getByRole('button', { name: /preview output/i }))
    expect(screen.getByText(/hello world/)).toBeTruthy()
  })

  it('highlights {start-comment} delimiters in amber background', () => {
    renderPreview({
      markdown: 'before {start-comment} after',
      onCopy: vi.fn(),
      hasComments: true,
    })
    fireEvent.click(screen.getByRole('button', { name: /preview output/i }))
    const highlighted = screen.getByText('{start-comment}')
    expect(highlighted.tagName).toBe('SPAN')
    expect(highlighted.className).toContain('amber')
  })

  it('highlights [SYSTEM: prompt in muted background', () => {
    renderPreview({
      markdown: 'before [SYSTEM: instructions here] after',
      onCopy: vi.fn(),
      hasComments: true,
    })
    fireEvent.click(screen.getByRole('button', { name: /preview output/i }))
    const highlighted = screen.getByText(/\[SYSTEM:.*\]/)
    expect(highlighted.tagName).toBe('SPAN')
    expect(highlighted.className).toContain('muted')
  })

  it('calls onCopy when copy button inside preview is clicked', () => {
    const onCopy = vi.fn()
    renderPreview({ markdown: 'hello', onCopy, hasComments: true })
    fireEvent.click(screen.getByRole('button', { name: /preview output/i }))
    fireEvent.click(screen.getByRole('button', { name: /copy/i }))
    expect(onCopy).toHaveBeenCalledOnce()
  })
})
