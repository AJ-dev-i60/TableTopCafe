import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'

export const games = pgTable('games', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  playerMin: integer('player_min').notNull(),
  playerMax: integer('player_max').notNull(),
  timeMin: integer('time_min').notNull(),
  timeMax: integer('time_max').notNull(),
  bggId: integer('bgg_id'),
  featured: boolean('featured').notNull().default(false),
  featuredNote: text('featured_note'),
  createdById: integer('created_by_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  lastEditedById: integer('last_edited_by_id'),
  lastEditedAt: timestamp('last_edited_at', { withTimezone: true }),
  deletedById: integer('deleted_by_id'),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
})
