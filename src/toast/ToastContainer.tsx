import { Check, Info, AlertCircle, X } from 'lucide-react'
import type { Toast } from './types'

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

const icons = {
  success: Check,
  info: Info,
  error: AlertCircle,
} as const

const borderColors = {
  success: 'var(--success)',
  info: 'var(--accent)',
  error: 'var(--danger)',
} as const

const iconColors = {
  success: 'var(--success)',
  info: 'var(--accent)',
  error: 'var(--danger)',
} as const

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  const politeToasts = toasts.filter(t => t.type !== 'error')
  const assertiveToasts = toasts.filter(t => t.type === 'error')

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {/* Polite live region for info/success */}
      <div aria-live="polite" aria-atomic="false" className="contents">
        {politeToasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>
      {/* Assertive live region for errors */}
      <div aria-live="assertive" aria-atomic="false" className="contents">
        {assertiveToasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const Icon = icons[toast.type]

  return (
    <div
      role="status"
      className="toast-enter flex items-start gap-3 rounded-lg bg-white px-4 py-3 shadow-lg"
      style={{ borderLeft: `4px solid ${borderColors[toast.type]}` }}
    >
      <Icon size={18} style={{ color: iconColors[toast.type], flexShrink: 0, marginTop: 2 }} />
      <span className="flex-1 text-sm" style={{ color: 'var(--text-primary)' }}>
        {toast.message}
      </span>
      <button
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="flex-shrink-0 rounded p-0.5 hover:bg-gray-100"
        style={{ color: 'var(--text-tertiary)' }}
      >
        <X size={16} />
      </button>
    </div>
  )
}
