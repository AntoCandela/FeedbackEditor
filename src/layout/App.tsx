import { useAppEditor } from '../editor/useEditor'
import { EditorPanel } from '../editor/EditorPanel'
import { useComments } from '../comments/useComments'
import { CommentBubbleMenu } from '../editor/CommentBubbleMenu'
import { CommentSidebar } from '../comments/CommentSidebar'

const SAMPLE_MARKDOWN = `# Welcome to FeedbackEditor

Select any text and click **Add Comment** to leave feedback.

This is a simple markdown editor for annotating AI-generated text.`

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

  const handleAddComment = (selectedText: string) => {
    if (!editor) return
    const id = crypto.randomUUID()
    editor.chain().focus().setComment(id).run()
    addComment(id, '', selectedText)
    setActiveCommentId(id)
  }

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

  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <h1 className="text-lg font-semibold text-gray-800">FeedbackEditor</h1>
        <div className="flex gap-2">
          <button className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
            Paste New Text
          </button>
          <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
            Copy with Comments
          </button>
        </div>
      </header>
      <main className="flex flex-1 overflow-hidden">
        <EditorPanel editor={editor} />
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
    </div>
  )
}
