import { createContext } from 'react'
import type { ToastType } from './types'

export interface ToastContextValue {
  showToast: (message: string, type: ToastType, duration?: number) => string
}

export const ToastContext = createContext<ToastContextValue | null>(null)
