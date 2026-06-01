import { XMLParser } from 'fast-xml-parser'
import { z } from 'zod'

const BGG_API = 'https://boardgamegeek.com/xmlapi2'

/**
 * Fetches a game's cover image URL by scraping its PUBLIC BGG page (the XML API
 * now requires approved access, but the website is reachable). Prefers the box
 * cover (__itemrep image variant) and falls back to the og:image social card.
 * Returns null if the page can't be reached or no image is found.
 */
// Browser-ish headers for the public site. Note: BGG sits behind Cloudflare,
// which can still block server-side (non-browser) clients by TLS fingerprint
// regardless of headers — so these calls may fail from some hosts. Callers
// degrade gracefully (return null / surface an error) when that happens.
const BGG_PAGE_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
}

async function fetchBggPageHtml(bggId: number): Promise<string | null> {
  const res = await fetch(`https://boardgamegeek.com/boardgame/${bggId}`, { headers: BGG_PAGE_HEADERS })
  if (!res.ok) return null
  return res.text()
}

export async function fetchBggCoverUrl(bggId: number): Promise<string | null> {
  const html = await fetchBggPageHtml(bggId)
  if (html === null) return null

  const itemrep = html.match(
    /https:\/\/cf\.geekdo-images\.com\/[^"'\s]*__itemrep\/img\/[^"'\s]*\.(?:png|jpe?g)/i,
  )
  if (itemrep) return itemrep[0]

  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
  return og?.[1] ?? null
}

// ── Public-page detail scrape (the XML API is gated behind 401) ──────────────
// BGG's public game page embeds the full item data as `GEEK.geekitemPreload`,
// which carries the same description / players / time the XML API used to give.

export type BggGameDetails = {
  description: string | null
  playerMin: number | null
  playerMax: number | null
  timeMin: number | null
  timeMax: number | null
  yearPublished: number | null
}

const PreloadSchema = z.object({
  item: z.object({
    description: z.string().optional(),
    minplayers: z.union([z.string(), z.number()]).optional(),
    maxplayers: z.union([z.string(), z.number()]).optional(),
    minplaytime: z.union([z.string(), z.number()]).optional(),
    maxplaytime: z.union([z.string(), z.number()]).optional(),
    yearpublished: z.union([z.string(), z.number()]).optional(),
  }),
})

export async function fetchBggGameDetails(bggId: number): Promise<BggGameDetails | null> {
  const html = await fetchBggPageHtml(bggId)
  if (html === null) return null

  const json = extractBalancedJson(html, 'GEEK.geekitemPreload')
  if (!json) return null

  let raw: unknown
  try {
    raw = JSON.parse(json)
  } catch {
    return null
  }

  const parsed = PreloadSchema.safeParse(raw)
  if (!parsed.success) return null
  const item = parsed.data.item

  return {
    description: cleanBggDescription(item.description),
    playerMin: toPositiveInt(item.minplayers),
    playerMax: toPositiveInt(item.maxplayers),
    timeMin: toPositiveInt(item.minplaytime),
    timeMax: toPositiveInt(item.maxplaytime),
    yearPublished: toPositiveInt(item.yearpublished),
  }
}

// Extract the JSON object that follows `marker`, balancing braces while ignoring
// any inside string literals.
function extractBalancedJson(html: string, marker: string): string | null {
  const markerIdx = html.indexOf(marker)
  if (markerIdx === -1) return null
  const start = html.indexOf('{', markerIdx)
  if (start === -1) return null

  let depth = 0
  let inString = false
  let escaped = false
  for (let i = start; i < html.length; i++) {
    const ch = html[i]
    if (escaped) {
      escaped = false
      continue
    }
    if (ch === '\\') {
      escaped = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) return html.slice(start, i + 1)
    }
  }
  return null
}

function toPositiveInt(value: string | number | undefined): number | null {
  if (value === undefined) return null
  const n = typeof value === 'number' ? value : parseInt(value, 10)
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : null
}

// BGG descriptions are HTML; turn them into plain text within the form's limit.
function cleanBggDescription(html: string | undefined): string | null {
  if (!html) return null
  const stripped = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>\s*/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
  const text = (decodeHtmlEntities(stripped) ?? '').replace(/\n{3,}/g, '\n\n').trim()
  if (text === '') return null
  return text.length > 2000 ? text.slice(0, 2000).trim() : text
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  isArray: (name) => ['item', 'name', 'link'].includes(name),
})

// --- Zod schemas for raw XML parse output ---

