import { z } from 'zod'
import { requireAuth } from '../../services/auth'
import { fetchGameDescription } from '../../services/wikipedia'

const QuerySchema = z.object({
  name: z.string().min(1).max(255),
})

// Look up a game's description from Wikipedia for the staff form. Returns
// { description: null } when there's no confident match (staff write their own).
export default defineEventHandler(async (event) => {
  requireAuth(event)

  const query = QuerySchema.safeParse(getQuery(event))
  if (!query.success) {
    throw createError({ statusCode: 400, statusMessage: 'name must be 1–255 characters' })
  }

  const description = await fetchGameDescription(query.data.name)
  return { description }
})
