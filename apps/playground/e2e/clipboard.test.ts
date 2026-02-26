import { expect, test } from '@playwright/test'
import { clickCell, getCell, goToBasicDemo, goToVirtualScrollDemo, modKey } from './helpers'

test.describe('クリップボード', () => {
  // Playwright はデフォルトでクリップボードアクセスを許可
  test.use({
    permissions: ['clipboard-read', 'clipboard-write'],
  })

  test('単一セルのコピー & ペースト', async ({ page }) => {
    await goToBasicDemo(page)
    const mod = modKey(page)

    // コピー元: Tanaka Taro (row=0, col=0)
    await clickCell(page, 0, 0)
    await page.keyboard.press(`${mod}+KeyC`)

    // ペースト先: row=1, col=0 (Suzuki Hanako)
    await clickCell(page, 1, 0)
    await page.keyboard.press(`${mod}+KeyV`)

    // ペーストされた値を確認
    await expect(getCell(page, 1, 0)).toHaveText('Tanaka Taro')
  })

  test('範囲選択のコピー & ペースト', async ({ page }) => {
    await goToBasicDemo(page)
    const mod = modKey(page)

    // (0,0)~(1,0) を選択 (2行分の名前列)
    await clickCell(page, 0, 0)
    await page.keyboard.press('Shift+ArrowDown')

    // コピー
    await page.keyboard.press(`${mod}+KeyC`)

    // (3,0) にペースト
    await clickCell(page, 3, 0)
    await page.keyboard.press(`${mod}+KeyV`)

    await expect(getCell(page, 3, 0)).toHaveText('Tanaka Taro')
    await expect(getCell(page, 4, 0)).toHaveText('Suzuki Hanako')
  })

  test('Ctrl+X で切り取り (セルがクリアされる)', async ({ page }) => {
    await goToBasicDemo(page)
    const mod = modKey(page)

    await clickCell(page, 0, 0)
    await page.keyboard.press(`${mod}+KeyX`)

    // 切り取り元がクリアされている
    await expect(getCell(page, 0, 0)).toHaveText('')
  })

  test('read-only セルへのペーストはスキップ', async ({ page }) => {
    await goToVirtualScrollDemo(page)
    const mod = modKey(page)

    // name 列 (col=1) からコピー
    await clickCell(page, 0, 1)
    await page.keyboard.press(`${mod}+KeyC`)

    // read-only の index 列 (col=0) にペースト
    await clickCell(page, 1, 0)
    await page.keyboard.press(`${mod}+KeyV`)

    // 値は変わらない (read-only)
    await expect(getCell(page, 1, 0)).toHaveText('2')
  })
})
