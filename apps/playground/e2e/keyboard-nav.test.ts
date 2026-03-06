import { expect, test } from '@playwright/test'
import { clickCell, getCell, getScrollContainer, goToBasicDemo } from './helpers'

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
    // 年齢で昇順ソート (ソートボタンをクリック)
    const ageHeader = page.locator('[class*="headerCell"]', { hasText: '年齢' })
    await ageHeader.locator('button[aria-label="ソート"]').click()
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

  test('Space でページスクロールしない', async ({ page }) => {
    await goToBasicDemo(page)
    await clickCell(page, 0, 0)

    const scrollBefore = await getScrollContainer(page).evaluate((el) => el.scrollTop)
    await page.keyboard.press('Space')
    const scrollAfter = await getScrollContainer(page).evaluate((el) => el.scrollTop)

    expect(scrollAfter).toBe(scrollBefore)
  })
})
