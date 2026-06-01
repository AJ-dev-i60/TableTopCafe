import { and, asc, count, eq, inArray, isNull } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { db } from '../client'
import { gameTags, games, photos, tags } from '../schema'

export type TagItem = Pick<InferSelectModel<typeof tags>, 'id' | 'name'>

export async function listActiveTags(): Promise<TagItem[]> {
  return db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(isNull(tags.archivedAt))
    .orderBy(asc(tags.name))
}

export type StaffTagItem = Pick<InferSelectModel<typeof tags>, 'id' | 'name' | 'archivedAt'> & {
  gameCount: number
}

export async function listAllTagsForStaff(): Promise<StaffTagItem[]> {
  const rows = await db
    .select({
      id: tags.id,
      name: tags.name,
      archivedAt: tags.archivedAt,
      gameCount: count(gameTags.gameId),
    })
    .from(tags)
    .leftJoin(gameTags, eq(tags.id, gameTags.tagId))
    .groupBy(tags.id, tags.name, tags.archivedAt)
    .orderBy(asc(tags.name))

  return rows.map((r) => ({ ...r, gameCount: Number(r.gameCount) }))
}

export async function createTag(name: string, actorId: number): Promise<TagItem> {
  // Returns existing tag if the name already exists (case-sensitive match)
  const [existing] = await db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(eq(tags.name, name))
    .limit(1)
  if (existing) return existing

  const [row] = await db
    .insert(tags)
    .values({ name, createdById: actorId })
    .returning({ id: tags.id, name: tags.name })
  if (!row) throw new Error('Insert returned no row')
  return row
}

export async function renameTag(id: number, name: string): Promise<void> {
  // Check for name collision with a different tag
  const [conflict] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(eq(tags.name, name))
    .limit(1)
  if (conflict && conflict.id !== id) {
    throw Object.assign(new Error('Tag name already exists'), { code: 'CONFLICT' })
  }
  await db.update(tags).set({ name }).where(eq(tags.id, id))
}

export async function mergeTag(sourceId: number, targetId: number): Promise<void> {
  await db.transaction(async (tx) => {
    // Get all games currently tagged with source
    const sourceGameTags = await tx
      .select({ gameId: gameTags.gameId })
      .from(gameTags)
      .where(eq(gameTags.tagId, sourceId))

    // Reassign to target, ignoring games that already have target
    if (sourceGameTags.length > 0) {
      await tx
        .insert(gameTags)
        .values(sourceGameTags.map((r) => ({ gameId: r.gameId, tagId: targetId })))
        .onConflictDoNothing()
    }

    // Remove source game_tags then the source tag itself
    await tx.delete(gameTags).where(eq(gameTags.tagId, sourceId))
    await tx.delete(tags).where(eq(tags.id, sourceId))
  })
}

export async function archiveTag(id: number): Promise<void> {
  await db.update(tags).set({ archivedAt: new Date() }).where(eq(tags.id, id))
}

export async function unarchiveTag(id: number): Promise<void> {
  await db.update(tags).set({ archivedAt: null }).where(eq(tags.id, id))
}

// Used by mergeTag UI to list valid merge targets for a given source
export async function listActiveTagsExcluding(excludeId: number): Promise<TagItem[]> {
  return db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(isNull(tags.archivedAt))
    .orderBy(asc(tags.name))
    .then((rows) => rows.filter((r) => r.id !== excludeId))
}

// ─── Tag detail: manage which games carry a tag ───────────────────────────────

export type TagDetail = Pick<InferSelectModel<typeof tags>, 'id' | 'name' | 'archivedAt'>

export async function getTagById(id: number): Promise<TagDetail | null> {
  const [row] = await db
    .select({ id: tags.id, name: tags.name, archivedAt: tags.archivedAt })
    .from(tags)
    .where(eq(tags.id, id))
    .limit(1)
  return row ?? null
}

export type TagGameItem = { id: number; name: string; photoHash: string | null }

// Live (non-deleted) games carrying this tag, with their first photo.
export async function listGamesForTag(tagId: number): Promise<TagGameItem[]> {
  const gameRows = await db
    .select({ id: games.id, name: games.name })
    .from(gameTags)
    .innerJoin(games, eq(gameTags.gameId, games.id))
    .where(and(eq(gameTags.tagId, tagId), isNull(games.deletedAt)))
    .orderBy(asc(games.name))

  if (gameRows.length === 0) return []

  const ids = gameRows.map((g) => g.id)
  const photoRows = await db
    .select({ gameId: photos.gameId, contentHash: photos.contentHash })
    .from(photos)
    .where(inArray(photos.gameId, ids))
    .orderBy(asc(photos.position))

  const firstPhotoByGame = new Map<number, string>()
  for (const row of photoRows) {
    if (!firstPhotoByGame.has(row.gameId)) firstPhotoByGame.set(row.gameId, row.contentHash)
  }

  return gameRows.map((g) => ({ ...g, photoHash: firstPhotoByGame.get(g.id) ?? null }))
}

export async function addGameToTag(gameId: number, tagId: number): Promise<void> {
  await db.insert(gameTags).values({ gameId, tagId }).onConflictDoNothing()
}

export async function removeGameFromTag(gameId: number, tagId: number): Promise<void> {
  await db.delete(gameTags).where(and(eq(gameTags.gameId, gameId), eq(gameTags.tagId, tagId)))
}
