import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const { fetchGameDescription } = await import('./wikipedia')

function jsonOk(body: unknown) {
  return { ok: true, status: 200, json: () => Promise.resolve(body) }
}

// First fetch = search, second = summary.
function mockSearchThenSummary(title: string, summary: unknown) {
  mockFetch
    .mockResolvedValueOnce(jsonOk({ query: { search: title ? [{ title }] : [] } }))
    .mockResolvedValueOnce(jsonOk(summary))
}

beforeEach(() => mockFetch.mockReset())

describe('fetchGameDescription', () => {
  it('returns the summary extract for a matching article', async () => {
    mockSearchThenSummary('Azul (board game)', {
      type: 'standard',
      extract: 'Azul is an abstract strategy board game designed by Michael Kiesling.',
    })
    const d = await fetchGameDescription('Azul')
    expect(d).toBe('Azul is an abstract strategy board game designed by Michael Kiesling.')
  })

  it('rejects an unrelated article (no Wikipedia page for the game)', async () => {
    mockSearchThenSummary('Phasmophobia (video game)', {
      type: 'standard',
      extract: 'Phasmophobia is a video game.',
    })
    expect(await fetchGameDescription('Disturbed Friends')).toBeNull()
  })

  it('rejects a disambiguation page', async () => {
    mockSearchThenSummary('Pandemic', { type: 'disambiguation', extract: 'Pandemic may refer to…' })
    expect(await fetchGameDescription('Pandemic')).toBeNull()
  })

  it('rejects a title match whose summary is not about a game', async () => {
    mockSearchThenSummary('Catan', { type: 'standard', extract: 'Catan is a region in Spain.' })
    expect(await fetchGameDescription('Catan')).toBeNull()
  })

  it('returns null when there is no search hit', async () => {
    mockFetch.mockResolvedValueOnce(jsonOk({ query: { search: [] } }))
    expect(await fetchGameDescription('Zzzznomatch')).toBeNull()
  })

  it('returns null when the search request fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
    expect(await fetchGameDescription('Catan')).toBeNull()
  })
})
