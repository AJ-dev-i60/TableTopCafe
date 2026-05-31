/**
 * Regenerates server/data/board-games.json from Wikidata (CC0).
 *
 * MANUAL ONLY — this is the single place that touches the network for the
 * board-game name list. It is NOT run on deploy or in CI. Run it by hand on the
 * rare occasion the static list needs refreshing:
 *
 *   npm run gen:game-names
 *
 * The committed JSON is the source of truth at runtime (read in-memory by
 * server/utils/gameNames.ts); nothing seeds a database.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const OUTPUT = resolve(fileURLToPath(import.meta.url), '../../server/data/board-games.json')
const ENDPOINT = 'https://query.wikidata.org/sparql'

// Every entity that is (transitively) a board game, with its English label, an
// optional BoardGameGeek id (P2339), and the earliest publication year (P577).
const QUERY = `
SELECT ?name (SAMPLE(?bggId) AS ?bgg) (MIN(YEAR(?pub)) AS ?year) WHERE {
  ?item wdt:P31/wdt:P279* wd:Q131436 .
  ?item rdfs:label ?name . FILTER(LANG(?name) = "en")
  OPTIONAL { ?item wdt:P2339 ?bggId . }
  OPTIONAL { ?item wdt:P577 ?pub . }
} GROUP BY ?item ?name`

const SparqlResponse = z.object({
  results: z.object({
    bindings: z.array(
      z.object({
        name: z.object({ value: z.string() }),
        bgg: z.object({ value: z.string() }).optional(),
        year: z.object({ value: z.string() }).optional(),
      }),
    ),
  }),
})

type BoardGame = { name: string; bggId: number | null; yearPublished: number | null }

function toInt(value: string | undefined): number | null {
  if (value === undefined) return null
  const n = Number.parseInt(value, 10)
  return Number.isFinite(n) ? n : null
}

async function main(): Promise<void> {
  const url = `${ENDPOINT}?query=${encodeURIComponent(QUERY)}&format=json`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/sparql-results+json',
      // Wikidata requires a descriptive User-Agent or it returns 403.
      'User-Agent': 'TableTopCafe/1.0 (board-game catalogue; game-names refresh)',
    },
  })
  if (!res.ok) {
    throw new Error(`Wikidata query failed: ${res.status} ${res.statusText}`)
  }

  const parsed = SparqlResponse.parse(await res.json())

  // De-dup by case-insensitive name, preferring an entry that has a BGG id.
  const byName = new Map<string, BoardGame>()
  for (const row of parsed.results.bindings) {
    const name = row.name.value.trim()
    if (name === '') continue
    const key = name.toLowerCase()
    const entry: BoardGame = {
      name,
      bggId: toInt(row.bgg?.value),
      yearPublished: toInt(row.year?.value),
    }
    const existing = byName.get(key)
    if (!existing || (existing.bggId === null && entry.bggId !== null)) {
      byName.set(key, entry)
    }
  }

  const games = [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))

  await mkdir(dirname(OUTPUT), { recursive: true })
  await writeFile(OUTPUT, `${JSON.stringify(games, null, 0)}\n`, 'utf-8')

  const withBgg = games.filter((g) => g.bggId !== null).length
  console.log(`Wrote ${games.length} board games to ${OUTPUT} (${withBgg} with a BGG id).`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
