import { eq, ilike, sql } from 'drizzle-orm'
import { db } from '../client'
import { bggGamesCache } from '../schema'
import type { BggSearchResult } from '../../services/bgg'

export async function searchBggCache(query: string): Promise<BggSearchResult[]> {
  const pattern = `%${query}%`
  const rows = await db
    .select({
      bggId: bggGamesCache.bggId,
      name: bggGamesCache.name,
      yearPublished: bggGamesCache.yearPublished,
    })
    .from(bggGamesCache)
    .where(ilike(bggGamesCache.name, pattern))
    .orderBy(sql`length(${bggGamesCache.name})`)
    .limit(20)
  return rows
}

export async function upsertBggCacheEntries(entries: BggSearchResult[]): Promise<void> {
  if (entries.length === 0) return
  await db
    .insert(bggGamesCache)
    .values(
      entries.map((e) => ({
        bggId: e.bggId,
        name: e.name,
        yearPublished: e.yearPublished ?? undefined,
        cachedAt: new Date(),
      })),
    )
    .onConflictDoUpdate({
      target: bggGamesCache.bggId,
      set: {
        name: sql`excluded.name`,
        yearPublished: sql`excluded.year_published`,
        cachedAt: new Date(),
      },
    })
}

export async function getBggCacheEntry(bggId: number) {
  const rows = await db
    .select()
    .from(bggGamesCache)
    .where(eq(bggGamesCache.bggId, bggId))
    .limit(1)
  return rows[0] ?? null
}

export async function listCachedBggIds(): Promise<number[]> {
  const rows = await db.select({ bggId: bggGamesCache.bggId }).from(bggGamesCache)
  return rows.map((r) => r.bggId)
}
