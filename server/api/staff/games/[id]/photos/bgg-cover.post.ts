import { eq, sql } from 'drizzle-orm'
import { requireAuth } from '../../../../../services/auth'
import { processPhoto } from '../../../../../services/photos'
import { fetchBggCoverUrl } from '../../../../../services/bgg'
import { getGameById } from '../../../../../db/queries/games'
import { db } from '../../../../../db/client'
import { photos } from '../../../../../db/schema'

// Fetches the game's cover from its BGG page (scraped server-side) and stores it
// through the same sharp pipeline as uploads. Requires the game to have a linked
// BGG id (captured when picked from search).
export default defineEventHandler(async (event) => {
  requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid game id' })
  }

  const existing = await getGameById(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Game not found' })
  }
  if (existing.bggId === null) {
    throw createError({ statusCode: 422, statusMessage: 'Game has no linked BoardGameGeek id' })
  }

  const coverUrl = await fetchBggCoverUrl(existing.bggId)
  if (!coverUrl) {
    throw createError({ statusCode: 502, statusMessage: 'Could not find a cover image on BGG' })
  }

  const imageRes = await fetch(coverUrl)
  if (!imageRes.ok) {
    throw createError({ statusCode: 502, statusMessage: 'Failed to download the BGG cover' })
  }
  if (!(imageRes.headers.get('content-type') ?? '').startsWith('image/')) {
    throw createError({ statusCode: 422, statusMessage: 'BGG cover URL did not return an image' })
  }

  const buffer = Buffer.from(await imageRes.arrayBuffer())
  const hash = await processPhoto(buffer)

  const [posRow] = await db
    .select({ maxPos: sql<number>`coalesce(max(${photos.position}), -1)` })
    .from(photos)
    .where(eq(photos.gameId, id))
  const nextPos = (posRow?.maxPos ?? -1) + 1

  await db
    .insert(photos)
    .values({ gameId: id, contentHash: hash, position: nextPos })
    .onConflictDoNothing()

  return { hash }
})
