import { asc, eq, isNull } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { db } from '../client'
import { tags } from '../schema'

export type TagItem = Pick<InferSelectModel<typeof tags>, 'id' | 'name'>

export async function listActiveTags(): Promise<TagItem[]> {
  return db
    .select({ id: tags.id, name: tags.name })
    .from(tags)
    .where(isNull(tags.archivedAt))
    .orderBy(asc(tags.name))
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
