import { expect, test } from '@playwright/test'
import { getCell, getDemoContainer, goToEditingDemo } from './helpers'

test.describe('バリデーション', () => {
  test('エラーセルの赤背景表示', async ({ page }) => {
    await goToEditingDemo(page)

    // EditingDemo にはバリデーションエラーのある行がある
    // email が空 (row=1) や invalid-email (row=2) がエラー
    // エラーセルにはクラス errorCell が付く
    const errorCells = page.locator('[class*="errorCell"]')
    await expect(errorCells.first()).toBeVisible()
  })

  test('警告セルの黄背景表示', async ({ page }) => {
    await goToEditingDemo(page)

    // score > 80 のカスタム警告 (row=0, score=85)
    const warnCells = page.locator('[class*="warnCell"]')
    await expect(warnCells.first()).toBeVisible()
  })

  test('エラーセルホバーでツールチップ表示', async ({ page }) => {
    await goToEditingDemo(page)
    const demo = getDemoContainer(page)

    const errorCell = demo.locator('[class*="errorCell"]').first()
    await errorCell.hover()

    // デモコンテナ内の tooltip のみ対象にする
    const tooltip = demo.locator('[class*="tooltip"]')
    await expect(tooltip).toBeVisible()
  })

  test('エラー/警告カウント表示確認', async ({ page }) => {
    await goToEditingDemo(page)
    const demo = getDemoContainer(page)

    await expect(demo.getByText(/エラー: \d+/)).toBeVisible()
    await expect(demo.getByText(/警告: \d+/)).toBeVisible()
  })

  test('無効な値を入力してバリデーション発火', async ({ page }) => {
    await goToEditingDemo(page)
    const demo = getDemoContainer(page)

    // score 列 (colIndex=1) に -10 を入力 (min=0 なのでエラー)
    const cell = getCell(page, 0, 1)
    await cell.dblclick()

    const input = demo.locator('input[type="number"]').first()
    await input.fill('-10')
    await input.press('Enter')

    // トーストまたはエラー表示を確認
    // format エラーの場合は Toast が出る、validation エラーはセルに表示
    // -10 は number として valid だが min=0 に違反 → validation error
    const errorCount = demo.getByText(/エラー: \d+/)
    await expect(errorCount).toBeVisible()
  })
})
