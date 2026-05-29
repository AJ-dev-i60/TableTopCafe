import { requireAuth } from '../../../services/auth'
import { countFeaturedGames } from '../../../db/queries/games'

export default defineEventHandler(async (event) => {
  requireAuth(event)
  const count = await countFeaturedGames()
  return { count }
})
