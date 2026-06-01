import { requireAuth } from '../../../../services/auth'
import { getTagById, listGamesForTag } from '../../../../db/queries/tags'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tag id' })
  }

  const tag = await getTagById(id)
  if (!tag) {
    throw createError({ statusCode: 404, statusMessage: 'Tag not found' })
  }

  const games = await listGamesForTag(id)
  return { tag, games }
})
