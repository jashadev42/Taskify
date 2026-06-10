'use client'

export default function ScoreRing({ score }) {
  const isOver100 = score > 100
  const displayScore = Math.min(score, 120)
  const ringPercent = Math.min(score, 100)
  const circumference = 2 * Math.PI * 44
  const offset = circumference - (ringPercent / 100) * circumference

  const ringColor = isOver100
    ? 'stroke-orange-400'
    : ringPercent >= 80
    ? 'stroke-emerald-400'
    : ringPercent >= 50
    ? 'stroke-violet-400'
    : 'stroke-slate-400'

  return (
    <div className="relative flex items-center justify-center w-32 h-32">
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="44" fill="none" stroke="currentColor"
          className="text-white/10" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="44" fill="none" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${ringColor} transition-all duration-500`}
        />
      </svg>
      <div className="relative flex flex-col items-center">
        <span className={`text-3xl font-bold leading-none ${isOver100 ? 'text-orange-300' : 'text-white'}`}>
          {displayScore}%
        </span>
        {isOver100 && <span className="text-lg leading-none mt-0.5">🔥</span>}
      </div>
    </div>
  )
}
