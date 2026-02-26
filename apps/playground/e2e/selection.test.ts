import { expect, test } from '@playwright/test'
import { clickCell, getCell, goToBasicDemo } from './helpers'

test.describe('選択', () => {
  test('クリックでアクティブセル設定 (アウトライン表示)', async ({ page }) => {
    await goToBasicDemo(page)
    const cell = await clickCell(page, 0, 0)
    await expect(cell).toHaveCSS('outline-style', 'solid')
  })

  test('Shift+クリックで範囲選択', async ({ page }) => {
    await goToBasicDemo(page)
    await clickCell(page, 0, 0)
    await page.keyboard.down('Shift')
    await getCell(page, 2, 2).click()
    await page.keyboard.up('Shift')

    // 範囲内のセルがハイライトされている
    const midCell = getCell(page, 1, 1)
    const bg = await midCell.evaluate((el) => getComputedStyle(el).backgroundColor)
    // 選択範囲はデフォルトの透明でない背景を持つ
    expect(bg).not.toBe('rgba(0, 0, 0, 0)')
  })

  test('ドラッグで範囲選択', async ({ page }) => {
    await goToBasicDemo(page)
    const start = getCell(page, 0, 0)
    const end = getCell(page, 2, 1)

    const startBox = await start.boundingBox()
    const endBox = await end.boundingBox()
    if (!startBox || !endBox) return

    await page.mouse.move(startBox.x + 5, startBox.y + 5)
    await page.mouse.down()
    await page.mouse.move(endBox.x + 5, endBox.y + 5)
    await page.mouse.up()

    // 範囲内のセルに選択スタイルが付く
    const midCell = getCell(page, 1, 0)
    const bg = await midCell.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bg).not.toBe('rgba(0, 0, 0, 0)')
  })

  test('Shift+矢印キーで範囲拡張', async ({ page }) => {
    await goToBasicDemo(page)
    await clickCell(page, 0, 0)

    await page.keyboard.press('Shift+ArrowDown')
    await page.keyboard.press('Shift+ArrowRight')

    // (0,0)~(1,1) が選択範囲
    const cell11 = getCell(page, 1, 1)
    const bg = await cell11.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bg).not.toBe('rgba(0, 0, 0, 0)')
  })

  test('Escape で選択解除', async ({ page }) => {
    await goToBasicDemo(page)
    const cell = await clickCell(page, 0, 0)
    await expect(cell).toHaveCSS('outline-style', 'solid')

    await page.keyboard.press('Escape')
    await expect(cell).not.toHaveCSS('outline-style', 'solid')
  })

  test('選択範囲のハイライト表示確認', async ({ page }) => {
    await goToBasicDemo(page)
    await clickCell(page, 0, 0)
    await page.keyboard.press('Shift+ArrowDown')

    // アクティブセルと選択範囲で異なるスタイル
    const activeCell = getCell(page, 0, 0)
    await expect(activeCell).toHaveCSS('outline-style', 'solid')

    const selectedCell = getCell(page, 1, 0)
    const bg = await selectedCell.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(bg).not.toBe('rgba(0, 0, 0, 0)')
  })
})
