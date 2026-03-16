import { expect, test } from '@playwright/test'
import { getCell, getDemoContainer, goToEditingDemo } from './helpers'

test.describe('cellMeta', () => {
  test('Category "C" のセルに cell-highlight クラスが付与される', async ({ page }) => {
    await goToEditingDemo(page)

    // 行3 (rowIndex=2), Category 列 (colIndex=4)
    const cell = getCell(page, 2, 4)
    await expect(cell).toHaveClass(/cell-highlight/)
  })

  test('Score < 50 のセルに cell-low-score クラスが付与される', async ({ page }) => {
    await goToEditingDemo(page)

    // 行2 (rowIndex=1), Score 列 (colIndex=1), score=-5
    const cell = getCell(page, 1, 1)
    await expect(cell).toHaveClass(/cell-low-score/)
  })

  test('cellMeta のツールチップがホバーで表示される', async ({ page }) => {
    await goToEditingDemo(page)
    const demo = getDemoContainer(page)

    // Category "C" のセルにホバー
    const cell = getCell(page, 2, 4)
    await cell.hover()

    const tooltip = demo.locator('[class*="tooltip"]')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText('カテゴリ C は要レビュー対象です')
  })

  test('バリデーションエラーがある場合はエラーメッセージが優先される', async ({ page }) => {
    await goToEditingDemo(page)
    const demo = getDemoContainer(page)

    // 行2 (rowIndex=1), Score 列 (colIndex=1) は score=-5
    // バリデーションエラー (min=0) と cellMeta (score < 50) の両方が該当
    // バリデーションエラーのツールチップが優先される
    const cell = getCell(page, 1, 1)
    await cell.hover()

    const tooltip = demo.locator('[class*="tooltip"]')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText('最小値は0です')
  })

  test('cellMeta が該当しないセルにはクラスが付かない', async ({ page }) => {
    await goToEditingDemo(page)

    // 行1 (rowIndex=0), Category 列 (colIndex=4), category="A" -> 該当なし
    const cell = getCell(page, 0, 4)
    await expect(cell).not.toHaveClass(/cell-highlight/)
    await expect(cell).not.toHaveClass(/cell-low-score/)
  })

  test('Approved 未承認セルのホバーでツールチップが表示される', async ({ page }) => {
    await goToEditingDemo(page)
    const demo = getDemoContainer(page)

    // 行2 (rowIndex=1), Approved 列 (colIndex=3), approved=false
    const cell = getCell(page, 1, 3)
    await cell.hover()

    const tooltip = demo.locator('[class*="tooltip"]')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText('未承認です')
  })
})
