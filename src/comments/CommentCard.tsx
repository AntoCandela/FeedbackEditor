import { useState, useEffect, useRef } from 'react'
import type { Comment } from './types'

interface CommentCardProps {
  comment: Comment
  isActive: boolean
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
  onClick: (id: string) => void
}

export function CommentCard({ comment, isActive, onUpdate, onDelete, onClick }: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(!comment.text)
  const [draft, setDraft] = useState(comment.text)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      // Delay focus to win the race against editor.chain().focus()
      const timer = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [isEditing])

  const handleSave = () => {
    onUpdate(comment.id, draft)
    setIsEditing(false)
  }

  return (
    <div
      id={`comment-card-${comment.id}`}
      onClick={() => onClick(comment.id)}
      className={`p-3 mb-2 rounded border cursor-pointer transition-colors ${
        isActive ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'
      }`}
    >
      <p className="text-xs text-gray-500 mb-1 truncate italic">
        "{comment.highlightedText}"
      </p>
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleSave}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() } }}
          className="w-full text-sm p-1 border border-gray-300 rounded resize-none focus:outline-none focus:border-blue-400"
          rows={2}
          placeholder="Type your feedback..."
        />
      ) : (
        <p className="text-sm text-gray-800">{comment.text || <span className="text-gray-400">No feedback yet</span>}</p>
      )}
      <div className="flex justify-end gap-1 mt-1">
        {!isEditing && (
          <button
            onClick={e => { e.stopPropagation(); setIsEditing(true) }}
            className="text-xs text-gray-400 hover:text-blue-600 p-1"
            title="Edit"
          >
            ✎
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDelete(comment.id) }}
          className="text-xs text-gray-400 hover:text-red-600 p-1"
          title="Delete"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
