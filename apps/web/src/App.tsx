function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent mb-8">
        AI CFO Dashboard
      </h1>
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 backdrop-blur-xl shadow-2xl max-w-md w-full">
        <p className="text-slate-400 mb-4">
          Welcome to your AI-powered financial officer. Your insights are being prepared.
        </p>
        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
          <div className="h-full w-1/3 bg-blue-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}

export default App
