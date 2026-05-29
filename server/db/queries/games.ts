import { and, asc, count, desc, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { db } from '../client'
import { gameTags, games, photos, tags } from '../schema'

type GameRow = InferSelectModel<typeof games>
type TagRow = Pick<InferSelectModel<typeof tags>, 'id' | 'name'>

export type GameListItem = Pick<
  GameRow,
  'id' | 'name' | 'description' | 'playerMin' | 'playerMax' | 'timeMin' | 'timeMax' | 'featured' | 'featuredNote'
> & {
  tags: TagRow[]
  photoHash: string | null
}

export async function listVisibleGames(): Promise<GameListItem[]> {
  const gameRows = await db
    .select({
      id: games.id,
      name: games.name,
      description: games.description,
      playerMin: games.playerMin,
      playerMax: games.playerMax,
      timeMin: games.timeMin,
      timeMax: games.timeMax,
      featured: games.featured,
      featuredNote: games.featuredNote,
    })
    .from(games)
    .where(isNull(games.deletedAt))
    .orderBy(desc(games.featured), asc(games.name))

  if (gameRows.length === 0) return []

  const ids = gameRows.map((g) => g.id)

  const [tagRows, photoRows] = await Promise.all([
    db
      .select({ gameId: gameTags.gameId, tagId: tags.id, tagName: tags.name })
      .from(gameTags)
      .innerJoin(tags, and(eq(gameTags.tagId, tags.id), isNull(tags.archivedAt)))
      .where(inArray(gameTags.gameId, ids)),
    db
      .select({ gameId: photos.gameId, contentHash: photos.contentHash, position: photos.position })
      .from(photos)
      .where(inArray(photos.gameId, ids))
      .orderBy(asc(photos.position)),
  ])

  const tagsByGame = new Map<number, TagRow[]>()
  for (const row of tagRows) {
    const list = tagsByGame.get(row.gameId) ?? []
    list.push({ id: row.tagId, name: row.tagName })
    tagsByGame.set(row.gameId, list)
  }

  const firstPhotoByGame = new Map<number, string>()
  for (const row of photoRows) {
    if (!firstPhotoByGame.has(row.gameId)) {
      firstPhotoByGame.set(row.gameId, row.contentHash)
    }
  }

  return gameRows.map((g) => ({
    ...g,
    tags: tagsByGame.get(g.id) ?? [],
    photoHash: firstPhotoByGame.get(g.id) ?? null,
  }))
}

// ─── Detail ───────────────────────────────────────────────────────────────────

type PhotoRow = Pick<InferSelectModel<typeof photos>, 'id' | 'contentHash' | 'position'>

export type GameDetail = Pick<
  GameRow,
  'id' | 'name' | 'description' | 'playerMin' | 'playerMax' | 'timeMin' | 'timeMax' | 'featured' | 'featuredNote'
> & {
  tags: TagRow[]
  photos: PhotoRow[]
}

export async function getGameById(id: number): Promise<GameDetail | null> {
  const [gameRow] = await db
    .select({
      id: games.id,
      name: games.name,
      description: games.description,
      playerMin: games.playerMin,
      playerMax: games.playerMax,
      timeMin: games.timeMin,
      timeMax: games.timeMax,
      featured: games.featured,
      featuredNote: games.featuredNote,
    })
    .from(games)
    .where(and(eq(games.id, id), isNull(games.deletedAt)))
    .limit(1)

  if (!gameRow) return null

  const [tagRows, photoRows] = await Promise.all([
    db
      .select({ id: tags.id, name: tags.name })
      .from(gameTags)
      .innerJoin(tags, and(eq(gameTags.tagId, tags.id), isNull(tags.archivedAt)))
      .where(eq(gameTags.gameId, id)),
    db
      .select({ id: photos.id, contentHash: photos.contentHash, position: photos.position })
      .from(photos)
      .where(eq(photos.gameId, id))
      .orderBy(asc(photos.position)),
  ])

  return { ...gameRow, tags: tagRows, photos: photoRows }
}

// ─── Write ────────────────────────────────────────────────────────────────────

type GameInput = {
  name: string
  description: string | null
  playerMin: number
  playerMax: number
  timeMin: number
  timeMax: number
  featured?: boolean
  featuredNote?: string | null
  bggId?: number | null
}

export async function createGame(
  input: GameInput,
  tagIds: number[],
  actorId: number,
): Promise<number> {
  const [row] = await db
    .insert(games)
    .values({
      name: input.name,
      description: input.description,
      playerMin: input.playerMin,
      playerMax: input.playerMax,
      timeMin: input.timeMin,
      timeMax: input.timeMax,
      bggId: input.bggId ?? null,
      featured: input.featured ?? false,
      featuredNote: input.featuredNote ?? null,
      createdById: actorId,
      createdAt: new Date(),
    })
    .returning({ id: games.id })

  if (!row) throw new Error('Insert returned no row')

  if (tagIds.length > 0) {
    await db
      .insert(gameTags)
      .values(tagIds.map((tagId) => ({ gameId: row.id, tagId })))
      .onConflictDoNothing()
  }

  return row.id
}

export async function updateGame(
  id: number,
  input: GameInput,
  tagIds: number[],
  actorId: number,
): Promise<void> {
  await db
    .update(games)
    .set({
      name: input.name,
      description: input.description,
      playerMin: input.playerMin,
      playerMax: input.playerMax,
      timeMin: input.timeMin,
      timeMax: input.timeMax,
      bggId: input.bggId ?? null,
      featured: input.featured ?? false,
      featuredNote: input.featuredNote ?? null,
      lastEditedById: actorId,
      lastEditedAt: new Date(),
    })
    .where(and(eq(games.id, id), isNull(games.deletedAt)))

  // Replace tags: delete existing, insert new
  await db.delete(gameTags).where(eq(gameTags.gameId, id))
  if (tagIds.length > 0) {
    await db
      .insert(gameTags)
      .values(tagIds.map((tagId) => ({ gameId: id, tagId })))
      .onConflictDoNothing()
  }
}

export async function countFeaturedGames(excludeId?: number): Promise<number> {
  const conditions = [isNull(games.deletedAt), eq(games.featured, true)]
  if (excludeId !== undefined) conditions.push(sql`${games.id} != ${excludeId}`)
  const [row] = await db.select({ n: count() }).from(games).where(and(...conditions))
  return row?.n ?? 0
}

export async function softDeleteGame(id: number, actorId: number): Promise<void> {
  await db
    .update(games)
    .set({ deletedAt: new Date(), deletedById: actorId })
    .where(and(eq(games.id, id), isNull(games.deletedAt)))
}

// Staff list — includes all columns needed for the dashboard (no deleted filter)
export type StaffGameListItem = Pick<
  GameRow,
  'id' | 'name' | 'playerMin' | 'playerMax' | 'timeMin' | 'timeMax' | 'featured' | 'deletedAt'
>

export async function listBggIdsInCatalogue(): Promise<number[]> {
  const rows = await db
    .select({ bggId: games.bggId })
    .from(games)
    .where(and(isNull(games.deletedAt), isNotNull(games.bggId)))
  return rows.map((r) => r.bggId!)
}

export async function listAllGamesForStaff(): Promise<StaffGameListItem[]> {
  return db
    .select({
      id: games.id,
      name: games.name,
      playerMin: games.playerMin,
      playerMax: games.playerMax,
      timeMin: games.timeMin,
      timeMax: games.timeMax,
      featured: games.featured,
      deletedAt: games.deletedAt,
    })
    .from(games)
    .orderBy(asc(games.name))
}
