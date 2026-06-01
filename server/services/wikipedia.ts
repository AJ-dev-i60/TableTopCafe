import { z } from 'zod'

// Wikipedia's API is open and not bot-blocked (unlike BGG behind Cloudflare), so
// it's a reliable source for a game's details. We find the article, confirm it's
// a tabletop game (it uses {{Infobox game}}, not {{Infobox video game}}), parse
// players/time from that infobox, and take the intro summary as the description.

const UA = 'TableTopCafe/1.0 (board game cafe catalogue)'

export type GameInfo = {
  description: string | null
  playerMin: number | null
  playerMax: number | null
  timeMin: number | null
  timeMax: number | null
}

const SearchResponse = z.object({
  query: z.object({ search: z.array(z.object({ title: z.string() })).optional() }).optional(),
})

const WikitextResponse = z.object({
  query: z
    .object({
      pages: z.record(
        z.object({
          revisions: z
            .array(z.object({ slots: z.object({ main: z.object({ '*': z.string() }) }) }))
            .optional(),
        }),
      ),
    })
    .optional(),
})

const SummaryResponse = z.object({ extract: z.string().optional() })

function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function titlesMatch(name: string, articleTitle: string): boolean {
  const a = normalizeTitle(name)
  const b = normalizeTitle(articleTitle)
  if (a === '' || b === '') return false
  return a === b || a.includes(b) || b.includes(a)
}

// Pull a "| field = value" line out of the infobox.
function infoboxField(wikitext: string, field: string): string | null {
  const key = field.replace(/[ _]/g, '[ _]')
  const m = wikitext.match(new RegExp('\\|\\s*' + key + '\\s*=\\s*([^\\n]*)', 'i'))
  return m ? m[1]!.trim() : null
}

// Reduce a free-text infobox value (list templates, links, italics, refs,
// parentheticals) to a bare "3–4" / "30–45 minutes"-style string.
function cleanValue(raw: string | null): string | null {
  if (!raw) return null
  let v = raw
  const list = v.match(/\{\{\s*(?:ubl|unbulleted list|plainlist|hlist|nowrap)\s*\|([\s\S]*?)\}\}/i)
  if (list) v = list[1]!.split('|')[0]!
  v = v
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
    .replace(/<ref[^>]*\/>/gi, '')
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1')
    .replace(/\[\[([^\]]*)\]\]/g, '$1')
    .replace(/'''?/g, '')
    .replace(/\{\{[^}]*\}\}/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
  return v || null
}

function numbersIn(v: string): number[] {
  return (v.match(/\d+/g) ?? []).map(Number).filter((n) => Number.isFinite(n) && n >= 1)
}

function parseRange(raw: string | null, detectHours = false): { min: number; max: number } | null {
  const v = cleanValue(raw)
  if (!v) return null
  const nums = numbersIn(v)
  if (nums.length === 0) return null
  const unit = detectHours && /\b(?:hours?|hrs?)\b/i.test(v) ? 60 : 1
  const a = nums[0]! * unit
  const b = (nums.length > 1 ? nums[1]! : nums[0]!) * unit
  return { min: Math.min(a, b), max: Math.max(a, b) }
}

async function searchTopTitle(query: string): Promise<string | null> {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&srsearch=' +
    encodeURIComponent(`${query} board game`)
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) return null
  const parsed = SearchResponse.safeParse(await res.json())
  return (parsed.success && parsed.data.query?.search?.[0]?.title) || null
}

async function fetchWikitext(title: string): Promise<string | null> {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&prop=revisions&rvprop=content&rvslots=main&redirects=1&format=json&titles=' +
    encodeURIComponent(title)
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) return null
  const parsed = WikitextResponse.safeParse(await res.json())
  if (!parsed.success || !parsed.data.query) return null
  const page = Object.values(parsed.data.query.pages)[0]
  return page?.revisions?.[0]?.slots.main['*'] ?? null
}

async function fetchSummary(title: string): Promise<string | null> {
  const url = 'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title)
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) return null
  const parsed = SummaryResponse.safeParse(await res.json())
  if (!parsed.success) return null
  const text = (parsed.data.extract ?? '').trim()
  if (text === '') return null
  return text.length > 2000 ? text.slice(0, 2000).trim() : text
}

export async function fetchGameInfo(name: string): Promise<GameInfo | null> {
  const query = name.trim()
  if (query === '') return null

  const topTitle = await searchTopTitle(query)
  if (!topTitle || !titlesMatch(query, topTitle)) return null

  const wikitext = await fetchWikitext(topTitle)
  // Confirm it's a tabletop game (board/card/CMG), not a same-named video game,
  // person, place, or disambiguation page.
  if (!wikitext || !/\{\{\s*infobox[ _]+(?:game|card[ _]?game|cmg)\b/i.test(wikitext)) return null

  const players = parseRange(infoboxField(wikitext, 'players'))
  const time = parseRange(infoboxField(wikitext, 'playing_time'), true)

  return {
    description: await fetchSummary(topTitle),
    playerMin: players?.min ?? null,
    playerMax: players?.max ?? null,
    timeMin: time?.min ?? null,
    timeMax: time?.max ?? null,
  }
}
