import { describe, it, expect } from 'vitest'

// selectionOverlapsComment requires a real Tiptap Editor instance,
// which is heavy to set up in unit tests. We test the logic indirectly
// through the keyboard shortcuts and bubble menu behavior.
// This file tests the module's export contract.

describe('selectionUtils', () => {
  it('exports selectionOverlapsComment as a function', async () => {
    const mod = await import('../../src/editor/selectionUtils')
    expect(typeof mod.selectionOverlapsComment).toBe('function')
  })
})

describe('getMarkdown', () => {
  it('exports getMarkdown as a function', async () => {
    const mod = await import('../../src/editor/getMarkdown')
    expect(typeof mod.getMarkdown).toBe('function')
  })
})
