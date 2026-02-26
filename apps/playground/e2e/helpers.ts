import type { Page } from '@playwright/test'

/** BasicDemo ページに遷移 (デフォルトページ) */
export async function goToBasicDemo(page: Page) {
  await page.goto('/')
  await page.locator('h2', { hasText: '基本テーブル' }).waitFor()
}

/** EditingDemo ページに遷移 */
export async function goToEditingDemo(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: '編集 & バリデーション' }).click()
  await page.locator('h2', { hasText: '編集 & バリデーション' }).waitFor()
}

/** VirtualScrollDemo ページに遷移 */
export async function goToVirtualScrollDemo(page: Page) {
  await page.goto('/')
  await page.getByRole('button', { name: '仮想スクロール (1万行)' }).click()
  await page.locator('h2', { hasText: '仮想スクロール' }).waitFor()
}

/** data-row / data-col でセルを取得 */
export function getCell(page: Page, rowIndex: number, colIndex: number) {
  return page.locator(`[data-row="${rowIndex}"][data-col="${colIndex}"]`)
}

/** セルをクリックしてフォーカスを確保 */
export async function clickCell(page: Page, rowIndex: number, colIndex: number) {
  const cell = getCell(page, rowIndex, colIndex)
  await cell.click()
  return cell
}

/** Cmd/Ctrl 修飾キーを返す (macOS = Meta, それ以外 = Control) */
export function modKey(_page: Page): string {
  const isMac = process.platform === 'darwin'
  return isMac ? 'Meta' : 'Control'
}

/** スクロールコンテナを取得 */
export function getScrollContainer(page: Page) {
  return page.locator('[class*="scrollContainer"]')
}

/** ヘッダーセルのフィルタボタンをクリック */
export async function openFilter(page: Page, headerText: string) {
  const header = page.locator('[class*="headerCell"]', { hasText: headerText })
  await header.locator('button[aria-label="フィルター"]').click()
}
