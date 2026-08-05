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
    const firstWidth = await wrappers.nth(0).evaluate((el) => (el as HTMLElement).offsetWidth)
    const secondWidth = await wrappers.nth(1).evaluate((el) => (el as HTMLElement).offsetWidth)

    // カラム数が違うのでテーブル幅も違うはず
    expect(firstWidth).toBeLessThan(secondWidth)

    // 親コンテナより小さい (余白がない)
    const demoWidth = await demo.evaluate((el) => (el as HTMLElement).offsetWidth)
    expect(firstWidth).toBeLessThan(demoWidth)
  })

  test('autoWidth のテーブルが親幅を超えても固定列を維持して内部でスクロールする', async ({
    page,
  }) => {
    await goToMultiTableDemo(page)
    const demo = getDemoContainer(page)
    const wrapper = demo.locator('[class*="wrapper"]').nth(1)

    await wrapper.evaluate((element) => {
      const parent = element.parentElement
      if (parent) parent.style.width = '300px'
    })

    const parentWidth = await wrapper.evaluate(
      (element) => element.parentElement?.getBoundingClientRect().width ?? 0,
    )
    const wrapperWidth = await wrapper.evaluate((element) => element.getBoundingClientRect().width)
    const scrollContainer = wrapper.locator('[class*="scrollContainer"]')
    const { clientWidth, scrollWidth } = await scrollContainer.evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }))
    const firstFrozenCell = wrapper.locator('[data-row="0"][data-col="0"]')
    const secondFrozenCell = wrapper.locator('[data-row="0"][data-col="1"]')
    const scrollingCell = wrapper.locator('[data-row="0"][data-col="2"]')
    const before = await Promise.all([
      firstFrozenCell.boundingBox(),
      secondFrozenCell.boundingBox(),
      scrollingCell.boundingBox(),
    ])

    await scrollContainer.evaluate((element) => {
      element.scrollLeft = element.scrollWidth
    })

    const after = await Promise.all([
      firstFrozenCell.boundingBox(),
      secondFrozenCell.boundingBox(),
      scrollingCell.boundingBox(),
    ])

    expect(wrapperWidth).toBeLessThanOrEqual(parentWidth + 1)
    expect(scrollWidth).toBeGreaterThan(clientWidth)
    expect(before.every((box) => box !== null)).toBe(true)
    expect(after.every((box) => box !== null)).toBe(true)
    expect(Math.abs((after[0]?.x ?? 0) - (before[0]?.x ?? 0))).toBeLessThan(2)
    expect(Math.abs((after[1]?.x ?? 0) - (before[1]?.x ?? 0))).toBeLessThan(2)
    expect((after[2]?.x ?? 0) - (before[2]?.x ?? 0)).toBeLessThan(-10)
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
