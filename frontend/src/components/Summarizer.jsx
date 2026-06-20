import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import LoadingSpinner from './ui/LoadingSpinner'

export default function Summarizer() {
  const [inputText, setInputText] = useState('')
  const [result,    setResult]    = useState(null)
  const [copied,    setCopied]    = useState(false)
  const { call, loading, error }  = useApi()

  const handleSubmit = async () => {
    if (!inputText.trim()) return
    const data = await call('/summarize', { text: inputText })
    if (data) setResult(data)
  }

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="page-enter flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Summarizer</h2>
        <p className="text-sm text-slate-400 mt-0.5">Extract the essence from long-form content</p>
      </div>

      {/* Input area */}
      <div className="glass-card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-moonDust-light">Paste your content</h3>
          <span className="text-xs text-slate-500">
            {inputText.trim() ? inputText.trim().split(/\s+/).length : 0} words
          </span>
        </div>
        <textarea
          className="glass-input min-h-[180px] text-sm leading-relaxed"
          placeholder="Paste a long article, report, essay, or any text you want to summarize…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          spellCheck={false}
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !inputText.trim()}
          className="glass-btn-primary self-end px-8 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Summarizing…
            </span>
          ) : 'Generate Summary'}
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="glass-card flex items-center justify-center py-12">
          <LoadingSpinner size="lg" text="Analyzing and summarizing your text…" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="glass rounded-xl p-4 border border-rose-500/30 bg-rose-500/10 animate-fadeInUp">
          <p className="text-rose-400 text-sm">⚠ {error}</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="flex flex-col gap-5 animate-fadeInUp">
          {/* Executive Summary */}
          <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                     style={{ background: 'linear-gradient(135deg, rgba(128,168,255,0.3), rgba(206,181,255,0.3))' }}>
                  <svg className="w-4 h-4 text-moonDust-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-white">Executive Summary</h3>
              </div>
              <button
                onClick={() => handleCopy(result.executive_summary)}
                className="text-xs px-3 py-1 rounded-lg border border-white/10 text-slate-400 hover:text-white transition-all"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">{result.executive_summary}</p>
          </div>

          {/* Key Takeaways */}
          <div
            className="rounded-2xl p-6 relative overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid transparent',
              backgroundImage: `
                linear-gradient(rgba(11,12,22,0.9), rgba(11,12,22,0.9)),
                linear-gradient(135deg, #D3D3FF, #CEB5FF, #8EC1DE, #80A8FF)
              `,
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
            }}
          >
            {/* Subtle corner glow */}
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 pointer-events-none"
                 style={{ background: 'radial-gradient(circle, #80A8FF, transparent)', transform: 'translate(40%, -40%)' }} />

            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, rgba(206,181,255,0.3), rgba(142,193,222,0.3))' }}>
                <svg className="w-4 h-4 text-moonDust-violet" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="font-semibold text-white">Key Takeaways</h3>
              <span className="ml-auto text-xs text-slate-500 border border-white/10 px-2 py-0.5 rounded-full">
                {result.key_takeaways.length} points
              </span>
            </div>

            <ul className="flex flex-col gap-3">
              {result.key_takeaways.map((point, i) => (
                <li key={i} className="flex items-start gap-3 animate-fadeInUp" style={{ animationDelay: `${i * 60}ms` }}>
                  <span
                    className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5"
                    style={{ background: 'linear-gradient(135deg, #80A8FF, #CEB5FF)' }}
                  >
                    {i + 1}
                  </span>
                  <span className="text-slate-200 text-sm leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-slate-600 gap-4">
          <svg className="w-14 h-14 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
          </svg>
          <div className="text-center">
            <p className="text-sm font-medium">No summary yet</p>
            <p className="text-xs text-slate-700 mt-1">Paste your content above and click Generate Summary</p>
          </div>
        </div>
      )}
    </div>
  )
}
