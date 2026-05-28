import { eq } from 'drizzle-orm'
import type { InferSelectModel } from 'drizzle-orm'
import { db } from '../client'
import { users } from '../schema'

type UserRow = InferSelectModel<typeof users>

export type PublicUser = Pick<UserRow, 'id' | 'username' | 'role' | 'createdAt'>

export async function getUserByUsername(username: string): Promise<UserRow | null> {
  const [row] = await db.select().from(users).where(eq(users.username, username)).limit(1)
  return row ?? null
}

export async function getUserById(id: number): Promise<PublicUser | null> {
  const [row] = await db
    .select({ id: users.id, username: users.username, role: users.role, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, id))
    .limit(1)
  return row ?? null
}

export async function createUser(
  username: string,
  passwordHash: string,
  role: 'staff' | 'admin' = 'staff',
): Promise<PublicUser> {
  const [row] = await db
    .insert(users)
    .values({ username, passwordHash, role })
    .returning({ id: users.id, username: users.username, role: users.role, createdAt: users.createdAt })
  if (!row) throw new Error('Insert returned no row')
  return row
}
