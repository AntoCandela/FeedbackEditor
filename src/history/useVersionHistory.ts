import { useState, useCallback } from 'react'
import type { Comment } from '../comments/types'
import type { Version } from './types'

const STORAGE_KEY = 'feedbackeditor-versions'

function loadFromStorage(): Version[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as Version[]
  } catch {
    console.warn('FeedbackEditor: corrupt version history in localStorage, resetting.')
    return []
  }
}

function saveToStorage(versions: Version[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versions))
  } catch {
    console.warn('FeedbackEditor: localStorage full, dropping oldest versions.')
    const trimmed = versions.slice(0, Math.ceil(versions.length / 2))
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch {
      // Give up silently
    }
  }
}

export function useVersionHistory() {
  const [versions, setVersions] = useState<Version[]>(loadFromStorage)

  const saveVersion = useCallback((markdown: string, comments: Comment[], trigger: 'copy' | 'paste') => {
    const version: Version = {
      id: crypto.randomUUID(),
      markdown,
      comments: structuredClone(comments),
      timestamp: Date.now(),
      trigger,
    }
    setVersions(prev => {
      const next = [version, ...prev]
      saveToStorage(next)
      return next
    })
  }, [])

  const loadVersion = useCallback((id: string): Version | undefined => {
    return versions.find(v => v.id === id)
  }, [versions])

  const clearHistory = useCallback(() => {
    setVersions([])
    saveToStorage([])
  }, [])

  return { versions, saveVersion, loadVersion, clearHistory }
}
