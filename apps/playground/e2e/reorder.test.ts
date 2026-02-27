import { expect, test } from '@playwright/test'
import { getCell, goToBasicDemo } from './helpers'

test.describe('行の並び替え (DnD)', () => {
  test('grip ハンドルが表示される', async ({ page }) => {
    await goToBasicDemo(page)
    const handles = page.locator('[class*="dragHandle"]')
    await expect(handles.first()).toBeVisible()
  })

  test('ヘッダーにもハンドルスペーサーが表示される', async ({ page }) => {
    await goToBasicDemo(page)
    const headerSpacer = page.locator('[class*="dragHandleHeader"]')
    await expect(headerSpacer).toBeVisible()
  })

  test('ソート有効時に grip ハンドルが非表示になる', async ({ page }) => {
    await goToBasicDemo(page)

    // ソート前はハンドルが表示される
    const handles = page.locator('[class*="dragHandle"]')
    await expect(handles.first()).toBeVisible()

    // ソートを有効化
    const ageHeader = page.locator('[class*="headerCell"]', { hasText: '年齢' })
    await ageHeader.click()
    await expect(ageHeader).toHaveAttribute('data-sort', 'asc')

    // ハンドルが非表示になる
    await expect(handles).toHaveCount(0)

    // ソートを解除 (desc -> 解除)
    await ageHeader.click()
    await ageHeader.click()

    // ハンドルが再表示される
    await expect(handles.first()).toBeVisible()
  })

  test('DnD で行の順序を変更できる', async ({ page }) => {
    await goToBasicDemo(page)

    // 最初の行の名前を確認
    const firstCell = getCell(page, 0, 0)
    const firstName = await firstCell.textContent()

    // 1行目のグリップハンドルを取得
    const firstHandle = page
      .locator('[class*="dragHandle"]:not([class*="dragHandleHeader"])')
      .first()
    const handleBox = await firstHandle.boundingBox()
    if (!handleBox) throw new Error('Handle not found')

    const startX = handleBox.x + handleBox.width / 2
    const startY = handleBox.y + handleBox.height / 2

    // @dnd-kit の PointerSensor (distance: 5) を有効化するため、
    // ゆっくりとしたマウスドラッグをシミュレーション
    await page.mouse.move(startX, startY)
    await page.mouse.down()

    // まず少し移動して activation constraint を超える
    for (let i = 1; i <= 5; i++) {
      await page.mouse.move(startX, startY + i * 2)
      await page.waitForTimeout(16)
    }

    // 3行分下に移動 (ROW_HEIGHT = 32px)
    for (let i = 0; i <= 20; i++) {
      await page.mouse.move(startX, startY + 10 + i * 4)
      await page.waitForTimeout(16)
    }

    await page.mouse.up()
    await page.waitForTimeout(300)

    // 元の1行目が移動していることを確認
    const newFirstCell = getCell(page, 0, 0)
    const newFirstName = await newFirstCell.textContent()
    expect(newFirstName).not.toBe(firstName)
  })
})
