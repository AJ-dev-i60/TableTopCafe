import { requireAuth } from '../../../services/auth'
import { fetchBggGameDetails } from '../../../services/bgg'

// Scrapes a game's public BGG page for description / players / time so the staff
// form can pre-fill them. The XML API is gated (401); the public page is not.
export default defineEventHandler(async (event) => {
  requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid BGG id' })
  }

  const details = await fetchBggGameDetails(id)
  if (!details) {
    throw createError({ statusCode: 502, statusMessage: 'Could not read details from BoardGameGeek' })
  }

  return details
})
