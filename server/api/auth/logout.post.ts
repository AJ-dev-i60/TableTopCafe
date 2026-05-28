import { invalidateSession } from '../../services/auth'

export default defineEventHandler(async (event) => {
  await invalidateSession(event)
  return { ok: true }
})
