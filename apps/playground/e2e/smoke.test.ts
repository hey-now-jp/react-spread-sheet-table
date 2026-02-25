import { test, expect } from '@playwright/test'

test('playground loads successfully', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('SpreadSheet Table Playground')
})
