import { searchBgg } from '../../services/bgg'
import { upsertBggCacheEntries } from '../../db/queries/bgg'
import { listBggIdsInCatalogue } from '../../db/queries/games'
import { db } from '../../db/client'
import { bggGamesCache } from '../../db/schema'
import { inArray } from 'drizzle-orm'

export default defineTask({
  meta: {
    name: 'bgg:refresh',
    description: 'Refresh BGG cache entries for all games in the catalogue that have a bgg_id',
  },
  async run() {
    const bggIds = await listBggIdsInCatalogue()
    if (bggIds.length === 0) return { result: 'no games with bgg_id' }

    // Fetch current cache entries to get their names for re-querying
    const cached = await db
      .select({ bggId: bggGamesCache.bggId, name: bggGamesCache.name })
      .from(bggGamesCache)
      .where(inArray(bggGamesCache.bggId, bggIds))

    let refreshed = 0
    for (const entry of cached) {
      try {
        const results = await searchBgg(entry.name)
        const match = results.find((r) => r.bggId === entry.bggId)
        if (match) {
          await upsertBggCacheEntries([match])
          refreshed++
        }
      } catch {
        // Skip on error — will retry next week
      }
      // Polite delay to avoid hammering BGG
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    return { result: `refreshed ${refreshed} of ${bggIds.length} entries` }
  },
})
