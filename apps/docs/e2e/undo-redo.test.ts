import { expect, test } from '@playwright/test'
import { getCell, getDemoContainer, goToEditingDemo, modKey } from './helpers'

test.describe('Undo/Redo', () => {
  test('セル編集後に Ctrl+Z で元に戻す', async ({ page }) => {
    await goToEditingDemo(page)
    const demo = getDemoContainer(page)
    const mod = modKey(page)

    // email 列 (colIndex=0) の row=0 を編集
    const cell = getCell(page, 0, 0)
    const original = await cell.textContent()

    await cell.dblclick()
    const input = demo.locator('input[type="text"]').first()
    await input.fill('changed@example.com')
    await input.press('Enter')
    await expect(cell).toHaveText('changed@example.com')

    // Undo
    await page.keyboard.press(`${mod}+KeyZ`)
    await expect(cell).toHaveText(original ?? '')
  })

  test('Ctrl+Y でやり直し', async ({ page }) => {
    await goToEditingDemo(page)
    const demo = getDemoContainer(page)
    const mod = modKey(page)

    const cell = getCell(page, 0, 0)
    await cell.dblclick()
    const input = demo.locator('input[type="text"]').first()
    await input.fill('redo@example.com')
    await input.press('Enter')

    // Undo
    await page.keyboard.press(`${mod}+KeyZ`)
    // Redo
    await page.keyboard.press(`${mod}+KeyY`)
    await expect(cell).toHaveText('redo@example.com')
  })

  test('複数回の undo/redo サイクル', async ({ page }) => {
    await goToEditingDemo(page)
    const demo = getDemoContainer(page)
    const mod = modKey(page)

    const cell = getCell(page, 0, 0)
    const original = await cell.textContent()

    // 2回編集
    await cell.dblclick()
    await demo.locator('input[type="text"]').first().fill('first@example.com')
    await demo.locator('input[type="text"]').first().press('Enter')

    await cell.dblclick()
    await demo.locator('input[type="text"]').first().fill('second@example.com')
    await demo.locator('input[type="text"]').first().press('Enter')
    await expect(cell).toHaveText('second@example.com')

    // Undo 2回
    await page.keyboard.press(`${mod}+KeyZ`)
    await expect(cell).toHaveText('first@example.com')
    await page.keyboard.press(`${mod}+KeyZ`)
    await expect(cell).toHaveText(original ?? '')

    // Redo 2回
    await page.keyboard.press(`${mod}+KeyY`)
    await expect(cell).toHaveText('first@example.com')
    await page.keyboard.press(`${mod}+KeyY`)
    await expect(cell).toHaveText('second@example.com')
  })

  test('新しい編集で redo スタック消去', async ({ page }) => {
    await goToEditingDemo(page)
    const demo = getDemoContainer(page)
    const mod = modKey(page)

    const cell = getCell(page, 0, 0)
    await cell.dblclick()
    await demo.locator('input[type="text"]').first().fill('edit1@example.com')
    await demo.locator('input[type="text"]').first().press('Enter')

    // Undo
    await page.keyboard.press(`${mod}+KeyZ`)

    // 新しい編集 (redo スタック消去)
    await cell.dblclick()
    await demo.locator('input[type="text"]').first().fill('edit2@example.com')
    await demo.locator('input[type="text"]').first().press('Enter')

    // Redo は効かない (スタック消去済み)
    await page.keyboard.press(`${mod}+KeyY`)
    await expect(cell).toHaveText('edit2@example.com') // edit1 には戻らない
  })

  test('undo/redo ボタンの disabled 状態', async ({ page }) => {
    await goToEditingDemo(page)
    const demo = getDemoContainer(page)

    const undoButton = demo.locator('button', { hasText: '元に戻す' })
    const redoButton = demo.locator('button', { hasText: 'やり直し' })

    // 初期状態: 両方 disabled
    await expect(undoButton).toBeDisabled()
    await expect(redoButton).toBeDisabled()

    // 編集後: undo 有効、redo 無効
    const cell = getCell(page, 0, 0)
    await cell.dblclick()
    await demo.locator('input[type="text"]').first().fill('test@example.com')
    await demo.locator('input[type="text"]').first().press('Enter')

    await expect(undoButton).toBeEnabled()
    await expect(redoButton).toBeDisabled()

    // Undo 後: undo 無効、redo 有効
    await undoButton.click()
    await expect(undoButton).toBeDisabled()
    await expect(redoButton).toBeEnabled()
  })
})
