import { requireAuth } from '../../../../services/auth'
import { softDeleteGame, getGameById } from '../../../../db/queries/games'

export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid game id' })
  }

  const existing = await getGameById(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Game not found' })
  }

  await softDeleteGame(id, actor.id)

  return { ok: true }
})
