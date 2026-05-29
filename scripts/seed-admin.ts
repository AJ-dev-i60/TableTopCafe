/**
 * Creates the initial admin user when ADMIN_USERNAME and ADMIN_PASSWORD are set.
 * Idempotent: skips silently if the username already exists.
 * Run via: npm run db:seed-admin
 */
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import { hash } from '@node-rs/argon2'
import * as schema from '../server/db/schema/index.js'

const DATABASE_URL = process.env.DATABASE_URL
const ADMIN_USERNAME = process.env.ADMIN_USERNAME
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!DATABASE_URL) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}
if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  console.error('ADMIN_USERNAME and ADMIN_PASSWORD are required')
  process.exit(1)
}

const client = postgres(DATABASE_URL, { max: 1 })
const db = drizzle(client, { schema })

async function seedAdmin() {
  const passwordHash = await hash(ADMIN_PASSWORD!, {
    algorithm: 2,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  })

  const existing = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.username, ADMIN_USERNAME!))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(schema.users)
      .set({ passwordHash })
      .where(eq(schema.users.username, ADMIN_USERNAME!))
    console.log(`Admin user "${ADMIN_USERNAME}" password synced from env.`)
    return
  }

  await db.insert(schema.users).values({
    username: ADMIN_USERNAME!,
    passwordHash,
    role: 'admin',
  })

  console.log(`Admin user "${ADMIN_USERNAME}" created.`)
}

seedAdmin()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => client.end())
