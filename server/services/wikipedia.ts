import { z } from 'zod'

// Wikipedia's API is open and not bot-blocked (unlike BGG behind Cloudflare), so
// it's a reliable source for a game's description. We search for the game, guard
// against a wrong article, then take the article's intro summary as plain text.

const UA = 'TableTopCafe/1.0 (board game cafe catalogue)'

const SearchResponse = z.object({
  query: z
    .object({
      search: z.array(z.object({ title: z.string() })).optional(),
    })
    .optional(),
})

const SummaryResponse = z.object({
  type: z.string().optional(),
  extract: z.string().optional(),
})

// Lowercase, drop "(board game)"-style qualifiers and punctuation for comparison.
function normalizeTitle(s: string): string {
  return s
    .toLowerCase()
    .replace(/\(.*?\)/g, '')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Only trust the article when its title clearly corresponds to the game name,
// so games with no Wikipedia page don't pull an unrelated article's text.
function titlesMatch(name: string, articleTitle: string): boolean {
  const a = normalizeTitle(name)
  const b = normalizeTitle(articleTitle)
  if (a === '' || b === '') return false
  return a === b || a.includes(b) || b.includes(a)
}

export async function fetchGameDescription(name: string): Promise<string | null> {
  const query = name.trim()
  if (query === '') return null

  // 1) Find the most likely article (biased toward the board game).
  const searchUrl =
    'https://en.wikipedia.org/w/api.php?action=query&list=search&srlimit=1&format=json&srsearch=' +
    encodeURIComponent(`${query} board game`)
  const searchRes = await fetch(searchUrl, { headers: { 'User-Agent': UA } })
  if (!searchRes.ok) return null
  const search = SearchResponse.safeParse(await searchRes.json())
  const topTitle = search.success ? search.data.query?.search?.[0]?.title : undefined
  if (!topTitle || !titlesMatch(query, topTitle)) return null

  // 2) Take the plain-text intro summary for that article.
  const summaryUrl =
    'https://en.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(topTitle)
  const summaryRes = await fetch(summaryUrl, { headers: { 'User-Agent': UA } })
  if (!summaryRes.ok) return null
  const summary = SummaryResponse.safeParse(await summaryRes.json())
  if (!summary.success || summary.data.type === 'disambiguation') return null

  const text = (summary.data.extract ?? '').trim()
  // Sanity check: it should actually read like a game, not a same-named person/place.
  if (text === '' || !/\bgame\b/i.test(text)) return null

  return text.length > 2000 ? text.slice(0, 2000).trim() : text
}
