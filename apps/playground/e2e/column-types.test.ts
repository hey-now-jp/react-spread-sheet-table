import { expect, test } from '@playwright/test'
import { clickCell, getCell, goToBasicDemo } from './helpers'

test.describe('カラム型', () => {
  test.beforeEach(async ({ page }) => {
    await goToBasicDemo(page)
  })

  test('テキスト編集で input[type="text"] 表示', async ({ page }) => {
    // name 列 = colIndex 0
    getCell(page, 0, 0).dblclick()
    await expect(page.locator('input[type="text"]').first()).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('数値編集で input[type="number"] 表示', async ({ page }) => {
    // age 列 = colIndex 1
    getCell(page, 0, 1).dblclick()
    await expect(page.locator('input[type="number"]').first()).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('日付編集で input[type="date"] 表示', async ({ page }) => {
    // joinDate 列 = colIndex 2
    getCell(page, 0, 2).dblclick()
    await expect(page.locator('input[type="date"]').first()).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('時刻編集で input[type="time"] 表示', async ({ page }) => {
    // startTime 列 = colIndex 3
    getCell(page, 0, 3).dblclick()
    await expect(page.locator('input[type="time"]').first()).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('boolean は常にチェックボックス表示', async ({ page }) => {
    // active 列 = colIndex 4 (編集モードでなくてもチェックボックスが表示)
    const checkbox = getCell(page, 0, 4).locator('input[type="checkbox"]')
    await expect(checkbox).toBeVisible()
  })

  test('list は編集モードで select 表示', async ({ page }) => {
    // department 列 = colIndex 5
    await clickCell(page, 0, 5)
    await page.keyboard.press('Enter')

    const select = page.locator('select').first()
    await expect(select).toBeVisible()

    // オプションが存在する
    const options = select.locator('option')
    await expect(options).toHaveCount(4) // Engineering, Sales, HR, Finance
  })

  test('action 列はカスタム render が表示される', async ({ page }) => {
    // action 列 = colIndex 6 (最後の列)
    const actionButton = page.locator('button', { hasText: '詳細' }).first()
    await expect(actionButton).toBeVisible()
  })
})
