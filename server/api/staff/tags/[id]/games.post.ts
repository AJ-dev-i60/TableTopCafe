import { z } from 'zod'
import { requireAuth } from '../../../../services/auth'
import { addGameToTag, getTagById } from '../../../../db/queries/tags'

const bodySchema = z.object({
  gameId: z.number().int().positive(),
})

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

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  await addGameToTag(parsed.data.gameId, id)
  return { ok: true }
})
