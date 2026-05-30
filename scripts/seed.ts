/**
 * Seed ~20 real board games with tags and placeholder photos.
 * Run with: npm run db:seed
 * Requires DATABASE_URL in env. PHOTOS_DIR defaults to ./photos.
 */
import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { eq } from 'drizzle-orm'
import * as schema from '../server/db/schema/index.js'
import { writePlaceholderPhoto } from '../server/services/photos.js'

const { games, tags, gameTags, photos } = schema

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('DATABASE_URL is required')
  process.exit(1)
}

const client = postgres(DATABASE_URL, { max: 1 })
const db = drizzle(client, { schema })

// ─── Data ─────────────────────────────────────────────────────────────────────

const TAG_NAMES = [
  'Strategy',
  'Family',
  'Cooperative',
  'Party',
  'Deck-building',
  'Tile-laying',
  'Worker placement',
  'Engine building',
  'Social deduction',
  'Abstract',
  'Card game',
  'Quick play',
  'Competitive',
  'Area control',
]

type GameSeed = {
  name: string
  description: string
  playerMin: number
  playerMax: number
  timeMin: number
  timeMax: number
  featured: boolean
  tags: string[]
}

const GAMES: GameSeed[] = [
  {
    name: 'Catan',
    description:
      'Trade, build, and settle the island of Catan in this classic resource-management game. Collect wood, brick, wheat, ore, and sheep to build roads, settlements, and cities while blocking your opponents.',
    playerMin: 3,
    playerMax: 4,
    timeMin: 60,
    timeMax: 120,
    featured: true,
    tags: ['Strategy', 'Family', 'Competitive'],
  },
  {
    name: 'Ticket to Ride',
    description:
      'Claim railway routes across the map to connect distant cities. The longer your routes, the more points you score — but watch out for rivals cutting you off.',
    playerMin: 2,
    playerMax: 5,
    timeMin: 45,
    timeMax: 75,
    featured: true,
    tags: ['Strategy', 'Family', 'Competitive'],
  },
  {
    name: 'Carcassonne',
    description:
      'Build the medieval landscape of southern France one tile at a time, placing followers as knights, monks, farmers, and thieves to score points from cities, roads, and fields.',
    playerMin: 2,
    playerMax: 5,
    timeMin: 30,
    timeMax: 45,
    featured: false,
    tags: ['Strategy', 'Tile-laying', 'Family'],
  },
  {
    name: 'Pandemic',
    description:
      'Work together as a team of specialists to stop four deadly diseases from wiping out humanity. Travel the world, treat infections, share knowledge, and find cures before time runs out.',
    playerMin: 2,
    playerMax: 4,
    timeMin: 45,
    timeMax: 60,
    featured: true,
    tags: ['Cooperative', 'Strategy', 'Card game'],
  },
  {
    name: 'Dominion',
    description:
      'Build your deck from scratch, acquiring action cards and treasures to score the most victory points. The game that launched the deck-building genre — no two games play the same.',
    playerMin: 2,
    playerMax: 4,
    timeMin: 30,
    timeMax: 60,
    featured: false,
    tags: ['Deck-building', 'Card game', 'Strategy'],
  },
  {
    name: '7 Wonders',
    description:
      'Lead an ancient civilisation to greatness by drafting cards to develop your city\'s science, commerce, military, and culture — all while building one of the seven wonders of the ancient world.',
    playerMin: 2,
    playerMax: 7,
    timeMin: 30,
    timeMax: 45,
    featured: false,
    tags: ['Strategy', 'Card game', 'Engine building'],
  },
  {
    name: 'Codenames',
    description:
      'Two rival spymasters give one-word clues to help their team identify secret agents on a grid of word cards. Avoid the assassin and contact all your agents before the other team does.',
    playerMin: 2,
    playerMax: 8,
    timeMin: 15,
    timeMax: 30,
    featured: false,
    tags: ['Party', 'Social deduction', 'Quick play'],
  },
  {
    name: 'Splendor',
    description:
      'Collect gem tokens to purchase development cards that grant permanent gem bonuses, attracting nobles and scoring prestige points. An elegant engine-building game that\'s deceptively simple to learn.',
    playerMin: 2,
    playerMax: 4,
    timeMin: 30,
    timeMax: 60,
    featured: false,
    tags: ['Strategy', 'Engine building', 'Competitive'],
  },
  {
    name: 'Azul',
    description:
      'Draft vivid azulejo tiles to complete patterns on your personal board. Score points for completing rows and columns, but lose points for leftover tiles — perfect balance of planning and reaction.',
    playerMin: 2,
    playerMax: 4,
    timeMin: 30,
    timeMax: 45,
    featured: false,
    tags: ['Abstract', 'Strategy', 'Family'],
  },
  {
    name: 'Wingspan',
    description:
      'Attract birds to your wildlife preserves in this engine-building game rich with stunning artwork. Each bird you play cascades powerful abilities through your habitat\'s food, egg, and card engines.',
    playerMin: 1,
    playerMax: 5,
    timeMin: 40,
    timeMax: 70,
    featured: false,
    tags: ['Engine building', 'Strategy', 'Competitive'],
  },
  {
    name: 'Terraforming Mars',
    description:
      'Compete as corporations racing to make Mars habitable: raise temperature, oxygen, and ocean levels while building cities and forests. A dense strategic engine played out over a century of colonisation.',
    playerMin: 1,
    playerMax: 5,
    timeMin: 120,
    timeMax: 180,
    featured: false,
    tags: ['Strategy', 'Engine building', 'Worker placement'],
  },
  {
    name: 'Agricola',
    description:
      'Feed your family, improve your farmhouse, and grow your fields in this challenging worker-placement classic. Every turn matters — neglect your livestock or crops and face famine.',
    playerMin: 1,
    playerMax: 5,
    timeMin: 60,
    timeMax: 150,
    featured: false,
    tags: ['Worker placement', 'Strategy', 'Competitive'],
  },
  {
    name: 'Dixit',
    description:
      'One player conjures a phrase for a beautifully illustrated card; others pick matching cards from their hand. Guess too obviously and score nothing — the art of the perfect clue is everything.',
    playerMin: 3,
    playerMax: 6,
    timeMin: 30,
    timeMax: 45,
    featured: false,
    tags: ['Party', 'Family', 'Quick play'],
  },
  {
    name: 'Betrayal at House on the Hill',
    description:
      'Explore a haunted mansion room by room until the haunt begins — then one player becomes the traitor. Fifty unique scenarios mean every game tells a different horror story.',
    playerMin: 3,
    playerMax: 6,
    timeMin: 60,
    timeMax: 90,
    featured: false,
    tags: ['Cooperative', 'Strategy', 'Social deduction'],
  },
  {
    name: 'Love Letter',
    description:
      'A micro-game of deduction and risk: use your single hand card to eliminate rivals and deliver your love letter to the princess. Sixteen cards, enormous tension, plays in minutes.',
    playerMin: 2,
    playerMax: 6,
    timeMin: 15,
    timeMax: 25,
    featured: false,
    tags: ['Card game', 'Quick play', 'Social deduction'],
  },
  {
    name: 'Sushi Go!',
    description:
      'Draft sushi dishes from a hand of cards, passing the rest around the table. Collect maki, dumplings, sashimi, and pudding to outscore your opponents at this fast-playing card drafter.',
    playerMin: 2,
    playerMax: 5,
    timeMin: 15,
    timeMax: 20,
    featured: false,
    tags: ['Card game', 'Family', 'Quick play'],
  },
  {
    name: 'Coup',
    description:
      'In a dystopian future, bluff your way to power. Each player holds two hidden role cards; call out opponents\' lies to eliminate them. The last player with influence wins.',
    playerMin: 2,
    playerMax: 6,
    timeMin: 15,
    timeMax: 30,
    featured: false,
    tags: ['Social deduction', 'Party', 'Quick play'],
  },
  {
    name: 'Hive',
    description:
      'Surround your opponent\'s Queen Bee using hexagonal tiles representing different insects, each with unique movement rules. Chess-like depth with no board, no setup, playable anywhere.',
    playerMin: 2,
    playerMax: 2,
    timeMin: 20,
    timeMax: 30,
    featured: false,
    tags: ['Abstract', 'Strategy', 'Quick play'],
  },
  {
    name: 'Sheriff of Nottingham',
    description:
      'Merchants smuggle goods past the Sheriff\'s checkpoint — or try to. Bluff, bribe, and negotiate your way to the most valuable market stall in Nottingham. Perfect for groups who love negotiation.',
    playerMin: 3,
    playerMax: 5,
    timeMin: 60,
    timeMax: 90,
    featured: false,
    tags: ['Party', 'Social deduction', 'Competitive'],
  },
  {
    name: 'King of Tokyo',
    description:
      'Giant monsters battle for control of Tokyo in this push-your-luck dice game. Roll to attack, heal, energise, or grab power cards — but stay in Tokyo too long and everyone targets you.',
    playerMin: 2,
    playerMax: 6,
    timeMin: 30,
    timeMax: 45,
    featured: false,
    tags: ['Family', 'Party', 'Quick play'],
  },
]

