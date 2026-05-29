import { z } from 'zod'
import { requireAuth } from '../../../../services/auth'
import { mergeTag } from '../../../../db/queries/tags'

const bodySchema = z.object({
  targetId: z.number().int().positive(),
})

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const sourceId = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(sourceId) || sourceId < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tag id' })
  }

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  if (sourceId === parsed.data.targetId) {
    throw createError({ statusCode: 400, statusMessage: 'Source and target must be different tags' })
  }

  await mergeTag(sourceId, parsed.data.targetId)

  return { ok: true }
})
