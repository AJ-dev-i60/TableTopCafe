import { z } from 'zod'
import { requireAuth } from '../../services/auth'
import { searchGameNames } from '../../utils/gameNames'

const QuerySchema = z.object({
  q: z.string().min(1).max(100),
})

// Instant search-as-you-type over the committed board-game name list
// (server/utils/gameNames.ts). No external calls, no database — auto-fill from
// BGG is a separate, explicit step in the add-game form.
export default defineEventHandler((event) => {
  requireAuth(event)

  const query = QuerySchema.safeParse(getQuery(event))
  if (!query.success) {
    throw createError({ statusCode: 400, statusMessage: 'q must be 1–100 characters' })
  }

  return searchGameNames(query.data.q)
})