// ─── Colour palette for placeholder photos ────────────────────────────────────

const PALETTE: [number, number, number][] = [
  [99, 140, 185],  // slate blue
  [180, 120, 75],  // warm amber
  [90, 160, 120],  // sage green
  [200, 90, 85],   // terracotta
  [130, 100, 180], // dusty purple
  [70, 150, 160],  // teal
  [210, 160, 60],  // golden yellow
]

// ─── Main ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('Seeding database…')

  // ── Tags ──────────────────────────────────────────────────────────────────
  console.log('  Inserting tags…')
  const insertedTags = await db
    .insert(tags)
    .values(TAG_NAMES.map((name) => ({ name })))
    .onConflictDoNothing()
    .returning({ id: tags.id, name: tags.name })

  // Fetch all tags (including any that already existed)
  const allTags = await db.select({ id: tags.id, name: tags.name }).from(tags)
  const tagByName = new Map(allTags.map((t) => [t.name, t.id]))
  console.log(`  ${insertedTags.length} new tags inserted (${allTags.length} total)`)

  // ── Games ─────────────────────────────────────────────────────────────────
  console.log('  Inserting games…')
  let newGames = 0

  for (const [i, g] of GAMES.entries()) {
    // Always (re-)write the placeholder photo. /app/photos is ephemeral on
    // Coolify (no volume mount), so files vanish on every redeploy while DB
    // rows persist. The hash is deterministic — same (r,g,b) → same sha256 →
    // same files on disk — so this is a no-op when files already exist and a
    // recovery step when they don't.
    const paletteEntry = PALETTE[i % PALETTE.length] ?? ([99, 140, 185] as [number, number, number])
    const [r, g2, b] = paletteEntry
    const hash = await writePlaceholderPhoto(r, g2, b)

    const existing = await db
      .select({ id: games.id })
      .from(games)
      .where(eq(games.name, g.name))
      .limit(1)

    if (existing.length > 0) {
      console.log(`    [skip-row, photo ensured] ${g.name}`)
      continue
    }

    const inserted = await db
      .insert(games)
      .values({
        name: g.name,
        description: g.description,
        playerMin: g.playerMin,
        playerMax: g.playerMax,
        timeMin: g.timeMin,
        timeMax: g.timeMax,
        featured: g.featured,
      })
      .returning({ id: games.id })

    const game = inserted[0]
    if (!game) throw new Error(`Insert returned no row for "${g.name}"`)

    // Game → tags
    const tagRows = g.tags
      .map((name) => tagByName.get(name))
      .filter((id): id is number => id !== undefined)
      .map((tagId) => ({ gameId: game.id, tagId }))

    if (tagRows.length > 0) {
      await db.insert(gameTags).values(tagRows).onConflictDoNothing()
    }

    await db.insert(photos).values({
      gameId: game.id,
      contentHash: hash,
      position: 0,
    })

    newGames++
    console.log(`    [ok] ${g.name} (id=${game.id}, photo=${hash.slice(0, 8)}…)`)
  }

  console.log(`  ${newGames} new games inserted`)
  console.log('Done.')
}

seed()
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
  .finally(() => client.end())
