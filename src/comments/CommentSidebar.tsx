import type { Comment } from './types'
import { CommentCard } from './CommentCard'

interface CommentSidebarProps {
  comments: Comment[]
  activeCommentId: string | null
  onUpdate: (id: string, text: string) => void
  onDelete: (id: string) => void
  onClickComment: (id: string) => void
}

export function CommentSidebar({
  comments,
  activeCommentId,
  onUpdate,
  onDelete,
  onClickComment,
}: CommentSidebarProps) {
  return (
    <aside className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
      <h2 className="text-sm font-semibold text-gray-600 mb-3">
        Comments {comments.length > 0 && `(${comments.length})`}
      </h2>
      {comments.length === 0 ? (
        <p className="text-sm text-gray-400">
          Select text and click "Add Comment" to start.
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
}
