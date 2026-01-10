import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDataStore } from './data'
import { fetchCsv } from '../utils/csv-loader'
import type { Pref, City, Change, Subprefecture, County } from '../types/municipality'

// csv-loaderのモック化
vi.mock('../utils/csv-loader', () => ({
  fetchCsv: vi.fn(),
}))

describe('DataStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  const mockPrefs: Pref[] = [{ code: '01', name: '北海道', yomi: 'ほっかいどう' }]
  const mockSubprefs: Subprefecture[] = [
    {
      code: '01013',
      name: '胆振総合振興局',
      yomi: 'いぶりそうごうしんこうきょく',
      prefecture_code: '01',
    },
  ]
  const mockCounties: County[] = [
    { code: '01069', name: '有珠郡', yomi: 'うすぐん', prefecture_code: '01' },
  ]
  const mockCities: City[] = [
    {
      code: '01576_initial',
      name: '伊達町',
      yomi: 'だてちょう',
      prefecture_code: '01',
      subprefecture_code: '01013',
      county_code: '01069',
      valid_from: '',
      valid_to: '1972-04-01',
    },
    {
      code: '01233_19720401',
      name: '伊達市',
      yomi: 'だてし',
      prefecture_code: '01',
      subprefecture_code: '01013',
      county_code: '',
      valid_from: '1972-04-01',
      valid_to: '',
    },
  ]
  const mockChanges: Change[] = [
    {
      code: 'event1',
      date: '1972-04-01',
      event_type: '市制施行',
      city_code_before: '01576_initial',
      city_code_after: '01233_19720401',
    },
  ]

  it('loadAllがデータを正しくロードし、インデックスを構築すること', async () => {
    const store = useDataStore()

    // fetchCsvのモックの戻り値を設定
    vi.mocked(fetchCsv).mockImplementation(async (path: string) => {
      if (path.endsWith('/prefectures.csv')) return mockPrefs as unknown as Record<string, string>[]
      if (path.endsWith('/subprefectures.csv'))
        return mockSubprefs as unknown as Record<string, string>[]
      if (path.endsWith('/counties.csv')) return mockCounties as unknown as Record<string, string>[]
      if (path.endsWith('/cities.csv')) return mockCities as unknown as Record<string, string>[]
      if (path.endsWith('/change_events.csv'))
        return mockChanges as unknown as Record<string, string>[]
      return []
    })

    await store.loadAll()

    expect(store.loaded).toBe(true)
    expect(store.prefs).toHaveLength(1)
    expect(store.cities).toHaveLength(2)
    expect(store.cityByCode.get('01576_initial')?.name).toBe('伊達町')
    expect(store.eventsByBefore.get('01576_initial')).toHaveLength(1)
  })

  it('getCurrentCitiesが現存する自治体のみを返すこと', async () => {
    const store = useDataStore()
    store.cities = mockCities
    store.loaded = true

    const currentCities = store.getCurrentCities()
    expect(currentCities).toHaveLength(1)
    expect(currentCities[0]?.name).toBe('伊達市')
  })

  it('searchCitiesがクエリに一致する自治体を返すこと', async () => {
    const store = useDataStore()
    store.cities = mockCities
    store.prefByCode = new Map(mockPrefs.map(p => [p.code, p]))
    store.loaded = true

    // 名前で検索
    expect(store.searchCities('伊達市')).toHaveLength(1)
    // 読みで検索
    expect(store.searchCities('だて')).toHaveLength(2)
    // 都道府県名で検索
    expect(store.searchCities('北海道')).toHaveLength(2)
    // 一致しない検索
    expect(store.searchCities('東京')).toHaveLength(0)
  })

  it('getAdjacentEventsが直前・直後のイベントを正しく取得すること', async () => {
    const store = useDataStore()
    store.changes = mockChanges
    // eventsByAfter/Beforeの構築ロジックをシミュレート
    store.eventsByAfter = new Map([['01233_19720401', [mockChanges[0]]]] as [string, Change[]][])
    store.eventsByBefore = new Map([['01576_initial', [mockChanges[0]]]] as [string, Change[]][])
    store.cityByCode = new Map(mockCities.map(c => [c.code, c]))
    store.loaded = true

    // 伊達町の直後イベント
    const dateMachiResult = store.getAdjacentEvents('01576_initial')
    expect(dateMachiResult.after).toHaveLength(1)
    expect(dateMachiResult.after[0]?.event_type).toBe('市制施行')

    // 伊達市の直前イベント
    const dateShiResult = store.getAdjacentEvents('01233_19720401')
    expect(dateShiResult.before).toHaveLength(1)
    expect(dateShiResult.before[0]?.event_type).toBe('市制施行')
  })
})
