import { useState, useCallback, useImperativeHandle, forwardRef } from 'react'
import type { SlashCommandItem } from './items'

export interface SlashCommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean
}

interface SlashCommandListProps {
  items: SlashCommandItem[]
  command: (item: SlashCommandItem) => void
}

export const SlashCommandList = forwardRef<SlashCommandListRef, SlashCommandListProps>(
  function SlashCommandList({ items, command }, ref) {
    const [selectedIndex, setSelectedIndex] = useState(0)
    const [prevItems, setPrevItems] = useState(items)
    if (items !== prevItems) {
      setPrevItems(items)
      setSelectedIndex(0)
    }

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index]
        if (item) command(item)
      },
      [items, command],
    )

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
          return true
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((prev) => (prev + 1) % items.length)
          return true
        }
        if (event.key === 'Enter') {
          selectItem(selectedIndex)
          return true
        }
        return false
      },
    }))

    if (items.length === 0) {
      return (
        <div
          className="rounded-lg border shadow-lg p-3 text-sm"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)', color: 'var(--text-tertiary)' }}
        >
          No matching commands
        </div>
      )
    }

    return (
      <div
        className="rounded-lg border shadow-lg overflow-hidden py-1 w-64"
        style={{ background: 'var(--bg-surface)', borderColor: 'var(--border)' }}
      >
        {items.map((item, index) => {
          const Icon = item.icon
          const isSelected = index === selectedIndex
          return (
            <button
              key={item.title}
              onClick={() => selectItem(index)}
              onMouseEnter={() => setSelectedIndex(index)}
              className="flex items-center gap-3 w-full px-3 py-2 text-left transition-colors"
              style={{
                background: isSelected ? 'var(--bg-surface-alt)' : 'transparent',
              }}
            >
              <div
                className="flex items-center justify-center w-8 h-8 rounded-md border"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                <Icon size={16} />
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {item.title}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                  {item.description}
                </div>
              </div>
            </button>
          )
        })}
      </div>
    )
  },
)
