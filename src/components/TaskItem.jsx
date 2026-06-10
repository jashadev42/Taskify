'use client'

import { useState } from 'react'
import { toggleTask } from '@/actions/tasks'

export default function TaskItem({ task, locked, onToggle }) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating]   = useState(false)

  async function handleToggle() {
    if (locked || updating) return
    const newCompleted = !task.completed
    onToggle(task.id, newCompleted) // optimistic update in parent immediately
    setUpdating(true)
    // Server action — user_id is verified server-side; client can't fake it
    await toggleTask(task.id, newCompleted)
    setUpdating(false)
  }

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        task.completed
          ? 'bg-white/5 border-white/10 opacity-70'
          : 'bg-white/10 border-white/20'
      }`}
    >
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={handleToggle}
          disabled={locked || updating}
          className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all
            ${locked ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
            ${task.completed
              ? 'bg-emerald-400 border-emerald-400'
              : 'bg-transparent border-white/40 hover:border-white/70'
            }
            ${updating ? 'opacity-50' : ''}
          `}
        >
          {task.completed && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium text-sm leading-snug ${task.completed ? 'line-through text-white/40' : 'text-white'}`}>
              {task.title}
            </span>
            {task.time_block && (
              <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full flex-shrink-0">
                {task.time_block}
              </span>
            )}
          </div>

          {task.description && (
            <button
              onClick={() => setExpanded(e => !e)}
              className="text-xs text-white/40 hover:text-white/60 mt-1 text-left"
            >
              {expanded ? 'hide details ▲' : 'show details ▼'}
            </button>
          )}
          {expanded && task.description && (
            <p className="text-xs text-white/50 mt-1 leading-relaxed">{task.description}</p>
          )}
        </div>
      </div>
    </div>
  )
}
