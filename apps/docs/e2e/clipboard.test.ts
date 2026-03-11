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

  test('単一セルコピー → 範囲選択ペースト (全セルを同じ値で埋める)', async ({ page }) => {
    await goToBasicDemo(page)
    const mod = modKey(page)

    // row=0, col=0 (Tanaka Taro) をコピー
    await clickCell(page, 0, 0)
    await page.keyboard.press(`${mod}+KeyC`)

    // row=2~4, col=0 を選択 (3行)
    await clickCell(page, 2, 0)
    await page.keyboard.press('Shift+ArrowDown')
    await page.keyboard.press('Shift+ArrowDown')

    // ペースト
    await page.keyboard.press(`${mod}+KeyV`)

    // 3 行すべて Tanaka Taro になる
    await expect(getCell(page, 2, 0)).toHaveText('Tanaka Taro')
    await expect(getCell(page, 3, 0)).toHaveText('Tanaka Taro')
    await expect(getCell(page, 4, 0)).toHaveText('Tanaka Taro')
  })

  test('範囲コピー → 範囲選択ペースト (タイリング)', async ({ page }) => {
    await goToBasicDemo(page)
    const mod = modKey(page)

    // row=0~1, col=0 をコピー (Tanaka Taro, Suzuki Hanako)
    await clickCell(page, 0, 0)
    await page.keyboard.press('Shift+ArrowDown')
    await page.keyboard.press(`${mod}+KeyC`)

    // row=4~7, col=0 を選択 (4行)
    await clickCell(page, 4, 0)
    await page.keyboard.press('Shift+ArrowDown')
    await page.keyboard.press('Shift+ArrowDown')
    await page.keyboard.press('Shift+ArrowDown')

    // ペースト
    await page.keyboard.press(`${mod}+KeyV`)

    // 2行パターンが2回繰り返される
    await expect(getCell(page, 4, 0)).toHaveText('Tanaka Taro')
    await expect(getCell(page, 5, 0)).toHaveText('Suzuki Hanako')
    await expect(getCell(page, 6, 0)).toHaveText('Tanaka Taro')
    await expect(getCell(page, 7, 0)).toHaveText('Suzuki Hanako')
  })

  test('範囲コピー → 単一セルペースト (従来通り)', async ({ page }) => {
    await goToBasicDemo(page)
    const mod = modKey(page)

    // row=0~1, col=0 をコピー (Tanaka Taro, Suzuki Hanako)
    await clickCell(page, 0, 0)
    await page.keyboard.press('Shift+ArrowDown')
    await page.keyboard.press(`${mod}+KeyC`)

    // row=5, col=0 にペースト (単一セル、範囲選択なし)
    await clickCell(page, 5, 0)
    await page.keyboard.press(`${mod}+KeyV`)

    // コピー次元分 (2行) だけ貼り付けられる
    await expect(getCell(page, 5, 0)).toHaveText('Tanaka Taro')
    await expect(getCell(page, 6, 0)).toHaveText('Suzuki Hanako')
  })
})
