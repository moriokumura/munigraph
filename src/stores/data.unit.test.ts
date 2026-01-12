import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import fs from 'fs'
import path from 'path'
import Papa from 'papaparse'
import { useDataStore } from './data'
import { fetchCsv } from '../utils/csv-loader'
import { MunicipalityVersionSchema } from '../types/municipality'
import type {
  Pref,
  MunicipalityVersion,
  Change,
  Subprefecture,
  County,
} from '../types/municipality'

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

  const mockNewMunicipalities = [
    { id: 'M001', name: '伊達町', yomi: 'だてちょう', prefecture_code: '01' },
    { id: 'M002', name: '伊達市', yomi: 'だてし', prefecture_code: '01' },
  ]

  const mockNewVersions: MunicipalityVersion[] = [
    {
      municipality_id: 'M001',
      subprefecture_code: '01013',
      county_code: '01069',
      valid_from: '',
      valid_to: '1972-04-01',
    },
    {
      municipality_id: 'M002',
      subprefecture_code: '01013',
      county_code: '',
      valid_from: '1972-04-01',
      valid_to: '',
    },
    {
      municipality_id: 'M002',
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
      municipality_id_before: 'M001',
      municipality_id_after: 'M002',
    },
  ]

  it('loadAllがデータを正しくロードし、自治体を属性で集約すること', async () => {
    const store = useDataStore()

    // fetchCsvのモックの戻り値を設定
    vi.mocked(fetchCsv).mockImplementation(async (path: string) => {
      if (path.endsWith('/prefectures.csv')) return mockPrefs as any
      if (path.endsWith('/subprefectures.csv')) return mockSubprefs as any
      if (path.endsWith('/counties.csv')) return mockCounties as any
      if (path.endsWith('/municipalities.csv')) return mockNewMunicipalities as any
      if (path.endsWith('/municipality_versions.csv')) return mockNewVersions as any
      if (path.endsWith('/change_events.csv')) return mockChanges as any
      return []
    })

    await store.loadAll()

    expect(store.loaded).toBe(true)
    expect(store.municipalities).toHaveLength(2) // 伊達町, 伊達市
    const dateShi = store.municipalityById.get('M002')
    expect(dateShi?.versions).toHaveLength(2) // 伊達市の2つのバージョンが集約されている
  })

  it('getCurrentMunicipalitiesが現存する自治体のみを返すこと', async () => {
    const store = useDataStore()
    store.municipalities = [
      { ...mockNewMunicipalities[0]!, versions: [mockNewVersions[0]!] },
      { ...mockNewMunicipalities[1]!, versions: [mockNewVersions[1]!, mockNewVersions[2]!] },
    ]
    store.loaded = true

    const currentMunicipalities = store.getCurrentMunicipalities()
    expect(currentMunicipalities).toHaveLength(1)
    expect(currentMunicipalities[0]?.name).toBe('伊達市')
  })

  it('searchMunicipalitiesがクエリに一致する自治体を返すこと', async () => {
    const store = useDataStore()
    store.municipalities = [
      { ...mockNewMunicipalities[0]!, versions: [mockNewVersions[0]!] },
      { ...mockNewMunicipalities[1]!, versions: [mockNewVersions[1]!, mockNewVersions[2]!] },
    ]
    store.prefByCode = new Map(mockPrefs.map((p) => [p.code, p]))
    store.countyByCode = new Map(mockCounties.map((c) => [c.code, c]))
    store.loaded = true

    // 名前で検索
    expect(store.searchMunicipalities('伊達市')).toHaveLength(1)
    // 読みで検索
    expect(store.searchMunicipalities('だて')).toHaveLength(2)
    // 郡名で検索（伊達町のバージョンが有珠郡を持っている）
    expect(store.searchMunicipalities('有珠郡')).toHaveLength(1)
  })

  it('getAdjacentEventsが直前・直後のイベントを正しく取得すること', async () => {
    const store = useDataStore()
    store.changes = mockChanges
    store.eventsByAfter = new Map([['M002', [mockChanges[0]]]] as [string, Change[]][])
    store.eventsByBefore = new Map([['M001', [mockChanges[0]]]] as [string, Change[]][])
    store.municipalityById = new Map([
      ['M001', { ...mockNewMunicipalities[0]!, versions: [mockNewVersions[0]!] }],
      [
        'M002',
        { ...mockNewMunicipalities[1]!, versions: [mockNewVersions[1]!, mockNewVersions[2]!] },
      ],
    ])
    store.loaded = true

    // 伊達町の直後イベント (valid_to: 1972-04-01)
    const dateMachiResult = store.getAdjacentEvents('M001', mockNewVersions[0]!)
    expect(dateMachiResult.after).toHaveLength(1)
    expect(dateMachiResult.after[0]?.event_type).toBe('市制施行')

    // 伊達市の直前イベント (valid_from: 1972-04-01)
    const dateShiResult = store.getAdjacentEvents('M002', mockNewVersions[1]!)
    expect(dateShiResult.before).toHaveLength(1)
    expect(dateShiResult.before[0]?.event_type).toBe('市制施行')
  })

  describe('New Entity-Centric Structure (TDD)', () => {
    const mockTddMunicipalities = [
      { id: 'M001', name: '幌加内町', yomi: 'ほろかないちょう', prefecture_code: '01' },
    ]
    const mockTddVersions: MunicipalityVersion[] = [
      {
        municipality_id: 'M001',
        subprefecture_code: '01012',
        county_code: '01040',
        valid_from: '',
        valid_to: '2010-04-01',
      },
      {
        municipality_id: 'M001',
        subprefecture_code: '01002',
        county_code: '01050',
        valid_from: '2010-04-01',
        valid_to: '',
      },
    ]

    it('CSVをロードし、同一ID内で郡変更を自動検知すること', async () => {
      const store = useDataStore()

      vi.mocked(fetchCsv).mockImplementation(async (path: string) => {
        if (path.endsWith('/municipalities.csv')) return mockTddMunicipalities as any
        if (path.endsWith('/municipality_versions.csv')) return mockTddVersions as any
        if (path.endsWith('/change_events.csv')) return []
        if (path.endsWith('/prefectures.csv')) return mockPrefs as any
        return []
      })

      await store.loadAll()

      const horokanai = store.municipalityById.get('M001')
      expect(horokanai).toBeDefined()
      expect(horokanai?.name).toBe('幌加内町')
      expect(horokanai?.versions).toHaveLength(2)

      // 郡変更の自動検知（郡が 01040 -> 01050 に変わっている）
      const adj = store.getAdjacentEvents('M001', horokanai!.versions[1]!)
      // change_events.csv は空だが、郡変更が自動生成されて before に入っていることを期待
      expect(adj.before).toHaveLength(1)
      expect(adj.before[0]?.event_type).toBe('郡変更')
    })
  })

  describe('Real Data Integrity', () => {
    it('現存する自治体数が正確に1747件であること', () => {
      const csvPath = path.resolve(process.cwd(), 'public/data/municipality_versions.csv')
      const csvContent = fs.readFileSync(csvPath, 'utf8')

      const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
      })

      const versions = (parsed.data as any[]).map((r) => MunicipalityVersionSchema.parse(r))

      // 現存バージョンの抽出（valid_to が空のレコード）
      const currentVersions = versions.filter((v) => !v.valid_to || v.valid_to.trim() === '')

      // 自治体IDのユニーク数
      const municipalityIds = new Set(currentVersions.map((v) => v.municipality_id))

      expect(municipalityIds.size).toBe(1747)
    })

    it('泊村が2つ別の自治体として認識されていること', () => {
      // マスターデータで北海道(01)の「泊村」が2件あることを確認
      const csvPath = path.resolve(process.cwd(), 'public/data/municipalities.csv')
      const csvContent = fs.readFileSync(csvPath, 'utf8')

      const parsed = Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
      })

      const tomariCount = (parsed.data as Record<string, string>[]).filter(
        (r) => r.name === '泊村' && r.prefecture_code === '01',
      ).length

      expect(tomariCount).toBe(2)
    })
  })

  describe('Real Data Search', () => {
    it('与那城町、桜島町、河内町が検索で見つかること', async () => {
      const store = useDataStore()

      // 実データをロードするための特殊なモック
      vi.mocked(fetchCsv).mockImplementation(async (url: string) => {
        const fileName = url.split('/').pop()
        if (!fileName) return []
        const csvPath = path.resolve(process.cwd(), 'public/data', fileName)
        const csvContent = fs.readFileSync(csvPath, 'utf8')
        return Papa.parse(csvContent, { header: true, skipEmptyLines: true }).data as any
      })

      await store.loadAll()

      const yonashiro = store.searchMunicipalities('与那城町')
      expect(yonashiro.some((m) => m.name === '与那城町')).toBe(true)

      const sakurajima = store.searchMunicipalities('桜島町')
      expect(sakurajima.some((m) => m.name === '桜島町')).toBe(true)

      const kawachi = store.searchMunicipalities('河内町')
      expect(kawachi.some((m) => m.name === '河内町' && m.prefecture_code === '43')).toBe(true)
    })
  })
})
