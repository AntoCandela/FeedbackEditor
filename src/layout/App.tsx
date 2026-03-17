import { useState, useEffect } from 'react'
import { useAppEditor } from '../editor/useEditor'
import { EditorPanel } from '../editor/EditorPanel'
import { useComments } from '../comments/useComments'
import { CommentBubbleMenu } from '../editor/CommentBubbleMenu'
import { CommentSidebar } from '../comments/CommentSidebar'
import { HeaderToolbar } from './HeaderToolbar'
import { serializeMarkdown } from '../export/serializeMarkdown'
import { parseMarkdown } from '../export/parseMarkdown'
import { useCopyToClipboard } from '../export/useCopyToClipboard'

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
    clearComments,
    activeCommentId,
    setActiveCommentId,
  } = useComments()

  const { copied, error: copyError, copy, fallbackText, clearFallback } = useCopyToClipboard()
  const [showPasteModal, setShowPasteModal] = useState(false)
  const [pasteText, setPasteText] = useState('')

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

  const handleCopy = () => {
    if (!editor) return
    const markdown = serializeMarkdown(editor.getJSON(), comments)
    copy(markdown)
  }

  const handlePasteClick = () => {
    if (comments.length > 0) {
      const confirmed = confirm(`You have ${comments.length} comments. Pasting new text will remove them. Continue?`)
      if (!confirmed) return
    }
    setPasteText('')
    setShowPasteModal(true)
  }

  const handlePasteConfirm = () => {
    if (!editor || !pasteText.trim()) return
    const result = parseMarkdown(pasteText)
    clearComments()
    editor.commands.setContent(result.html)
    result.comments.forEach(c => addComment(c.id, c.text, c.highlightedText))
    setShowPasteModal(false)
  }

  return (
    <div className="flex flex-col h-screen">
      <HeaderToolbar
        onCopy={handleCopy}
        onPaste={handlePasteClick}
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

      {showPasteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[600px] max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-semibold mb-3">Paste New Text</h3>
            <textarea
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              className="flex-1 min-h-[300px] p-3 border border-gray-300 rounded font-mono text-sm resize-none focus:outline-none focus:border-blue-400"
              placeholder="Paste your markdown here..."
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowPasteModal(false)} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">Cancel</button>
              <button onClick={handlePasteConfirm} className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Import</button>
            </div>
          </div>
        </div>
      )}

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
