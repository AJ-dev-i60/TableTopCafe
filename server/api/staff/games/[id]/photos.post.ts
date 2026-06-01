import { requireAuth } from '../../../../services/auth'
import { processPhoto, getPlaceholderHashes } from '../../../../services/photos'
import { getGameById } from '../../../../db/queries/games'
import { db } from '../../../../db/client'
import { photos } from '../../../../db/schema'
import { and, eq, inArray, sql } from 'drizzle-orm'

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

  const formData = await readMultipartFormData(event)
  if (!formData || formData.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No files uploaded' })
  }

  // Determine starting position for new photos
  const [posRow] = await db
    .select({ maxPos: sql<number>`coalesce(max(${photos.position}), -1)` })
    .from(photos)
    .where(eq(photos.gameId, id))

  let nextPos = (posRow?.maxPos ?? -1) + 1

  const hashes: string[] = []
  for (const part of formData) {
    if (!part.data || !part.type?.startsWith('image/')) continue

    const hash = await processPhoto(part.data)

    await db
      .insert(photos)
      .values({ gameId: id, contentHash: hash, position: nextPos })
      .onConflictDoNothing()

    hashes.push(hash)
    nextPos++
  }

  if (hashes.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'No valid image files found' })
  }

  // A real photo now exists, so drop any seeded placeholder rows for this game —
  // a "placeholder" should never sit alongside a real upload. Only the DB rows
  // are removed: placeholder image files are shared across games by hash, so the
  // files on disk must stay.
  const placeholderHashes = await getPlaceholderHashes()
  await db
    .delete(photos)
    .where(and(eq(photos.gameId, id), inArray(photos.contentHash, [...placeholderHashes])))

  return { hashes }
})
