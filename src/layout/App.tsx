import { useEffect, useCallback, useRef } from 'react'
import { useAppEditor } from '../editor/useEditor'
import { EditorPanel } from '../editor/EditorPanel'
import { useComments } from '../comments/useComments'
import { CommentBubbleMenu } from '../editor/CommentBubbleMenu'
import { CommentSidebar } from '../comments/CommentSidebar'
import { HeaderToolbar } from './HeaderToolbar'
import { serializeMarkdown } from '../export/serializeMarkdown'
import { useCopyToClipboard } from '../export/useCopyToClipboard'

const SAMPLE_MARKDOWN = `# Welcome to FeedbackEditor

Paste your AI-generated text here and select any text to add comments.`

export default function App() {
  const editor = useAppEditor(SAMPLE_MARKDOWN)
  const {
    comments,
    addComment,
    updateComment,
    deleteComment,
    clearComments: _clearComments,
    activeCommentId,
    setActiveCommentId,
  } = useComments()

  const { copied, error: copyError, copy, fallbackText, clearFallback } = useCopyToClipboard()
  const pendingCommentRef = useRef<string | null>(null)

  const handleAddComment = useCallback((selectedText: string) => {
    if (!editor) return
    const id = crypto.randomUUID()
    editor.chain().setComment(id).run()
    addComment(id, '', selectedText)
    pendingCommentRef.current = id
    // Delay setting active so the card renders first, then focus
    setTimeout(() => {
      setActiveCommentId(id)
      pendingCommentRef.current = null
    }, 50)
  }, [editor, addComment, setActiveCommentId])

  const handleDeleteComment = (id: string) => {
    deleteComment(id)
    if (!editor) return
    const { doc } = editor.state
    doc.descendants((node, pos) => {
      if (node.marks?.some(m => m.type.name === 'comment' && m.attrs.commentId === id)) {
        editor.chain().focus().setTextSelection({ from: pos, to: pos + node.nodeSize }).unsetMark('comment').run()
      }
    })
  }

  const handleClickSidebarComment = (id: string) => {
    setActiveCommentId(id)
    if (!editor) return
    const { doc } = editor.state
    doc.descendants((node, pos) => {
      if (node.marks?.some(m => m.type.name === 'comment' && m.attrs.commentId === id)) {
        editor.chain().focus().setTextSelection({ from: pos, to: pos + node.nodeSize }).run()
        return false
      }
    })
  }

  useEffect(() => {
    const container = document.querySelector('.ProseMirror')
    if (!container) return
    container.querySelectorAll('.comment-highlight').forEach(el => {
      el.classList.toggle('active', el.getAttribute('data-comment-id') === activeCommentId)
    })
  }, [activeCommentId])

  useEffect(() => {
    if (activeCommentId) {
      document.getElementById(`comment-card-${activeCommentId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeCommentId])

  useEffect(() => {
    if (!editor) return

    let debounceTimer: ReturnType<typeof setTimeout>
    const handler = () => {
      // Debounce to avoid interfering with in-progress comment additions
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        // Skip if a comment is being added right now
        if (pendingCommentRef.current) return

        const editorIds = new Set<string>()
        editor.state.doc.descendants((node) => {
          node.marks?.forEach(mark => {
            if (mark.type.name === 'comment' && mark.attrs.commentId) {
              editorIds.add(mark.attrs.commentId as string)
            }
          })
        })

        for (const comment of comments) {
          if (!editorIds.has(comment.id)) {
            deleteComment(comment.id)
          }
        }
      }, 300)
    }

    editor.on('update', handler)
    return () => {
      clearTimeout(debounceTimer)
      editor.off('update', handler)
    }
  }, [editor, comments, deleteComment])

  const handleCopy = () => {
    if (!editor) return
    const markdown = serializeMarkdown(editor.getJSON(), comments)
    copy(markdown)
  }

  return (
    <div className="flex flex-col h-screen">
      <HeaderToolbar
        onCopy={handleCopy}
        copied={copied}
        copyError={copyError}
        commentCount={comments.length}
      />
      <main className="flex flex-1 overflow-hidden">
        <EditorPanel
          editor={editor}
          onClickComment={(id) => setActiveCommentId(id)}
        />
        {editor && (
          <CommentBubbleMenu editor={editor} onAddComment={handleAddComment} />
        )}
        <CommentSidebar
          comments={comments}
          activeCommentId={activeCommentId}
          onUpdate={updateComment}
          onDelete={handleDeleteComment}
          onClickComment={handleClickSidebarComment}
        />
      </main>

      {fallbackText && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-semibold mb-2">Copy Manually</h3>
            <p className="text-sm text-gray-500 mb-3">Clipboard access was denied. Select all text below and copy with Ctrl+C / Cmd+C.</p>
            <textarea
              readOnly
              value={fallbackText}
              className="flex-1 min-h-[300px] p-3 border border-gray-300 rounded font-mono text-sm resize-none"
              onFocus={e => e.target.select()}
              autoFocus
            />
            <div className="flex justify-end mt-4">
              <button onClick={clearFallback} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
