import { count } from 'drizzle-orm'
import { requireAuth } from '../../services/auth'
import { db } from '../../db/client'
import { games, tags, users } from '../../db/schema'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const [gameCount] = await db.select({ n: count() }).from(games)
  const [tagCount] = await db.select({ n: count() }).from(tags)
  const [userCount] = await db.select({ n: count() }).from(users)

  return {
    games: gameCount?.n ?? 0,
    tags: tagCount?.n ?? 0,
    users: userCount?.n ?? 0,
  }
})
