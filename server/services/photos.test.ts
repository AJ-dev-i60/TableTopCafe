import { describe, it, expect } from 'vitest'
import { getPlaceholderHashes, PLACEHOLDER_PALETTE } from './photos'

describe('placeholder hash detection', () => {
  it('produces one stable 32-char hash per palette colour', async () => {
    const hashes = await getPlaceholderHashes()
    expect(hashes.size).toBe(PLACEHOLDER_PALETTE.length)
    for (const hash of hashes) {
      expect(hash).toMatch(/^[0-9a-f]{32}$/)
    }
  })

  it('caches the set so repeated lookups are cheap', async () => {
    const first = await getPlaceholderHashes()
    const second = await getPlaceholderHashes()
    expect(second).toBe(first)
  })
})
