import { z } from 'zod'
import { requireAdmin } from '../../../../services/auth'
import { hashPassword } from '../../../../services/auth'
import { updateUserPassword } from '../../../../db/queries/users'

const bodySchema = z.object({
  password: z.string().min(8),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid user id' })
  }

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Password must be at least 8 characters' })
  }

  const passwordHash = await hashPassword(parsed.data.password)
  await updateUserPassword(id, passwordHash)

  return { ok: true }
})
