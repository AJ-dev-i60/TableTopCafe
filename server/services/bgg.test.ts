import { describe, it, expect, vi, beforeEach } from 'vitest'

// We test the XML parsing logic by mocking fetch and calling the exported functions.
// The private parser and Zod schemas are exercised indirectly.

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Import after stubbing global fetch
const { searchBgg, fetchBggThing, fetchBggGameDetails } = await import('./bgg')

const SEARCH_XML = `<?xml version="1.0" encoding="utf-8"?>
<items total="2" termsofuse="https://boardgamegeek.com/xmlapi/termsofuse" page="1">
  <item type="boardgame" id="13">
    <name type="primary" sortindex="1" value="Catan"/>
    <yearpublished value="1995"/>
  </item>
  <item type="boardgame" id="1234">
    <name type="primary" sortindex="1" value="Catan: Cities &amp; Knights"/>
    <yearpublished value="1998"/>
  </item>
</items>`

const THING_XML = `<?xml version="1.0" encoding="utf-8"?>
<items termsofuse="https://boardgamegeek.com/xmlapi/termsofuse">
  <item type="boardgame" id="13">
    <thumbnail>https://cf.geekdo-images.com/thumb.jpg</thumbnail>
    <image>https://cf.geekdo-images.com/full.jpg</image>
    <name type="primary" sortindex="1" value="Catan"/>
    <description>A game about trading &amp; building.</description>
    <yearpublished value="1995"/>
    <minplayers value="3"/>
    <maxplayers value="6"/>
    <minplaytime value="60"/>
    <maxplaytime value="120"/>
    <link type="boardgamecategory" id="1015" value="Economic"/>
    <link type="boardgamemechanic" id="325" value="Hand Management"/>
  </item>
</items>`

function mockOkResponse(body: string) {
  return {
    ok: true,
    status: 200,
    text: () => Promise.resolve(body),
    headers: new Headers({ 'content-type': 'text/xml' }),
  }
}

beforeEach(() => {
  mockFetch.mockReset()
})

describe('searchBgg', () => {
  it('parses search results correctly', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse(SEARCH_XML))
    const results = await searchBgg('catan')
    expect(results).toHaveLength(2)
    expect(results[0]).toEqual({ bggId: 13, name: 'Catan', yearPublished: 1995 })
    expect(results[1]!.name).toBe('Catan: Cities & Knights')
  })

  it('returns empty array when items element has no items', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse(`<?xml version="1.0"?><items total="0" termsofuse="" page="1"></items>`),
    )
    const results = await searchBgg('zzznomatch')
    expect(results).toEqual([])
  })

  it('throws when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 })
    await expect(searchBgg('catan')).rejects.toThrow('BGG search failed')
  })
})

describe('fetchBggThing', () => {
  it('parses thing detail correctly', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse(THING_XML))
    const detail = await fetchBggThing(13)
    expect(detail).not.toBeNull()
    expect(detail!.bggId).toBe(13)
    expect(detail!.name).toBe('Catan')
    expect(detail!.description).toBe('A game about trading & building.')
    expect(detail!.playerMin).toBe(3)
    expect(detail!.playerMax).toBe(6)
    expect(detail!.timeMin).toBe(60)
    expect(detail!.timeMax).toBe(120)
    expect(detail!.thumbnail).toBe('https://cf.geekdo-images.com/thumb.jpg')
    expect(detail!.image).toBe('https://cf.geekdo-images.com/full.jpg')
    expect(detail!.categories).toEqual(['Economic'])
    expect(detail!.mechanics).toEqual(['Hand Management'])
  })

  it('returns null when items list is empty', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse(`<?xml version="1.0"?><items termsofuse=""></items>`),
    )
    const detail = await fetchBggThing(99999)
    expect(detail).toBeNull()
  })

  it('throws when fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })
    await expect(fetchBggThing(13)).rejects.toThrow('BGG thing fetch failed')
  })
})

describe('fetchBggGameDetails (public page scrape)', () => {
  const PAGE = `<!doctype html><html><head></head><body>
    <script>GEEK.geekitemPreload = {"item":{"href":"/x","description":"<p>Trade &amp; build on the <em>island</em>.</p><p>Second line.</p>","minplayers":"2","maxplayers":"4","minplaytime":"30","maxplaytime":"60","yearpublished":"2017"}};</script>
    </body></html>`

  it('extracts and cleans details from the embedded preload', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse(PAGE))
    const d = await fetchBggGameDetails(13)
    expect(d).not.toBeNull()
    expect(d!.description).toBe('Trade & build on the island.\n\nSecond line.')
    expect(d!.playerMin).toBe(2)
    expect(d!.playerMax).toBe(4)
    expect(d!.timeMin).toBe(30)
    expect(d!.timeMax).toBe(60)
    expect(d!.yearPublished).toBe(2017)
  })

  it('returns null when the preload is missing', async () => {
    mockFetch.mockResolvedValueOnce(mockOkResponse('<html><body>no preload here</body></html>'))
    expect(await fetchBggGameDetails(13)).toBeNull()
  })

  it('returns null when the page fetch fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 })
    expect(await fetchBggGameDetails(13)).toBeNull()
  })

  it('treats zero/absent players and time as null (not filled)', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkResponse(`<script>GEEK.geekitemPreload = {"item":{"description":"x","minplayers":"0"}};</script>`),
    )
    const d = await fetchBggGameDetails(13)
    expect(d!.playerMin).toBeNull()
    expect(d!.playerMax).toBeNull()
    expect(d!.timeMin).toBeNull()
  })
})
