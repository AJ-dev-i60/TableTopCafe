import { requireAuth } from '../../../services/auth'
import { listAllGamesForStaff } from '../../../db/queries/games'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  return listAllGamesForStaff()
})
