import { expect, test } from '@playwright/test'
import { clickCell, getCell, getScrollContainer, goToBasicDemo, modKey } from './helpers'

test.describe('キーボードナビゲーション', () => {
  test('矢印キーでセル移動 (上下左右)', async ({ page }) => {
    await goToBasicDemo(page)
    await clickCell(page, 0, 0)

    // 右
    await page.keyboard.press('ArrowRight')
    await expect(getCell(page, 0, 1)).toHaveCSS('outline-style', 'solid')

    // 下
    await page.keyboard.press('ArrowDown')
    await expect(getCell(page, 1, 1)).toHaveCSS('outline-style', 'solid')

    // 左
    await page.keyboard.press('ArrowLeft')
    await expect(getCell(page, 1, 0)).toHaveCSS('outline-style', 'solid')

    // 上
    await page.keyboard.press('ArrowUp')
    await expect(getCell(page, 0, 0)).toHaveCSS('outline-style', 'solid')
  })

  test('Tab で次のセルに移動', async ({ page }) => {
    await goToBasicDemo(page)
    await clickCell(page, 0, 0)

    await page.keyboard.press('Tab')
    await expect(getCell(page, 0, 1)).toHaveCSS('outline-style', 'solid')
  })

  test('Shift+Tab で前のセルに移動', async ({ page }) => {
    await goToBasicDemo(page)
    await clickCell(page, 0, 1)

    await page.keyboard.press('Shift+Tab')
    await expect(getCell(page, 0, 0)).toHaveCSS('outline-style', 'solid')
  })

  test('ソート後の矢印キー移動はソート順に従う', async ({ page }) => {
    await goToBasicDemo(page)
    // 年齢で昇順ソート (列メニューから)
    const ageHeader = page.locator('[class*="headerCell"]', { hasText: '年齢' })
    await ageHeader.locator('button[aria-label="列メニュー"]').click()
    await page.locator('button[aria-label="昇順でソート"]').click()
    await expect(page.locator('[data-sort="asc"]')).toBeVisible()

    // 最初のセルをクリック
    const firstCell = page.locator('[data-col="0"]').first()
    const firstName = await firstCell.textContent()
    await firstCell.click()

    // ArrowDown で次の行 (ソート順)
    await page.keyboard.press('ArrowDown')
    const secondCell = page.locator('[data-col="0"]').nth(1)
    const secondName = await secondCell.textContent()

    // 異なる名前 = カーソルが移動した
    expect(secondName).not.toBe(firstName)
  })

  test('Cmd+Arrow で端までジャンプ (全セル非空)', async ({ page }) => {
    await goToBasicDemo(page)
    await clickCell(page, 0, 0)

    const mod = modKey(page)

    // Cmd+Down: 最終行にジャンプ
    await page.keyboard.press(`${mod}+ArrowDown`)
    // 最終行のセルがアクティブ
    const lastRowCell = page.locator('[data-col="0"]').last()
    await expect(lastRowCell).toHaveCSS('outline-style', 'solid')

    // Cmd+Up: 先頭行にジャンプ
    await page.keyboard.press(`${mod}+ArrowUp`)
    await expect(getCell(page, 0, 0)).toHaveCSS('outline-style', 'solid')

    // Cmd+Right: 全セル非空なので最終データ列にジャンプ (action列は空扱い)
    await page.keyboard.press(`${mod}+ArrowRight`)
    // skills列 (col 6) が最終データ列
    const activeRight = page.locator('[data-row="0"][class*="activeCell"]')
    await expect(activeRight).toBeVisible()
    const activeColIndex = Number(await activeRight.getAttribute('data-col'))
    expect(activeColIndex).toBeGreaterThan(0)

    // Cmd+Left: 先頭列にジャンプ
    await page.keyboard.press(`${mod}+ArrowLeft`)
    await expect(getCell(page, 0, 0)).toHaveCSS('outline-style', 'solid')
  })

  test('Cmd+Arrow で値の境界にジャンプ (空セルあり)', async ({ page }) => {
    await goToBasicDemo(page)

    const mod = modKey(page)

    // 2行目 (index 1) の名前セルを空にする
    await clickCell(page, 1, 0)
    await page.keyboard.press('Delete')

    // 0行目から Cmd+Down: 次のセル(1行目)が空なので、その先の非空セル(2行目)にジャンプ
    await clickCell(page, 0, 0)
    await page.keyboard.press(`${mod}+ArrowDown`)
    await expect(getCell(page, 2, 0)).toHaveCSS('outline-style', 'solid')

    // 2行目から Cmd+Up: 次のセル(1行目)が空なので、その先の非空セル(0行目)にジャンプ
    await page.keyboard.press(`${mod}+ArrowUp`)
    await expect(getCell(page, 0, 0)).toHaveCSS('outline-style', 'solid')

    // 空セル(1行目)から Cmd+Down: 最初の非空セル(2行目)にジャンプ
    await clickCell(page, 1, 0)
    await page.keyboard.press(`${mod}+ArrowDown`)
    await expect(getCell(page, 2, 0)).toHaveCSS('outline-style', 'solid')
  })

  test('Space でページスクロールしない', async ({ page }) => {
    await goToBasicDemo(page)
    await clickCell(page, 0, 0)

    const scrollBefore = await getScrollContainer(page).evaluate((el) => el.scrollTop)
    await page.keyboard.press('Space')
    const scrollAfter = await getScrollContainer(page).evaluate((el) => el.scrollTop)

    expect(scrollAfter).toBe(scrollBefore)
  })
})
