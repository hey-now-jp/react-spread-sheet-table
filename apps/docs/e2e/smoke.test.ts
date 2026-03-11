import { expect, test } from '@playwright/test'

test('docs site loads successfully', async ({ page }) => {
  await page.goto('/react-spread-sheet-table/')
  await expect(page.locator('h1')).toContainText('React SpreadSheet Table')
})

test('basic demo page renders with data', async ({ page }) => {
  await page.goto('/react-spread-sheet-table/playground/basic/')
  await page.locator('[class*="scrollContainer"]').waitFor()

  // Check that cells with sample data are visible
  await expect(page.getByText('Tanaka Taro')).toBeVisible()
  await expect(page.getByText('Engineering').first()).toBeVisible()
})

test('cell editing via double-click', async ({ page }) => {
  await page.goto('/react-spread-sheet-table/playground/basic/')
  await page.locator('[class*="scrollContainer"]').waitFor()

  // Find a cell with text content and double-click it
  const nameCell = page.getByText('Tanaka Taro')
  await nameCell.dblclick()

  // An input should appear
  const input = page.locator('input[type="text"]').first()
  await expect(input).toBeVisible()

  // Type a new value
  await input.fill('New Name')
  await input.press('Enter')

  // The new value should be displayed
  await expect(page.getByText('New Name')).toBeVisible()
})

test('sort via column menu', async ({ page }) => {
  await page.goto('/react-spread-sheet-table/playground/basic/')
  await page.locator('[class*="scrollContainer"]').waitFor()

  // Open column menu for Age
  const ageHeader = page.locator('[class*="headerCell"]', { hasText: '年齢' })
  await ageHeader.locator('button[aria-label="列メニュー"]').click()
  await page.locator('button[aria-label="昇順でソート"]').click()

  // Should show sort indicator
  await expect(page.locator('[data-sort="asc"]')).toBeVisible()
})

test('editing demo page loads', async ({ page }) => {
  await page.goto('/react-spread-sheet-table/playground/editing/')
  await page.locator('[class*="scrollContainer"]').waitFor()

  // Should show error count
  await expect(page.getByText(/エラー: \d+/)).toBeVisible()
  await expect(page.getByText(/有効: /)).toBeVisible()
})

test('virtual scroll demo page loads', async ({ page }) => {
  await page.goto('/react-spread-sheet-table/playground/virtual-scroll/')
  await page.locator('[class*="scrollContainer"]').waitFor()

  // Should render cells
  await expect(page.locator('[data-row="0"]').first()).toBeVisible()
})

test('boolean cell toggles on click', async ({ page }) => {
  await page.goto('/react-spread-sheet-table/playground/basic/')
  await page.locator('[class*="scrollContainer"]').waitFor()

  // Find a checkbox and click it
  const checkbox = page.locator('input[type="checkbox"]').first()
  const initialChecked = await checkbox.isChecked()
  await checkbox.click()
  const newChecked = await checkbox.isChecked()

  expect(newChecked).not.toBe(initialChecked)
})

test('arrow keys move active cell after clicking', async ({ page }) => {
  await page.goto('/react-spread-sheet-table/playground/basic/')
  await page.locator('[class*="scrollContainer"]').waitFor()

  // Click on the first name cell (Tanaka Taro)
  const firstCell = page.locator('[data-col="0"]', { hasText: 'Tanaka Taro' })
  await firstCell.click()

  // Verify the clicked cell has active outline
  await expect(firstCell).toHaveCSS('outline-style', 'solid')

  // Press ArrowDown to move to the next row
  await page.keyboard.press('ArrowDown')

  // The next row's name cell (Suzuki Hanako) should now be active
  const secondCell = page.locator('[data-col="0"]', { hasText: 'Suzuki Hanako' })
  await expect(secondCell).toHaveCSS('outline-style', 'solid')

  // The first cell should no longer be active
  await expect(firstCell).not.toHaveCSS('outline-style', 'solid')
})

test('space key does not scroll the page', async ({ page }) => {
  await page.goto('/react-spread-sheet-table/playground/basic/')
  await page.locator('[class*="scrollContainer"]').waitFor()

  // Click on a cell
  const cell = page.locator('[data-col="0"]', { hasText: 'Tanaka Taro' })
  await cell.click()

  // Record scroll position
  const scrollBefore = await page
    .locator('[class*="scrollContainer"]')
    .evaluate((el) => el.scrollTop)

  // Press Space (should not cause browser scroll)
  await page.keyboard.press('Space')

  // Scroll position should not have changed
  const scrollAfter = await page
    .locator('[class*="scrollContainer"]')
    .evaluate((el) => el.scrollTop)
  expect(scrollAfter).toBe(scrollBefore)
})

test('arrow keys scroll to keep active cell visible', async ({ page }) => {
  await page.goto('/react-spread-sheet-table/playground/virtual-scroll/')
  await page.locator('[class*="scrollContainer"]').waitFor()

  // Click the first row's name cell
  const firstCell = page.locator('[data-col="1"]').first()
  await firstCell.click()

  // Scroll should be at top
  const scrollContainer = page.locator('[class*="scrollContainer"]')
  const scrollBefore = await scrollContainer.evaluate((el) => el.scrollTop)
  expect(scrollBefore).toBe(0)

  // Press ArrowDown many times to go below visible area
  for (let i = 0; i < 25; i++) {
    await page.keyboard.press('ArrowDown')
  }

  // Scroll should have moved down to keep cell visible
  const scrollAfter = await scrollContainer.evaluate((el) => el.scrollTop)
  expect(scrollAfter).toBeGreaterThan(0)
})
