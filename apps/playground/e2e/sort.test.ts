import { expect, test } from '@playwright/test'
import { goToBasicDemo } from './helpers'

function sortButton(page: import('@playwright/test').Page, headerText: string) {
  return page
    .locator('[class*="headerCell"]', { hasText: headerText })
    .locator('button[aria-label="ソート"]')
}

test.describe('ソート', () => {
  test('ソートボタンクリックで asc → desc → 解除 サイクル', async ({ page }) => {
    await goToBasicDemo(page)
    const ageHeader = page.locator('[class*="headerCell"]', { hasText: '年齢' })
    const ageSortBtn = sortButton(page, '年齢')

    // 1回目: asc
    await ageSortBtn.click()
    await expect(ageHeader).toHaveAttribute('data-sort', 'asc')

    // 2回目: desc
    await ageSortBtn.click()
    await expect(ageHeader).toHaveAttribute('data-sort', 'desc')

    // 3回目: 解除
    await ageSortBtn.click()
    await expect(ageHeader).not.toHaveAttribute('data-sort')
  })

  test('ソートボタンが表示されている', async ({ page }) => {
    await goToBasicDemo(page)
    const ageSortBtn = sortButton(page, '年齢')

    await expect(ageSortBtn).toBeVisible()
  })

  test('ソート後のデータ順序確認', async ({ page }) => {
    await goToBasicDemo(page)

    // 年齢で昇順ソート
    await sortButton(page, '年齢').click()

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
    await sortButton(page, '年齢').click()
    await expect(ageHeader).toHaveAttribute('data-sort', 'asc')

    // 名前でソートに切り替え
    const nameHeader = page.locator('[class*="headerCell"]', { hasText: '名前' })
    await sortButton(page, '名前').click()

    await expect(nameHeader).toHaveAttribute('data-sort', 'asc')
    // 前のソートは解除
    await expect(ageHeader).not.toHaveAttribute('data-sort')
  })

  test('ヘッダークリックで列全選択', async ({ page }) => {
    await goToBasicDemo(page)
    const nameHeader = page.locator('[class*="headerCell"]', { hasText: '名前' })

    await nameHeader.click()

    // 最初のセルがアクティブ
    const firstCell = page.locator('[data-row="0"][data-col="0"]')
    await expect(firstCell).toHaveClass(/activeCell/)

    // 最後の行も選択範囲に含まれる
    const lastCell = page.locator('[data-col="0"]').last()
    await expect(lastCell).toHaveClass(/selected|selectionBottom/)
  })
})
