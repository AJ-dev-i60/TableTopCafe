import boardGamesData from '../data/board-games.json'
import { z } from 'zod'

/**
 * Static board-game name list, generated once from Wikidata and committed as
 * server/data/board-games.json (see scripts/refresh-game-names.ts). It ships
 * with the build and is read in-memory here — there is no database table and
 * nothing is seeded on deploy. Regenerate manually with `npm run gen:game-names`.
 */
const BoardGameSchema = z.object({
  name: z.string(),
  bggId: z.number().nullable(),
  yearPublished: z.number().nullable(),
})

export type GameNameResult = z.infer<typeof BoardGameSchema>

// Validated and frozen once per server process.
const boardGames: readonly GameNameResult[] = Object.freeze(
  z.array(BoardGameSchema).parse(boardGamesData),
)

const MAX_RESULTS = 20

/**
 * Case-insensitive substring search over the committed list. Orders the
 * shortest matching name first (a proxy for "closest match"), capped at 20.
 */
export function searchGameNames(query: string): GameNameResult[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') return []

  return boardGames
    .filter((game) => game.name.toLowerCase().includes(needle))
    .sort((a, b) => a.name.length - b.name.length)
    .slice(0, MAX_RESULTS)
}
