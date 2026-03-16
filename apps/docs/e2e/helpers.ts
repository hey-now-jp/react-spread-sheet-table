import type { Page } from '@playwright/test'

/** BasicDemo ページに遷移 */
export async function goToBasicDemo(page: Page) {
  await page.goto('/react-spread-sheet-table/playground/basic/')
  const container = page.locator('[class*="scrollContainer"]')
  await container.waitFor()
  // Starlight ページのフォーカスをテーブルに移す
  await container.click()
}

/** EditingDemo ページに遷移 */
export async function goToEditingDemo(page: Page) {
  await page.goto('/react-spread-sheet-table/playground/editing/')
  const container = page.locator('[class*="scrollContainer"]')
  await container.waitFor()
  await container.click()
}

/** VirtualScrollDemo ページに遷移 */
export async function goToVirtualScrollDemo(page: Page) {
  await page.goto('/react-spread-sheet-table/playground/virtual-scroll/')
  const container = page.locator('[class*="scrollContainer"]')
  await container.waitFor()
  await container.click()
}

/** デモコンテナを取得 */
export function getDemoContainer(page: Page) {
  return page.locator('.demo-container')
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

/** 列メニューを開く */
export async function openColumnMenu(page: Page, headerText: string) {
  const header = page.locator('[class*="headerCell"]', { hasText: headerText })
  await header.locator('button[aria-label="列メニュー"]').click()
}

/** ヘッダーセルのフィルタポップオーバーを開く (列メニュー経由) */
export async function openFilter(page: Page, headerText: string) {
  await openColumnMenu(page, headerText)
}

/** ツールチップ (Portal) を取得 */
export function getTooltip(page: Page) {
  return page.locator('[data-testid="sst-tooltip"]')
}

/** 列メニューからソートを適用 */
export async function sortColumn(page: Page, headerText: string, direction: 'asc' | 'desc') {
  await openColumnMenu(page, headerText)
  const label = direction === 'asc' ? '昇順でソート' : '降順でソート'
  await page.locator(`button[aria-label="${label}"]`).click()
}
