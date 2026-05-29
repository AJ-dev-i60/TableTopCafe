import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const bggGamesCache = pgTable('bgg_games_cache', {
  id: serial('id').primaryKey(),
  bggId: integer('bgg_id').notNull().unique(),
  name: text('name').notNull(),
  yearPublished: integer('year_published'),
  thumbnail: text('thumbnail'),
  cachedAt: timestamp('cached_at', { withTimezone: true }).notNull().defaultNow(),
})
