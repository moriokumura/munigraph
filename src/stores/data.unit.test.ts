import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDataStore } from './data'
import { fetchCsv } from '../utils/csv-loader'
import type { Pref, City, Change, Subprefecture, County, Municipality } from '../types/municipality'

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
      city_code: '01576',
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
      city_code: '01233',
      name: '伊達市',
      yomi: 'だてし',
      prefecture_code: '01',
      subprefecture_code: '01013',
      county_code: '',
      valid_from: '1972-04-01',
      valid_to: '',
    },
    {
      code: '01233_20060301',
      city_code: '01233',
      name: '伊達市',
      yomi: 'だてし',
      prefecture_code: '01',
      subprefecture_code: '01013',
      county_code: '',
      valid_from: '2006-03-01',
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

  it('loadAllがデータを正しくロードし、自治体を属性で集約すること', async () => {
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
    expect(store.municipalities).toHaveLength(2) // 伊達町, 伊達市
    const dateShi = store.municipalityById.get('01233-伊達市')
    expect(dateShi?.versions).toHaveLength(2) // 伊達市の2つのバージョンが集約されている
    expect(store.cityByCode.get('01576_initial')?.name).toBe('伊達町')
  })

  it('getCurrentMunicipalitiesが現存する自治体のみを返すこと', async () => {
    const store = useDataStore()
    // loadAllを介さずに状態をセット
    const mMap = new Map<string, Municipality>()
    mMap.set('01576-伊達町', {
      id: '01576-伊達町',
      name: '伊達町',
      yomi: 'だてちょう',
      prefecture_code: '01',
      versions: [mockCities[0]!],
    })
    mMap.set('01233-伊達市', {
      id: '01233-伊達市',
      name: '伊達市',
      yomi: 'だてし',
      prefecture_code: '01',
      versions: [mockCities[1]!, mockCities[2]!],
    })
    store.municipalities = Array.from(mMap.values())
    store.loaded = true

    const currentMunicipalities = store.getCurrentMunicipalities()
    expect(currentMunicipalities).toHaveLength(1)
    expect(currentMunicipalities[0]?.name).toBe('伊達市')
  })

  it('searchMunicipalitiesがクエリに一致する自治体を返すこと', async () => {
    const store = useDataStore()
    const mMap = new Map<string, Municipality>()
    mMap.set('01576-伊達町', {
      id: '01576-伊達町',
      name: '伊達町',
      yomi: 'だてちょう',
      prefecture_code: '01',
      versions: [mockCities[0]!],
    })
    mMap.set('01233-伊達市', {
      id: '01233-伊達市',
      name: '伊達市',
      yomi: 'だてし',
      prefecture_code: '01',
      versions: [mockCities[1]!, mockCities[2]!],
    })
    store.municipalities = Array.from(mMap.values())
    store.prefByCode = new Map(mockPrefs.map(p => [p.code, p]))
    store.countyByCode = new Map(mockCounties.map(c => [c.code, c]))
    store.loaded = true

    // 名前で検索
    expect(store.searchMunicipalities('伊達市')).toHaveLength(1)
    // 読みで検索
    expect(store.searchMunicipalities('だて')).toHaveLength(2)
    // 郡名で検索（伊達町のバージョンが有珠郡を持っている）
    expect(store.searchMunicipalities('有珠郡')).toHaveLength(1)
    // 一致しない検索
    expect(store.searchMunicipalities('東京')).toHaveLength(0)
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

  it('同一都道府県内の同名自治体（泊村のケース）が個別のエンティティとして集約されること', async () => {
    const store = useDataStore()
    const mockTomariCities: City[] = [
      {
        code: '01403_initial',
        city_code: '01403',
        name: '泊村',
        yomi: 'とまりむら',
        prefecture_code: '01',
        subprefecture_code: '01005', // 後志
        county_code: '01392',
        valid_from: '',
        valid_to: '',
      },
      {
        code: '01696_initial',
        city_code: '01696',
        name: '泊村',
        yomi: 'とまりむら',
        prefecture_code: '01',
        subprefecture_code: '01007', // 根室
        county_code: '01695',
        valid_from: '',
        valid_to: '',
      },
    ]

    vi.mocked(fetchCsv).mockImplementation(async (path: string) => {
      if (path.endsWith('/cities.csv'))
        return mockTomariCities as unknown as Record<string, string>[]
      return []
    })

    await store.loadAll()

    // 名前は同じだがJISコードが異なるため、2つのエンティティになるべき
    expect(store.municipalities).toHaveLength(2)
    expect(store.getCurrentMunicipalities()).toHaveLength(2)
    expect(store.municipalityById.has('01403-泊村')).toBe(true)
    expect(store.municipalityById.has('01696-泊村')).toBe(true)
  })
})
