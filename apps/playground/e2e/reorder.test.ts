import { expect, test } from '@playwright/test'
import { getCell, goToBasicDemo } from './helpers'

test.describe('行の並び替え (DnD)', () => {
  test('行番号が表示される', async ({ page }) => {
    await goToBasicDemo(page)
    const rowHeaders = page.locator('[class*="rowHeader"]:not([class*="Placeholder"])')
    await expect(rowHeaders.first()).toBeVisible()
    await expect(rowHeaders.first()).toHaveText('1')
  })

  test('ヘッダー行に全選択セルが表示される', async ({ page }) => {
    await goToBasicDemo(page)
    const selectAll = page.locator('[class*="selectAllCell"]')
    await expect(selectAll).toBeVisible()
  })

  test('ソート有効時にドラッグカーソルが無効になる', async ({ page }) => {
    await goToBasicDemo(page)

    // ソート前は行番号がドラッグ可能
    const rowHeader = page.locator('[class*="rowHeader"]:not([class*="Placeholder"])').first()
    await expect(rowHeader).toHaveClass(/draggable/)

    // ソートを有効化
    const ageHeader = page.locator('[class*="headerCell"]', { hasText: '年齢' })
    const ageSortBtn = ageHeader.locator('button[aria-label="ソート"]')
    await ageSortBtn.click()
    await expect(ageHeader).toHaveAttribute('data-sort', 'asc')

    // ドラッグ可能クラスがなくなる (通常行の行番号にはdraggableなし)
    const rowHeaderAfter = page.locator('[class*="rowHeader"]:not([class*="Placeholder"])').first()
    await expect(rowHeaderAfter).not.toHaveClass(/draggable/)

    // ソートを解除 (desc -> 解除)
    await ageSortBtn.click()
    await ageSortBtn.click()

    // ドラッグ可能クラスが復帰
    const rowHeaderRestored = page
      .locator('[class*="rowHeader"]:not([class*="Placeholder"])')
      .first()
    await expect(rowHeaderRestored).toHaveClass(/draggable/)
  })

  test('DnD で行の順序を変更できる', async ({ page }) => {
    await goToBasicDemo(page)

    // 最初の行の名前を確認
    const firstCell = getCell(page, 0, 0)
    const firstName = await firstCell.textContent()

    // 1行目の行番号ヘッダーを取得
    const firstRowHeader = page.locator('[class*="rowHeader"]:not([class*="Placeholder"])').first()
    const headerBox = await firstRowHeader.boundingBox()
    if (!headerBox) throw new Error('Row header not found')

    const startX = headerBox.x + headerBox.width / 2
    const startY = headerBox.y + headerBox.height / 2

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

  test('行番号クリックで行全体を選択', async ({ page }) => {
    await goToBasicDemo(page)

    // 2行目の行番号をクリック
    const rowHeader = page.locator('[class*="rowHeader"]:not([class*="Placeholder"])').nth(1)
    await rowHeader.click()

    // 2行目の最初のセルがアクティブ
    const firstCol = page.locator('[data-row][data-col="0"]').nth(1)
    await expect(firstCol).toHaveClass(/activeCell/)
  })
})
