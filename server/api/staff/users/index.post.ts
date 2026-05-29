import { z } from 'zod'
import { requireAdmin } from '../../../services/auth'
import { hashPassword } from '../../../services/auth'
import { createUser } from '../../../db/queries/users'

const bodySchema = z.object({
  username: z.string().min(1).max(100),
  password: z.string().min(8),
  role: z.enum(['staff', 'admin']).default('staff'),
})

export default defineEventHandler(async (event) => {
  requireAdmin(event)

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const passwordHash = await hashPassword(parsed.data.password)

  try {
    const user = await createUser(parsed.data.username, passwordHash, parsed.data.role)
    return { id: user.id, username: user.username, role: user.role }
  } catch (err: unknown) {
    const pg = err as { code?: string }
    if (pg.code === '23505') {
      throw createError({ statusCode: 409, statusMessage: 'Username already exists' })
    }
    throw err
  }
})
