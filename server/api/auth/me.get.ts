import { requireAuth } from '../../services/auth'

export default defineEventHandler((event) => {
  const user = requireAuth(event)
  return { id: user.id, username: user.username, role: user.role }
})
