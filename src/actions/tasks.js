'use server'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth.server'
import { getDb } from '@/lib/db'

// Every action starts here — returns the verified user ID or redirects.
// The user ID always comes from the server-verified session, never from the client.
async function getVerifiedUserId() {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')
  return session.user.id
}

/**
 * Fetch existing day_tasks for a date. Does NOT generate — call loadOrGenerateDay instead.
 * dateStr must be YYYY-MM-DD in the user's local timezone (passed from the client).
 */
export async function getDayTasks(dateStr) {
  const userId = await getVerifiedUserId()
  const sql = getDb()
  return await sql`
    SELECT * FROM day_tasks
    WHERE user_id = ${userId} AND date = ${dateStr}
    ORDER BY sort_order ASC, created_at ASC
  `
}

/**
 * Load today's tasks, generating any that haven't been created yet from templates.
 * Always attempts to insert from templates — ON CONFLICT DO NOTHING is idempotent,
 * so completed tasks are never overwritten and duplicate inserts are safe.
 * This means importing new templates after today's first load still picks them up.
 *
 * @param dateStr   YYYY-MM-DD of today (user's local date, from the client)
 * @param dayOfWeek 0-6 matching dateStr's weekday (from the client)
 */
export async function loadOrGenerateDay(dateStr, dayOfWeek) {
  const userId = await getVerifiedUserId()
  const sql = getDb()

  const templates = await sql`
    SELECT * FROM task_templates
    WHERE user_id = ${userId}
      AND day_of_week = ${dayOfWeek}
      AND active = true
    ORDER BY sort_order ASC, created_at ASC
  `

  for (const t of templates) {
    await sql`
      INSERT INTO day_tasks
        (user_id, date, template_id, title, description, time_block, type, sort_order, completed)
      VALUES
        (${userId}, ${dateStr}, ${t.id}, ${t.title}, ${t.description},
         ${t.time_block}, ${t.type}, ${t.sort_order}, false)
      ON CONFLICT (user_id, date, template_id) DO NOTHING
    `
  }

  // Remove today's tasks whose template was deleted or deactivated since generation.
  // Uses a subquery against the already-fetched template IDs to avoid a second round-trip.
  const activeIds = templates.map(t => t.id)
  if (activeIds.length > 0) {
    await sql`
      DELETE FROM day_tasks
      WHERE user_id = ${userId}
        AND date = ${dateStr}
        AND template_id IS NOT NULL
        AND template_id != ALL(${activeIds})
    `
  } else {
    // No active templates for today — wipe any previously generated tasks
    await sql`
      DELETE FROM day_tasks
      WHERE user_id = ${userId}
        AND date = ${dateStr}
        AND template_id IS NOT NULL
    `
  }

  return await sql`
    SELECT * FROM day_tasks
    WHERE user_id = ${userId} AND date = ${dateStr}
    ORDER BY sort_order ASC, created_at ASC
  `
}

/**
 * Toggle a task's completion state.
 * The user_id filter in the WHERE clause ensures a client cannot toggle
 * another user's task even if it sends a valid task UUID.
 */
export async function toggleTask(taskId, completed) {
  const userId = await getVerifiedUserId()
  const sql = getDb()
  await sql`
    UPDATE day_tasks
    SET
      completed    = ${completed},
      completed_at = ${completed ? new Date().toISOString() : null}
    WHERE id = ${taskId}
      AND user_id = ${userId}
  `
}

/**
 * Fetch all day_tasks for dates strictly before todayStr (locked/past days).
 * todayStr is YYYY-MM-DD in the user's local timezone.
 */
export async function getHistory(todayStr) {
  const userId = await getVerifiedUserId()
  const sql = getDb()
  return await sql`
    SELECT * FROM day_tasks
    WHERE user_id = ${userId}
      AND date < ${todayStr}
    ORDER BY date DESC, sort_order ASC
  `
}
