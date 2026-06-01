import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

const { fetchGameInfo } = await import('./wikipedia')

function jsonOk(body: unknown) {
  return { ok: true, status: 200, json: () => Promise.resolve(body) }
}
const searchResp = (title: string | null) =>
  jsonOk({ query: { search: title ? [{ title }] : [] } })
const wikitextResp = (wt: string) =>
  jsonOk({ query: { pages: { '1': { revisions: [{ slots: { main: { '*': wt } } }] } } } })
const summaryResp = (extract: string) => jsonOk({ extract })

const infobox = (players: string, time: string) =>
  `{{Infobox game\n| title = X\n| players = ${players}\n| playing_time = ${time}\n}}\n'''X''' is a game.`

beforeEach(() => mockFetch.mockReset())

describe('fetchGameInfo', () => {
  it('fills description, players and time from a matching game article', async () => {
    mockFetch
      .mockResolvedValueOnce(searchResp('Azul (board game)'))
      .mockResolvedValueOnce(wikitextResp(infobox('2–4', '30–45 minutes')))
      .mockResolvedValueOnce(summaryResp('Azul is an abstract strategy board game.'))
    expect(await fetchGameInfo('Azul')).toEqual({
      description: 'Azul is an abstract strategy board game.',
      playerMin: 2,
      playerMax: 4,
      timeMin: 30,
      timeMax: 45,
    })
  })

  it('converts hours to minutes', async () => {
    mockFetch
      .mockResolvedValueOnce(searchResp('Catan'))
      .mockResolvedValueOnce(wikitextResp(infobox('3–4', '1–2 hours')))
      .mockResolvedValueOnce(summaryResp('Catan is a board game.'))
    const info = await fetchGameInfo('Catan')
    expect(info).toMatchObject({ timeMin: 60, timeMax: 120 })
  })

  it('takes the first entry of a list-template value', async () => {
    mockFetch
      .mockResolvedValueOnce(searchResp('Catan'))
      .mockResolvedValueOnce(wikitextResp(infobox('{{ubl|3–4 (standard)|5–6 (with extensions)}}', '1 hour')))
      .mockResolvedValueOnce(summaryResp('Catan is a board game.'))
    const info = await fetchGameInfo('Catan')
    expect(info).toMatchObject({ playerMin: 3, playerMax: 4, timeMin: 60, timeMax: 60 })
  })

  it('rejects an unrelated article (title mismatch) without fetching the page', async () => {
    mockFetch.mockResolvedValueOnce(searchResp('Phasmophobia (video game)'))
    expect(await fetchGameInfo('Disturbed Friends')).toBeNull()
    expect(mockFetch).toHaveBeenCalledTimes(1)
  })

  it('rejects a same-named non-tabletop article (no game infobox)', async () => {
    mockFetch
      .mockResolvedValueOnce(searchResp('Pandemic'))
      .mockResolvedValueOnce(wikitextResp('{{Infobox video game\n| title = Pandemic\n}}'))
    expect(await fetchGameInfo('Pandemic')).toBeNull()
  })

  it('returns description with null players/time when the infobox lacks them', async () => {
    mockFetch
      .mockResolvedValueOnce(searchResp('Hive'))
      .mockResolvedValueOnce(wikitextResp('{{Infobox game\n| title = Hive\n}}'))
      .mockResolvedValueOnce(summaryResp('Hive is an abstract strategy board game.'))
    expect(await fetchGameInfo('Hive')).toEqual({
      description: 'Hive is an abstract strategy board game.',
      playerMin: null,
      playerMax: null,
      timeMin: null,
      timeMax: null,
    })
  })

  it('returns null when the search request fails', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })
    expect(await fetchGameInfo('Catan')).toBeNull()
  })
})
