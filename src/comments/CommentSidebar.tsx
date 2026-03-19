import type { Comment } from './types'
import { CommentCard } from './CommentCard'

interface CommentSidebarProps {
  comments: Comment[]
  activeCommentId: string | null
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
  onClickComment: (id: string) => void
  open?: boolean
  overlay?: boolean
  onClose?: () => void
}

export function CommentSidebar({
  comments,
  activeCommentId,
  onUpdate,
  onDelete,
  onClickComment,
  open = true,
  overlay = false,
  onClose,
}: CommentSidebarProps) {
  if (!open && !overlay) return null
  if (overlay && !open) return null

  const sidebarContent = (
    <aside
      className={`w-80 p-4 overflow-y-auto border-l ${overlay && open ? 'sidebar-slide-in fixed top-0 right-0 bottom-0 z-50' : 'sidebar-collapsible'}`}
      style={{
        borderColor: 'var(--border)',
        background: 'var(--bg-surface-alt)',
      }}
    >
      <h2
        className="text-sm font-semibold mb-3"
        style={{ color: 'var(--text-secondary)' }}
      >
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>
      {comments.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Select text and click &ldquo;Add Comment&rdquo; to start.
        </p>
      ) : (
        comments.map(comment => (
          <CommentCard
            key={comment.id}
            comment={comment}
            isActive={comment.id === activeCommentId}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onClick={onClickComment}
          />
        ))
      )}
    </aside>
  )

  if (overlay && open) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
        {sidebarContent}
      </>
    )
  }

  return sidebarContent
}
