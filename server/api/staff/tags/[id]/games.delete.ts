import { z } from 'zod'
import { requireAuth } from '../../../../services/auth'
import { removeGameFromTag } from '../../../../db/queries/tags'

const bodySchema = z.object({
  gameId: z.number().int().positive(),
})

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tag id' })
  }

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  await removeGameFromTag(parsed.data.gameId, id)
  return { ok: true }
})
