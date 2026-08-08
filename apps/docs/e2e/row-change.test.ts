import { expect, test } from '@playwright/test'
import { clickCell, getCell, getDemoContainer, goToRowChangeDemo, modKey } from './helpers'

test.describe('行変更の確定前処理', () => {
  test.use({
    permissions: ['clipboard-read', 'clipboard-write'],
  })

  test('開始時刻の編集で終了時刻が補正され、1回のUndoで両方戻る', async ({ page }) => {
    await goToRowChangeDemo(page)
    const demo = getDemoContainer(page)

    await getCell(page, 0, 1).dblclick()
    const input = demo.locator('input[type="time"]').first()
    await input.fill('10:00')
    await input.press('Enter')

    await expect(getCell(page, 0, 1)).toHaveText('10:00')
    await expect(getCell(page, 0, 2)).toHaveText('11:00')

    await demo.getByRole('button', { name: '元に戻す' }).click()

    await expect(getCell(page, 0, 1)).toHaveText('09:00')
    await expect(getCell(page, 0, 2)).toHaveText('10:00')
  })

  test('編集の確定内容が補正後の値を含めて通知される', async ({ page }) => {
    await goToRowChangeDemo(page)
    const demo = getDemoContainer(page)

    await getCell(page, 0, 1).dblclick()
    const input = demo.locator('input[type="time"]').first()
    await input.fill('10:00')
    await input.press('Enter')

    await expect(page.getByTestId('committed-message')).toHaveText(
      'edit: #0 startTime 09:00→10:00, endTime 10:00→11:00',
    )
    await expect(page.getByTestId('commit-count')).toHaveText('1')
  })

  test('ペーストは1操作としてまとめて通知される', async ({ page }) => {
    await goToRowChangeDemo(page)
    const mod = modKey(page)

    await page.evaluate(() => navigator.clipboard.writeText('10:00\t11:00\n13:00\t14:00'))
    await clickCell(page, 0, 1)
    await page.keyboard.press(`${mod}+KeyV`)

    await expect(page.getByTestId('committed-message')).toHaveText(
      'paste: #0 startTime 09:00→10:00, endTime 10:00→11:00 / #1 startTime 11:00→13:00, endTime 12:00→14:00',
    )
    // 2行分の変更でも通知は1回のみ
    await expect(page.getByTestId('commit-count')).toHaveText('1')

    await expect(getCell(page, 0, 1)).toHaveText('10:00')
    await expect(getCell(page, 0, 2)).toHaveText('11:00')
    await expect(getCell(page, 1, 1)).toHaveText('13:00')
    await expect(getCell(page, 1, 2)).toHaveText('14:00')
  })

  test('拒否された編集は反映されず、拒否理由が通知される', async ({ page }) => {
    await goToRowChangeDemo(page)
    const demo = getDemoContainer(page)

    // 終了を開始以前にする編集は拒否される
    await getCell(page, 0, 2).dblclick()
    const input = demo.locator('input[type="time"]').first()
    await input.fill('08:00')
    await input.press('Enter')

    await expect(getCell(page, 0, 2)).toHaveText('10:00')
    await expect(page.getByTestId('rejected-message')).toHaveText('終了は開始より後にしてください')
    // 拒否された操作は確定通知されない
    await expect(page.getByTestId('commit-count')).toHaveText('0')
  })

  test('クリアはsourceがclearとして拒否される', async ({ page }) => {
    await goToRowChangeDemo(page)

    await clickCell(page, 0, 1)
    await page.keyboard.press('Delete')

    await expect(getCell(page, 0, 1)).toHaveText('09:00')
    await expect(page.getByTestId('rejected-message')).toHaveText('この列はクリアできません')
  })

  test('1行でも拒否されるとペースト全体が反映されない', async ({ page }) => {
    await goToRowChangeDemo(page)
    const mod = modKey(page)

    // 2行目は終了が開始以前になるため、ペースト全体が拒否される
    await page.evaluate(() => navigator.clipboard.writeText('10:00\t11:00\n11:00\t10:30'))
    await clickCell(page, 0, 1)
    await page.keyboard.press(`${mod}+KeyV`)

    await expect(getCell(page, 0, 1)).toHaveText('09:00')
    await expect(getCell(page, 0, 2)).toHaveText('10:00')
    await expect(getCell(page, 1, 1)).toHaveText('11:00')
    await expect(getCell(page, 1, 2)).toHaveText('12:00')
    await expect(page.getByTestId('rejected-message')).toHaveText('終了は開始より後にしてください')
  })
})
