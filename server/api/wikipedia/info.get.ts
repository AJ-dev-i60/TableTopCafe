import { z } from 'zod'
import { requireAuth } from '../../services/auth'
import { fetchGameInfo } from '../../services/wikipedia'

const QuerySchema = z.object({
  name: z.string().min(1).max(255),
})

// Look up a game's description + players + play time from Wikipedia for the staff
// form. All-null when there's no confident match (staff fill it in manually).
export default defineEventHandler(async (event) => {
  requireAuth(event)

  const query = QuerySchema.safeParse(getQuery(event))
  if (!query.success) {
    throw createError({ statusCode: 400, statusMessage: 'name must be 1–255 characters' })
  }

  const info = await fetchGameInfo(query.data.name)
  return (
    info ?? { description: null, playerMin: null, playerMax: null, timeMin: null, timeMax: null }
  )
})
