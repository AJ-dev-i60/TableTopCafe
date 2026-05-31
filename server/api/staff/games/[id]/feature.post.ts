import { z } from 'zod'
import { requireAuth } from '../../../../services/auth'
import {
  countFeaturedGames,
  getGameById,
  replaceFeatured,
  setFeatured,
} from '../../../../db/queries/games'

// Optional `replace`: the id of a currently-featured game to swap out when the
// 3-slot cap is full. Without it, featuring at the cap is rejected (422) and the
// client opens the replace-picker.
const bodySchema = z.object({
  replace: z.number().int().positive().optional(),
})

export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid game id' })
  }

  // Body is optional — a plain "feature" call sends none; only the replace flow
  // sends { replace }. Treat an empty/absent body as {}.
  const raw = (await readBody(event).catch(() => undefined)) ?? {}
  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const game = await getGameById(id)
  if (!game) {
    throw createError({ statusCode: 404, statusMessage: 'Game not found' })
  }
  if (game.featured) {
    return { ok: true } // already featured — no-op
  }

  // Count featured excluding this game (it isn't featured, but keep it robust).
  const featuredCount = await countFeaturedGames(id)

  if (featuredCount < 3) {
    await setFeatured(id, true, actor.id)
    return { ok: true }
  }

  // At the cap: require an explicit game to replace.
  const replaceId = parsed.data.replace
  if (replaceId === undefined) {
    throw createError({ statusCode: 422, statusMessage: 'Featured limit reached (max 3)' })
  }
  if (replaceId === id) {
    throw createError({ statusCode: 400, statusMessage: 'Cannot replace a game with itself' })
  }

  const outgoing = await getGameById(replaceId)
  if (!outgoing || !outgoing.featured) {
    throw createError({ statusCode: 422, statusMessage: 'Game to replace is not currently featured' })
  }

  await replaceFeatured(replaceId, id, actor.id)
  return { ok: true }
})
