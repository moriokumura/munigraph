import { defineStore } from 'pinia'
import Papa from 'papaparse'
import { z } from 'zod'

const PrefRow = z.object({ code: z.string(), name: z.string(), yomi: z.string().optional().default('') })
const CountyRow = z.object({ code: z.string(), name: z.string(), yomi: z.string().default(''), prefecture_code: z.string() })
const CityRow = z.object({ code: z.string(), name: z.string(), yomi: z.string().default(''), prefecture_code: z.string(), county_code: z.string().default(''), valid_from: z.string().default(''), valid_to: z.string().default('') })
const EventRow = z.object({ code: z.string(), date: z.string(), event_type: z.string(), city_code_before: z.string(), city_code_after: z.string() })

export type Pref = z.infer<typeof PrefRow>
export type County = z.infer<typeof CountyRow>
export type City = z.infer<typeof CityRow>
export type Change = z.infer<typeof EventRow>

// CSVファイルを読み込んでパースする
async function fetchCsv(path: string): Promise<Record<string, string>[]> {
  const res = await fetch(path)
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status} ${res.statusText}`)
  }
  
  const text = await res.text()
  const parsed = Papa.parse<Record<string, string>>(text, { 
    header: true, 
    skipEmptyLines: true 
  })
  
  // パースエラーがある場合は警告を表示
  if (parsed.errors.length > 0) {
    console.warn(`CSV parse warnings for ${path}:`, parsed.errors.slice(0, 3))
  }
  
  return parsed.data
}

export const useDataStore = defineStore('data', {
  state: () => ({
    loaded: false,
    loading: false,
    error: null as string | null,
    prefs: [] as Pref[],
    counties: [] as County[],
    cities: [] as City[],
    changes: [] as Change[],
    cityByCode: new Map<string, City>(),
    eventsByAfter: new Map<string, Change[]>(),
    eventsByBefore: new Map<string, Change[]>(),
    prefByCode: new Map<string, Pref>(),
    countyByCode: new Map<string, County>(),
  }),
  actions: {
    async loadAll() {
      // 既にロード済みの場合は何もしない
      if (this.loaded) {
        console.log('Data already loaded, skipping...')
        return
      }
      
      // ロード中の場合は待機
      if (this.loading) {
        console.log('Data loading in progress, waiting...')
        // ロード完了まで待機
        while (this.loading && !this.loaded) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
        return
      }
      
      this.loading = true
      this.error = null
      console.log('Starting data load...')
      
      try {
        const base = '/data'
        console.log('Loading data from:', base)
        const [prefsRaw, countiesRaw, citiesRaw, changesRaw] = await Promise.all([
          fetchCsv(`${base}/prefectures.csv`),
          fetchCsv(`${base}/counties.csv`),
          fetchCsv(`${base}/cities.csv`),
          fetchCsv(`${base}/change_events.csv`),
        ])
        console.log('CSV data loaded:', {
          prefs: prefsRaw.length,
          counties: countiesRaw.length,
          cities: citiesRaw.length,
          changes: changesRaw.length
        })
      this.prefs = prefsRaw.map((r) => PrefRow.parse(r))
      this.counties = countiesRaw.map((r) => CountyRow.parse(r))
      this.cities = citiesRaw.map((r) => CityRow.parse(r))
      this.changes = changesRaw.map((r) => EventRow.parse(r))

      // indexes
      this.cityByCode = new Map(this.cities.map((c) => [c.code, c]))
      this.prefByCode = new Map(this.prefs.map((p) => [p.code, p]))
      this.countyByCode = new Map(this.counties.map((c) => [c.code, c]))
      this.eventsByAfter = new Map()
      this.eventsByBefore = new Map()
      for (const ev of this.changes) {
        if (!this.eventsByAfter.has(ev.city_code_after)) this.eventsByAfter.set(ev.city_code_after, [])
        this.eventsByAfter.get(ev.city_code_after)!.push(ev)
        if (!this.eventsByBefore.has(ev.city_code_before)) this.eventsByBefore.set(ev.city_code_before, [])
        this.eventsByBefore.get(ev.city_code_before)!.push(ev)
      }
      
      console.log('Event maps built:')
      console.log('Events by after (city_code_after):', this.eventsByAfter.size)
      console.log('Events by before (city_code_before):', this.eventsByBefore.size)
      console.log('Sample events for 05210 (by after):', this.eventsByAfter.get('05210')?.length || 0)
      console.log('Sample events for 05210 (by before):', this.eventsByBefore.get('05210')?.length || 0)
      this.loaded = true
      this.loading = false
      console.log('Data store loaded successfully')
      } catch (error) {
        console.error('Failed to load data:', error)
        this.loading = false
        this.error = error instanceof Error ? error.message : 'データの読み込みに失敗しました'
        throw error
      }
    },

    // データストアをリセット
    reset() {
      this.loaded = false
      this.loading = false
      this.error = null
      this.prefs = []
      this.counties = []
      this.cities = []
      this.changes = []
      this.cityByCode = new Map()
      this.eventsByAfter = new Map()
      this.eventsByBefore = new Map()
      this.prefByCode = new Map()
      this.countyByCode = new Map()
    },

    // 現存の市区町村を取得
    getCurrentCities() {
      const currentCities = this.cities.filter(city => 
        (!city.valid_to || city.valid_to.trim() === '') && 
        city.name && city.name.trim() !== ''
      )
      console.log('Current cities count:', currentCities.length, 'out of total:', this.cities.length)
      return currentCities
    },

    // 検索機能（現存・消滅両方を含む）
    searchCities(query: string) {
      if (!query.trim()) {
        // 検索クエリが空の場合は、現存・消滅両方の市区町村を返す
        return this.cities.filter(city => city.name && city.name.trim() !== '')
      }
      
      const lowerQuery = query.toLowerCase()
      return this.cities.filter(city => {
        if (!city.name || city.name.trim() === '') return false // 名前が空の市区町村は除外
        const cityName = city.name.toLowerCase()
        const cityYomi = city.yomi.toLowerCase()
        const pref = this.prefByCode.get(city.prefecture_code)
        const prefName = pref?.name.toLowerCase() || ''
        const county = this.countyByCode.get(city.county_code)
        const countyName = county?.name.toLowerCase() || ''
        const countyYomi = county?.yomi.toLowerCase() || ''
        
        return cityName.includes(lowerQuery) ||
               cityYomi.includes(lowerQuery) ||
               prefName.includes(lowerQuery) ||
               countyName.includes(lowerQuery) ||
               countyYomi.includes(lowerQuery)
      })
    },

    // 市制施行・町制施行のような変更を検出
    getMunicipalStatusChanges(cityCode: string): Change[] {
      const events: Change[] = []
      const city = this.cityByCode.get(cityCode)
      if (!city) return events
      
      // 同じ都道府県で同じ名前（読み仮名も考慮）の市区町村を探す
      const similarCities = this.cities.filter(c => 
        c.prefecture_code === city.prefecture_code &&
        c.code !== cityCode &&
        (
          c.name === city.name ||
          (c.yomi && city.yomi && c.yomi === city.yomi)
        )
      )
      
      for (const similarCity of similarCities) {
        // 市制施行: 町→市
        if (city.name.endsWith('市') && similarCity.name.endsWith('町')) {
          const event: Change = {
            code: `status_${cityCode}_${similarCity.code}`,
            date: '2000-01-01', // 仮の日付
            event_type: '市制施行',
            city_code_before: similarCity.code,
            city_code_after: cityCode
          }
          events.push(event)
        }
        // 町制施行: 村→町
        else if (city.name.endsWith('町') && similarCity.name.endsWith('村')) {
          const event: Change = {
            code: `status_${cityCode}_${similarCity.code}`,
            date: '2000-01-01', // 仮の日付
            event_type: '町制施行',
            city_code_before: similarCity.code,
            city_code_after: cityCode
          }
          events.push(event)
        }
      }
      
      return events
    },

    // 市区町村の祖先イベントを取得（時系列順）
    getAncestorEvents(cityCode: string): Change[] {
      const events: Change[] = []
      const processedCodes = new Set<string>() // 処理済み市区町村コードを記録
      
      console.log(`Getting ancestor events for city: ${cityCode}`)
      
      // まず、この市区町村が「新設」または「編入」された場合のイベントを取得
      const afterEvents = this.eventsByAfter.get(cityCode)
      console.log(`After events for ${cityCode}:`, afterEvents?.length || 0)
      
      // 市制施行・町制施行の可能性もチェック（町→市、村→町の変化）
      const statusChanges = this.getMunicipalStatusChanges(cityCode)
      console.log(`Status changes for ${cityCode}:`, statusChanges.length)
      
      if (statusChanges.length > 0) {
        events.push(...statusChanges)
        // 市制施行・町制施行の前の自治体の祖先も取得
        for (const statusChange of statusChanges) {
          if (!processedCodes.has(statusChange.city_code_before)) {
            processedCodes.add(statusChange.city_code_before)
            const ancestorEvents = this.getAncestorEventsRecursive(statusChange.city_code_before, processedCodes)
            events.push(...ancestorEvents)
          }
        }
      }
      
      if (afterEvents && afterEvents.length > 0) {
        // 同じ日付のイベントをグループ化（合併などで複数の自治体が同時に変化する場合がある）
        const eventsByDate = new Map<string, Change[]>()
        for (const event of afterEvents) {
          if (!eventsByDate.has(event.date)) {
            eventsByDate.set(event.date, [])
          }
          eventsByDate.get(event.date)!.push(event)
        }
        
        // 日付順にソートして処理（新しい日付から古い日付へ）
        const sortedDates = Array.from(eventsByDate.keys()).sort((a, b) => b.localeCompare(a))
        
        for (const date of sortedDates) {
          const eventsForDate = eventsByDate.get(date)!
          console.log(`Processing events for date ${date}:`, eventsForDate.length)
          
          // 同じ日付のイベントをすべて追加
          for (const event of eventsForDate) {
            events.push(event)
            console.log(`Added event:`, event)
          }
          
          // この日付のイベントの祖先を再帰的に取得
          for (const event of eventsForDate) {
            if (!processedCodes.has(event.city_code_before)) {
              processedCodes.add(event.city_code_before)
              const ancestorEvents = this.getAncestorEventsRecursive(event.city_code_before, processedCodes)
              events.push(...ancestorEvents)
            }
          }
          
          // 最初の日付のイベントのみ処理して終了（直近の変化のみを対象とする）
          break
        }
      }
      
      console.log(`Total ancestor events found: ${events.length}`)
      return events
    },
    
    // 再帰的に祖先イベントを取得
    getAncestorEventsRecursive(cityCode: string, processedCodes: Set<string>): Change[] {
      const events: Change[] = []
      
      console.log(`Getting recursive ancestor events for city: ${cityCode}`)
      
      // この市区町村が「変化前」の場合のイベントを確認
      const beforeEvents = this.eventsByBefore.get(cityCode)
      console.log(`Before events for ${cityCode}:`, beforeEvents?.length || 0)
      
      if (!beforeEvents || beforeEvents.length === 0) return events
      
      // 時期別コードの場合、コードのサフィックス（日付部分）を取得
      // 例: "18201_20050101" → "20050101"
      const codeParts = cityCode.split('_')
      const codeDate = codeParts.length > 1 ? codeParts[1] : null
      
      // コードの日付より前のイベントのみをフィルタリング（時系列の整合性を保つため）
      let filteredEvents = beforeEvents
      if (codeDate && codeDate !== 'initial') {
        // コードの日付をYYYY-MM-DD形式に変換
        // 例: "20050101" → "2005-01-01"
        const year = codeDate.substring(0, 4)
        const month = codeDate.substring(4, 6)
        const day = codeDate.substring(6, 8)
        const codeDateStr = `${year}-${month}-${day}`
        
        console.log(`Filtering events for code date: ${codeDateStr}`)
        filteredEvents = beforeEvents.filter(e => e.date <= codeDateStr)
        console.log(`Filtered to ${filteredEvents.length} events`)
      }
      
      if (filteredEvents.length === 0) return events
      
      // 最新のイベントを取得（日付順）
      const latestEvent = filteredEvents.sort((a, b) => b.date.localeCompare(a.date))[0]
      console.log(`Latest before event:`, latestEvent)
      
      events.push(latestEvent)
      
      // さらに祖先がある場合は再帰的に取得
      if (!processedCodes.has(latestEvent.city_code_before)) {
        processedCodes.add(latestEvent.city_code_before)
        const ancestorEvents = this.getAncestorEventsRecursive(latestEvent.city_code_before, processedCodes)
        events.push(...ancestorEvents)
      }
      
      return events
    },
    
    // 市区町村の直前と直後のイベントを取得
    // 直前イベント: この市区町村が新設されたイベント
    // 直後イベント: この市区町村が変化・消滅したイベント
    getAdjacentEvents(cityCode: string): { before: Change[], after: Change[] } {
      // 直前のイベント: この市区町村が変化後となったイベント（新設されたイベント）
      const afterEvents = this.eventsByAfter.get(cityCode) || []
      
      // 最新の日付のイベントを取得（複数ある場合は最新のもの）
      const latestDate = afterEvents.length > 0
        ? afterEvents.sort((a, b) => b.date.localeCompare(a.date))[0].date
        : null
      
      const beforeEvents = latestDate
        ? afterEvents.filter(e => e.date === latestDate)
        : []
      
      // 直後のイベントを探す
      const beforeEventsAll = this.eventsByBefore.get(cityCode) || []
      const codeParts = cityCode.split('_')
      const codeDate = codeParts.length > 1 ? codeParts[1] : null
      
      let filteredBeforeEvents = beforeEventsAll
      
      if (codeDate && codeDate !== 'initial') {
        // 時期別コード（例：20201_20050101）の場合
        // コードの日付より後のイベントのみを取得（時系列の整合性を保つ）
        const year = codeDate.substring(0, 4)
        const month = codeDate.substring(4, 6)
        const day = codeDate.substring(6, 8)
        const codeDateStr = `${year}-${month}-${day}`
        
        filteredBeforeEvents = beforeEventsAll.filter(e => e.date > codeDateStr)
      } else if (codeDate === 'initial') {
        // initialコード（例：20581_initial）の場合
        // この自治体が消滅するイベントを取得
        const latestBeforeDate = beforeEventsAll.length > 0
          ? beforeEventsAll.sort((a, b) => b.date.localeCompare(a.date))[0].date
          : null
        
        if (latestBeforeDate) {
          const latestBeforeEvents = beforeEventsAll.filter(e => e.date === latestBeforeDate)
          const sameDateAfterCode = latestBeforeEvents[0]?.city_code_after
          
          if (sameDateAfterCode) {
            // 同じ日付・同じ変化後自治体のすべてのイベントを取得
            const additionalEvents = this.eventsByAfter.get(sameDateAfterCode) || []
            filteredBeforeEvents = additionalEvents.filter((e: Change) => e.date === latestBeforeDate)
          }
        }
      }
      
      // この市区町村の次のバージョンが変化後となったイベントを探す
      // 例：20201_20050101 の場合、20201_20100101 が変化後となったイベント
      const baseCode = codeParts[0]
      const futureAfterEvents: Change[] = []
      
      if (codeDate && codeDate !== 'initial') {
        const year = codeDate.substring(0, 4)
        const month = codeDate.substring(4, 6)
        const day = codeDate.substring(6, 8)
        const codeDateStr = `${year}-${month}-${day}`
        
        // 同じベースコードでより新しい日付のイベントを検索
        for (const [eventCode, events] of this.eventsByAfter.entries()) {
          if (eventCode.startsWith(baseCode + '_')) {
            for (const event of events) {
              if (event.date > codeDateStr) {
                // 同じ日付・同じ変化後自治体のすべてのイベントを取得
                const sameDateAfterCode = event.city_code_after
                const additionalEvents = this.eventsByAfter.get(sameDateAfterCode) || []
                const sameDateEvents = additionalEvents.filter((e: Change) => e.date === event.date)
                futureAfterEvents.push(...sameDateEvents)
                break
              }
            }
            if (futureAfterEvents.length > 0) break
          }
        }
      }
      
      // 消滅イベントと次のバージョンのイベントを結合
      const allFutureEvents = [...filteredBeforeEvents, ...futureAfterEvents]
      
      // 最も近い日付のイベントを取得
      const earliestDate = allFutureEvents.length > 0
        ? allFutureEvents.sort((a, b) => a.date.localeCompare(b.date))[0].date
        : null
      
      const afterEventsResult = earliestDate
        ? allFutureEvents.filter(e => e.date === earliestDate)
        : []
      
      return { before: beforeEvents, after: afterEventsResult }
    },

    // 市区町村の祖先イベントを取得（編入の場合も含む）
    getAncestorEventsWithMergers(cityCode: string): Change[] {
      const events: Change[] = []
      const processedEventCodes = new Set<string>()
      const processedCityCodes = new Set<string>()
      
      console.log(`[getAncestorEventsWithMergers] Starting for city: ${cityCode}`)
      
      // まず通常の祖先イベントを取得
      const normalEvents = this.getAncestorEvents(cityCode)
      console.log(`[getAncestorEventsWithMergers] Got ${normalEvents.length} normal events:`, normalEvents.map(e => `${e.date} ${e.event_type} ${e.city_code_before}->${e.city_code_after}`))
      
      for (const event of normalEvents) {
        if (!processedEventCodes.has(event.code)) {
          processedEventCodes.add(event.code)
          events.push(event)
          console.log(`[getAncestorEventsWithMergers] Added event: ${event.date} ${event.event_type} ${event.city_code_before}->${event.city_code_after}`)
        }
      }
      
      // 編入イベントの場合、存続自治体（変化後）のさらに古いイベントも取得
      for (const event of normalEvents) {
        console.log(`[getAncestorEventsWithMergers] Checking event: ${event.event_type}, city_code_after=${event.city_code_after}, cityCode=${cityCode}, match=${event.city_code_after === cityCode}`)
        
        if (event.event_type === '編入' && event.city_code_after === cityCode) {
          console.log(`[getAncestorEventsWithMergers] Found merger event for ${cityCode} on ${event.date}, getting older events of surviving city`)
          
          if (!processedCityCodes.has(event.city_code_after)) {
            processedCityCodes.add(event.city_code_after)
            
            // 存続自治体のこのイベントより古いイベントを取得
            const olderEvents = this.getSurvivingCityAncestors(event.city_code_after, event.date)
            console.log(`[getAncestorEventsWithMergers] Got ${olderEvents.length} older events:`, olderEvents.map(e => `${e.date} ${e.event_type} ${e.city_code_before}->${e.city_code_after}`))
            
            for (const olderEvent of olderEvents) {
              if (!processedEventCodes.has(olderEvent.code)) {
                processedEventCodes.add(olderEvent.code)
                events.push(olderEvent)
                console.log(`[getAncestorEventsWithMergers] Added older event: ${olderEvent.date} ${olderEvent.event_type} ${olderEvent.city_code_before}->${olderEvent.city_code_after}`)
              }
            }
          }
        }
      }
      
      console.log(`[getAncestorEventsWithMergers] Final events count: ${events.length}`)
      
      // 日付順にソート
      return events.sort((a, b) => b.date.localeCompare(a.date))
    },
    
    // 市区町村コードから、その市区町村が存続自治体となった編入イベントの祖先を取得
    // このメソッドは、指定されたコードが city_code_before として使用されているイベントを検索する
    getSurvivingCityAncestors(cityCode: string, fromEventDate?: string): Change[] {
      const events: Change[] = []
      const processedCodes = new Set<string>()
      
      console.log(`[getSurvivingCityAncestors] Starting for city: ${cityCode}, fromEventDate: ${fromEventDate}`)
      
      // このコードが変化前（city_code_before）となっている編入イベントを検索
      const allBeforeEvents = this.eventsByBefore.get(cityCode) || []
      console.log(`[getSurvivingCityAncestors] Found ${allBeforeEvents.length} events where ${cityCode} is city_code_before:`, allBeforeEvents.map(e => `${e.date} ${e.event_type} ${e.city_code_before}->${e.city_code_after}`))
      
      // fromEventDateが指定されている場合、それより前のイベントのみを取得
      const beforeEvents = allBeforeEvents.filter(event => {
        const isCorrectType = event.event_type === '編入'
        const isBeforeDate = !fromEventDate || event.date < fromEventDate
        console.log(`[getSurvivingCityAncestors] Event ${event.date}: type=${event.event_type}, isCorrectType=${isCorrectType}, isBeforeDate=${isBeforeDate} (${event.date} < ${fromEventDate})`)
        return isCorrectType && isBeforeDate
      })
      
      console.log(`[getSurvivingCityAncestors] After filtering: ${beforeEvents.length} events`)
      
      for (const event of beforeEvents) {
        if (!processedCodes.has(event.code)) {
          processedCodes.add(event.code)
          events.push(event)
          console.log(`[getSurvivingCityAncestors] Added event: ${event.date} ${event.event_type} ${event.city_code_before}->${event.city_code_after}`)
          
          // この編入イベントの他の変化前の自治体の祖先も取得
          if (!processedCodes.has(event.city_code_before)) {
            processedCodes.add(event.city_code_before)
            const ancestors = this.getAncestorEventsRecursive(event.city_code_before, processedCodes)
            events.push(...ancestors)
          }
        }
      }
      
      console.log(`[getSurvivingCityAncestors] Returning ${events.length} events`)
      return events.sort((a, b) => b.date.localeCompare(a.date))
    },
  },
})
