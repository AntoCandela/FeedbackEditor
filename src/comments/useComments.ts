import { useState, useCallback } from 'react'
import type { Comment } from './types'

export function useComments() {
  const [comments, setComments] = useState<Comment[]>([])
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null)

  const addComment = useCallback((id: string, text: string, highlightedText: string) => {
    setComments(prev => [...prev, { id, text, highlightedText, createdAt: Date.now() }])
  }, [])

  const updateComment = useCallback((id: string, text: string) => {
    setComments(prev => prev.map(c => c.id === id ? { ...c, text } : c))
  }, [])

  const deleteComment = useCallback((id: string) => {
    setComments(prev => prev.filter(c => c.id !== id))
    setActiveCommentId(prev => prev === id ? null : prev)
  }, [])

  const clearComments = useCallback(() => {
    setComments([])
    setActiveCommentId(null)
  }, [])

  return {
    comments,
    addComment,
    updateComment,
    deleteComment,
    clearComments,
    activeCommentId,
    setActiveCommentId,
  }
}
