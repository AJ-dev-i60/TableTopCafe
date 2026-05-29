import { z } from 'zod'
import { requireAuth } from '../../services/auth'
import { searchBgg } from '../../services/bgg'
import { searchBggCache, upsertBggCacheEntries } from '../../db/queries/bgg'

const QuerySchema = z.object({
  q: z.string().min(2).max(100),
})

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const query = QuerySchema.safeParse(getQuery(event))
  if (!query.success) {
    throw createError({ statusCode: 400, statusMessage: 'q must be 2–100 characters' })
  }

  const q = query.data.q

  try {
    const results = await searchBgg(q)
    if (results.length > 0) {
      await upsertBggCacheEntries(results).catch(() => {})
    }
    return results
  } catch {
    // BGG unreachable — fall back to local cache
    return searchBggCache(q)
  }
})
