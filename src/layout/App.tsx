import { useAppEditor } from '../editor/useEditor'
import { EditorPanel } from '../editor/EditorPanel'
import { useComments } from '../comments/useComments'
import { CommentBubbleMenu } from '../editor/CommentBubbleMenu'

const SAMPLE_MARKDOWN = `# Welcome to FeedbackEditor

Select any text and click **Add Comment** to leave feedback.

This is a simple markdown editor for annotating AI-generated text.`

export default function App() {
  const editor = useAppEditor(SAMPLE_MARKDOWN)
  const {
    comments: _comments,
    addComment,
    updateComment: _updateComment,
    deleteComment: _deleteComment,
    clearComments: _clearComments,
    activeCommentId: _activeCommentId,
    setActiveCommentId,
  } = useComments()

  const handleAddComment = (selectedText: string) => {
    if (!editor) return
    const id = crypto.randomUUID()
    editor.chain().focus().setComment(id).run()
    addComment(id, '', selectedText)
    setActiveCommentId(id)
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
        <aside className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
          <p className="text-gray-400">Sidebar will go here</p>
        </aside>
      </main>
    </div>
  )
}
