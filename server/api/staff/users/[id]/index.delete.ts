import { requireAdmin } from '../../../../services/auth'
import { deleteUser } from '../../../../db/queries/users'

export default defineEventHandler(async (event) => {
  const actor = requireAdmin(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid user id' })
  }

  if (id === actor.id) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot delete your own account' })
  }

  await deleteUser(id)

  return { ok: true }
})
