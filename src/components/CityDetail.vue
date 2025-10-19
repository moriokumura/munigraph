<template>
  <div v-if="selectedCity" class="mt-8 border-t pt-6">
    <!-- 選択中の自治体名表示 -->
    <div class="mb-6">
      <h3 class="text-2xl font-bold text-gray-900 mb-2">
        {{ selectedCity.name }}
      </h3>
      <div class="text-sm text-gray-600 space-y-1">
        <div v-if="selectedCity.yomi && selectedCity.yomi.trim() !== ''">
          <span class="font-medium">読み方:</span> {{ selectedCity.yomi }}
        </div>
        <div>
          <span class="font-medium">コード:</span> {{ selectedCity.code }}
        </div>
        <div>
          <span class="font-medium">所在地:</span> {{ getCityInfo(selectedCity) }}
        </div>
        <div>
          <span class="font-medium">存続期間:</span> {{ getValidityPeriod(selectedCity) }}
        </div>
      </div>
    </div>

    <div class="space-y-6">
      <!-- 直後のイベント（新しいイベント） -->
      <div v-if="afterEvents.length > 0">
        <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-3">直後</span>
          この自治体が変化したイベント
        </h4>
        <div class="space-y-3">
          <div
            v-for="(eventGroup, index) in groupedAfterEvents"
            :key="'after-' + eventGroup.date + '-' + index"
            class="bg-green-50 border border-green-200 rounded-lg p-4"
          >
            <div class="mb-2">
              <h5 class="font-semibold text-green-900">
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
      </div>

      <!-- 直前のイベント（古いイベント） -->
      <div v-if="beforeEvents.length > 0">
        <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-3">直前</span>
          この自治体が新設されたイベント
        </h4>
        <div class="space-y-3">
          <div
            v-for="(eventGroup, index) in groupedBeforeEvents"
            :key="'before-' + eventGroup.date + '-' + index"
            class="bg-blue-50 border border-blue-200 rounded-lg p-4"
          >
            <div class="mb-2">
              <h5 class="font-semibold text-blue-900">
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
      </div>

      <!-- イベントがない場合 -->
      <div v-if="displayEvents.length === 0" class="text-gray-500">
        この市区町村には直前・直後の廃置分合イベントがありません。
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useDataStore, type City } from '@/stores/data'

// Props定義
interface Props {
  selectedCity: City | null
}

// Emits定義
interface Emits {
  (e: 'citySelected', city: City): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dataStore = useDataStore()

// 直前と直後のイベントを計算
const adjacentEvents = computed(() => {
  if (!props.selectedCity) return { before: [], after: [] }
  return dataStore.getAdjacentEvents(props.selectedCity.code)
})

// 直前のイベント（この自治体が新設・編入されたイベント）
const beforeEvents = computed(() => {
  return adjacentEvents.value.before
})

// 直後のイベント（この自治体が消滅・変化したイベント）
const afterEvents = computed(() => {
  return adjacentEvents.value.after
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

// イベントをグループ化する共通関数
const groupEvents = (events: any[]) => {
  try {
    if (!events || events.length === 0) return []
    
    const groups = new Map<string, any>()
    
    for (const event of events) {
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
    console.error('Error in groupEvents:', error)
    return []
  }
}

// 直前のイベントをグループ化
const groupedBeforeEvents = computed(() => {
  return groupEvents(beforeEvents.value)
})

// 直後のイベントをグループ化
const groupedAfterEvents = computed(() => {
  return groupEvents(afterEvents.value)
})

// 同日のイベントをグループ化（同じ日付・同じイベントタイプ・同じ変化後の自治体でグループ化）
const groupedEvents = computed(() => {
  return groupEvents(displayEvents.value)
})

// 市区町村コードから市区町村を選択
const selectCityByCode = (cityCode: string, fromEventDate?: string) => {
  const city = dataStore.cityByCode.get(cityCode)
  if (city) {
    emit('citySelected', city)
    
    // スクロールして選択された市区町村の詳細を表示
    setTimeout(() => {
      const element = document.querySelector('.mt-8.border-t.pt-6')
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    }, 100)
  }
}

// 市区町村コードから名前を取得
const getCityNameByCode = (code: string) => {
  const city = dataStore.cityByCode.get(code)
  const cityInfo = city ? getCityInfo(city) : ''
  return city ? `${city.name} (${cityInfo})` : `不明な市区町村 (${code})`
}

// 市区町村情報を取得
const getCityInfo = (city: City) => {
  const pref = dataStore.prefByCode.get(city.prefecture_code)
  const county = dataStore.countyByCode.get(city.county_code)
  const parts = [pref?.name, county?.name].filter(Boolean)
  return parts.join(' ')
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

// 存続期間を取得
const getValidityPeriod = (city: City) => {
  let validFromStr = ''
  if (city.valid_from && city.valid_from.trim() !== '') {
    const validFromDate = new Date(city.valid_from)
    validFromStr = validFromDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/')
  }
  
  if (city.valid_to && city.valid_to.trim() !== '') {
    // 消滅自治体の場合：開始日〜廃止日を表示
    const validToDate = new Date(city.valid_to)
    const validToStr = validToDate.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\//g, '/')
    return validFromStr ? `${validFromStr}〜${validToStr}` : `〜${validToStr}`
  } else {
    // 現存自治体の場合：開始日〜現存
    return validFromStr ? `${validFromStr}〜現存` : '現存'
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
</script>
