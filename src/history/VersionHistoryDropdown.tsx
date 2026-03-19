import { Clipboard, ClipboardPaste, X } from 'lucide-react'
import type { Version } from './types'
import { formatRelativeTime } from './formatRelativeTime'

interface VersionHistoryDropdownProps {
  versions: Version[]
  onSelect: (id: string) => void
  onClear: () => void
  onClose: () => void
}

export function VersionHistoryDropdown({ versions, onSelect, onClear, onClose }: VersionHistoryDropdownProps) {
  const handleClear = () => {
    if (confirm('Clear all version history? This cannot be undone.')) {
      onClear()
    }
  }

  return (
    <div className="absolute top-full right-0 mt-1 w-96 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-700">
          Version History {versions.length > 0 && `(${versions.length})`}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-sm p-1"
        >
          <X size={14} />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {versions.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">
            No versions saved yet. Versions are created when you copy or paste.
          </p>
        ) : (
          versions.map(version => (
            <button
              key={version.id}
              onClick={() => onSelect(version.id)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-50 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {version.trigger === 'copy'
                    ? <Clipboard size={14} style={{ color: 'var(--text-secondary)' }} />
                    : <ClipboardPaste size={14} style={{ color: 'var(--text-secondary)' }} />
                  }
                </span>
                <span className="text-sm text-gray-700">
                  {version.trigger === 'copy' ? 'Copied' : 'Pasted'}
                </span>
                <span className="text-xs text-gray-400">
                  — {formatRelativeTime(version.timestamp)}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5 ml-6">
                {version.comments.length} comment{version.comments.length !== 1 ? 's' : ''}
              </p>
            </button>
          ))
        )}
      </div>
      {versions.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-100">
          <button
            onClick={handleClear}
            className="text-xs text-gray-400 hover:text-red-600"
          >
            Clear History
          </button>
        </div>
      )}
    </div>
  )
}
