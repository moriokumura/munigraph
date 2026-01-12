import { defineStore } from 'pinia'
import type {
  Pref,
  Subprefecture,
  County,
  MunicipalityVersion,
  Change,
  Municipality,
} from '@/types/municipality'
import {
  PrefSchema,
  SubprefectureSchema,
  CountySchema,
  MunicipalityVersionSchema,
  MunicipalitySchema,
  ChangeSchema,
} from '@/types/municipality'
import { fetchCsv } from '@/utils/csv-loader'

export const useDataStore = defineStore('data', {
  state: () => ({
    loaded: false,
    loading: false,
    error: null as string | null,
    prefs: [] as Pref[],
    subprefectures: [] as Subprefecture[],
    counties: [] as County[],
    municipalityVersions: [] as MunicipalityVersion[],
    municipalities: [] as Municipality[],
    changes: [] as Change[],
    municipalityById: new Map<string, Municipality>(),
    eventsByAfter: new Map<string, Change[]>(),
    eventsByBefore: new Map<string, Change[]>(),
    prefByCode: new Map<string, Pref>(),
    subprefByCode: new Map<string, Subprefecture>(),
    countyByCode: new Map<string, County>(),
  }),

  actions: {
    // ========================================
    // データロード
    // ========================================

    /**
     * すべてのCSVデータを読み込む
     */
    async loadAll() {
      // 既にロード済みの場合は何もしない
      if (this.loaded) {
        return
      }

      // ロード中の場合は待機
      if (this.loading) {
        // ロード完了まで待機
        while (this.loading && !this.loaded) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
        return
      }

      this.loading = true
      this.error = null

      try {
        const base = import.meta.env.BASE_URL + 'data'
        const [prefsRaw, subprefsRaw, countiesRaw, municipalitiesRaw, versionsRaw, changesRaw] =
          await Promise.all([
            fetchCsv(`${base}/prefectures.csv`),
            fetchCsv(`${base}/subprefectures.csv`),
            fetchCsv(`${base}/counties.csv`),
            fetchCsv(`${base}/municipalities.csv`),
            fetchCsv(`${base}/municipality_versions.csv`),
            fetchCsv(`${base}/change_events.csv`),
          ])

        this.prefs = prefsRaw.map((r) => PrefSchema.parse(r))
        this.subprefectures = subprefsRaw.map((r) => SubprefectureSchema.parse(r))
        this.counties = countiesRaw.map((r) => CountySchema.parse(r))
        const mMasters = municipalitiesRaw.map((r) => MunicipalitySchema.parse(r))
        this.municipalityVersions = versionsRaw.map((r) => MunicipalityVersionSchema.parse(r))

        this.changes = changesRaw.map((r, i) => {
          try {
            return ChangeSchema.parse(r)
          } catch (e) {
            console.error(`Error parsing change_events.csv at index ${i}:`, r)
            throw e
          }
        })

        // インデックスを構築
        this.prefByCode = new Map(this.prefs.map((p) => [p.code, p]))
        this.subprefByCode = new Map(this.subprefectures.map((s) => [s.code, s]))
        this.countyByCode = new Map(this.counties.map((c) => [c.code, c]))

        // 自治体エンティティの構築
        const mMap = new Map<string, Municipality>()
        for (const m of mMasters) {
          mMap.set(m.id, {
            ...m,
            versions: [],
          })
        }

        for (const v of this.municipalityVersions) {
          const m = mMap.get(v.municipality_id)
          if (m) {
            m.versions.push(v)
          }
        }

        // バージョンを日付順にソート
        for (const m of mMap.values()) {
          m.versions.sort((a, b) => {
            const dateA = a.valid_from || '0000-00-00'
            const dateB = b.valid_from || '0000-00-00'
            if (dateA !== dateB) return dateA.localeCompare(dateB)

            // 開始日が同じ場合、終了日でソート（短い期間のものが先）
            const toA = a.valid_to || '9999-12-31'
            const toB = b.valid_to || '9999-12-31'
            return toA.localeCompare(toB)
          })
        }

        this.municipalities = Array.from(mMap.values())
        this.municipalityById = mMap

        // イベントマップを構築
        this.eventsByAfter = new Map()
        this.eventsByBefore = new Map()
        for (const ev of this.changes) {
          if (!this.eventsByAfter.has(ev.municipality_id_after))
            this.eventsByAfter.set(ev.municipality_id_after, [])
          this.eventsByAfter.get(ev.municipality_id_after)!.push(ev)

          if (!this.eventsByBefore.has(ev.municipality_id_before))
            this.eventsByBefore.set(ev.municipality_id_before, [])
          this.eventsByBefore.get(ev.municipality_id_before)!.push(ev)
        }

        this.loaded = true
        this.loading = false
      } catch (error) {
        console.error('Failed to load data:', error)
        this.loading = false
        this.error = error instanceof Error ? error.message : 'データの読み込みに失敗しました'
        throw error
      }
    },

    /**
     * データストアをリセット
     */
    reset() {
      this.loaded = false
      this.loading = false
      this.error = null
      this.prefs = []
      this.subprefectures = []
      this.counties = []
      this.municipalityVersions = []
      this.municipalities = []
      this.changes = []
      this.municipalityById = new Map()
      this.eventsByAfter = new Map()
      this.eventsByBefore = new Map()
      this.prefByCode = new Map()
      this.subprefByCode = new Map()
      this.countyByCode = new Map()
    },

    // ========================================
    // 検索機能
    // ========================================

    /**
     * 現存の自治体エンティティを取得
     */
    getCurrentMunicipalities() {
      return this.municipalities.filter((m) =>
        m.versions.some((v) => !v.valid_to || v.valid_to === ''),
      )
    },

    /**
     * 自治体エンティティを検索（現存・消滅両方を含む）
     * @param query 検索クエリ（自治体名、読み仮名、都道府県名、郡名、支庁/振興局名で検索）
     */
    searchMunicipalities(query: string) {
      if (!query.trim()) {
        return this.municipalities
      }

      const lowerQuery = query.toLowerCase()
      return this.municipalities.filter((m) => {
        const cityName = m.name.toLowerCase()
        const cityYomi = m.yomi.toLowerCase()
        const pref = this.prefByCode.get(m.prefecture_code)
        const prefName = pref?.name.toLowerCase() || ''

        // 名称・読み・都道府県名で検索
        if (
          cityName.includes(lowerQuery) ||
          cityYomi.includes(lowerQuery) ||
          prefName.includes(lowerQuery)
        ) {
          return true
        }

        // 各バージョンに紐づく名称・読み・郡・支庁名で検索
        return m.versions.some((v) => {
          const vName = v.name?.toLowerCase() || ''
          const vYomi = v.yomi?.toLowerCase() || ''
          const county = this.countyByCode.get(v.county_code)
          const countyName = county?.name.toLowerCase() || ''
          const countyYomi = county?.yomi.toLowerCase() || ''

          // 支庁名による検索は現存バージョンの支庁のみを対象とする
          const isCurrent = !v.valid_to || v.valid_to === ''
          const subpref = isCurrent ? this.subprefByCode.get(v.subprefecture_code) : null
          const subprefName = subpref?.name.toLowerCase() || ''
          const subprefYomi = subpref?.yomi.toLowerCase() || ''

          return (
            vName.includes(lowerQuery) ||
            vYomi.includes(lowerQuery) ||
            countyName.includes(lowerQuery) ||
            countyYomi.includes(lowerQuery) ||
            subprefName.includes(lowerQuery) ||
            subprefYomi.includes(lowerQuery)
          )
        })
      })
    },

    // ========================================
    // イベント取得ロジック
    // ========================================

    /**
     * 自治体バージョンの直前と直後のイベントを取得
     * @param municipalityId 自治体ID
     * @param version バージョンデータ
     */
    getAdjacentEvents(
      municipalityId: string,
      version: MunicipalityVersion,
    ): { before: Change[]; after: Change[] } {
      const municipality = this.municipalityById.get(municipalityId)
      if (!municipality) return { before: [], after: [] }

      // 1. CSVに記述された明示的なイベントを取得
      // before: 自治体IDが一致し、日付が valid_from と一致するイベント
      const beforeEvents = (this.eventsByAfter.get(municipalityId) || []).filter(
        (ev) => ev.date === version.valid_from,
      )

      // after: 自治体IDが一致し、日付が valid_to と一致するイベント
      const afterEvents = (this.eventsByBefore.get(municipalityId) || []).filter(
        (ev) => ev.date === version.valid_to,
      )

      // 2. 同一自治体内での郡変更を自動検知
      const vIndex = municipality.versions.findIndex((v) => v === version)
      if (vIndex > 0) {
        const prevVersion = municipality.versions[vIndex - 1]!

        // 郡の変更をチェック
        if (prevVersion.county_code !== version.county_code) {
          const afterCounty = this.countyByCode.get(version.county_code)?.name || 'なし'

          // 市制施行によって郡が「なし」になった場合は自明なので表示しない
          const isCityNow = (version.name || municipality.name).endsWith('市')
          const isNowNoCounty = afterCounty === 'なし'

          if (!(isCityNow && isNowNoCounty)) {
            beforeEvents.push({
              code: `auto_county_${municipalityId}_${version.valid_from}`,
              date: version.valid_from,
              event_type: '郡変更',
              municipality_id_before: municipalityId,
              municipality_id_after: municipalityId,
            })
          }
        }
      }

      return { before: beforeEvents, after: afterEvents }
    },
  },
})
