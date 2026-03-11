import { expect, test } from '@playwright/test'
import {
  clickCell,
  getCell,
  getDemoContainer,
  goToBasicDemo,
  goToVirtualScrollDemo,
} from './helpers'

test.describe('セル編集', () => {
  test('ダブルクリックで編集モードに入り、Enter で確定', async ({ page }) => {
    await goToBasicDemo(page)
    const demo = getDemoContainer(page)
    const nameCell = demo.getByText('Tanaka Taro')
    await nameCell.dblclick()

    const input = demo.locator('input[type="text"]').first()
    await expect(input).toBeVisible()
    await input.fill('Test Name')
    await input.press('Enter')

    await expect(demo.getByText('Test Name')).toBeVisible()
  })

  test('Enter キーで編集モード開始', async ({ page }) => {
    await goToBasicDemo(page)
    const demo = getDemoContainer(page)
    await clickCell(page, 0, 0)
    await page.keyboard.press('Enter')

    const input = demo.locator('input[type="text"]').first()
    await expect(input).toBeVisible()
  })

  test('Escape で編集キャンセル (元の値に戻る)', async ({ page }) => {
    await goToBasicDemo(page)
    const demo = getDemoContainer(page)
    const cell = getCell(page, 0, 0)
    await cell.dblclick()

    const input = demo.locator('input[type="text"]').first()
    await input.fill('Cancelled')
    await input.press('Escape')

    await expect(cell).toHaveText('Tanaka Taro')
  })

  test('Tab で値が確定される', async ({ page }) => {
    await goToBasicDemo(page)
    const demo = getDemoContainer(page)
    const cell = getCell(page, 0, 0)
    await cell.dblclick()

    const input = demo.locator('input[type="text"]').first()
    await expect(input).toBeVisible()
    await input.fill('Tab Test')
    await input.press('Tab')

    // 値が確定されている
    await expect(demo.getByText('Tab Test')).toBeVisible()
    // 編集モードが解除されている
    await expect(input).not.toBeVisible()
  })

  test('直接文字入力で編集開始 (既存値を置換)', async ({ page }) => {
    await goToBasicDemo(page)
    const demo = getDemoContainer(page)
    await clickCell(page, 0, 0)
    await page.keyboard.type('A')

    const input = demo.locator('input[type="text"]').first()
    await expect(input).toBeVisible()
    await expect(input).toHaveValue('A')
  })

  test('read-only セルは編集不可', async ({ page }) => {
    await goToVirtualScrollDemo(page)
    const demo = getDemoContainer(page)
    // index 列 (colIndex=0) は readOnly
    const cell = getCell(page, 0, 0)
    await cell.dblclick()

    // 編集用の input は表示されない (チェックボックスも除外)
    // デモコンテナ内でスコープして Starlight UI との衝突を避ける
    await expect(demo.locator('input:not([type="checkbox"]), select').first()).not.toBeVisible({
      timeout: 500,
    })
  })

  test('boolean セルを Space でトグル', async ({ page }) => {
    await goToBasicDemo(page)
    // active 列 = colIndex 4
    const checkbox = getCell(page, 0, 4).locator('input[type="checkbox"]')
    const initial = await checkbox.isChecked()

    // まず隣のセルをクリック (wrapper にフォーカスが残る)
    await clickCell(page, 0, 3)
    // 矢印キーで boolean セルに移動
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Space')

    const after = await checkbox.isChecked()
    expect(after).not.toBe(initial)
  })

  test('boolean セルを Enter でトグル', async ({ page }) => {
    await goToBasicDemo(page)
    const checkbox = getCell(page, 0, 4).locator('input[type="checkbox"]')
    const initial = await checkbox.isChecked()

    // 隣のセルから矢印キーで移動
    await clickCell(page, 0, 3)
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')

    const after = await checkbox.isChecked()
    expect(after).not.toBe(initial)
  })

  test('list セルで Enter → 選択 → 自動確定', async ({ page }) => {
    await goToBasicDemo(page)
    const demo = getDemoContainer(page)
    // department 列 = colIndex 5
    await clickCell(page, 0, 5)
    await page.keyboard.press('Enter')

    const select = demo.locator('select').first()
    await expect(select).toBeVisible()
  })

  test('multiList セルで Enter → チェック切替 → Enter で確定', async ({ page }) => {
    await goToBasicDemo(page)
    // skills 列 = colIndex 6, row 0 = ['React', 'TypeScript']
    const cell = getCell(page, 0, 6)
    await expect(cell).toHaveText('React, TypeScript')

    await clickCell(page, 0, 6)
    await page.keyboard.press('Enter')

    // エディタが表示される
    const editor = page.locator('[class*="multiListEditor"]')
    await expect(editor).toBeVisible()

    // Python のチェックボックスをクリックして追加
    const pythonLabel = editor.locator('label', { hasText: 'Python' })
    await pythonLabel.click()

    // Enter で確定
    await page.keyboard.press('Enter')

    // 値が更新されている
    await expect(cell).toHaveText('React, TypeScript, Python')
  })

  test('multiList セルで Escape でキャンセル', async ({ page }) => {
    await goToBasicDemo(page)
    // skills 列 = colIndex 6, row 0 = ['React', 'TypeScript']
    const cell = getCell(page, 0, 6)
    await clickCell(page, 0, 6)
    await page.keyboard.press('Enter')

    const editor = page.locator('[class*="multiListEditor"]')
    await expect(editor).toBeVisible()

    // Docker をチェック
    const dockerLabel = editor.locator('label', { hasText: 'Docker' })
    await dockerLabel.click()

    // Escape でキャンセル
    await page.keyboard.press('Escape')

    // 元の値のまま
    await expect(cell).toHaveText('React, TypeScript')
  })

  test('multiList セルで Space から編集開始', async ({ page }) => {
    await goToBasicDemo(page)
    // skills 列 = colIndex 6
    await clickCell(page, 0, 5)
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Space')

    const editor = page.locator('[class*="multiListEditor"]')
    await expect(editor).toBeVisible()
  })

  test('multiList セルの直接文字入力は無視される', async ({ page }) => {
    await goToBasicDemo(page)
    await clickCell(page, 0, 6)
    await page.keyboard.type('A')

    // エディタは表示されない
    const editor = page.locator('[class*="multiListEditor"]')
    await expect(editor).not.toBeVisible({ timeout: 500 })
  })
})
