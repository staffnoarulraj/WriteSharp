import { NavLink } from 'react-router-dom'

const NAV_ITEMS = [
  {
    to: '/',
    label: 'Paraphraser',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
  },
  {
    to: '/summarizer',
    label: 'Summarizer',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
      </svg>
    ),
  },
  {
    to: '/grammar',
    label: 'Grammar',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z" />
      </svg>
    ),
  },
  {
    to: '/cs-refiner',
    label: 'CS Refiner',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 0 1 .865-.501 48.172 48.172 0 0 0 3.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
      </svg>
    ),
  },
]

export default function Sidebar() {
  return (
    <aside className="flex flex-col h-full w-64 shrink-0 glass border-r border-white/10 p-5 gap-6 z-10 relative">
      {/* Logo */}
      <div className="flex items-center gap-3 px-1 py-2">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
          style={{ background: 'linear-gradient(135deg, #80A8FF, #CEB5FF)' }}
        >
          W
        </div>
        <div>
          <h1 className="font-bold text-base text-white leading-tight tracking-tight flex items-baseline gap-1.5">
            WriteSharp
            <span className="text-[11px] font-normal italic text-moonDust-primary/50 tracking-normal">
              by Staffno
            </span>
          </h1>
          <p className="text-[10px] text-moonDust-primary/60 font-medium uppercase tracking-widest">AI Assistant</p>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Navigation */}
      <nav className="flex flex-col gap-1.5 flex-1">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-1">Tools</p>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
               ${isActive
                 ? 'bg-moonDust-primary/20 text-moonDust-primary border border-moonDust-primary/30'
                 : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
               }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive ? 'text-moonDust-primary' : 'text-slate-500 group-hover:text-moonDust-light transition-colors'}>
                  {item.icon}
                </span>
                {item.label}
                {isActive && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-moonDust-primary" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="glass rounded-xl p-3 text-center">
        <p className="text-[10px] text-slate-500 leading-relaxed">
          Powered by <span className="text-moonDust-primary font-semibold">Gemini</span> AI
        </p>
      </div>
    </aside>
  )
}
