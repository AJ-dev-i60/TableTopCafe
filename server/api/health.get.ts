import { sql } from 'drizzle-orm'
import { db } from '../db/client'

export default defineEventHandler(async () => {
  await db.execute(sql`SELECT 1`)
  return { ok: true, db: 'connected' }
})
