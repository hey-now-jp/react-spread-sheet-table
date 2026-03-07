import { expect, test } from '@playwright/test'
import { goToBasicDemo, openFilter } from './helpers'

test.describe('フィルタ', () => {
  test('テキストカラムの contains フィルタ', async ({ page }) => {
    await goToBasicDemo(page)
    await openFilter(page, '名前')

    // 検索して絞り込み、チェックボックスで選択 → 適用
    const input = page.locator('[class*="filterInput"]')
    await input.fill('Tanaka')
    const checkbox = page.locator('[class*="filterCheckItem"]', { hasText: 'Tanaka Taro' })
    await checkbox.locator('input[type="checkbox"]').check()
    await page.locator('[class*="filterApply"]').click()

    // Tanaka Taro のみ表示される
    const rows = page.locator('[data-col="0"]')
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toHaveText('Tanaka Taro')
  })

  test('数値カラムのフィルタ (チェックボックス選択)', async ({ page }) => {
    await goToBasicDemo(page)
    await openFilter(page, '年齢')

    // 28 を検索して選択
    const input = page.locator('[class*="filterInput"]')
    await input.fill('28')
    const checkbox = page.locator('[class*="filterCheckItem"]', { hasText: '28' })
    await checkbox.locator('input[type="checkbox"]').check()
    await page.locator('[class*="filterApply"]').click()

    // 28歳のみ表示
    const rows = page.locator('[data-col="1"]')
    await expect(rows).toHaveCount(1)
    await expect(rows.first()).toHaveText('28')
  })

  test('リストカラムのフィルタ', async ({ page }) => {
    await goToBasicDemo(page)
    await openFilter(page, '部署')

    // HR を選択して適用
    const checkbox = page.locator('[class*="filterCheckItem"]', { hasText: 'HR' })
    await checkbox.locator('input[type="checkbox"]').check()
    await page.locator('[class*="filterApply"]').click()

    // HR のみ表示
    const deptCells = page.locator('[data-col="5"]')
    const count = await deptCells.count()
    for (let i = 0; i < count; i++) {
      await expect(deptCells.nth(i)).toHaveText('HR')
    }
  })

  test('boolean カラムのフィルタ', async ({ page }) => {
    await goToBasicDemo(page)
    await openFilter(page, '在籍')

    // false を選択して適用
    const checkbox = page.locator('[class*="filterCheckItem"]', { hasText: 'false' })
    await checkbox.locator('input[type="checkbox"]').check()
    await page.locator('[class*="filterApply"]').click()

    // active=false の行のみ表示 (チェックボックスが unchecked)
    const checkboxes = page.locator('[data-col="4"] input[type="checkbox"]')
    const count = await checkboxes.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      expect(await checkboxes.nth(i).isChecked()).toBe(false)
    }
  })

  test('フィルタ解除で全行復帰', async ({ page }) => {
    await goToBasicDemo(page)

    // フィルタ適用
    await openFilter(page, '名前')
    const input = page.locator('[class*="filterInput"]')
    await input.fill('Tanaka')
    const checkbox = page.locator('[class*="filterCheckItem"]', { hasText: 'Tanaka Taro' })
    await checkbox.locator('input[type="checkbox"]').check()
    await page.locator('[class*="filterApply"]').click()
    await expect(page.locator('[data-col="0"]')).toHaveCount(1)

    // フィルタ解除
    await openFilter(page, '名前')
    await page.locator('button', { hasText: 'クリア' }).click()

    // 全行が復帰
    const rows = page.locator('[data-col="0"]')
    await expect(rows).toHaveCount(20)
  })

  test('複数値の選択でフィルタ', async ({ page }) => {
    await goToBasicDemo(page)
    await openFilter(page, '部署')

    // HR と Engineering を選択
    const hr = page.locator('[class*="filterCheckItem"]', { hasText: 'HR' })
    await hr.locator('input[type="checkbox"]').check()
    const eng = page.locator('[class*="filterCheckItem"]', { hasText: 'Engineering' })
    await eng.locator('input[type="checkbox"]').check()
    await page.locator('[class*="filterApply"]').click()

    // HR または Engineering のみ表示
    const deptCells = page.locator('[data-col="5"]')
    const count = await deptCells.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) {
      const text = await deptCells.nth(i).textContent()
      expect(text === 'HR' || text === 'Engineering').toBe(true)
    }
  })
})
