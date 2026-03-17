import { useState, useCallback } from 'react'

interface CopyState {
  copied: boolean
  error: string | null
  fallbackText: string | null
}

export function useCopyToClipboard() {
  const [state, setState] = useState<CopyState>({ copied: false, error: null, fallbackText: null })

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setState({ copied: true, error: null, fallbackText: null })
      setTimeout(() => setState({ copied: false, error: null, fallbackText: null }), 2000)
    } catch {
      setState({ copied: false, error: 'Clipboard access denied. Copy from below.', fallbackText: text })
    }
  }, [])

  const clearFallback = useCallback(() => {
    setState({ copied: false, error: null, fallbackText: null })
  }, [])

  return { ...state, copy, clearFallback }
}
