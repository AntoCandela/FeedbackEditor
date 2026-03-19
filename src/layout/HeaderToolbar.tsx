import { PanelRight, PanelRightClose, Clipboard } from 'lucide-react'

interface HeaderToolbarProps {
  onCopy: () => void
  commentCount: number
  sidebarOpen: boolean
  onToggleSidebar: () => void
  historyButton: React.ReactNode
  /** @deprecated kept for backward compat — ignored */
  copied?: boolean
  /** @deprecated kept for backward compat — ignored */
  copyError?: string | null
}

export function HeaderToolbar({
  onCopy,
  commentCount,
  sidebarOpen,
  onToggleSidebar,
  historyButton,
}: HeaderToolbarProps) {
  return (
    <header
      className="flex items-center justify-between px-6 py-3 border-b"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--bg-surface)',
      }}
    >
      {/* Left: title + comment badge */}
      <div className="flex items-center gap-3">
        <h1
          className="text-lg font-bold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}
        >
          FeedbackEditor
        </h1>
        {commentCount > 0 && (
          <span
            className="inline-flex items-center justify-center text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'var(--comment-bg)',
              color: 'var(--text-primary)',
            }}
          >
            {commentCount}
          </span>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2">
        {/* Sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          aria-expanded={sidebarOpen}
          aria-label="Toggle comment sidebar"
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded border transition-colors duration-150 ease-out"
          style={{
            background: 'transparent',
            borderColor: 'var(--border)',
            color: 'var(--text-secondary)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--text-tertiary)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)'
          }}
        >
          {sidebarOpen ? <PanelRightClose size={16} /> : <PanelRight size={16} />}
        </button>

        {/* History button slot */}
        {historyButton}

        {/* Copy button (CTA) */}
        <button
          onClick={onCopy}
          data-testid="copy-button"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded transition-colors duration-150 ease-out"
          style={{
            backgroundColor: 'var(--cta-bg)',
            color: 'var(--cta-text)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.opacity = '0.85'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          <Clipboard size={16} />
          <span>Copy</span>
          <kbd
            className="ml-1 text-xs opacity-60 font-mono"
          >
            &#x2318;&#x21A9;
          </kbd>
        </button>
      </div>
    </header>
  )
}
