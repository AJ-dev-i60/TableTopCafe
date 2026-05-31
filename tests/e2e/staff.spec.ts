import { test, expect } from '@playwright/test'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? 'ci_admin_password'

test('unauthenticated /staff redirects to login', async ({ page }) => {
  await page.goto('/staff')
  await expect(page).toHaveURL(/\/staff\/login/)
})

test('staff login with wrong password shows error', async ({ page }) => {
  await page.goto('/staff/login')
  await page.getByLabel('Username').fill(ADMIN_USERNAME)
  await page.getByLabel('Password').fill('wrong-password')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.locator('[aria-live="assertive"]')).toContainText('Invalid username or password')
})

test('staff login → add game → appears in public catalogue', async ({ page }) => {
  // Log in
  await page.goto('/staff/login')
  await page.getByLabel('Username').fill(ADMIN_USERNAME)
  await page.getByLabel('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/staff$/)

  // Navigate to add game
  await page.getByRole('link', { name: 'Add game' }).click()
  await expect(page).toHaveURL(/\/staff\/games\/new/)

  // Fill in the form
  const gameName = `Test Game ${Date.now()}`
  await page.getByLabel('Name *').fill(gameName)
  await page.getByLabel('Min players *').fill('2')
  await page.getByLabel('Max players *').fill('4')
  await page.getByLabel('Min time (min) *').fill('30')
  await page.getByLabel('Max time (min) *').fill('60')

  await page.getByRole('button', { name: 'Add game' }).click()

  // Should redirect to staff dashboard
  await expect(page).toHaveURL(/\/staff$/)
  await expect(page.getByText(gameName)).toBeVisible()

  // Edit is a button-styled link (not a plain text link) — see SharedButton `to`
  await expect(page.getByRole('link', { name: 'Edit' }).first()).toBeVisible()

  // Game should appear in public catalogue
  await page.goto('/')
  await expect(page.getByText(gameName).first()).toBeVisible()
})

test('staff session persists across a hard refresh', async ({ page }) => {
  await page.goto('/staff/login')
  await page.getByLabel('Username').fill(ADMIN_USERNAME)
  await page.getByLabel('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/staff$/)

  // Hard reload must NOT bounce back to login (regression: SSR cookie forwarding)
  await page.reload()
  await expect(page).toHaveURL(/\/staff$/)
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
})

test('View catalogue stays inside the staff shell', async ({ page }) => {
  await page.goto('/staff/login')
  await page.getByLabel('Username').fill(ADMIN_USERNAME)
  await page.getByLabel('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/staff$/)

  await page.getByRole('link', { name: 'View catalogue' }).click()
  await expect(page).toHaveURL(/\/staff\/catalogue/)
  // Staff chrome (Sign out) is still present — we did not leave for the public page
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible()
})

test('staff can log out', async ({ page }) => {
  await page.goto('/staff/login')
  await page.getByLabel('Username').fill(ADMIN_USERNAME)
  await page.getByLabel('Password').fill(ADMIN_PASSWORD)
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page).toHaveURL(/\/staff$/)

  await page.getByRole('button', { name: 'Sign out' }).click()
  await expect(page).toHaveURL(/\/staff\/login/)
})
