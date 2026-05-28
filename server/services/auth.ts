import { randomBytes } from 'node:crypto'
import { hash, verify } from '@node-rs/argon2'
import { eq, and, gt } from 'drizzle-orm'
import type { H3Event } from 'h3'
import { getCookie, setCookie, deleteCookie, createError } from 'h3'
import { db } from '../db/client'
import { sessions, users } from '../db/schema'

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_COOKIE = 'ttc_session'
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
const SESSION_REFRESH_THRESHOLD_MS = 15 * 24 * 60 * 60 * 1000 // refresh when <15 days remain

// ─── Types ────────────────────────────────────────────────────────────────────

export type SessionUser = {
  id: number
  username: string
  role: 'staff' | 'admin'
}

// ─── Password ─────────────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return hash(password, {
    algorithm: 2, // Argon2id
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  })
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return verify(hash, password)
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

function generateSessionId(): string {
  return randomBytes(32).toString('hex')
}

function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    expires: expiresAt,
  }
}

export async function createSession(event: H3Event, userId: number): Promise<void> {
  const id = generateSessionId()
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await db.insert(sessions).values({ id, userId, expiresAt })
  setCookie(event, SESSION_COOKIE, id, sessionCookieOptions(expiresAt))
}

export async function validateSession(event: H3Event): Promise<SessionUser | null> {
  const sessionId = getCookie(event, SESSION_COOKIE)
  if (!sessionId) return null

  const now = new Date()

  const [row] = await db
    .select({
      sessionId: sessions.id,
      sessionExpiresAt: sessions.expiresAt,
      userId: users.id,
      username: users.username,
      role: users.role,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.id, sessionId), gt(sessions.expiresAt, now)))
    .limit(1)

  if (!row) {
    deleteCookie(event, SESSION_COOKIE, { path: '/' })
    return null
  }

  // Refresh session when it's running low
  const remaining = row.sessionExpiresAt.getTime() - now.getTime()
  if (remaining < SESSION_REFRESH_THRESHOLD_MS) {
    const newExpiresAt = new Date(Date.now() + SESSION_TTL_MS)
    await db.update(sessions).set({ expiresAt: newExpiresAt }).where(eq(sessions.id, row.sessionId))
    setCookie(event, SESSION_COOKIE, row.sessionId, sessionCookieOptions(newExpiresAt))
  }

  return { id: row.userId, username: row.username, role: row.role as 'staff' | 'admin' }
}

export async function invalidateSession(event: H3Event): Promise<void> {
  const sessionId = getCookie(event, SESSION_COOKIE)
  if (sessionId) {
    await db.delete(sessions).where(eq(sessions.id, sessionId))
  }
  deleteCookie(event, SESSION_COOKIE, { path: '/' })
}

// ─── Guards ───────────────────────────────────────────────────────────────────

export function requireAuth(event: H3Event): SessionUser {
  const user = event.context.user as SessionUser | null
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  }
  return user
}

export function requireAdmin(event: H3Event): SessionUser {
  const user = requireAuth(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })
  }
  return user
}
