import { useState, useCallback, useRef, useEffect } from 'react'
import { useApi } from '../hooks/useApi'
import LoadingSpinner from './ui/LoadingSpinner'

// ── Grammar Tooltip ────────────────────────────────────────────────────────
function GrammarTooltip({ error, position, onClose }) {
  if (!error || !position) return null
  const { x, y } = position

  // Keep tooltip inside viewport
  const style = {
    left:  Math.min(x, window.innerWidth  - 330) + 'px',
    top:   (y + 12) + 'px',
  }

  return (
    <div className="grammar-tooltip glass-card" style={style}>
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/30 flex items-center justify-center mt-0.5">
          <svg className="w-3.5 h-3.5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold text-rose-400 line-through">{error.word}</span>
            <span className="text-xs text-slate-500">→</span>
            <span className="text-xs font-semibold text-emerald-400">{error.suggestion}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{error.reason}</p>
        </div>
      </div>
    </div>
  )
}

// ── Highlighted Text ───────────────────────────────────────────────────────
function AnnotatedText({ text, errors, onHover, onLeave }) {
  if (!text || !errors || errors.length === 0) {
    return <span className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{text}</span>
  }

  // Sort errors by index
  const sorted = [...errors].sort((a, b) => a.index - b.index)
  const segments = []
  let cursor = 0

  for (const err of sorted) {
    const start = err.index
    const end   = err.index + err.length
    if (start > cursor) segments.push({ type: 'text', content: text.slice(cursor, start) })
    if (start >= 0 && end <= text.length) {
      segments.push({ type: 'error', content: text.slice(start, end), error: err })
    }
    cursor = Math.max(cursor, end)
  }
  if (cursor < text.length) segments.push({ type: 'text', content: text.slice(cursor) })

  return (
    <span className="text-sm leading-relaxed whitespace-pre-wrap">
      {segments.map((seg, i) =>
        seg.type === 'error' ? (
          <span
            key={i}
            className="grammar-error text-slate-200"
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect()
              onHover(seg.error, { x: rect.left, y: rect.bottom })
            }}
            onMouseLeave={onLeave}
          >
            {seg.content}
          </span>
        ) : (
          <span key={i} className="text-slate-200">{seg.content}</span>
        )
      )}
    </span>
  )
}

export default function GrammarChecker() {
  const [inputText,    setInputText]    = useState('')
  const [result,       setResult]       = useState(null)
  const [tooltip,      setTooltip]      = useState({ error: null, pos: null })
  const [copiedFix,    setCopiedFix]    = useState(false)
  const { call, loading, error }        = useApi()

  const handleSubmit = async () => {
    if (!inputText.trim()) return
    const data = await call('/grammar-check', { text: inputText })
    if (data) setResult(data)
  }

  const handleCopyFixed = () => {
    if (!result) return
    navigator.clipboard.writeText(result.corrected_text)
    setCopiedFix(true)
    setTimeout(() => setCopiedFix(false), 2000)
  }

  return (
    <div className="page-enter flex flex-col gap-6 max-w-4xl mx-auto w-full">
      {/* Tooltip (portal-like fixed positioning) */}
      {tooltip.error && (
        <GrammarTooltip error={tooltip.error} position={tooltip.pos} />
      )}

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Grammar Checker</h2>
        <p className="text-sm text-slate-400 mt-0.5">Detect and fix grammatical errors with explanations</p>
      </div>

      {/* Input */}
      <div className="glass-card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-moonDust-light">Your Text</h3>
          <span className="text-xs text-slate-500">
            {inputText.trim() ? inputText.trim().split(/\s+/).length : 0} words
          </span>
        </div>
        <textarea
          className="glass-input min-h-[150px] text-sm leading-relaxed"
          placeholder="Paste or type the text you want to grammar check…"
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
              Analyzing…
            </span>
          ) : 'Check Grammar'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="glass-card py-12 flex justify-center">
          <LoadingSpinner size="lg" text="Analyzing grammar and style…" />
        </div>
      )}

      {/* API Error */}
      {error && (
        <div className="glass rounded-xl p-4 border border-rose-500/30 bg-rose-500/10">
          <p className="text-rose-400 text-sm">⚠ {error}</p>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="flex flex-col gap-5 animate-fadeInUp">
          {/* Error count banner */}
          <div className={`glass rounded-xl px-5 py-3.5 flex items-center gap-4
            ${result.errors.length === 0
              ? 'border border-emerald-500/30 bg-emerald-500/5'
              : 'border border-rose-500/30 bg-rose-500/5'
            }`}>
            {result.errors.length === 0 ? (
              <>
                <span className="text-emerald-400 text-xl">✓</span>
                <div>
                  <p className="text-emerald-400 font-semibold text-sm">No errors found!</p>
                  <p className="text-emerald-400/60 text-xs">Your text is grammatically correct.</p>
                </div>
              </>
            ) : (
              <>
                <span className="text-rose-400 text-xl">⚠</span>
                <div>
                  <p className="text-rose-400 font-semibold text-sm">
                    {result.errors.length} issue{result.errors.length !== 1 ? 's' : ''} found
                  </p>
                  <p className="text-rose-400/60 text-xs">Hover over underlined words for suggestions</p>
                </div>
              </>
            )}
          </div>

          {/* Interactive annotated view */}
          {result.errors.length > 0 && (
            <div className="glass-card">
              <h3 className="text-sm font-semibold text-moonDust-light mb-4">
                Interactive View
                <span className="ml-2 text-xs text-slate-500 font-normal">(hover underlined words)</span>
              </h3>
              <div className="p-4 glass rounded-xl leading-8">
                <AnnotatedText
                  text={inputText}
                  errors={result.errors}
                  onHover={(err, pos) => setTooltip({ error: err, pos })}
                  onLeave={() => setTooltip({ error: null, pos: null })}
                />
              </div>

              {/* Error list below */}
              <div className="mt-4 flex flex-col gap-2">
                {result.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-3 glass rounded-xl p-3 animate-fadeInUp"
                       style={{ animationDelay: `${i * 50}ms` }}>
                    <span className="shrink-0 text-xs text-slate-500 font-mono w-5 text-right mt-0.5">{i+1}.</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold text-rose-400 line-through bg-rose-500/10 px-2 py-0.5 rounded">{err.word}</span>
                        <span className="text-slate-500 text-xs">→</span>
                        <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">{err.suggestion}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 leading-relaxed">{err.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Corrected text */}
          <div className="glass-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-emerald-500/20">
                  <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-white">Corrected Version</h3>
              </div>
              <button
                onClick={handleCopyFixed}
                className="text-xs px-3 py-1.5 rounded-lg glass-btn-primary"
              >
                {copiedFix ? '✓ Copied!' : '📋 Copy to Clipboard'}
              </button>
            </div>
            <div className="glass rounded-xl p-4">
              <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{result.corrected_text}</p>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="glass-card flex flex-col items-center justify-center py-16 text-slate-600 gap-4">
          <svg className="w-14 h-14 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
          </svg>
          <div className="text-center">
            <p className="text-sm font-medium">No analysis yet</p>
            <p className="text-xs text-slate-700 mt-1">Enter your text above and click Check Grammar</p>
          </div>
        </div>
      )}
    </div>
  )
}
