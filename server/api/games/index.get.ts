import { listVisibleGames } from '../../db/queries/games'

export default defineEventHandler(async () => {
  return listVisibleGames()
})
