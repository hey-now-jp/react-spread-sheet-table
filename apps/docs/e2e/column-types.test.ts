import { expect, test } from '@playwright/test'
import { clickCell, getCell, getDemoContainer, goToBasicDemo } from './helpers'

test.describe('カラム型', () => {
  test.beforeEach(async ({ page }) => {
    await goToBasicDemo(page)
  })

  test('テキスト編集で input[type="text"] 表示', async ({ page }) => {
    const demo = getDemoContainer(page)
    // name 列 = colIndex 0
    getCell(page, 0, 0).dblclick()
    await expect(demo.locator('input[type="text"]').first()).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('数値編集で input[type="number"] 表示', async ({ page }) => {
    const demo = getDemoContainer(page)
    // age 列 = colIndex 1
    getCell(page, 0, 1).dblclick()
    await expect(demo.locator('input[type="number"]').first()).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('日付編集で input[type="date"] 表示', async ({ page }) => {
    const demo = getDemoContainer(page)
    // joinDate 列 = colIndex 2
    getCell(page, 0, 2).dblclick()
    await expect(demo.locator('input[type="date"]').first()).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('時刻編集で input[type="time"] 表示', async ({ page }) => {
    const demo = getDemoContainer(page)
    // startTime 列 = colIndex 3
    getCell(page, 0, 3).dblclick()
    await expect(demo.locator('input[type="time"]').first()).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('boolean は常にチェックボックス表示', async ({ page }) => {
    // active 列 = colIndex 4 (編集モードでなくてもチェックボックスが表示)
    const checkbox = getCell(page, 0, 4).locator('input[type="checkbox"]')
    await expect(checkbox).toBeVisible()
  })

  test('list は編集モードで select 表示', async ({ page }) => {
    const demo = getDemoContainer(page)
    // department 列 = colIndex 5
    await clickCell(page, 0, 5)
    await page.keyboard.press('Enter')

    const select = demo.locator('select').first()
    await expect(select).toBeVisible()

    // オプションが存在する
    const options = select.locator('option')
    await expect(options).toHaveCount(4) // Engineering, Sales, HR, Finance
  })

  test('multiList は編集モードでチェックボックス一覧表示', async ({ page }) => {
    // skills 列 = colIndex 6
    await clickCell(page, 0, 6)
    await page.keyboard.press('Enter')

    // チェックボックスが複数表示される
    const checkboxes = page.locator('[class*="multiListEditor"] input[type="checkbox"]')
    await expect(checkboxes.first()).toBeVisible()
    const count = await checkboxes.count()
    expect(count).toBe(8) // React, TypeScript, Node.js, Python, Docker, SQL, Excel, PowerPoint
  })

  test('multiList の初期値がカンマ区切りで表示', async ({ page }) => {
    // skills 列 = colIndex 6, row 0 = ['React', 'TypeScript']
    const cell = getCell(page, 0, 6)
    await expect(cell).toHaveText('React, TypeScript')
  })

  test('action 列はカスタム render が表示される', async ({ page }) => {
    const demo = getDemoContainer(page)
    // action 列 = colIndex 7 (最後の列)
    // テーブルを右にスクロールして action 列を表示
    const scrollContainer = page.locator('[class*="scrollContainer"]')
    await scrollContainer.evaluate((el) => {
      el.scrollLeft = el.scrollWidth
    })
    const actionButton = demo.locator('button', { hasText: 'Detail' }).first()
    await expect(actionButton).toBeVisible()
  })
})
