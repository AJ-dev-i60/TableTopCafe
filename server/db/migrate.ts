import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import { resolve } from 'node:path'
import { env } from '../config'

const client = postgres(env.DATABASE_URL, { max: 1 })
const db = drizzle(client)

await migrate(db, { migrationsFolder: resolve('server/db/migrations') })
await client.end()
console.log('Migrations applied')
