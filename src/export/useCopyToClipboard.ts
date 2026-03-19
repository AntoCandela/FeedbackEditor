import { useCallback } from 'react'

export function useCopyToClipboard() {
  const copy = useCallback(async (text: string) => {
    await navigator.clipboard.writeText(text)
  }, [])

  return { copy }
}
