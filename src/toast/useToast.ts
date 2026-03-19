import { useState, useCallback, useRef } from 'react'
import type { Toast, ToastType } from './types'

const MAX_TOASTS = 3

export function useToastState() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: string) => {
    const timer = timers.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timers.current.delete(id)
    }
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const show = useCallback((message: string, type: ToastType, duration?: number) => {
    const id = crypto.randomUUID()
    const toast: Toast = { id, message, type, duration }

    setToasts(prev => {
      const next = [toast, ...prev]
      // If we exceed max, drop oldest (last in array)
      if (next.length > MAX_TOASTS) {
        const removed = next.slice(MAX_TOASTS)
        for (const t of removed) {
          const timer = timers.current.get(t.id)
          if (timer) {
            clearTimeout(timer)
            timers.current.delete(t.id)
          }
        }
        return next.slice(0, MAX_TOASTS)
      }
      return next
    })

    // Auto-dismiss: info/success default to 3000ms, error has no auto-dismiss
    const autoDuration = duration ?? (type === 'error' ? undefined : 3000)
    if (autoDuration != null) {
      const timer = setTimeout(() => {
        timers.current.delete(id)
        setToasts(prev => prev.filter(t => t.id !== id))
      }, autoDuration)
      timers.current.set(id, timer)
    }

    return id
  }, [])

  return { toasts, show, dismiss }
}
