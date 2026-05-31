/**
 * Converts BoardGameGeek's official ranks dump into the committed name list
 * that powers the add-game search (server/data/board-games.json).
 *
 * One-time / occasional, run by hand — does NOT run on deploy:
 *
 *   1. Download `boardgames_ranks.csv` from BGG while logged in:
 *      https://boardgamegeek.com/data_dumps/bg_ranks
 *   2. Put it at  data/boardgames_ranks.csv  (or pass a path as the first arg).
 *   3. Run:  npm run bgg:ranks
 *   4. Commit the regenerated server/data/board-games.json.
 *
 * The raw CSV is gitignored; only the derived JSON is committed. At runtime the
 * JSON is read in-memory by server/utils/gameNames.ts — no DB, no deploy step.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const INPUT = process.argv[2] ?? resolve(HERE, '../data/boardgames_ranks.csv')
const OUTPUT = resolve(HERE, '../server/data/board-games.json')

// Drop the ultra-obscure long tail: BGG's full dump is ~177k games, mostly with
// almost no ratings. Keeping games with at least this many ratings (~42k at 30)
// covers everything a café would realistically own while keeping the committed
// file small and the search relevant. Override with MIN_RATINGS=0 for everything.
const MIN_RATINGS = Number(process.env.MIN_RATINGS ?? 30)

type BoardGame = { name: string; bggId: number; yearPublished: number | null; usersRated: number }

// Minimal RFC-4180 CSV parser: handles quoted fields, escaped quotes ("") and
// commas/newlines inside quotes. Returns rows of string cells.
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ } else { inQuotes = false }
      } else {
        field += ch
      }
      continue
    }
    if (ch === '"') { inQuotes = true }
    else if (ch === ',') { row.push(field); field = '' }
    else if (ch === '\r') { /* ignore */ }
    else if (ch === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else { field += ch }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row) }
  return rows
}

function toYear(raw: string | undefined): number | null {
  if (raw === undefined) return null
  const n = Number.parseInt(raw, 10)
  // BGG uses 0 for "unknown"; keep real years (incl. negative/BC), drop 0/NaN.
  return Number.isFinite(n) && n !== 0 ? n : null
}

async function main(): Promise<void> {
  let text: string
  try {
    text = await readFile(INPUT, 'utf-8')
  } catch {
    throw new Error(`Could not read ${INPUT}. Download boardgames_ranks.csv from BGG and place it there (or pass a path as the first argument).`)
  }

  const rows = parseCsv(text)
  if (rows.length < 2) throw new Error('CSV has no data rows.')

  const header = rows[0].map((h) => h.trim().toLowerCase())
  const idIdx = header.indexOf('id')
  const nameIdx = header.indexOf('name')
  const yearIdx = header.indexOf('yearpublished')
  const ratedIdx = header.indexOf('usersrated')
  if (idIdx === -1 || nameIdx === -1) {
    throw new Error(`Unexpected CSV columns: [${header.join(', ')}] — need at least "id" and "name".`)
  }

  const byId = new Map<number, BoardGame>()
  let skippedLowRatings = 0
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r]
    const name = (cells[nameIdx] ?? '').trim()
    if (name === '') continue
    const bggId = Number.parseInt(cells[idIdx] ?? '', 10)
    if (!Number.isFinite(bggId)) continue // skip rows without a usable id

    const usersRated = ratedIdx === -1 ? 0 : (Number.parseInt(cells[ratedIdx] ?? '', 10) || 0)
    if (usersRated < MIN_RATINGS) { skippedLowRatings++; continue }

    if (!byId.has(bggId)) {
      byId.set(bggId, {
        name,
        bggId,
        yearPublished: yearIdx === -1 ? null : toYear(cells[yearIdx]),
        usersRated,
      })
    }
  }

  // Stable, readable order in the committed file (search re-sorts by popularity).
  const games = [...byId.values()].sort((a, b) => a.name.localeCompare(b.name))

  await mkdir(dirname(OUTPUT), { recursive: true })
  await writeFile(OUTPUT, `${JSON.stringify(games, null, 0)}\n`, 'utf-8')

  console.log(`Wrote ${games.length} board games to ${OUTPUT} (source: ${INPUT}).`)
  console.log(`Filter: usersRated >= ${MIN_RATINGS} (skipped ${skippedLowRatings} below threshold).`)
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
