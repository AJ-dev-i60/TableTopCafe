import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { resolve } from 'node:path'
import { env } from '../config'

export default defineNitroPlugin(async () => {
  console.log('[migrations] starting...')
  const client = postgres(env.DATABASE_URL, { max: 1 })
  try {
    await migrate(drizzle(client), { migrationsFolder: resolve('server/db/migrations') })
    console.log('[migrations] done')
  } catch (err) {
    console.error('[migrations] failed:', err)
    throw err
  } finally {
    await client.end()
  }
})
