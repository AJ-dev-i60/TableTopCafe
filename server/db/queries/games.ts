import { and, asc, count, desc, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { db } from '../client'
import { gameTags, games, photos, tags, users } from '../schema'

type GameRow = InferSelectModel<typeof games>
type TagRow = Pick<InferSelectModel<typeof tags>, 'id' | 'name'>

// The public catalogue list renders name, meta, tags, featured flag, and the
// first photo only. `description`/`featuredNote` are intentionally NOT selected
// here — they're large (≤2000-char Wikipedia text) and only the detail page
// uses them (via GameDetail), so shipping them for ~400 games would bloat the
// SSR HTML and hydration payload for no render benefit.
export type GameListItem = Pick<
  GameRow,
  'id' | 'name' | 'playerMin' | 'playerMax' | 'timeMin' | 'timeMax' | 'featured'
> & {
  tags: TagRow[]
  photoHash: string | null
}

export async function listVisibleGames(): Promise<GameListItem[]> {
  const gameRows = await db
    .select({
      id: games.id,
      name: games.name,
      playerMin: games.playerMin,
      playerMax: games.playerMax,
      timeMin: games.timeMin,
      timeMax: games.timeMax,
      featured: games.featured,
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
  'id' | 'name' | 'description' | 'playerMin' | 'playerMax' | 'timeMin' | 'timeMax' | 'featured' | 'featuredNote' | 'bggId'
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
      bggId: games.bggId,
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
      featuredAt: input.featured ? new Date() : null,
      featuredById: input.featured ? actorId : null,
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
      // Stamp featured audit on transition: keep the existing values while it
      // stays featured, set now()/actor when newly featured, clear when unfeatured.
      featuredAt: input.featured
        ? sql`coalesce(${games.featuredAt}, now())`
        : null,
      featuredById: input.featured
        ? sql`coalesce(${games.featuredById}, ${actorId})`
        : null,
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

// Toggle a single game's featured state, stamping/clearing the featured audit.
export async function setFeatured(id: number, featured: boolean, actorId: number): Promise<void> {
  await db
    .update(games)
    .set({
      featured,
      featuredAt: featured ? new Date() : null,
      featuredById: featured ? actorId : null,
    })
    .where(and(eq(games.id, id), isNull(games.deletedAt)))
}

// Atomically swap one featured game for another so the 3-slot cap is never
// transiently exceeded and a partial failure can't leave 2 or 4 featured.
export async function replaceFeatured(
  outgoingId: number,
  incomingId: number,
  actorId: number,
): Promise<void> {
  await db.transaction(async (tx) => {
    await tx
      .update(games)
      .set({ featured: false, featuredAt: null, featuredById: null })
      .where(and(eq(games.id, outgoingId), isNull(games.deletedAt)))
    await tx
      .update(games)
      .set({ featured: true, featuredAt: new Date(), featuredById: actorId })
      .where(and(eq(games.id, incomingId), isNull(games.deletedAt)))
  })
}

export async function softDeleteGame(id: number, actorId: number): Promise<void> {
  await db
    .update(games)
    .set({ deletedAt: new Date(), deletedById: actorId })
    .where(and(eq(games.id, id), isNull(games.deletedAt)))
}

export async function restoreGame(id: number, actorId: number): Promise<void> {
  await db
    .update(games)
    .set({ deletedAt: null, deletedById: null, lastEditedById: actorId, lastEditedAt: new Date() })
    .where(and(eq(games.id, id), isNotNull(games.deletedAt)))
}

// Staff list — includes all columns needed for the dashboard (no deleted filter)
export type StaffGameListItem = Pick<
  GameRow,
  'id' | 'name' | 'playerMin' | 'playerMax' | 'timeMin' | 'timeMax' | 'featured' | 'featuredAt' | 'deletedAt'
> & { photoHash: string | null; featuredBy: string | null }

export async function listBggIdsInCatalogue(): Promise<number[]> {
  const rows = await db
    .select({ bggId: games.bggId })
    .from(games)
    .where(and(isNull(games.deletedAt), isNotNull(games.bggId)))
  return rows.map((r) => r.bggId!)
}

export async function listAllGamesForStaff(): Promise<StaffGameListItem[]> {
  const gameRows = await db
    .select({
      id: games.id,
      name: games.name,
      playerMin: games.playerMin,
      playerMax: games.playerMax,
      timeMin: games.timeMin,
      timeMax: games.timeMax,
      featured: games.featured,
      featuredAt: games.featuredAt,
      featuredBy: users.username,
      deletedAt: games.deletedAt,
    })
    .from(games)
    .leftJoin(users, eq(games.featuredById, users.id))
    .orderBy(asc(games.name))

  if (gameRows.length === 0) return gameRows.map((g) => ({ ...g, photoHash: null }))

  const ids = gameRows.map((g) => g.id)
  const photoRows = await db
    .select({ gameId: photos.gameId, contentHash: photos.contentHash })
    .from(photos)
    .where(inArray(photos.gameId, ids))
    .orderBy(asc(photos.position))

  const firstPhotoByGame = new Map<number, string>()
  for (const row of photoRows) {
    if (!firstPhotoByGame.has(row.gameId)) {
      firstPhotoByGame.set(row.gameId, row.contentHash)
    }
  }

  return gameRows.map((g) => ({ ...g, photoHash: firstPhotoByGame.get(g.id) ?? null }))
}

// ─── Photo row management (delete / rotate) ───────────────────────────────────

export async function deleteGamePhoto(gameId: number, contentHash: string): Promise<void> {
  await db.delete(photos).where(and(eq(photos.gameId, gameId), eq(photos.contentHash, contentHash)))
}

// Rotate stores a freshly-processed image under a new hash; point the same row
// at it, keeping its position.
export async function updateGamePhotoHash(gameId: number, oldHash: string, newHash: string): Promise<void> {
  await db
    .update(photos)
    .set({ contentHash: newHash })
    .where(and(eq(photos.gameId, gameId), eq(photos.contentHash, oldHash)))
}

// How many photo rows (across all games) still point at a hash — used to decide
// whether the files on disk can be removed (placeholders are shared by hash).
export async function countPhotoHashReferences(contentHash: string): Promise<number> {
  const [row] = await db
    .select({ c: sql<number>`count(*)` })
    .from(photos)
    .where(eq(photos.contentHash, contentHash))
  return Number(row?.c ?? 0)
}

export async function gameHasPhoto(gameId: number, contentHash: string): Promise<boolean> {
  const [row] = await db
    .select({ id: photos.id })
    .from(photos)
    .where(and(eq(photos.gameId, gameId), eq(photos.contentHash, contentHash)))
    .limit(1)
  return !!row
}

// Persist a new photo order: each hash's position becomes its index in the list.
export async function reorderGamePhotos(gameId: number, orderedHashes: string[]): Promise<void> {
  await db.transaction(async (tx) => {
    for (let i = 0; i < orderedHashes.length; i++) {
      await tx
        .update(photos)
        .set({ position: i })
        .where(and(eq(photos.gameId, gameId), eq(photos.contentHash, orderedHashes[i]!)))
    }
  })
}
