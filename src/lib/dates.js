/**
 * Return today's date as a YYYY-MM-DD string in the user's local timezone.
 * Never use toISOString() here — that converts to UTC and can give the wrong date
 * for users in UTC- timezones after midnight UTC but before their local midnight.
 */
export function localToday() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Format a YYYY-MM-DD string as "Wednesday, June 11" */
export function formatDateLong(dateStr) {
  // Parse as local date by appending T00:00 to avoid UTC shift
  const d = new Date(`${dateStr}T00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
}

/** Format as short "Jun 11" */
export function formatDateShort(dateStr) {
  const d = new Date(`${dateStr}T00:00`)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

/** Return the day-of-week (0=Sun…6=Sat) for a YYYY-MM-DD string */
export function dayOfWeek(dateStr) {
  return new Date(`${dateStr}T00:00`).getDay()
}

/**
 * Milliseconds until the next local midnight from now.
 * Used to set the rollover timer.
 */
export function msUntilMidnight() {
  const now = new Date()
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
  return tomorrow - now
}
