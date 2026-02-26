import { expect, test } from '@playwright/test'
import { clickCell, getScrollContainer, goToVirtualScrollDemo } from './helpers'

test.describe('仮想スクロール', () => {
  test.beforeEach(async ({ page }) => {
    await goToVirtualScrollDemo(page)
  })

  test('初期表示で DOM ノード数が行数より少ない', async ({ page }) => {
    // 10,000 行あるが、DOM 上の行は画面に表示される分だけ
    const visibleRows = page.locator('[data-row]')
    const count = await visibleRows.count()

    // 画面に収まる行数 + バッファ (数十行程度)
    expect(count).toBeLessThan(200)
    expect(count).toBeGreaterThan(0)
  })

  test('スクロール後に新しい行データが表示される', async ({ page }) => {
    const container = getScrollContainer(page)

    // 先頭行のテキストを取得
    const firstRow = page.locator('[data-col="1"]').first()
    const firstText = await firstRow.textContent()
    expect(firstText).toBe('Row 1')

    // 大きくスクロール
    await container.evaluate((el) => {
      el.scrollTop = 5000
    })

    // 待機してから確認
    await page.waitForTimeout(100)
    const newFirstRow = page.locator('[data-col="1"]').first()
    const newText = await newFirstRow.textContent()
    expect(newText).not.toBe('Row 1')
  })

  test('矢印キーで画面外に移動するとスクロール追従', async ({ page }) => {
    await clickCell(page, 0, 1)

    const container = getScrollContainer(page)
    const scrollBefore = await container.evaluate((el) => el.scrollTop)
    expect(scrollBefore).toBe(0)

    // 25回下に移動して画面外に出る
    for (let i = 0; i < 25; i++) {
      await page.keyboard.press('ArrowDown')
    }

    const scrollAfter = await container.evaluate((el) => el.scrollTop)
    expect(scrollAfter).toBeGreaterThan(0)
  })
})
