'use client'

import { useEffect, useState, useCallback } from 'react'
import { loadOrGenerateDay } from '@/actions/tasks'
import { localToday, formatDateLong, dayOfWeek, msUntilMidnight } from '@/lib/dates'
import { computeScore, BONUS_CEILING } from '@/lib/scoring'
import ScoreRing from '@/components/ScoreRing'
import TaskItem from '@/components/TaskItem'

export default function TodayView() {
  const [today, setToday] = useState(localToday)
  const [tasks, setTasks]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(null)

  const score = computeScore(tasks)

  // Flip "today" at local midnight without a page refresh
  useEffect(() => {
    const delay = msUntilMidnight()
    const timer = setTimeout(() => {
      setToday(localToday())
      const daily = setInterval(() => setToday(localToday()), 24 * 60 * 60 * 1000)
      return () => clearInterval(daily)
    }, delay)
    return () => clearTimeout(timer)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      // Pass local date + weekday from the client — server must not call new Date() for timezone reasons
      const data = await loadOrGenerateDay(today, dayOfWeek(today))
      setTasks(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [today])

  useEffect(() => { load() }, [load])

  function handleToggle(taskId, newCompleted) {
    setTasks(prev => prev.map(t =>
      t.id === taskId
        ? { ...t, completed: newCompleted, completed_at: newCompleted ? new Date().toISOString() : null }
        : t
    ))
  }

  const priorityTasks = tasks.filter(t => t.type === 'priority')
  const extraTasks    = tasks.filter(t => t.type === 'extra')

  const bgGradient = score.total >= 100
    ? 'from-orange-900/60 via-violet-900 to-slate-900'
    : 'from-violet-900/60 via-slate-900 to-slate-900'

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} transition-all duration-1000 pb-24`}>
      <div className="px-4 pt-8 pb-4">
        <p className="text-white/50 text-sm font-medium uppercase tracking-widest mb-1">Today</p>
        <h1 className="text-white text-2xl font-bold leading-tight">{formatDateLong(today)}</h1>
      </div>

      {/* Score card */}
      <div className="px-4 mb-6">
        <div className={`rounded-2xl p-6 flex items-center gap-6 border transition-all duration-500 ${
          score.total >= 100 ? 'bg-orange-500/10 border-orange-400/30' : 'bg-white/5 border-white/10'
        }`}>
          <ScoreRing score={score.total} />
          <div>
            <div className={`text-3xl font-bold ${score.total >= 100 ? 'text-orange-300' : 'text-white'}`}>
              {score.total}%{score.total >= 100 && <span className="ml-2">🔥</span>}
            </div>
            {score.total > 100 && <p className="text-orange-200/70 text-sm font-medium">Extra credit!</p>}
            <p className="text-white/50 text-sm mt-1">
              {score.priorityCompleted}/{score.priorityTotal} priority
              {score.extraTotal > 0 && ` · ${score.extraCompleted}/${score.extraTotal} extras`}
            </p>
            {score.extraTotal > 0 && (
              <p className="text-white/30 text-xs mt-0.5">extras worth up to +{BONUS_CEILING}pts</p>
            )}
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {error && (
        <div className="mx-4 rounded-xl bg-red-500/20 border border-red-400/30 p-4 text-red-200 text-sm">
          {error}
          <button onClick={load} className="ml-3 underline">retry</button>
        </div>
      )}

      {!loading && !error && tasks.length === 0 && (
        <div className="mx-4 rounded-2xl bg-white/5 border border-white/10 p-8 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-white font-semibold text-lg">No tasks for today</p>
          <p className="text-white/50 text-sm mt-2">
            Head to the <strong>Plan</strong> tab to set up your weekly schedule, or import a plan from JSON.
          </p>
        </div>
      )}

      {!loading && priorityTasks.length > 0 && (
        <section className="px-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-white font-semibold text-sm uppercase tracking-widest">Priority</h2>
            <span className="text-white/40 text-xs">{score.priorityCompleted}/{score.priorityTotal}</span>
          </div>
          <div className="flex flex-col gap-2">
            {priorityTasks.map(task => (
              <TaskItem key={task.id} task={task} locked={false} onToggle={handleToggle} />
            ))}
          </div>
        </section>
      )}

      {!loading && extraTasks.length > 0 && (
        <section className="px-4">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-white font-semibold text-sm uppercase tracking-widest">Extras</h2>
            <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
              bonus / extra credit
            </span>
            <span className="text-white/40 text-xs">{score.extraCompleted}/{score.extraTotal}</span>
          </div>
          <p className="text-white/30 text-xs mb-3">
            Completing extras boosts your score above 100% — skipping them never lowers it.
          </p>
          <div className="flex flex-col gap-2">
            {extraTasks.map(task => (
              <TaskItem key={task.id} task={task} locked={false} onToggle={handleToggle} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
