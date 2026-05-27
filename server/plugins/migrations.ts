import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { resolve } from 'node:path'
import { db } from '../db/client'

export default defineNitroPlugin(async () => {
  await migrate(db, { migrationsFolder: resolve('server/db/migrations') })
})
