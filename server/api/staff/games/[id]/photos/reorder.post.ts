import { z } from 'zod'
import { requireAuth } from '../../../../../services/auth'
import { getGameById, reorderGamePhotos } from '../../../../../db/queries/games'

const bodySchema = z.object({
  order: z.array(z.string().regex(/^[a-f0-9]{32}$/)).min(1),
})

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid game id' })
  }

  const game = await getGameById(id)
  if (!game) {
    throw createError({ statusCode: 404, statusMessage: 'Game not found' })
  }

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  await reorderGamePhotos(id, parsed.data.order)
  return { ok: true }
})
