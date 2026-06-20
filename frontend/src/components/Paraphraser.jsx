import { useState, useMemo } from 'react'
import { useApi } from '../hooks/useApi'
import LoadingSpinner from './ui/LoadingSpinner'

const MODES = ['Standard', 'Fluency', 'Formal', 'Creative', 'Shorten', 'Expand']
const MODE_DESCRIPTIONS = {
  Standard:  'Different words, same meaning',
  Fluency:   'Smoother, more natural flow',
  Formal:    'Professional & academic tone',
  Creative:  'Vivid, expressive language',
  Shorten:   'Concise & condensed',
  Expand:    'Elaborated with more detail',
}
const MAX_WORDS = 500

// ── Lightweight inline LCS word diff ─────────────────────────────────────
function lcsMatrix(a, b) {
  const m = a.length, n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] + 1 : Math.max(dp[i-1][j], dp[i][j-1])
  return dp
}

function wordDiff(original, rewritten) {
  const a = original.split(/\s+/).filter(Boolean)
  const b = rewritten.split(/\s+/).filter(Boolean)
  const dp = lcsMatrix(a, b)
  const result = []
  let i = a.length, j = b.length
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i-1] === b[j-1]) {
      result.unshift({ type: 'same', word: b[j-1] })
      i--; j--
    } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
      result.unshift({ type: 'added', word: b[j-1] })
      j--
    } else {
      result.unshift({ type: 'removed', word: a[i-1] })
      i--
    }
  }
  return result
}

function DiffDisplay({ original, rewritten }) {
  const tokens = useMemo(() => {
    if (!original || !rewritten) return []
    return wordDiff(original.trim(), rewritten.trim())
  }, [original, rewritten])

  if (!tokens.length) return null

  return (
    <div className="leading-relaxed text-sm text-slate-200 whitespace-pre-wrap">
      {tokens.map((tok, i) => {
        if (tok.type === 'same')    return <span key={i}>{tok.word} </span>
        if (tok.type === 'added')   return <span key={i} className="diff-added">{tok.word} </span>
        if (tok.type === 'removed') return <span key={i} className="diff-removed">{tok.word} </span>
        return null
      })}
    </div>
  )
}

export default function Paraphraser() {
  const [inputText,     setInputText]     = useState('')
  const [mode,          setMode]          = useState('Standard')
  const [result,        setResult]        = useState(null)
  const [showDiff,      setShowDiff]      = useState(true)
  const [copied,        setCopied]        = useState(false)
  const { call, loading, error }          = useApi()

  const wordCount = useMemo(
    () => inputText.trim() ? inputText.trim().split(/\s+/).length : 0,
    [inputText]
  )
  const isOverLimit = wordCount > MAX_WORDS

  const handleSubmit = async () => {
    if (!inputText.trim() || isOverLimit) return
    const data = await call('/paraphrase', { text: inputText, mode })
    if (data) setResult(data.rewritten_text)
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleInput = (e) => {
    const text = e.target.value
    const words = text.trim() ? text.trim().split(/\s+/) : []
    if (words.length > MAX_WORDS) {
      const capped = words.slice(0, MAX_WORDS).join(' ')
      setInputText(capped)
    } else {
      setInputText(text)
    }
  }

  return (
    <div className="page-enter h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Paraphraser</h2>
          <p className="text-sm text-slate-400 mt-0.5">Rewrite text in different styles while preserving meaning</p>
        </div>
        {/* Mode toolbar */}
        <div className="flex items-center gap-1.5 glass rounded-2xl p-1.5">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              title={MODE_DESCRIPTIONS[m]}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200
                ${mode === m
                  ? 'bg-moonDust-primary/90 text-white shadow-lg'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Split workspace */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Input Panel */}
        <div className="flex-1 glass-card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-moonDust-light">Original Text</h3>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full border
              ${isOverLimit
                ? 'text-rose-400 border-rose-400/40 bg-rose-400/10'
                : wordCount > MAX_WORDS * 0.8
                  ? 'text-amber-400 border-amber-400/40 bg-amber-400/10'
                  : 'text-slate-400 border-white/10 bg-white/5'
              }`}>
              {wordCount} / {MAX_WORDS} words
            </span>
          </div>
          <textarea
            className="glass-input flex-1 text-sm leading-relaxed"
            placeholder="Paste or type your text here (up to 500 words)…"
            value={inputText}
            onChange={handleInput}
            spellCheck={false}
          />
          <button
            onClick={handleSubmit}
            disabled={loading || !inputText.trim() || isOverLimit}
            className="glass-btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <LoadingSpinner size="sm" />
                Paraphrasing…
              </span>
            ) : (
              `Paraphrase — ${mode} Mode`
            )}
          </button>
        </div>

        {/* Output Panel */}
        <div className="flex-1 glass-card flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-moonDust-light">Result</h3>
            <div className="flex items-center gap-2">
              {result && (
                <>
                  <button
                    onClick={() => setShowDiff(!showDiff)}
                    className={`text-xs px-3 py-1 rounded-lg border transition-all duration-200
                      ${showDiff
                        ? 'border-moonDust-primary/50 text-moonDust-primary bg-moonDust-primary/10'
                        : 'border-white/10 text-slate-400 hover:text-white'
                      }`}
                  >
                    {showDiff ? '◉ Diff On' : '◎ Diff Off'}
                  </button>
                  <button
                    onClick={handleCopy}
                    className="text-xs px-3 py-1 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 transition-all"
                  >
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="h-full flex items-center justify-center">
                <LoadingSpinner size="lg" text="Rewriting your text…" />
              </div>
            ) : error ? (
              <div className="glass rounded-xl p-4 border border-rose-500/30 bg-rose-500/10">
                <p className="text-rose-400 text-sm">⚠ {error}</p>
              </div>
            ) : result ? (
              <div className="animate-fadeInUp">
                {/* Mode badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs px-2.5 py-1 rounded-full bg-moonDust-primary/15 text-moonDust-primary border border-moonDust-primary/30 font-medium">
                    {mode}
                  </span>
                  {showDiff && (
                    <span className="text-xs text-slate-500">
                      <span className="text-emerald-400">■</span> Added &nbsp;
                      <span className="text-rose-400">■</span> Removed
                    </span>
                  )}
                </div>
                {showDiff ? (
                  <DiffDisplay original={inputText} rewritten={result} />
                ) : (
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{result}</p>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-600">
                <svg className="w-12 h-12 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                <p className="text-sm">Your paraphrased text will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Diff Legend */}
      {result && showDiff && (
        <div className="glass rounded-xl px-4 py-3 flex items-center gap-6 text-xs text-slate-400 animate-fadeInUp">
          <span className="font-medium text-slate-300">Diff Legend:</span>
          <span><span className="diff-added px-1">green words</span> = new additions</span>
          <span><span className="diff-removed px-1">red words</span> = removed/changed</span>
          <span>unchanged words shown normally</span>
        </div>
      )}
    </div>
  )
}
