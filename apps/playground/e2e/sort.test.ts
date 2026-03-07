import { expect, test } from '@playwright/test'
import { goToBasicDemo, openColumnMenu, sortColumn } from './helpers'

test.describe('ソート', () => {
  test('列メニューから昇順・降順・解除を切り替え', async ({ page }) => {
    await goToBasicDemo(page)
    const ageHeader = page.locator('[class*="headerCell"]', { hasText: '年齢' })

    // 昇順ソート
    await sortColumn(page, '年齢', 'asc')
    await expect(ageHeader).toHaveAttribute('data-sort', 'asc')

    // 降順ソート
    await sortColumn(page, '年齢', 'desc')
    await expect(ageHeader).toHaveAttribute('data-sort', 'desc')

    // 解除 (アクティブな降順をもう一度クリック)
    await sortColumn(page, '年齢', 'desc')
    await expect(ageHeader).not.toHaveAttribute('data-sort')
  })

  test('列メニューボタンが表示されている', async ({ page }) => {
    await goToBasicDemo(page)
    const menuBtn = page
      .locator('[class*="headerCell"]', { hasText: '年齢' })
      .locator('button[aria-label="列メニュー"]')

    await expect(menuBtn).toBeVisible()
  })

  test('ソート後のデータ順序確認', async ({ page }) => {
    await goToBasicDemo(page)

    // 年齢で昇順ソート
    await sortColumn(page, '年齢', 'asc')

    // 最初の数行の年齢列 (colIndex=1) を確認
    const ages: number[] = []
    for (let i = 0; i < 5; i++) {
      const text = await page.locator('[data-col="1"]').nth(i).textContent()
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
    await sortColumn(page, '年齢', 'asc')
    await expect(ageHeader).toHaveAttribute('data-sort', 'asc')

    // 名前でソートに切り替え
    const nameHeader = page.locator('[class*="headerCell"]', { hasText: '名前' })
    await sortColumn(page, '名前', 'asc')

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

  test('列メニューにソートオプションが表示される', async ({ page }) => {
    await goToBasicDemo(page)
    await openColumnMenu(page, '年齢')

    await expect(page.locator('button[aria-label="昇順でソート"]')).toBeVisible()
    await expect(page.locator('button[aria-label="降順でソート"]')).toBeVisible()
  })
})
