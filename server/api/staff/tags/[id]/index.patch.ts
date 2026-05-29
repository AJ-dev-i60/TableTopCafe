import { z } from 'zod'
import { requireAuth } from '../../../../services/auth'
import { renameTag } from '../../../../db/queries/tags'

const bodySchema = z.object({
  name: z.string().min(1).max(100),
})

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tag id' })
  }

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  try {
    await renameTag(id, parsed.data.name)
  } catch (err: unknown) {
    if ((err as { code?: string }).code === 'CONFLICT') {
      throw createError({ statusCode: 409, statusMessage: 'A tag with that name already exists' })
    }
    throw err
  }

  return { ok: true }
})
