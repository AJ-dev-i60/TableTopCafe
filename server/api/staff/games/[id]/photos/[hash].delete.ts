import { requireAuth } from '../../../../../services/auth'
import { deletePhotoFiles } from '../../../../../services/photos'
import { getGameById, deleteGamePhoto, countPhotoHashReferences } from '../../../../../db/queries/games'

const HASH_RE = /^[a-f0-9]{32}$/

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

  await deleteGamePhoto(id, hash)

  // Only bin the files when nothing else (another game, a placeholder) uses them.
  if ((await countPhotoHashReferences(hash)) === 0) {
    await deletePhotoFiles(hash)
  }

  return { ok: true }
})
