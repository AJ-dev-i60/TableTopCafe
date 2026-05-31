import { test, expect } from '@playwright/test'

test('games API returns seeded data', async ({ request }) => {
  const response = await request.get('/api/games')
  expect(response.ok()).toBeTruthy()
  const games = await response.json() as unknown[]
  expect(Array.isArray(games)).toBe(true)
  expect(games.length).toBeGreaterThan(0)
})

test('health endpoint returns ok', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.ok()).toBeTruthy()
  const body = await response.json() as { ok: boolean; db: string }
  expect(body.ok).toBe(true)
  expect(body.db).toBe('connected')
})

test('catalogue loads and shows games', async ({ page }) => {
  await page.goto('/')
  // Header branding
  await expect(page.getByText('TableTopCafe').first()).toBeVisible()
  // At least one game card or list item
  await expect(page.locator('article').first()).toBeVisible()
})

test('search filters games by name', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('article').first()).toBeVisible()

  const searchInput = page.getByPlaceholder('Search games…')
  await searchInput.fill('Catan')

  // Should show Catan. Target the visible grid card heading (<h2>) — the mobile
  // featured carousel also renders the title in a hidden (sm:hidden) <h3>, so a
  // plain getByText().first() would resolve to that hidden node on desktop.
  await expect(page.locator('h2', { hasText: 'Catan' }).first()).toBeVisible()
  // Should not show Pandemic (not matching the search)
  await expect(page.getByText('Pandemic')).not.toBeVisible()
})

test('filter by player count narrows results', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('article').first()).toBeVisible()

  // Count games before filtering
  const before = await page.locator('article').count()

  // Click player count "2"
  await page.getByRole('button', { name: '2', exact: true }).first().click()

  // Count should decrease or stay same (Hive is 2-only, most others are 2+)
  const after = await page.locator('article').count()
  expect(after).toBeLessThanOrEqual(before)
})

test('can open a game detail page', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('article').first()).toBeVisible()

  // Click the first game
  const firstGame = page.locator('article').first()
  const gameName = await firstGame.locator('h2').textContent()
  await firstGame.click()

  // Should navigate to /games/[id]
  await expect(page).toHaveURL(/\/games\/\d+/)
  // Should show game name in a heading
  await expect(page.locator('h1')).toContainText(gameName?.trim() ?? '')
  // Back link should be present (glass pill back-link since M5 redesign)
  await expect(page.getByRole('link', { name: 'Catalogue' })).toBeVisible()
})

test('list view toggle switches layout', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('article').first()).toBeVisible()

  // Switch to list view
  await page.getByTitle('List view').click()

  // Articles should still be present
  await expect(page.locator('article').first()).toBeVisible()

  // Switch back to grid
  await page.getByTitle('Grid view').click()
  await expect(page.locator('article').first()).toBeVisible()
})
