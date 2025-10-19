<template>
  <section class="p-4">
    <h2 class="text-2xl font-bold mb-6">自治体ブラウズ</h2>

    <!-- ローディング表示 -->
    <div v-if="!dataStore.loaded" class="text-center py-8">
      <p>データを読み込み中...</p>
    </div>

    <!-- 検索結果 -->
    <div v-else>
      <!-- 検索フォーム -->
      <div class="mb-6">
        <label for="search-input" class="block text-sm font-medium text-gray-700 mb-2">
          自治体検索
        </label>
        <input
          id="search-input"
          name="search"
          v-model="searchQuery"
          type="text"
          placeholder="市区町村名、郡名、都道府県名、読み仮名で検索..."
          class="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-describedby="search-help"
        />
        <p id="search-help" class="mt-1 text-sm text-gray-500">
          市区町村名、郡名、都道府県名、読み仮名（ひらがな）で検索できます
        </p>
      </div>
      <!-- フィルター設定 -->
      <div class="mb-4 p-4 bg-gray-50 rounded-lg">
        <div class="flex items-center gap-4 mb-2 flex-wrap">
          <label class="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              v-model="showExisting"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            >
            <span class="text-sm font-medium">現存自治体</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              v-model="showExtinct"
              class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            >
            <span class="text-sm font-medium">消滅自治体</span>
          </label>
          <div class="flex items-center gap-2">
            <label for="prefecture-filter" class="text-sm font-medium">都道府県:</label>
            <select 
              id="prefecture-filter"
              v-model="selectedPrefecture"
              class="rounded border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">すべて</option>
              <option 
                v-for="pref in dataStore.prefs" 
                :key="pref.code" 
                :value="pref.code"
              >
                {{ pref.name }}
              </option>
            </select>
          </div>
          <div class="flex items-center gap-2">
            <label for="county-filter" class="text-sm font-medium">郡:</label>
            <select 
              id="county-filter"
              v-model="selectedCounty"
              :disabled="!selectedPrefecture"
              class="rounded border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">すべて</option>
              <option 
                v-for="county in availableCounties" 
                :key="county.code" 
                :value="county.code"
              >
                {{ county.name }} ({{ county.yomi }})
              </option>
            </select>
          </div>
          <div class="flex items-center">
            <button
              @click="resetFilters"
              class="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              title="すべてのフィルターをリセット"
            >
              リセット
            </button>
          </div>
        </div>
        <div class="text-sm text-gray-600">
          {{ filteredCities.length }}件の市区町村を表示中
        </div>
      </div>
      
      <!-- 市区町村一覧 -->
      <div class="grid gap-2">
        <div
          v-for="city in filteredCities"
          :key="city.code"
          class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          @click="selectCity(city)"
          tabindex="0"
          role="button"
          :aria-label="`${city.name}の詳細を表示 (${getCityInfo(city)})`"
          @keydown.enter="selectCity(city)"
          @keydown.space.prevent="selectCity(city)"
        >
          <div class="flex justify-between items-center">
            <div class="flex-1">
              <h3 class="font-semibold text-lg">
                {{ formatCityWithYomiAndPeriod(city) }}
              </h3>
            </div>
          </div>
        </div>
      </div>

      <!-- 選択された市区町村の詳細 -->
      <div v-if="selectedCity" class="mt-8 border-t pt-6">
        <div class="space-y-4">
          <!-- 直前・直後のイベント -->
          <div v-if="displayEvents.length > 0" class="space-y-3">
            <div
              v-for="(eventGroup, index) in (groupedEvents || [])"
              :key="eventGroup.date + '-' + index"
              class="bg-gray-50 border border-gray-200 rounded-lg p-4"
            >
              <div class="mb-2">
                <h5 class="font-semibold">
                  {{ formatDate(eventGroup.date) }} 
                  {{ eventGroup.event_type === '市制施行' || eventGroup.event_type === '町制施行' ? eventGroup.event_type : eventGroup.event_type + '合併' }}
                </h5>
              </div>
              <div class="text-sm text-gray-600">
                <div class="mb-2">
                  <strong>変化前:</strong>
                  <div class="ml-4 mt-1">
                    <div
                      v-for="(beforeCity, idx) in eventGroup.beforeCities"
                      :key="idx"
                      class="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline mb-1"
                      @click="selectCityByCode(eventGroup.beforeCityCodes[idx], isSurvivingCityInGroup(eventGroup.beforeCityCodes[idx], eventGroup.event_type, eventGroup.afterCityCodes) ? eventGroup.date : undefined)"
                      :title="`${beforeCity}の詳細を表示`"
                    >
                      {{ formatBeforeCityWithLabel(eventGroup.beforeCityCodes[idx], eventGroup.event_type, eventGroup.afterCityCodes) }}
                    </div>
                  </div>
                </div>
                <div>
                  <strong>変化後:</strong>
                  <div class="ml-4 mt-1">
                    <div
                      v-for="(afterCity, idx) in eventGroup.afterCities"
                      :key="idx"
                      class="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline mb-1"
                      @click="selectCityByCode(eventGroup.afterCityCodes[idx], eventGroup.event_type === '編入' ? eventGroup.date : undefined)"
                      :title="`${afterCity}の詳細を表示`"
                    >
                      {{ formatAfterCityWithLabel(eventGroup.afterCityCodes[idx], eventGroup.event_type) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- イベントがない場合 -->
          <div v-else class="text-gray-500">
            この市区町村には直前・直後の廃置分合イベントがありません。
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useDataStore, type City } from '@/stores/data'

const dataStore = useDataStore()
const searchQuery = ref('')
const selectedCity = ref<City | null>(null)

// フィルター設定
const showExisting = ref(true)
const showExtinct = ref(true)
const selectedPrefecture = ref('')
const selectedCounty = ref('')

// 選択された都道府県の郡一覧を取得
const availableCounties = computed(() => {
  if (!selectedPrefecture.value) return []
  return dataStore.counties.filter(county => county.prefecture_code === selectedPrefecture.value)
})

// 検索結果を計算（検索クエリとフィルター条件を組み合わせて適用）
const filteredCities = computed(() => {
  if (!dataStore.loaded) return []
  
  // まず検索クエリで絞り込み（市区町村名、読み仮名、都道府県名、郡名で検索）
  let cities = dataStore.searchCities(searchQuery.value)
  
  // フィルター適用（現存/消滅、都道府県、郡での絞り込み）
  cities = cities.filter(city => {
    // 現存/消滅フィルター：valid_toが空の場合は現存自治体
    const isExisting = !city.valid_to || city.valid_to.trim() === ''
    if (isExisting && !showExisting.value) return false
    if (!isExisting && !showExtinct.value) return false
    
    // 都道府県フィルター
    if (selectedPrefecture.value && city.prefecture_code !== selectedPrefecture.value) return false
    
    // 郡フィルター（都道府県が選択されている場合のみ適用）
    if (selectedCounty.value && city.county_code !== selectedCounty.value) return false
    
    return true
  })
  
  return cities
})

// 都道府県が変更されたときに郡の選択をリセット
watch(selectedPrefecture, () => {
  selectedCounty.value = ''
})

// すべてのフィルターをリセット
const resetFilters = () => {
  showExisting.value = true
  showExtinct.value = true
  selectedPrefecture.value = ''
  selectedCounty.value = ''
  searchQuery.value = ''
}

// 直前と直後のイベントを計算
const adjacentEvents = computed(() => {
  if (!selectedCity.value) return { before: [], after: [] }
  return dataStore.getAdjacentEvents(selectedCity.value.code)
})

// 表示するイベントのリスト（直前と直後のイベントを結合）
const displayEvents = computed(() => {
  const events: any[] = []
  
  // 直前のイベント（すべて）：この自治体が新設・編入されたイベント
  events.push(...adjacentEvents.value.before)
  
  // 直後のイベント（すべて）：この自治体が消滅・変化したイベント
  events.push(...adjacentEvents.value.after)
  
  return events
})

// 同日のイベントをグループ化（同じ日付・同じイベントタイプ・同じ変化後の自治体でグループ化）
const groupedEvents = computed(() => {
  try {
    const eventsList = displayEvents.value
    if (!eventsList || eventsList.length === 0) return []
    
    const groups = new Map<string, any>()
    
    for (const event of eventsList) {
      if (!event || !event.date || !event.event_type) continue
      
      // グループ化のキー：日付-イベントタイプ-変化後の自治体コード
      const key = `${event.date}-${event.event_type}-${event.city_code_after}`
      
      if (!groups.has(key)) {
        groups.set(key, {
          date: event.date,
          event_type: event.event_type,
          beforeCities: [],
          afterCities: [],
          beforeCityCodes: [],
          afterCityCodes: []
        })
      }
      
      const group = groups.get(key)!
      const beforeCity = getCityNameByCode(event.city_code_before)
      const afterCity = getCityNameByCode(event.city_code_after)
      
      // 編入の場合、存続自治体かどうかを判定（コードのプレフィックスが同じ場合）
      // 例：18201_20050101 → 18201（同じベースコードなら存続自治体）
      const beforePrefix = event.city_code_before.split('_')[0]
      const afterPrefix = event.city_code_after.split('_')[0]
      const isSurvivingCity = event.event_type === '編入' && beforePrefix === afterPrefix
      
      // 編入の場合で存続自治体の場合、変化前の先頭に追加（存続自治体を最初に表示）
      if (isSurvivingCity && beforeCity && !group.beforeCityCodes.includes(event.city_code_before)) {
        group.beforeCities.unshift(beforeCity)
        group.beforeCityCodes.unshift(event.city_code_before)
      }
      // それ以外の変化前の自治体を追加（消滅自治体）
      else if (beforeCity && !group.beforeCityCodes.includes(event.city_code_before)) {
        group.beforeCities.push(beforeCity)
        group.beforeCityCodes.push(event.city_code_before)
      }
      
      // 変化後の自治体を追加
      if (afterCity && !group.afterCityCodes.includes(event.city_code_after)) {
        group.afterCities.push(afterCity)
        group.afterCityCodes.push(event.city_code_after)
      }
    }
    
    // 日付順でソート（新しい日付から古い日付へ）
    return Array.from(groups.values()).sort((a, b) => b.date.localeCompare(a.date))
  } catch (error) {
    console.error('Error in groupedEvents:', error)
    return []
  }
})

// 市区町村選択
const selectCity = (city: City) => {
  selectedCity.value = city
}

// 市区町村コードから市区町村を選択
const selectCityByCode = (cityCode: string, fromEventDate?: string) => {
  const city = dataStore.cityByCode.get(cityCode)
  if (city) {
    selectedCity.value = city
    
    // スクロールして選択された市区町村の詳細を表示
    setTimeout(() => {
      const element = document.querySelector('.mt-8.border-t.pt-6')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }
}

// 市区町村情報を取得
const getCityInfo = (city: City) => {
  const pref = dataStore.prefByCode.get(city.prefecture_code)
  const county = dataStore.countyByCode.get(city.county_code)
  const parts = [pref?.name, county?.name].filter(Boolean)
  return parts.join(' ')
}

// 市区町村コードから名前を取得
const getCityNameByCode = (code: string) => {
  const city = dataStore.cityByCode.get(code)
  return city ? `${city.name} (${getCityInfo(city)})` : `不明な市区町村 (${code})`
}

// 市区町村名と読み方を組み合わせて表示
const formatCityWithYomi = (code: string) => {
  const city = dataStore.cityByCode.get(code)
  if (!city) return `不明な市区町村 (${code})`
  
  const cityInfo = getCityInfo(city)
  if (city.yomi && city.yomi.trim() !== '') {
    return `${city.name} (${city.yomi} ${cityInfo} ${code})`
  } else {
    return `${city.name} (${cityInfo} ${code})`
  }
}

// 一覧表示用：市区町村名と読み方、存続期間を組み合わせて表示
const formatCityWithYomiAndPeriod = (city: City) => {
  const cityInfo = getCityInfo(city)
  let baseDisplay = ''
  
  // 読み仮名がある場合は含めて表示
  if (city.yomi && city.yomi.trim() !== '') {
    baseDisplay = `${city.name} (${city.yomi} ${cityInfo} ${city.code}`
  } else {
    baseDisplay = `${city.name} (${cityInfo} ${city.code}`
  }
  
  // 存続期間の開始日を取得（YYYY-MM-DD形式から日本語形式に変換）
  let validFromStr = ''
  if (city.valid_from && city.valid_from.trim() !== '') {
    const validFromDate = new Date(city.valid_from)
    validFromStr = validFromDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/')
  }
  
  // 存続期間を追加（現存/消滅の区別を明確に表示）
  if (city.valid_to && city.valid_to.trim() !== '') {
    // 消滅自治体の場合：開始日〜廃止日を表示
    const validToDate = new Date(city.valid_to)
    const validToStr = validToDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/')
    const period = validFromStr ? `${validFromStr}〜${validToStr}` : `〜${validToStr}`
    return `${baseDisplay} ${period})`
  } else {
    // 現存自治体の場合：開始日〜現存
    const period = validFromStr ? `${validFromStr}〜現存` : '現存'
    return `${baseDisplay} ${period})`
  }
}

// 存続自治体かどうかを判定（編入イベントで、変化前と変化後のコードプレフィックスが同じ場合）
const isSurvivingCityInGroup = (beforeCode: string, eventType: string, afterCodes: string[]) => {
  if (eventType !== '編入') return false
  const beforePrefix = beforeCode.split('_')[0]
  return afterCodes.some(afterCode => afterCode.split('_')[0] === beforePrefix)
}

// 変化前の自治体にラベルを付けて表示（存続/消滅の区別を明確にする）
const formatBeforeCityWithLabel = (code: string, eventType: string, afterCityCodes: string[]) => {
  const cityDisplay = formatCityWithYomi(code)
  
  // 編入の場合、コードのプレフィックスを比較して存続自治体かどうかを判定
  if (isSurvivingCityInGroup(code, eventType, afterCityCodes)) {
    return `[存続] ${cityDisplay}`
  }
  
  return `[消滅] ${cityDisplay}`
}

// 変化後の自治体にラベルを付けて表示（イベントタイプに応じてラベルを追加）
const formatAfterCityWithLabel = (code: string, eventType: string) => {
  const cityDisplay = formatCityWithYomi(code)
  if (eventType === '新設') {
    return `[新設] ${cityDisplay}`
  } else if (eventType === '編入') {
    return `[存続] ${cityDisplay}`
  } else {
    return cityDisplay
  }
}

// 日付フォーマット
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// データを読み込み
onMounted(async () => {
  await dataStore.loadAll()
})
</script>
