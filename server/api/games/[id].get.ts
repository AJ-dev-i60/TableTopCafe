import { getGameById } from '../../db/queries/games'

export default defineEventHandler(async (event) => {
  const raw = getRouterParam(event, 'id')
  const id = Number(raw)

  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, message: 'Invalid game id' })
  }

  const game = await getGameById(id)

  if (!game) {
    throw createError({ statusCode: 404, message: 'Game not found' })
  }

  return game
})
