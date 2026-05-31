import boardGamesData from '../data/board-games.json'
import { z } from 'zod'

/**
 * Static board-game name list, committed as server/data/board-games.json
 * (generated from BGG's official ranks dump — see scripts/convert-bgg-ranks.ts,
 * `npm run bgg:ranks`). It ships with the build and is read in-memory here —
 * there is no database table and nothing is seeded on deploy.
 */
const BoardGameSchema = z.object({
  name: z.string(),
  bggId: z.number(),
  yearPublished: z.number().nullable(),
  usersRated: z.number(),
})

type BoardGame = z.infer<typeof BoardGameSchema>

// The shape returned to callers (the API/component don't need the rating count).
export type GameNameResult = {
  name: string
  bggId: number | null
  yearPublished: number | null
}

// Validated and frozen once per server process.
const boardGames: readonly BoardGame[] = Object.freeze(
  z.array(BoardGameSchema).parse(boardGamesData),
)

const MAX_RESULTS = 20

/**
 * Case-insensitive substring search over the committed list. Ranks the
 * most-rated (most recognizable) games first so common titles surface ahead of
 * obscure variants/expansions; shorter name breaks ties. Capped at 20.
 */
export function searchGameNames(query: string): GameNameResult[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return []

  return boardGames
    .filter((game) => game.name.toLowerCase().includes(needle))
    .sort((a, b) => b.usersRated - a.usersRated || a.name.length - b.name.length)
    .slice(0, MAX_RESULTS)
    .map(({ name, bggId, yearPublished }) => ({ name, bggId, yearPublished }))
}
