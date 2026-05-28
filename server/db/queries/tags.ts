import { asc, isNull } from 'drizzle-orm'
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
