import { useState, useEffect, useRef } from 'react'
import { Pencil, X } from 'lucide-react'
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
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      const timer = setTimeout(() => inputRef.current?.focus(), 100)
      return () => clearTimeout(timer)
    }
  }, [isEditing])

  const handleSave = () => {
    onUpdate(comment.id, draft)
    setIsEditing(false)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger sidebar-to-editor navigation when interacting inside the card's content area
    const target = e.target as HTMLElement
    // Only navigate to editor highlight when clicking the card background/header, not content
    if (target.closest('textarea') || target.closest('button')) return
    onClick(comment.id)
  }

  const handleBlur = (e: React.FocusEvent) => {
    // Only save if focus is leaving the card entirely, not moving within it
    if (cardRef.current?.contains(e.relatedTarget as Node)) return
    handleSave()
  }

  return (
    <div
      ref={cardRef}
      id={`comment-card-${comment.id}`}
      onClick={handleCardClick}
      className={`comment-card p-3 mb-2 rounded cursor-pointer transition-all duration-150 ease-out ${
        isActive
          ? 'border-l-4 border-l-[var(--accent)] border-t border-r border-b border-t-[var(--border)] border-r-[var(--border)] border-b-[var(--border)]'
          : 'border border-[var(--border)] hover:border-[var(--text-tertiary)]'
      }`}
      style={{
        backgroundColor: isActive ? 'var(--bg-surface-alt)' : 'var(--bg-surface)',
      }}
    >
      <p
        className="text-xs mb-1 truncate italic"
        style={{ color: 'var(--text-tertiary)' }}
      >
        &ldquo;{comment.highlightedText}&rdquo;
      </p>
      {isEditing ? (
        <textarea
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSave() } }}
          className="w-full text-sm p-1 border rounded resize-none focus:outline-none"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
          rows={2}
          placeholder="Type your feedback..."
        />
      ) : (
        <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
          {comment.text || <span style={{ color: 'var(--text-tertiary)' }}>No feedback yet</span>}
        </p>
      )}
      <div className="flex justify-end gap-1 mt-1">
        {!isEditing && (
          <button
            onClick={e => { e.stopPropagation(); setIsEditing(true) }}
            className="flex items-center gap-1 text-xs p-1 transition-colors duration-150 ease-out hover:text-[var(--accent)]"
            style={{ color: 'var(--text-tertiary)' }}
            title="Edit"
          >
            <Pencil size={14} />
            <span>edit</span>
          </button>
        )}
        <button
          onClick={e => { e.stopPropagation(); onDelete(comment.id) }}
          className="flex items-center gap-1 text-xs p-1 transition-colors duration-150 ease-out hover:text-[var(--danger)]"
          style={{ color: 'var(--text-tertiary)' }}
          title="Delete"
        >
          <X size={14} />
          <span>delete</span>
        </button>
      </div>
    </div>
  )
}
