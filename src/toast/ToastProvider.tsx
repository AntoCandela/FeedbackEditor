import type { ReactNode } from 'react'
import { useToastState } from './useToast'
import { ToastContainer } from './ToastContainer'
import { ToastContext } from './ToastContext'

export function ToastProvider({ children }: { children: ReactNode }) {
  const { toasts, show, dismiss } = useToastState()

  return (
    <ToastContext.Provider value={{ showToast: show }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}