const RawSearchItem = z.object({
  '@_type': z.string(),
  '@_id': z.coerce.number(),
  name: z
    .array(
      z.object({
        '@_type': z.string(),
        '@_value': z.string(),
      }),
    )
    .optional(),
  yearpublished: z
    .object({ '@_value': z.coerce.number() })
    .optional(),
})

const RawSearchResponse = z.object({
  items: z.object({
    item: z.array(RawSearchItem).optional(),
  }),
})

const RawLink = z.object({
  '@_type': z.string(),
  '@_value': z.string(),
})

const RawThingItem = z.object({
  '@_type': z.string(),
  '@_id': z.coerce.number(),
  name: z.array(z.object({ '@_type': z.string(), '@_value': z.string() })).optional(),
  description: z.string().optional(),
  yearpublished: z.object({ '@_value': z.coerce.number() }).optional(),
  minplayers: z.object({ '@_value': z.coerce.number() }).optional(),
  maxplayers: z.object({ '@_value': z.coerce.number() }).optional(),
  minplaytime: z.object({ '@_value': z.coerce.number() }).optional(),
  maxplaytime: z.object({ '@_value': z.coerce.number() }).optional(),
  thumbnail: z.string().optional(),
  image: z.string().optional(),
  link: z.array(RawLink).optional(),
})

const RawThingResponse = z.object({
  items: z.object({
    item: z.array(RawThingItem).optional(),
  }),
})

// --- Public types ---

export type BggSearchResult = {
  bggId: number
  name: string
  yearPublished: number | null
}

export type BggThingDetail = {
  bggId: number
  name: string
  description: string | null
  yearPublished: number | null
  playerMin: number | null
  playerMax: number | null
  timeMin: number | null
  timeMax: number | null
  thumbnail: string | null
  image: string | null
  categories: string[]
  mechanics: string[]
}

// --- API calls ---

export async function searchBgg(query: string): Promise<BggSearchResult[]> {
  const url = `${BGG_API}/search?query=${encodeURIComponent(query)}&type=boardgame`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`BGG search failed: ${res.status}`)
  const xml = await res.text()
  const raw = parser.parse(xml)
  const parsed = RawSearchResponse.parse(raw)
  const items = parsed.items.item ?? []
  return items
    .filter((item) => item['@_type'] === 'boardgame')
    .map((item) => {
      const primaryName = item.name?.find((n) => n['@_type'] === 'primary')
      return {
        bggId: item['@_id'],
        name: primaryName?.['@_value'] ?? '',
        yearPublished: item.yearpublished?.['@_value'] ?? null,
      }
    })
    .filter((r) => r.name !== '')
    .slice(0, 20)
}

export async function fetchBggThing(bggId: number): Promise<BggThingDetail | null> {
  const url = `${BGG_API}/thing?id=${bggId}&stats=1`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`BGG thing fetch failed: ${res.status}`)
  const xml = await res.text()
  const raw = parser.parse(xml)
  const parsed = RawThingResponse.parse(raw)
  const item = parsed.items.item?.[0]
  if (!item) return null

  const primaryName = item.name?.find((n) => n['@_type'] === 'primary')
  const categories = (item.link ?? [])
    .filter((l) => l['@_type'] === 'boardgamecategory')
    .map((l) => l['@_value'])
  const mechanics = (item.link ?? [])
    .filter((l) => l['@_type'] === 'boardgamemechanic')
    .map((l) => l['@_value'])

  return {
    bggId: item['@_id'],
    name: primaryName?.['@_value'] ?? '',
    description: decodeHtmlEntities(item.description ?? null),
    yearPublished: item.yearpublished?.['@_value'] ?? null,
    playerMin: item.minplayers?.['@_value'] ?? null,
    playerMax: item.maxplayers?.['@_value'] ?? null,
    timeMin: item.minplaytime?.['@_value'] ?? null,
    timeMax: item.maxplaytime?.['@_value'] ?? null,
    thumbnail: item.thumbnail?.trim() ?? null,
    image: item.image?.trim() ?? null,
    categories,
    mechanics,
  }
}

function decodeHtmlEntities(str: string | null): string | null {
  if (!str) return null
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#10;/g, '\n')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&rsquo;/g, '’')
    .replace(/&lsquo;/g, '‘')
    .replace(/&rdquo;/g, '”')
    .replace(/&ldquo;/g, '“')
    .replace(/&hellip;/g, '…')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#[0-9]+;/g, (m) => String.fromCharCode(parseInt(m.slice(2, -1), 10)))
    .trim()
}
