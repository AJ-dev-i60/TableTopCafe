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
  await expect(page.getByText('Invalid username or password')).toBeVisible()
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
  await page.getByLabel('Name').fill(gameName)
  await page.getByLabel('Min players').fill('2')
  await page.getByLabel('Max players').fill('4')
  await page.getByLabel('Min time').fill('30')
  await page.getByLabel('Max time').fill('60')

  await page.getByRole('button', { name: 'Add game' }).click()

  // Should redirect to staff dashboard
  await expect(page).toHaveURL(/\/staff$/)
  await expect(page.getByText(gameName)).toBeVisible()

  // Game should appear in public catalogue
  await page.goto('/')
  await expect(page.getByText(gameName).first()).toBeVisible()
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
