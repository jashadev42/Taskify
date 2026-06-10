'use server'

import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth.server'
import { getDb } from '@/lib/db'

async function getVerifiedUserId() {
  const { data: session } = await auth.getSession()
  if (!session?.user) redirect('/auth/sign-in')
  return session.user.id
}

export async function getTemplates() {
  const userId = await getVerifiedUserId()
  const sql = getDb()
  return await sql`
    SELECT * FROM task_templates
    WHERE user_id = ${userId}
    ORDER BY day_of_week ASC, sort_order ASC, created_at ASC
  `
}

export async function addTemplate(data) {
  const userId = await getVerifiedUserId()
  const sql = getDb()
  await sql`
    INSERT INTO task_templates
      (user_id, day_of_week, title, description, time_block, type, sort_order, active)
    VALUES
      (${userId}, ${data.day_of_week}, ${data.title}, ${data.description ?? null},
       ${data.time_block ?? null}, ${data.type}, ${data.sort_order ?? 0}, ${data.active ?? true})
  `
}

export async function updateTemplate(id, data) {
  const userId = await getVerifiedUserId()
  const sql = getDb()
  // user_id in WHERE prevents editing another user's template
  await sql`
    UPDATE task_templates
    SET
      day_of_week = ${data.day_of_week},
      title       = ${data.title},
      description = ${data.description ?? null},
      time_block  = ${data.time_block ?? null},
      type        = ${data.type},
      sort_order  = ${data.sort_order ?? 0},
      active      = ${data.active ?? true}
    WHERE id = ${id}
      AND user_id = ${userId}
  `
}

export async function deleteTemplate(id) {
  const userId = await getVerifiedUserId()
  const sql = getDb()
  await sql`
    DELETE FROM task_templates
    WHERE id = ${id}
      AND user_id = ${userId}
  `
}

/**
 * Bulk-insert templates from the JSON import feature.
 * Rows are already validated/shaped by the caller.
 */
export async function importTemplates(rows) {
  const userId = await getVerifiedUserId()
  const sql = getDb()
  for (const r of rows) {
    await sql`
      INSERT INTO task_templates
        (user_id, day_of_week, title, description, time_block, type, sort_order, active)
      VALUES
        (${userId}, ${r.day_of_week}, ${r.title}, ${r.description ?? null},
         ${r.time_block ?? null}, ${r.type}, ${r.sort_order ?? 0}, true)
    `
  }
}
