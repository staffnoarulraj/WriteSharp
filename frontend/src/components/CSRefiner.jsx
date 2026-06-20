import { useState, useEffect, useRef } from 'react'
import { useApi } from '../hooks/useApi'
import LoadingSpinner from './ui/LoadingSpinner'

// ── Verdict Badge ─────────────────────────────────────────────────────────
function VerdictBadge({ verdict }) {
  const config = {
    'Acceptable':      { color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/40', glow: '0 0 20px rgba(52,211,153,0.3)', icon: '✓' },
    'Needs Improvement': { color: 'text-amber-400',   bg: 'bg-amber-500/15',   border: 'border-amber-500/40',   glow: '0 0 20px rgba(251,191,36,0.3)',  icon: '⚡' },
    'Not Recommended': { color: 'text-rose-400',    bg: 'bg-rose-500/15',    border: 'border-rose-500/40',    glow: '0 0 20px rgba(251,113,133,0.3)', icon: '✕' },
  }
  const c = config[verdict] || config['Needs Improvement']
  return (
    <div
      className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border ${c.bg} ${c.border} ${c.color} font-bold text-lg animate-fadeInUp`}
      style={{ boxShadow: c.glow }}
    >
      <span className="text-xl">{c.icon}</span>
      {verdict}
    </div>
  )
}

// ── Rudeness Meter ────────────────────────────────────────────────────────
function RudenessMeter({ score }) {
  const [displayed, setDisplayed] = useState(0)
  useEffect(() => {
    const timer = setTimeout(() => setDisplayed(score), 100)
    return () => clearTimeout(timer)
  }, [score])

  const getColor = (val) => {
    if (val < 30) return '#34d399' // emerald
    if (val < 60) return '#fbbf24' // amber
    return '#f87171'               // rose
  }
  const color = getColor(score)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Rudeness Level</span>
        <span className="font-bold text-sm" style={{ color }}>{score}/100</span>
      </div>
      <div className="h-3 glass rounded-full overflow-hidden">
        <div
          className="h-full rounded-full rudeness-bar relative overflow-hidden"
          style={{
            width: `${displayed}%`,
            background: `linear-gradient(90deg, #34d399, ${color})`,
            boxShadow: `0 0 12px ${color}60`,
          }}
        >
          {/* Shimmer overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
      <div className="flex justify-between text-[10px] text-slate-600">
        <span>Polite</span>
        <span>Moderate</span>
        <span>Hostile</span>
      </div>
    </div>
  )
}

// ── Score Card ───────────────────────────────────────────────────────────
function ScoreCard({ label, score, delay = 0 }) {
  const [displayed, setDisplayed] = useState(0)
  useEffect(() => {
    const timer = setTimeout(() => setDisplayed(score), delay + 200)
    return () => clearTimeout(timer)
  }, [score, delay])

  const getGrade = (s) => {
    if (s >= 90) return { grade: 'A+', color: '#34d399' }
    if (s >= 80) return { grade: 'A',  color: '#6ee7b7' }
    if (s >= 70) return { grade: 'B',  color: '#80A8FF' }
    if (s >= 60) return { grade: 'C',  color: '#fbbf24' }
    return              { grade: 'D',  color: '#f87171' }
  }
  const { grade, color } = getGrade(score)

  return (
    <div className="glass-card-hover flex flex-col gap-3 score-animate" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-bold px-2 py-0.5 rounded-md" style={{ color, background: color + '20' }}>{grade}</span>
      </div>
      {/* Circular score */}
      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
            <circle
              cx="18" cy="18" r="15.9" fill="none"
              stroke={color} strokeWidth="2.5"
              strokeDasharray={`${(displayed / 100) * 100} 100`}
              strokeLinecap="round"
              style={{ filter: `drop-shadow(0 0 4px ${color}80)`, transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-bold text-sm" style={{ color }}>
            {displayed}
          </span>
        </div>
        <div className="flex-1">
          <div className="h-1.5 glass rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${displayed}%`,
                background: `linear-gradient(90deg, ${color}80, ${color})`,
                transition: 'width 1s ease',
              }}
            />
          </div>
          <p className="text-[10px] text-slate-500 mt-1">out of 100</p>
        </div>
      </div>
    </div>
  )
}

