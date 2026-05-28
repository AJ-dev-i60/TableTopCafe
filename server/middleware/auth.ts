import { validateSession } from '../services/auth'

// Runs on every request. Populates event.context.user if the session cookie is
// valid; leaves it null otherwise. Auth enforcement is done per-route via
// requireAuth() — this middleware never rejects requests.
export default defineEventHandler(async (event) => {
  event.context.user = await validateSession(event)
})
