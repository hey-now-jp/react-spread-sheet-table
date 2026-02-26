import { expect, test } from '@playwright/test'
import { goToBasicDemo } from './helpers'

test.describe('ソート', () => {
  test('ヘッダークリックで asc → desc → 解除 サイクル', async ({ page }) => {
    await goToBasicDemo(page)
    const ageHeader = page.locator('[class*="headerCell"]', { hasText: '年齢' })

    // 1回目: asc
    await ageHeader.click()
    await expect(ageHeader).toHaveAttribute('data-sort', 'asc')

    // 2回目: desc
    await ageHeader.click()
    await expect(ageHeader).toHaveAttribute('data-sort', 'desc')

    // 3回目: 解除
    await ageHeader.click()
    await expect(ageHeader).not.toHaveAttribute('data-sort')
  })

  test('ソートインジケーター表示', async ({ page }) => {
    await goToBasicDemo(page)
    const ageHeader = page.locator('[class*="headerCell"]', { hasText: '年齢' })

    await ageHeader.click()
    // SortIndicator コンポーネントが表示されている
    await expect(ageHeader.locator('[class*="sortIndicator"]')).toBeVisible()
  })

  test('ソート後のデータ順序確認', async ({ page }) => {
    await goToBasicDemo(page)

    // 年齢で昇順ソート
    await page.locator('[class*="headerCell"]', { hasText: '年齢' }).click()

    // 最初の数行の年齢列 (colIndex=1) を確認
    const ages: number[] = []
    for (let i = 0; i < 5; i++) {
      const text = await page.locator(`[data-col="1"]`).nth(i).textContent()
      ages.push(Number(text))
    }

    // 昇順であること
    for (let i = 0; i < ages.length - 1; i++) {
      expect(ages[i]).toBeLessThanOrEqual(ages[i + 1])
    }
  })

  test('別カラムのソートに切り替え', async ({ page }) => {
    await goToBasicDemo(page)

    // まず年齢でソート
    const ageHeader = page.locator('[class*="headerCell"]', { hasText: '年齢' })
    await ageHeader.click()
    await expect(ageHeader).toHaveAttribute('data-sort', 'asc')

    // 名前でソートに切り替え
    const nameHeader = page.locator('[class*="headerCell"]', { hasText: '名前' })
    await nameHeader.click()

    await expect(nameHeader).toHaveAttribute('data-sort', 'asc')
    // 前のソートは解除
    await expect(ageHeader).not.toHaveAttribute('data-sort')
  })
})
