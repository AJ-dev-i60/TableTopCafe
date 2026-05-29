import { requireAuth } from '../../../services/auth'
import { fetchBggThing } from '../../../services/bgg'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const rawId = getRouterParam(event, 'id')
  const bggId = Number(rawId)
  if (!Number.isInteger(bggId) || bggId <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid BGG id' })
  }

  const detail = await fetchBggThing(bggId)
  if (!detail) {
    throw createError({ statusCode: 404, statusMessage: 'BGG game not found' })
  }

  return detail
})
