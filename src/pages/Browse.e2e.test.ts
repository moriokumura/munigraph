import { test, expect } from '@playwright/test'

test.describe('Munigraph E2E', () => {
  test('トップページからブラウズ画面へ遷移し、自治体を検索できる', async ({ page }) => {
    // 1. トップページにアクセス
    await page.goto('./')

    // タイトルの確認
    await expect(page).toHaveTitle(/munigraph/i)
    await expect(page.locator('h1')).toContainText(/munigraph/i)

    // 2. 「ブラウズ」ボタンをクリック
    await page.click('text=ブラウズ')

    // ブラウズ画面（URLに /browse が含まれる）へ遷移したことを確認
    // HashHistory を使用しているため、URLは #/browse になる
    await expect(page).toHaveURL(/.*#\/browse/)

    // 3. 検索窓に「伊達」と入力
    const searchInput = page.locator('input[placeholder*="検索"]')
    await searchInput.fill('伊達')

    // 4. リストに「北海道 有珠郡 伊達町」や「北海道 伊達市」が表示されることを確認
    // データがロードされるまで少し待機が必要な場合がある
    await expect(page.locator('text=伊達市').first()).toBeVisible()
    await expect(page.locator('text=伊達町').first()).toBeVisible()

    // 5. 「伊達市」をクリックして詳細画面へ遷移
    await page.click('text=伊達市')

    // 詳細画面が表示されることを確認（h3タグに自治体名が表示される）
    // 複数の h3 があるため、自治体名が含まれるものを特定する
    await expect(page.locator('h3').filter({ hasText: '伊達市' })).toBeVisible()
    // Wikipediaリンクが表示されていることを確認
    await expect(page.locator('text=Wikipedia')).toBeVisible()
  })

  test('チェックボックスで自治体の種類をフィルタリングできる', async ({ page }) => {
    await page.goto('./#/browse')

    // 初期状態では「市」が表示されているはず
    await expect(page.locator('text=伊達市').first()).toBeVisible()

    // 「市」のチェックボックスをオフにする
    // ラベルテキスト「市」に紐付くチェックボックスを探す
    await page.uncheck('label:has-text("市") input[type="checkbox"]')

    // 「市」が消えることを確認（「伊達市」が表示されない）
    await expect(page.locator('text=伊達市')).not.toBeVisible()

    // 「町」はまだ残っているはず（「伊達町」は表示される）
    await expect(page.locator('text=伊達町').first()).toBeVisible()
  })

  test('幌加内町の支庁変更が正しく表示される', async ({ page }) => {
    await page.goto('./#/browse')

    // 1. 検索窓に「幌加内」と入力
    const searchInput = page.locator('input[placeholder*="検索"]')
    await searchInput.fill('幌加内')

    // 2. リストから選択
    await page.click('text=幌加内町')

    // 3. 詳細画面の確認
    await expect(page.locator('h3').filter({ hasText: '幌加内町' })).toBeVisible()

    // 4. タイムラインに支庁変更が表示されているか確認
    // 「空知総合振興局 → 上川総合振興局」というテキストが含まれているはず
    await expect(page.locator('text=空知総合振興局 → 上川総合振興局')).toBeVisible()
    await expect(page.locator('text=管轄変更')).toBeVisible()
  })

  test('門前町の郡名変更とエンティティ集約が正しく機能している', async ({ page }) => {
    await page.goto('./#/browse')

    // 1. 検索窓に「門前」と入力
    const searchInput = page.locator('input[placeholder*="検索"]')
    await searchInput.fill('門前')

    // 2. 検索結果が1件のみであることを確認（集約されているか）
    // 「門前町」というテキストを持つ要素が複数出てこないことを確認
    const results = page.locator('div[role="button"]:has-text("門前町")')
    await expect(results).toHaveCount(1)

    // 3. クリックして詳細を表示
    await results.click()

    // 4. 属性変更「鳳至郡 → 鳳珠郡」が表示されているか確認
    await expect(page.locator('text=鳳至郡 → 鳳珠郡')).toBeVisible()
    await expect(page.locator('text=管轄変更')).toBeVisible()
  })
})
