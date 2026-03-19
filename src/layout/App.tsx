import { useState, useEffect, useCallback, useRef, type RefObject } from 'react'
import { Clock } from 'lucide-react'
import { useKeyboardShortcuts } from '../editor/useKeyboardShortcuts'
import { useAppEditor } from '../editor/useEditor'
import { EditorPanel } from '../editor/EditorPanel'
import { useComments } from '../comments/useComments'
import type { Comment } from '../comments/types'
import { CommentBubbleMenu } from '../editor/CommentBubbleMenu'
import { CommentSidebar } from '../comments/CommentSidebar'
import { HeaderToolbar } from './HeaderToolbar'
import { serializeMarkdown } from '../export/serializeMarkdown'
import { useCopyToClipboard } from '../export/useCopyToClipboard'
import { getMarkdown } from '../editor/getMarkdown'
import { useVersionHistory } from '../history/useVersionHistory'
import { VersionHistoryDropdown } from '../history/VersionHistoryDropdown'
import { useToast } from '../toast/useToastContext'
import { CopyPreview } from '../export/CopyPreview'
import { OnboardingOverlay } from '../onboarding/OnboardingOverlay'

const SAMPLE_MARKDOWN = `# Welcome to FeedbackEditor

Paste your AI-generated text here and select any text to add comments.`

const SIDEBAR_KEY = 'feedbackeditor-sidebar:v1'

export default function App() {
  const {
    comments,
    addComment,
    updateComment,
    deleteComment,
    clearComments,
    activeCommentId,
    setActiveCommentId,
  } = useComments()

  const { copy } = useCopyToClipboard()
  const { versions, saveVersion, loadVersion, clearHistory } = useVersionHistory()
  const [showHistory, setShowHistory] = useState(false)
  const pendingCommentRef = useRef<string | null>(null)
  const commentsRef: RefObject<Comment[]> = useRef(comments)
  useEffect(() => { commentsRef.current = comments }, [comments])

  const { showToast } = useToast()

  // Sidebar state with localStorage persistence
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    try { return localStorage.getItem(SIDEBAR_KEY) !== 'closed' } catch { return true }
  })
  const toggleSidebar = () => {
    setSidebarOpen(prev => {
      const next = !prev
      try { localStorage.setItem(SIDEBAR_KEY, next ? 'open' : 'closed') } catch { /* noop */ }
      return next
    })
  }

  // Mobile detection for overlay sidebar
  const [isMobile, setIsMobile] = useState(
    () => window.matchMedia('(max-width: 767px)').matches,
  )
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)')
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  // Paste detection with ref to break circular dependency with editor
  const pasteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handlePasteRef = useRef<() => void>(() => {})

  const editor = useAppEditor({
    content: SAMPLE_MARKDOWN,
    onPaste: () => handlePasteRef.current(),
  })

  useEffect(() => {
    handlePasteRef.current = () => {
      if (pasteTimerRef.current) clearTimeout(pasteTimerRef.current)
      pasteTimerRef.current = setTimeout(() => {
        if (!editor) return
        const markdown = getMarkdown(editor)
        saveVersion(markdown, commentsRef.current, 'paste')
        showToast('Content saved to history', 'info')
      }, 500)
    }
  }, [editor, saveVersion, showToast])

  const handleAddComment = useCallback((selectedText: string) => {
    if (!editor) return
    const id = crypto.randomUUID()
    const { to } = editor.state.selection
    // Apply comment mark, then collapse selection to end so bubble menu dismisses
    editor.chain().setComment(id).setTextSelection(to).run()
    addComment(id, '', selectedText)
    pendingCommentRef.current = id
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

  const handleRevert = (id: string) => {
    const version = loadVersion(id)
    if (!version || !editor) return
    const currentMarkdown = getMarkdown(editor)
    const latestVersion = versions[0]
    if (!latestVersion || latestVersion.markdown !== currentMarkdown) {
      saveVersion(currentMarkdown, comments, 'copy')
    }
    editor.commands.setContent(version.markdown)
    clearComments()
    version.comments.forEach(c => addComment(c.id, c.text, c.highlightedText))
    setShowHistory(false)
    showToast('Version restored', 'info')
  }

  // Highlight active comment in editor + scroll sidebar card into view
  useEffect(() => {
    const container = document.querySelector('.ProseMirror')
    if (container) {
      container.querySelectorAll('.comment-highlight').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-comment-id') === activeCommentId)
      })
    }
    if (activeCommentId) {
      document.getElementById(`comment-card-${activeCommentId}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeCommentId])

  // Clean up orphan comments when editor content changes
  useEffect(() => {
    if (!editor) return

    let debounceTimer: ReturnType<typeof setTimeout>
    const handler = () => {
      clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        if (pendingCommentRef.current) return

        const editorIds = new Set<string>()
        editor.state.doc.descendants((node) => {
          node.marks?.forEach(mark => {
            if (mark.type.name === 'comment' && mark.attrs.commentId) {
              editorIds.add(mark.attrs.commentId as string)
            }
          })
        })

        for (const comment of commentsRef.current) {
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
  }, [editor, deleteComment])

  const handleCopy = async () => {
    if (!editor) return
    const currentMarkdown = getMarkdown(editor)
    saveVersion(currentMarkdown, comments, 'copy')
    const markdown = serializeMarkdown(editor.getJSON(), comments)
    try {
      await copy(markdown)
      showToast('Copied to clipboard', 'success')
    } catch {
      showToast('Clipboard access denied', 'error')
    }
  }

  const previewMarkdown = editor ? serializeMarkdown(editor.getJSON(), comments) : ''

  useKeyboardShortcuts({
    editor,
    onCopy: handleCopy,
    onAddComment: handleAddComment,
    versions,
    onRevert: handleRevert,
    comments,
  })

  return (
    <div className="flex flex-col h-screen">
      <HeaderToolbar
        onCopy={handleCopy}
        commentCount={comments.length}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
        historyButton={
          <div className="relative">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded border transition-colors duration-150"
              style={{ background: 'transparent', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              <Clock size={16} />
              <span className="header-label">History</span>
              {versions.length > 0 && (
                <span className="text-xs opacity-60">({versions.length})</span>
              )}
            </button>
            {showHistory && (
              <VersionHistoryDropdown
                versions={versions}
                onSelect={handleRevert}
                onClear={clearHistory}
                onClose={() => setShowHistory(false)}
              />
            )}
          </div>
        }
      />
      <CopyPreview markdown={previewMarkdown} onCopy={handleCopy} hasComments={comments.length > 0} />
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
          open={sidebarOpen}
          overlay={isMobile}
          onClose={() => setSidebarOpen(false)}
        />
      </main>
      <OnboardingOverlay />
    </div>
  )
}
