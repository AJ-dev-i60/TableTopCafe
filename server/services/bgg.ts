import { XMLParser } from 'fast-xml-parser'
import { z } from 'zod'

const BGG_API = 'https://boardgamegeek.com/xmlapi2'

/**
 * Fetches a game's cover image URL by scraping its PUBLIC BGG page (the XML API
 * now requires approved access, but the website is reachable). Prefers the box
 * cover (__itemrep image variant) and falls back to the og:image social card.
 * Returns null if the page can't be reached or no image is found.
 */
export async function fetchBggCoverUrl(bggId: number): Promise<string | null> {
  const res = await fetch(`https://boardgamegeek.com/boardgame/${bggId}`, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TableTopCafe/1.0)' },
  })
  if (!res.ok) return null
  const html = await res.text()

  const itemrep = html.match(
    /https:\/\/cf\.geekdo-images\.com\/[^"'\s]*__itemrep\/img\/[^"'\s]*\.(?:png|jpe?g)/i,
  )
  if (itemrep) return itemrep[0]

  const og = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
  return og?.[1] ?? null
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
    .replace(/&#[0-9]+;/g, (m) => String.fromCharCode(parseInt(m.slice(2, -1), 10)))
    .trim()
}
