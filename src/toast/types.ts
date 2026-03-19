export type ToastType = 'success' | 'info' | 'error'

export interface Toast {
  id: string
  message: string
  type: ToastType
  duration?: number
}
