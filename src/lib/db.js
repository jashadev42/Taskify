import { neon } from '@neondatabase/serverless'

// Lazy singleton — created on first call so build-time import doesn't throw
// if DATABASE_URL isn't set. Only ever runs server-side.
let _sql = null
export function getDb() {
  if (!_sql) _sql = neon(process.env.DATABASE_URL)
  return _sql
}
