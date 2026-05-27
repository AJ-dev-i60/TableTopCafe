import { describe, it, expect } from 'vitest'

describe('health', () => {
  it('response shape is correct', () => {
    const response: { ok: true; db: 'connected' } = {
      ok: true,
      db: 'connected',
    }
    expect(response.ok).toBe(true)
    expect(response.db).toBe('connected')
  })
})
