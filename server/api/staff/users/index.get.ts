import { requireAdmin } from '../../../services/auth'
import { listUsers } from '../../../db/queries/users'

export default defineEventHandler(async (event) => {
  requireAdmin(event)
  return listUsers()
})
