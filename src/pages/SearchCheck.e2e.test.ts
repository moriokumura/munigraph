import { test, expect } from '@playwright/test'

test('与那城町と桜島町が検索でヒットすること', async ({ page }) => {
  await page.goto('/#/browse')

  // データロードを待機
  await expect(page.locator('text=件を表示中')).toBeVisible()

  // キーワード入力
  const searchInput = page.getByPlaceholder('市区町村名、郡名、都道府県名、読み仮名で検索...')

  // 与那城町
  await searchInput.fill('与那城')
  await expect(page.locator('text=与那城村').first()).toBeVisible()
  await expect(page.locator('text=与那城町').first()).toBeVisible()

  // 桜島町
  await searchInput.clear()
  await searchInput.fill('桜島')
  await expect(page.locator('text=西桜島村').first()).toBeVisible()
  await expect(page.locator('text=桜島町').first()).toBeVisible()

  // 河内町 (熊本県)
  await searchInput.clear()
  await searchInput.fill('河内町')
  // 複数あるはずだが、熊本県のものが含まれているか
  // テキストの内容を細かく指定せず、自治体リストの要素内に「熊本県」と「河内町」が含まれていることを確認
  const kawachiRow = page
    .locator('div[role="button"]')
    .filter({ hasText: '熊本県' })
    .filter({ hasText: '河内町' })
    .first()
  await expect(kawachiRow).toBeVisible()
})
