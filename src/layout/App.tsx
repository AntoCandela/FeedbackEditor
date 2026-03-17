export default function App() {
  return (
    <div className="flex flex-col h-screen">
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200">
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
        <div className="flex-1 p-6 overflow-y-auto">
          <p className="text-gray-400">Editor will go here</p>
        </div>
        <aside className="w-80 border-l border-gray-200 bg-gray-50 p-4 overflow-y-auto">
          <p className="text-gray-400">Sidebar will go here</p>
        </aside>
      </main>
    </div>
  )
}
