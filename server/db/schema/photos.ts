import { index, integer, pgTable, serial, smallint, text, timestamp } from 'drizzle-orm/pg-core'
import { games } from './games'

export const photos = pgTable(
  'photos',
  {
    id: serial('id').primaryKey(),
    gameId: integer('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    contentHash: text('content_hash').notNull(),
    position: smallint('position').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    byGame: index('photos_game_id_idx').on(t.gameId),
  }),
)
