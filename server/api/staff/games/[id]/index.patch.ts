import { z } from 'zod'
import { requireAuth } from '../../../../services/auth'
import { updateGame, getGameById } from '../../../../db/queries/games'
import { createTag } from '../../../../db/queries/tags'

const bodySchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(2000).nullable().default(null),
  playerMin: z.number().int().min(1),
  playerMax: z.number().int().min(1),
  timeMin: z.number().int().min(1),
  timeMax: z.number().int().min(1),
  featured: z.boolean().default(false),
  featuredNote: z.string().max(500).nullable().default(null),
  tagIds: z.array(z.number().int().positive()).default([]),
  newTagNames: z.array(z.string().min(1).max(100)).default([]),
  bggId: z.number().int().positive().nullable().optional(),
})

export default defineEventHandler(async (event) => {
  const actor = requireAuth(event)

  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid game id' })
  }

  const existing = await getGameById(id)
  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Game not found' })
  }

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const { tagIds, newTagNames, ...gameInput } = parsed.data

  const createdTags = await Promise.all(newTagNames.map((name) => createTag(name, actor.id)))
  const allTagIds = [...new Set([...tagIds, ...createdTags.map((t) => t.id)])]

  await updateGame(id, gameInput, allTagIds, actor.id)

  return { ok: true }
})