// ── Word Suggestions Table ────────────────────────────────────────────────
function WordSuggestionsTable({ suggestions }) {
  if (!suggestions || suggestions.length === 0) return null
  return (
    <div className="glass-card">
      <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
        <span className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-xs">🔄</span>
        Word Suggestions
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-slate-500 font-semibold pb-3 pr-4 uppercase tracking-wider">Original</th>
              <th className="text-left text-slate-500 font-semibold pb-3 pr-4 uppercase tracking-wider">Replace With</th>
              <th className="text-left text-slate-500 font-semibold pb-3 uppercase tracking-wider">Reason</th>
            </tr>
          </thead>
          <tbody>
            {suggestions.map((s, i) => (
              <tr key={i} className="border-b border-white/5 animate-fadeInUp" style={{ animationDelay: `${i * 60}ms` }}>
                <td className="py-3 pr-4">
                  <span className="line-through text-rose-400 bg-rose-500/10 px-2 py-1 rounded font-medium">{s.original}</span>
                </td>
                <td className="py-3 pr-4">
                  <span className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded font-medium">{s.replacement}</span>
                </td>
                <td className="py-3 text-slate-400 leading-relaxed">{s.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────
export default function CSRefiner() {
  const [inputText,  setInputText]  = useState('')
  const [result,     setResult]     = useState(null)
  const [copiedRef,  setCopiedRef]  = useState(false)
  const { call, loading, error }    = useApi()

  const handleSubmit = async () => {
    if (!inputText.trim()) return
    const data = await call('/cs-refine', { text: inputText })
    if (data) setResult(data)
  }

  const handleCopyRefined = () => {
    if (!result) return
    navigator.clipboard.writeText(result.refined_version)
    setCopiedRef(true)
    setTimeout(() => setCopiedRef(false), 2000)
  }

  return (
    <div className="page-enter flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">CS Response Refiner</h2>
          <p className="text-sm text-slate-400 mt-0.5">Analyze and refine customer service communications</p>
        </div>
        <div className="glass rounded-xl px-3 py-1.5 text-xs text-moonDust-primary border border-moonDust-primary/20">
          ✦ Anchor Feature
        </div>
      </div>

      {/* Input cockpit */}
      <div className="glass-card flex flex-col gap-4">
        <h3 className="text-sm font-semibold text-moonDust-light">Paste Customer Communication or Support Draft</h3>
        <textarea
          className="glass-input min-h-[160px] text-sm leading-relaxed"
          placeholder="Paste the raw customer message, angry complaint, or support draft response here…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          spellCheck={false}
        />
        <button
          onClick={handleSubmit}
          disabled={loading || !inputText.trim()}
          className="glass-btn-primary self-end px-10 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <LoadingSpinner size="sm" />
              Analyzing…
            </span>
          ) : '⚡ Run Full Analysis'}
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="glass-card py-16 flex items-center justify-center">
          <LoadingSpinner size="lg" text="Running comprehensive analysis…" />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass rounded-xl p-4 border border-rose-500/30 bg-rose-500/10 animate-fadeInUp">
          <p className="text-rose-400 text-sm">⚠ {error}</p>
        </div>
      )}

      {/* Dashboard results */}
      {result && !loading && (
        <div className="flex flex-col gap-5 animate-fadeInUp">
          {/* Row 1: Verdict + Rudeness */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="glass-card flex flex-col gap-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overall Verdict</h3>
              <VerdictBadge verdict={result.verdict} />
            </div>
            <div className="glass-card flex flex-col gap-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rudeness Meter</h3>
              <RudenessMeter score={result.rudeness_score} />
            </div>
          </div>

          {/* Row 2: Score Cards 2x2 */}
          <div>
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Performance Metrics</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <ScoreCard label="Overall Score"    score={result.metrics.overall}        delay={0}   />
              <ScoreCard label="Professionalism"  score={result.metrics.professionalism} delay={100} />
              <ScoreCard label="Empathy"          score={result.metrics.empathy}        delay={200} />
              <ScoreCard label="Clarity"          score={result.metrics.clarity}        delay={300} />
            </div>
          </div>

          {/* Row 3: Word Suggestions */}
          <WordSuggestionsTable suggestions={result.word_suggestions} />

          {/* Row 4: Tone Issues + Positive Aspects */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tone Issues */}
            <div className="glass-card">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-rose-500/20 flex items-center justify-center text-xs">⚠</span>
                Tone Issues
              </h3>
              <ul className="flex flex-col gap-2.5">
                {result.tone_issues.map((issue, i) => (
                  <li key={i} className="flex items-start gap-2.5 animate-fadeInUp text-sm text-slate-300"
                      style={{ animationDelay: `${i * 60}ms` }}>
                    <span className="shrink-0 w-4 h-4 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] flex items-center justify-center mt-0.5 font-bold">!</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>

            {/* Positive Aspects */}
            <div className="glass-card">
              <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xs">✓</span>
                Positive Aspects
              </h3>
              <ul className="flex flex-col gap-2.5">
                {result.positive_aspects.map((aspect, i) => (
                  <li key={i} className="flex items-start gap-2.5 animate-fadeInUp text-sm text-slate-300"
                      style={{ animationDelay: `${i * 60}ms` }}>
                    <span className="shrink-0 w-4 h-4 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] flex items-center justify-center mt-0.5 font-bold">✓</span>
                    {aspect}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Row 5: Refined Version */}
          <div className="glass-card relative overflow-hidden"
               style={{ boxShadow: '0 0 40px rgba(128,168,255,0.1), 0 8px 32px rgba(0,0,0,0.4)' }}>
            {/* Decorative gradient blob */}
            <div className="absolute top-0 right-0 w-48 h-48 opacity-5 pointer-events-none"
                 style={{ background: 'radial-gradient(circle, #80A8FF, transparent)', transform: 'translate(30%, -30%)' }} />

            <div className="flex items-center justify-between mb-4 relative">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <span className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'linear-gradient(135deg, rgba(128,168,255,0.3), rgba(206,181,255,0.3))' }}>
                  ✨
                </span>
                Refined Version
              </h3>
              <button onClick={handleCopyRefined} className="glass-btn-primary text-xs px-4 py-1.5">
                {copiedRef ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
            <div className="glass rounded-xl p-5 relative">
              <p className="text-slate-100 text-sm leading-relaxed whitespace-pre-wrap">{result.refined_version}</p>
            </div>
          </div>

          {/* Row 6: Coaching Feedback */}
          <div
            className="rounded-2xl p-5 relative overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid transparent',
              backgroundImage: `
                linear-gradient(rgba(11,12,22,0.95), rgba(11,12,22,0.95)),
                linear-gradient(135deg, #D3D3FF, #CEB5FF, #8EC1DE, #80A8FF)
              `,
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
            }}
          >
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                   style={{ background: 'linear-gradient(135deg, rgba(128,168,255,0.2), rgba(206,181,255,0.2))' }}>
                🎯
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Coaching Feedback</h3>
                <p className="text-slate-300 text-sm leading-relaxed">{result.coaching_feedback}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div className="glass-card flex flex-col items-center justify-center py-20 text-slate-600 gap-5">
          <div className="relative">
            <svg className="w-16 h-16 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
            </svg>
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-moonDust-primary/30 animate-ping" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium text-slate-500">Full Analysis Dashboard</p>
            <p className="text-xs text-slate-700 mt-1">Paste a customer message above to activate the cockpit</p>
          </div>
        </div>
      )}
    </div>
  )
}
