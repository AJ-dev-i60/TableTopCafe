import { z } from 'zod'
import { getUserByUsername } from '../../db/queries/users'
import { verifyPassword, createSession } from '../../services/auth'

const bodySchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const user = await getUserByUsername(parsed.data.username)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  const valid = await verifyPassword(user.passwordHash, parsed.data.password)
  if (!valid) {
    throw createError({ statusCode: 401, statusMessage: 'Invalid credentials' })
  }

  await createSession(event, user.id)

  return { id: user.id, username: user.username, role: user.role }
})
