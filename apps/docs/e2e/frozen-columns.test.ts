import { expect, test } from '@playwright/test'
import { clickCell, getCell, getScrollContainer, goToBasicDemo } from './helpers'

test.describe('列固定', () => {
  test.beforeEach(async ({ page }) => {
    await goToBasicDemo(page)
  })

  test('固定列に sticky スタイルが適用されている', async ({ page }) => {
    // BasicDemo は frozenColumns: 1 なので、最初の列 (colIndex=0) が固定
    const frozenCell = getCell(page, 0, 0)
    await expect(frozenCell).toHaveClass(/frozenCell/)
  })

  test('非固定列には sticky スタイルが適用されていない', async ({ page }) => {
    const normalCell = getCell(page, 0, 1)
    await expect(normalCell).not.toHaveClass(/frozenCell/)
  })

  test('固定列の最後のセルに影が表示される', async ({ page }) => {
    const frozenLastCell = getCell(page, 0, 0)
    await expect(frozenLastCell).toHaveClass(/frozenLastCell/)
  })

  test('横スクロール後も固定列が表示されている', async ({ page }) => {
    const container = getScrollContainer(page)
    const frozenCell = getCell(page, 0, 0)

    // 横スクロール前の位置を記録
    const beforeBox = await frozenCell.boundingBox()
    expect(beforeBox).not.toBeNull()

    // 横にスクロール
    await container.evaluate((el) => {
      el.scrollLeft = 300
    })

    // 少し待ってからスクロール後の位置を確認
    await page.waitForTimeout(100)
    const afterBox = await frozenCell.boundingBox()
    expect(afterBox).not.toBeNull()

    // 固定列は左位置がほぼ変わらない (sticky のため)
    expect(Math.abs(afterBox!.x - beforeBox!.x)).toBeLessThan(10)
  })

  test('固定列のヘッダーにも sticky スタイルが適用されている', async ({ page }) => {
    const frozenHeader = page.locator('[class*="headerCell"]').first()
    await expect(frozenHeader).toHaveClass(/frozenHeaderCell/)
  })

  test('固定列内のセルを編集できる', async ({ page }) => {
    // 固定列 (名前列) のセルをダブルクリックして編集
    const cell = await clickCell(page, 0, 0)
    await cell.dblclick()

    // エディタが表示される
    const editor = cell.locator('input')
    await expect(editor).toBeVisible()

    // 値を入力して確定
    await editor.fill('Test Name')
    await page.keyboard.press('Enter')

    // 値が反映される
    await expect(cell).toContainText('Test Name')
  })

  test('固定列を含む範囲選択ができる', async ({ page }) => {
    // 固定列のセルをクリック
    await clickCell(page, 0, 0)

    // Shift+クリックで非固定列まで範囲選択
    const targetCell = getCell(page, 1, 2)
    await targetCell.click({ modifiers: ['Shift'] })

    // 固定列のセルも選択範囲に含まれる
    const frozenCell = getCell(page, 0, 0)
    await expect(frozenCell).toHaveClass(/activeCell/)
  })

  test('行番号列が固定されている', async ({ page }) => {
    const rowHeader = page.locator('[class*="rowHeader"]').first()
    await expect(rowHeader).toHaveClass(/frozenRowHeader/)
  })
})
