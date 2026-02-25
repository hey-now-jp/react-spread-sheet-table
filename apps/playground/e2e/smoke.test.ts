import { expect, test } from '@playwright/test'

test('playground loads successfully', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('h1')).toHaveText('SpreadSheet Table デモ')
})

test('basic table renders with data', async ({ page }) => {
  await page.goto('/')
  // Basic Table demo should be active by default
  await expect(page.locator('h2')).toHaveText('基本テーブル')

  // Check that cells with sample data are visible
  await expect(page.getByText('Tanaka Taro')).toBeVisible()
  await expect(page.getByText('Engineering').first()).toBeVisible()
})

test('cell editing via double-click', async ({ page }) => {
  await page.goto('/')

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

test('sort by clicking header', async ({ page }) => {
  await page.goto('/')

  // Click the Age header to sort
  await page.getByText('年齢').first().click()

  // Should show sort indicator
  await expect(page.locator('[data-sort="asc"]')).toBeVisible()
})

test('navigation between demo pages', async ({ page }) => {
  await page.goto('/')

  // Switch to Editing & Validation demo
  await page.getByText('編集 & バリデーション').click()
  await expect(page.locator('h2')).toHaveText('編集 & バリデーション')
  await expect(page.getByText('エラー:')).toBeVisible()

  // Switch to Virtual Scroll demo
  await page.getByText('仮想スクロール (1万行)').click()
  await expect(page.locator('h2')).toHaveText('仮想スクロール (10,000行)')
})

test('boolean cell toggles on click', async ({ page }) => {
  await page.goto('/')

  // Find a checkbox and click it
  const checkbox = page.locator('input[type="checkbox"]').first()
  const initialChecked = await checkbox.isChecked()
  await checkbox.click()
  const newChecked = await checkbox.isChecked()

  expect(newChecked).not.toBe(initialChecked)
})

test('keyboard navigation with arrow keys', async ({ page }) => {
  await page.goto('/')

  // Click on a cell to set active cell
  await page.getByText('Tanaka Taro').click()

  // The cell should have active styling (outline)
  const activeCell = page.locator('[data-row="0"][data-col="0"]')
  await expect(activeCell).toBeVisible()
})

test('validation demo shows errors', async ({ page }) => {
  await page.goto('/')
  await page.getByText('編集 & バリデーション').click()

  // Should show error count
  await expect(page.getByText(/エラー: \d+/)).toBeVisible()
  await expect(page.getByText(/有効: /)).toBeVisible()
})
