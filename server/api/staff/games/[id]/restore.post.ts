import { requireAuth } from '../../../../services/auth'
import { restoreGame } from '../../../../db/queries/games'

export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid game id' })
  }

  await restoreGame(id, actor.id)

  return { ok: true }
})
