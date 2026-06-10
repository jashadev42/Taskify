'use client'

import { useEffect, useState } from 'react'
import { getHistory } from '@/actions/tasks'
import { localToday, formatDateLong } from '@/lib/dates'
import { computeScore } from '@/lib/scoring'

function groupByDate(tasks) {
  const map = {}
  for (const t of tasks) {
    if (!map[t.date]) map[t.date] = []
    map[t.date].push(t)
  }
  return map
}

function scoreColor(total) {
  if (total >= 100) return 'text-orange-300'
  if (total >= 80)  return 'text-emerald-300'
  if (total >= 50)  return 'text-violet-300'
  return 'text-slate-400'
}

function scoreBg(total) {
  if (total >= 100) return 'bg-orange-500/20 border-orange-400/30'
  if (total >= 80)  return 'bg-emerald-500/10 border-emerald-400/20'
  if (total >= 50)  return 'bg-violet-500/10 border-violet-400/20'
  return 'bg-white/5 border-white/10'
}

function calcStreak(dates) {
  if (dates.length === 0) return 0
  const dateSet = new Set(dates)
  const today = localToday()
  let streak = 0
  const cursor = new Date(`${today}T00:00`)
  cursor.setDate(cursor.getDate() - 1)
  while (true) {
    const ds = `${cursor.getFullYear()}-${String(cursor.getMonth()+1).padStart(2,'0')}-${String(cursor.getDate()).padStart(2,'0')}`
    if (!dateSet.has(ds)) break
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export default function HistoryView() {
  const [tasksByDate, setTasksByDate] = useState({})
  const [dates, setDates]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState(null)
  const [selected, setSelected]       = useState(null)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      // Pass local today from client so the server doesn't use server timezone
      const today = localToday()
      const data = await getHistory(today)
      const grouped = groupByDate(data)
      const sorted = Object.keys(grouped).sort((a, b) => b.localeCompare(a))
      setTasksByDate(grouped)
      setDates(sorted)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const last7 = dates.slice(0, 7)
  const avg7 = last7.length > 0
    ? Math.round(last7.reduce((s, d) => s + computeScore(tasksByDate[d]).total, 0) / last7.length)
    : null
  const streak = calcStreak(dates)

  // Detail view for a selected past day
  if (selected) {
    const tasks = tasksByDate[selected] || []
    const score = computeScore(tasks)
    const priority = tasks.filter(t => t.type === 'priority').sort((a, b) => a.sort_order - b.sort_order)
    const extras   = tasks.filter(t => t.type === 'extra').sort((a, b) => a.sort_order - b.sort_order)

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900/20 to-slate-900 pb-24">
        <div className="px-4 pt-8 pb-4 flex items-center gap-3">
          <button onClick={() => setSelected(null)} className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <p className="text-white/50 text-xs uppercase tracking-widest">History</p>
            <h1 className="text-white text-xl font-bold">{formatDateLong(selected)}</h1>
          </div>
        </div>

        <div className={`mx-4 mb-6 rounded-2xl border p-5 ${scoreBg(score.total)}`}>
          <div className={`text-4xl font-bold ${scoreColor(score.total)}`}>
            {score.total}%{score.total >= 100 && ' 🔥'}
          </div>
          <p className="text-white/50 text-sm mt-1">
            {score.priorityCompleted}/{score.priorityTotal} priority
            {score.extraTotal > 0 && ` · ${score.extraCompleted}/${score.extraTotal} extras`}
          </p>
        </div>

        {priority.length > 0 && (
          <section className="px-4 mb-5">
            <h2 className="text-white/50 text-xs uppercase tracking-widest mb-3">Priority</h2>
            <div className="flex flex-col gap-2">
              {priority.map(t => (
                <div key={t.id} className={`rounded-xl border p-3 flex items-center gap-3 ${t.completed ? 'bg-emerald-500/10 border-emerald-400/20' : 'bg-white/5 border-white/10'}`}>
                  <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${t.completed ? 'bg-emerald-400' : 'bg-white/10 border border-white/30'}`}>
                    {t.completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${t.completed ? 'text-white' : 'text-white/40 line-through'}`}>{t.title}</p>
                    {t.time_block && <p className="text-white/30 text-xs">{t.time_block}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {extras.length > 0 && (
          <section className="px-4">
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-white/50 text-xs uppercase tracking-widest">Extras</h2>
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">bonus</span>
            </div>
            <div className="flex flex-col gap-2">
              {extras.map(t => (
                <div key={t.id} className={`rounded-xl border p-3 flex items-center gap-3 ${t.completed ? 'bg-amber-500/10 border-amber-400/20' : 'bg-white/5 border-white/10'}`}>
                  <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center ${t.completed ? 'bg-amber-400' : 'bg-white/10 border border-white/30'}`}>
                    {t.completed && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${t.completed ? 'text-white' : 'text-white/40 line-through'}`}>{t.title}</p>
                    {t.time_block && <p className="text-white/30 text-xs">{t.time_block}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900/20 to-slate-900 pb-24">
      <div className="px-4 pt-8 pb-4">
        <p className="text-white/50 text-sm font-medium uppercase tracking-widest mb-1">History</p>
        <h1 className="text-white text-2xl font-bold">Past Days</h1>
      </div>

      {!loading && dates.length > 0 && (
        <div className="px-4 mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Streak</p>
            <p className="text-white text-2xl font-bold">{streak} <span className="text-base font-normal text-white/50">days</span></p>
          </div>
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Avg (7d)</p>
            <p className={`text-2xl font-bold ${avg7 !== null ? scoreColor(avg7) : 'text-white/30'}`}>
              {avg7 !== null ? `${avg7}%` : '—'}
            </p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="mx-4 rounded-xl bg-red-500/20 border border-red-400/30 p-4 text-red-200 text-sm">
          {error} <button onClick={load} className="ml-2 underline">retry</button>
        </div>
      )}

      {!loading && dates.length === 0 && (
        <div className="mx-4 rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-white font-semibold">No history yet</p>
          <p className="text-white/50 text-sm mt-2">Completed days appear here after midnight.</p>
        </div>
      )}

      <div className="px-4 flex flex-col gap-2">
        {dates.map(date => {
          const score = computeScore(tasksByDate[date])
          return (
            <button key={date} onClick={() => setSelected(date)}
              className={`rounded-xl border p-4 flex items-center justify-between text-left transition-all hover:scale-[1.01] ${scoreBg(score.total)}`}>
              <div>
                <p className="text-white font-medium text-sm">{formatDateLong(date)}</p>
                <p className="text-white/40 text-xs mt-0.5">
                  {score.priorityCompleted}/{score.priorityTotal} priority
                  {score.extraTotal > 0 && ` · ${score.extraCompleted}/${score.extraTotal} extras`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xl font-bold ${scoreColor(score.total)}`}>
                  {score.total}%{score.total >= 100 && ' 🔥'}
                </span>
                <svg className="w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
