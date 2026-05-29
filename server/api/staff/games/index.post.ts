import { z } from 'zod'
import { requireAuth } from '../../../services/auth'
import { createGame } from '../../../db/queries/games'
import { createTag } from '../../../db/queries/tags'

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

  const body = await readBody(event)
  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid request body' })
  }

  const { tagIds, newTagNames, ...gameInput } = parsed.data

  const createdTags = await Promise.all(newTagNames.map((name) => createTag(name, actor.id)))
  const allTagIds = [...new Set([...tagIds, ...createdTags.map((t) => t.id)])]

  const gameId = await createGame(gameInput, allTagIds, actor.id)

  return { id: gameId }
})
