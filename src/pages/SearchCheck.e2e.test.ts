import { test, expect } from '@playwright/test'

test('与那城町と桜島町が検索でヒットすること', async ({ page }) => {
  await page.goto('/#/browse')

  // データロードを待機
  await expect(page.locator('text=件を表示中')).toBeVisible()

  // キーワード入力
  const searchInput = page.getByPlaceholder('市区町村名、郡名、都道府県名、読み仮名で検索...')

  // 与那城町
  await searchInput.fill('与那城')
  // 統合されたため、一覧には代表名称の「与那城町」のみが出る（旧称表示なし設定）
  await expect(page.locator('text=与那城町').first()).toBeVisible()
  // 与那城村というテキストは一覧には出てこないはず
  await expect(page.locator('text=与那城村')).toHaveCount(0)

  // クリックして詳細を開き、履歴に「与那城村」があることを確認
  await page.locator('text=与那城町').first().click()
  await expect(page.locator('text=与那城村').first()).toBeVisible()

  // 桜島町
  await searchInput.clear()
  await searchInput.fill('桜島')
  await expect(page.locator('text=桜島町').first()).toBeVisible()
  await expect(page.locator('text=西桜島村')).toHaveCount(0)

  // クリックして詳細を開き、履歴に「西桜島村」があることを確認
  await page.locator('text=桜島町').first().click()
  await expect(page.locator('text=西桜島村').first()).toBeVisible()

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

test('みよし市のタイムラインが統合されており、重複がないこと', async ({ page }) => {
  await page.goto('/#/browse')

  // データロードを待機
  await expect(page.locator('text=件を表示中')).toBeVisible()

  const searchInput = page.getByPlaceholder('市区町村名、郡名、都道府県名、読み仮名で検索...')

  // みよし市で検索
  await searchInput.clear()
  await searchInput.fill('みよし市')
  const miyoshiRow = page.locator('div[role="button"]').filter({ hasText: 'みよし市' }).first()
  await expect(miyoshiRow).toBeVisible()

  // クリックして詳細を表示
  await miyoshiRow.click()

  // タイムラインの内容を確認
  // 市制施行、名称変更、成立が1つずつ表示されていること
  // (注: getAdjacentEventsにより名称変更が自動生成されるケースもあるが、データ統合により整理されているはず)
  await expect(page.locator('text=市制施行')).toHaveCount(1)
  await expect(page.locator('text=名称変更')).toHaveCount(1)
  await expect(page.locator('text=成立')).toHaveCount(1)

  // 統合された歴史上の名称が表示されていること
  await expect(page.locator('text=三好町').first()).toBeVisible()
  await expect(page.locator('text=みよし町').first()).toBeVisible()
  await expect(page.locator('text=みよし市').first()).toBeVisible()
})

test('常陸大宮市の複雑な同日イベントが正しく表示されること', async ({ page }) => {
  await page.goto('/#/browse')

  // データロードを待機
  await expect(page.locator('text=件を表示中')).toBeVisible()

  const searchInput = page.getByPlaceholder('市区町村名、郡名、都道府県名、読み仮名で検索...')

  // 常陸大宮市で検索
  await searchInput.clear()
  await searchInput.fill('常陸大宮市')
  const row = page.locator('div[role="button"]').filter({ hasText: '常陸大宮市' }).first()
  await expect(row).toBeVisible()

  // クリックして詳細を表示
  await row.click()

  // タイムラインのイベント種類を確認
  // 2004-10-16に発生したイベント群
  await expect(page.locator('text=市制施行')).toHaveCount(1)
  await expect(page.locator('text=名称変更')).toHaveCount(1)
  await expect(page.locator('text=編入')).toHaveCount(1)
  // 初期状態
  await expect(page.locator('text=成立')).toHaveCount(1)

  // 編入カードの中身を厳密に検証
  const transferCard = page
    .locator('div')
    .filter({ hasText: /^編入$/ })
    .locator('..')
  // 編入された町村のみが表示されていること（計4つ）
  const transferItems = transferCard.locator('.cursor-pointer')
  await expect(transferItems).toHaveCount(4)
  await expect(transferItems.filter({ hasText: '緒川村' })).toBeVisible()
  await expect(transferItems.filter({ hasText: '美和村' })).toBeVisible()
  await expect(transferItems.filter({ hasText: '山方町' })).toBeVisible()
  await expect(transferItems.filter({ hasText: '御前山村' })).toBeVisible()

  // 名称変更のカードに「常陸大宮町」が表示されていること
  // (名称変更後の名前として表示される)
  const renameCard = page
    .locator('div')
    .filter({ hasText: '名称変更' })
    .locator('text=常陸大宮町')
    .first()
  await expect(renameCard).toBeVisible()

  // 市制施行のカードに「常陸大宮市」が表示されていること
  const statusCard = page
    .locator('div')
    .filter({ hasText: '市制施行' })
    .locator('text=常陸大宮市')
    .first()
  await expect(statusCard).toBeVisible()

  // 編入された町村が表示されていること
  await expect(page.locator('text=緒川村')).toBeVisible()
  await expect(page.locator('text=美和村')).toBeVisible()
  await expect(page.locator('text=山方町')).toBeVisible()
  await expect(page.locator('text=御前山村')).toBeVisible()
})
