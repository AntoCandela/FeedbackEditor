import { useState, type ReactNode } from 'react'
import { ChevronDown, ChevronRight, Clipboard } from 'lucide-react'

interface CopyPreviewProps {
  markdown: string
  onCopy: () => void
  hasComments: boolean
}

/**
 * Splits text on comment delimiters and system prompts,
 * wrapping matches in highlighted spans.
 */
function highlightDelimiters(text: string): ReactNode[] {
  const pattern =
    /(\{start-comment\}|\{end-comment:[^}]*\}|\[SYSTEM:[^\]]*\])/g
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    const token = match[0]
    const isSystem = token.startsWith('[SYSTEM:')
    parts.push(
      <span
        key={match.index}
        className={
          isSystem
            ? 'bg-gray-200 text-gray-600 rounded px-0.5 muted'
            : 'bg-amber-100 text-amber-800 rounded px-0.5 amber'
        }
      >
        {token}
      </span>,
    )

    lastIndex = pattern.lastIndex
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts
}

export function CopyPreview({
  markdown,
  onCopy,
  hasComments,
}: CopyPreviewProps): ReactNode {
  const [expanded, setExpanded] = useState(false)

  if (!markdown && !hasComments) return null

  return (
    <div className="border border-[var(--border)] rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-alt)] transition-colors"
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        Preview output
      </button>

      {expanded && (
        <div className="border-t border-[var(--border)] bg-[var(--bg-surface)]">
          <pre
            className="px-3 py-2 text-xs font-mono whitespace-pre-wrap break-words overflow-auto"
            style={{ maxHeight: 200 }}
          >
            {highlightDelimiters(markdown)}
          </pre>

          <div className="flex justify-end px-3 py-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--cta-bg)] text-white hover:opacity-90 transition-opacity"
            >
              <Clipboard className="w-3.5 h-3.5" />
              Copy
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
