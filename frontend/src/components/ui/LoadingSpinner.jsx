export default function LoadingSpinner({ size = 'md', text = '' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' }
  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <div
        className={`${sizes[size]} rounded-full border-2 border-moonDust-primary/30 border-t-moonDust-primary animate-spin`}
        style={{ boxShadow: '0 0 16px rgba(128,168,255,0.4)' }}
      />
      {text && <p className="text-sm text-moonDust-primary/70 animate-pulse">{text}</p>}
    </div>
  )
}
