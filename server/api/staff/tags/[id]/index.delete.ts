import { requireAuth } from '../../../../services/auth'
import { archiveTag } from '../../../../db/queries/tags'

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid tag id' })
  }

  await archiveTag(id)

  return { ok: true }
})
