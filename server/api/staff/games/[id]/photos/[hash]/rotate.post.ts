import { z } from 'zod'
import { requireAuth } from '../../../../../../services/auth'
import { rotatePhoto, deletePhotoFiles } from '../../../../../../services/photos'
import {
  getGameById,
  gameHasPhoto,
  updateGamePhotoHash,
  countPhotoHashReferences,
} from '../../../../../../db/queries/games'

const HASH_RE = /^[a-f0-9]{32}$/
const bodySchema = z.object({ direction: z.enum(['cw', 'ccw']) })

export default defineEventHandler(async (event) => {
  requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid game id' })
  }

  const hash = getRouterParam(event, 'hash')
  if (!hash || !HASH_RE.test(hash)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid photo hash' })
  }

  const game = await getGameById(id)
  if (!game) {
    throw createError({ statusCode: 404, statusMessage: 'Game not found' })
  }
  if (!(await gameHasPhoto(id, hash))) {
    throw createError({ statusCode: 404, statusMessage: 'Photo not found on this game' })
  }

  const parsed = bodySchema.safeParse(await readBody(event))
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const newHash = await rotatePhoto(hash, parsed.data.direction)
  await updateGamePhotoHash(id, hash, newHash)

  // Drop the pre-rotation files if nothing else references them.
  if (newHash !== hash && (await countPhotoHashReferences(hash)) === 0) {
    await deletePhotoFiles(hash)
  }

  return { hash: newHash }
})
