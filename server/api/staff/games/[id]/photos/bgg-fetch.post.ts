import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import { requireAuth } from '../../../../../services/auth'
import { processPhoto } from '../../../../../services/photos'
import { getGameById } from '../../../../../db/queries/games'
import { db } from '../../../../../db/client'
import { photos } from '../../../../../db/schema'

const BodySchema = z.object({
  imageUrl: z.string().url(),
})

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

  const body = BodySchema.safeParse(await readBody(event))
  if (!body.success) {
    throw createError({ statusCode: 400, statusMessage: 'imageUrl is required' })
  }

  // Fetch the image server-side so the client never touches BGG directly
  const imageRes = await fetch(body.data.imageUrl)
  if (!imageRes.ok) {
    throw createError({ statusCode: 502, statusMessage: 'Failed to fetch BGG image' })
  }

  const contentType = imageRes.headers.get('content-type') ?? ''
  if (!contentType.startsWith('image/')) {
    throw createError({ statusCode: 422, statusMessage: 'URL did not return an image' })
  }

  const buffer = Buffer.from(await imageRes.arrayBuffer())

  const [posRow] = await db
    .select({ maxPos: sql<number>`coalesce(max(${photos.position}), -1)` })
    .from(photos)
    .where(eq(photos.gameId, id))

  const nextPos = (posRow?.maxPos ?? -1) + 1
  const hash = await processPhoto(buffer)

  await db
    .insert(photos)
    .values({ gameId: id, contentHash: hash, position: nextPos })
    .onConflictDoNothing()

  return { hash }
})
