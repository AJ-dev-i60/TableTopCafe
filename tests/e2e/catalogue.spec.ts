import { test, expect } from '@playwright/test'

test('placeholder page loads', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toContainText('TableTopCafe')
})

test('health endpoint returns ok', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.ok()).toBeTruthy()
  const body = await response.json() as { ok: boolean; db: string }
  expect(body.ok).toBe(true)
  expect(body.db).toBe('connected')
})
