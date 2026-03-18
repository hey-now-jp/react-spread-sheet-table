import { expect, test } from '@playwright/test'
import { getDemoContainer, goToMultiTableDemo, modKey } from './helpers'

test.describe('複数テーブル', () => {
  test('2つのテーブルが表示される', async ({ page }) => {
    await goToMultiTableDemo(page)
    const demo = getDemoContainer(page)

    const tables = demo.locator('[class*="scrollContainer"]')
    await expect(tables).toHaveCount(2)
  })

  test('height 省略時にスクロールバーが出ない', async ({ page }) => {
    await goToMultiTableDemo(page)
    const demo = getDemoContainer(page)

    const containers = demo.locator('[class*="scrollContainer"]')
    for (let i = 0; i < 2; i++) {
      const container = containers.nth(i)
      const scrollHeight = await container.evaluate((el) => el.scrollHeight)
      const clientHeight = await container.evaluate((el) => el.clientHeight)
      expect(scrollHeight).toBeLessThanOrEqual(clientHeight + 1)
    }
  })

  test('各テーブルで独立してセル選択できる', async ({ page }) => {
    await goToMultiTableDemo(page)
    const demo = getDemoContainer(page)

    const wrappers = demo.locator('[class*="wrapper"]')

    // 1つ目のテーブルのセルをクリック
    const firstCell = wrappers.nth(0).locator('[data-row="0"][data-col="0"]')
    await firstCell.click()
    await expect(firstCell).toHaveClass(/activeCell/)

    // 2つ目のテーブルのセルをクリック
    const secondCell = wrappers.nth(1).locator('[data-row="0"][data-col="0"]')
    await secondCell.click()
    await expect(secondCell).toHaveClass(/activeCell/)

    // 1つ目のテーブルの選択が解除されている
    await expect(firstCell).not.toHaveClass(/activeCell/)
  })

  test('両テーブルに優先度 (list) カラムがある', async ({ page }) => {
    await goToMultiTableDemo(page)
    const demo = getDemoContainer(page)

    const headers = demo.locator('[class*="headerCell"]', { hasText: '優先度' })
    await expect(headers).toHaveCount(2)
  })

  test('autoWidth でテーブル幅がカラム幅の合計に収まる', async ({ page }) => {
    await goToMultiTableDemo(page)
    const demo = getDemoContainer(page)

    const wrappers = demo.locator('[class*="wrapper"]')
    const firstWidth = await wrappers.nth(0).evaluate((el) => el.offsetWidth)
    const secondWidth = await wrappers.nth(1).evaluate((el) => el.offsetWidth)

    // カラム数が違うのでテーブル幅も違うはず
    expect(firstWidth).toBeLessThan(secondWidth)

    // 親コンテナより小さい (余白がない)
    const demoWidth = await demo.evaluate((el) => el.offsetWidth)
    expect(firstWidth).toBeLessThan(demoWidth)
  })

  test('テーブルAでコピー後にテーブルBでコピーするとテーブルAのマーチングアンツが消える', async ({
    page,
    context,
  }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await goToMultiTableDemo(page)
    const demo = getDemoContainer(page)
    const wrappers = demo.locator('[class*="wrapper"]')
    const mod = modKey(page)

    // テーブルAのセルを選択してコピー
    const cellA = wrappers.nth(0).locator('[data-row="0"][data-col="0"]')
    await cellA.click()
    await page.keyboard.press(`${mod}+c`)

    // テーブルAにマーチングアンツが表示されている
    await expect(wrappers.nth(0).locator('[class*="clipboardCell"]')).toHaveCount(1)

    // テーブルBのセルを選択してコピー
    const cellB = wrappers.nth(1).locator('[data-row="0"][data-col="0"]')
    await cellB.click()
    await page.keyboard.press(`${mod}+c`)

    // テーブルBにマーチングアンツが表示されている
    await expect(wrappers.nth(1).locator('[class*="clipboardCell"]')).toHaveCount(1)

    // テーブルAのマーチングアンツが消えている
    await expect(wrappers.nth(0).locator('[class*="clipboardCell"]')).toHaveCount(0)
  })

  test('各テーブルのセルを編集できる', async ({ page }) => {
    await goToMultiTableDemo(page)
    const demo = getDemoContainer(page)

    const firstWrapper = demo.locator('[class*="wrapper"]').nth(0)
    const cell = firstWrapper.locator('[data-row="0"][data-col="0"]')

    // セルをクリックしてアクティブにし、React ハイドレーション完了を確認
    await cell.click()
    await expect(cell).toHaveClass(/activeCell/)

    await cell.dblclick()

    const input = firstWrapper.locator('input[type="text"]')
    await input.fill('Updated Name')
    await input.press('Enter')

    await expect(cell).toContainText('Updated Name')
  })
})
