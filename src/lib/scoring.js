// BONUS_CEILING controls how much extra tasks can boost the daily score.
// Raise it to reward extras more; lower it to make extras worth less.
// Default: 20 means a perfect extras day is worth +20 pts (total max = 120).
export const BONUS_CEILING = 20

/**
 * Compute the daily score from an array of day_tasks.
 *
 * Returns:
 *   { base, bonus, total, priorityTotal, priorityCompleted, extraTotal, extraCompleted }
 *
 * Rules:
 * - base  = priorityCompleted / priorityTotal * 100  (100 if no priority tasks)
 * - bonus = extraCompleted / extraTotal * BONUS_CEILING  (0 if no extra tasks)
 * - total = round(base + bonus), capped at nothing — max is 120 when base=100 + bonus=20
 *
 * Example (all priority done, half extras done):
 *   score({ tasks: [{type:'priority',completed:true}, {type:'extra',completed:true}, {type:'extra',completed:false}] })
 *   => { base:100, bonus:10, total:110, ... }
 */
export function computeScore(tasks) {
  const priorityTasks = tasks.filter(t => t.type === 'priority')
  const extraTasks    = tasks.filter(t => t.type === 'extra')

  const Pt = priorityTasks.length
  const Pc = priorityTasks.filter(t => t.completed).length
  const Et = extraTasks.length
  const Ec = extraTasks.filter(t => t.completed).length

  // If there are no priority tasks, treat the base as 100% so an extras-only
  // day isn't stuck at 0.
  const base  = Pt > 0 ? (Pc / Pt) * 100 : 100
  const bonus = Et > 0 ? (Ec / Et) * BONUS_CEILING : 0
  const total = Math.round(base + bonus)

  return { base, bonus, total, priorityTotal: Pt, priorityCompleted: Pc, extraTotal: Et, extraCompleted: Ec }
}

// Inline smoke-test examples (not a test runner, just documentation):
// computeScore([]) => { base:100, bonus:0, total:100, ... }
// computeScore([{type:'priority',completed:true},{type:'priority',completed:false}])
//   => { base:50, bonus:0, total:50, ... }
// computeScore([{type:'priority',completed:true},{type:'extra',completed:true}])
//   => { base:100, bonus:20, total:120, ... }
