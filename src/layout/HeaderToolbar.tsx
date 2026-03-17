interface HeaderToolbarProps {
  onCopy: () => void
  copied: boolean
  copyError: string | null
  commentCount: number
}

export function HeaderToolbar({ onCopy, copied, copyError, commentCount }: HeaderToolbarProps) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
      <h1 className="text-lg font-semibold text-gray-800">FeedbackEditor</h1>
      <div className="flex items-center gap-3">
        {copied && (
          <span className="text-sm text-green-600">Copied!</span>
        )}
        {copyError && (
          <span className="text-sm text-red-600">{copyError}</span>
        )}
        <button
          onClick={onCopy}
          className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Copy with Comments {commentCount > 0 && `(${commentCount})`}
        </button>
      </div>
    </header>
  )
}
