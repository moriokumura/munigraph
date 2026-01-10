<template>
  <div v-if="selectedCity" ref="detailContainer" class="mt-8 border-t pt-6">
    <!-- 選択中の自治体名表示 -->
    <div class="mb-6">
      <div class="flex items-center gap-3 mb-2">
        <h3 class="text-2xl font-bold text-gray-900">
          {{ selectedCity.name }}
        </h3>
        <a
          :href="getWikipediaUrl(selectedCity)"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 px-3 py-1 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
          title="Wikipediaで開く"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12.87 15.07l-2.54-2.51.03-.03c1.74-1.94 2.98-4.17 3.71-6.53H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"
            />
          </svg>
          Wikipedia
        </a>
      </div>
      <div class="text-sm text-gray-600 space-y-1">
        <div v-if="selectedCity.yomi && selectedCity.yomi.trim() !== ''">
          <span class="font-medium">読み方:</span> {{ selectedCity.yomi }}
        </div>
        <div><span class="font-medium">所在地:</span> {{ getCityInfo(selectedCity) }}</div>
        <div v-if="getSubprefectureInfo(selectedCity)">
          <span class="font-medium">支庁:</span> {{ getSubprefectureInfo(selectedCity) }}
        </div>
        <div><span class="font-medium">存続期間:</span> {{ getValidityPeriod(selectedCity) }}</div>
      </div>
    </div>

    <div class="space-y-6">
      <!-- 直前のイベント（古いイベント） -->
      <div v-if="groupedBeforeEvent">
        <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span
            class="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-3"
            >直前</span
          >
          この自治体が新設されたイベント
        </h4>
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div class="mb-2">
            <h5 class="font-semibold text-blue-900">
              {{ formatDate(groupedBeforeEvent.date) }}
              {{ groupedBeforeEvent.event_type }}
            </h5>
          </div>
          <div class="text-sm text-gray-600">
            <div class="mb-2">
              <strong>変化前:</strong>
              <div class="ml-4 mt-1">
                <div
                  v-for="(beforeCity, idx) in groupedBeforeEvent.beforeCities"
                  :key="idx"
                  class="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline mb-1"
                  :title="`${beforeCity}の詳細を表示`"
                  @click="selectCityByCode(groupedBeforeEvent.beforeCityCodes[idx])"
                >
                  {{
                    formatBeforeCityWithLabel(
                      groupedBeforeEvent.beforeCityCodes[idx],
                      groupedBeforeEvent.event_type,
                      groupedBeforeEvent.afterCityCodes
                    )
                  }}
                </div>
              </div>
            </div>
            <div>
              <strong>変化後:</strong>
              <div class="ml-4 mt-1">
                <div
                  v-for="(afterCity, idx) in groupedBeforeEvent.afterCities"
                  :key="idx"
                  class="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline mb-1"
                  :title="`${afterCity}の詳細を表示`"
                  @click="selectCityByCode(groupedBeforeEvent.afterCityCodes[idx])"
                >
                  {{
                    formatAfterCityWithLabel(
                      groupedBeforeEvent.afterCityCodes[idx],
                      groupedBeforeEvent.event_type
                    )
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 直後のイベント（新しいイベント） -->
      <div v-if="groupedAfterEvent">
        <h4 class="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span
            class="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full mr-3"
            >直後</span
          >
          この自治体が変化したイベント
        </h4>
        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
          <div class="mb-2">
            <h5 class="font-semibold text-green-900">
              {{ formatDate(groupedAfterEvent.date) }}
              {{ groupedAfterEvent.event_type }}
            </h5>
          </div>
          <div class="text-sm text-gray-600">
            <div class="mb-2">
              <strong>変化前:</strong>
              <div class="ml-4 mt-1">
                <div
                  v-for="(beforeCity, idx) in groupedAfterEvent.beforeCities"
                  :key="idx"
                  class="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline mb-1"
                  :title="`${beforeCity}の詳細を表示`"
                  @click="selectCityByCode(groupedAfterEvent.beforeCityCodes[idx])"
                >
                  {{
                    formatBeforeCityWithLabel(
                      groupedAfterEvent.beforeCityCodes[idx],
                      groupedAfterEvent.event_type,
                      groupedAfterEvent.afterCityCodes
                    )
                  }}
                </div>
              </div>
            </div>
            <div>
              <strong>変化後:</strong>
              <div class="ml-4 mt-1">
                <div
                  v-for="(afterCity, idx) in groupedAfterEvent.afterCities"
                  :key="idx"
                  class="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline mb-1"
                  :title="`${afterCity}の詳細を表示`"
                  @click="selectCityByCode(groupedAfterEvent.afterCityCodes[idx])"
                >
                  {{
                    formatAfterCityWithLabel(
                      groupedAfterEvent.afterCityCodes[idx],
                      groupedAfterEvent.event_type
                    )
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- イベントがない場合 -->
      <div v-if="!groupedAfterEvent && !groupedBeforeEvent" class="text-gray-500">
        この自治体のイベントが登録されていません。
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick } from 'vue'
import { format, parseISO } from 'date-fns'
import { useDataStore } from '@/stores/data'
import type { City } from '@/types/municipality'

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
const detailContainer = ref<HTMLElement | null>(null)

// 直前と直後のイベントを計算
const adjacentEvents = computed(() => {
  if (!props.selectedCity) return { before: [], after: [] }
  return dataStore.getAdjacentEvents(props.selectedCity.code)
})

// 直前のイベント（この自治体が新設・編入されたイベント）- 最大1つ
const beforeEvent = computed(() => {
  const events = adjacentEvents.value.before
  return events.length > 0 ? events : []
})

// 直後のイベント（この自治体が消滅・変化したイベント）- 最大1つ
const afterEvent = computed(() => {
  const events = adjacentEvents.value.after
  return events.length > 0 ? events : []
})

// イベントをグループ化する関数（複数のイベントを処理）
const groupEvents = (events: any[]) => {
  try {
    if (!events || events.length === 0) return null

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
          afterCityCodes: [],
        })
      }

      const group = groups.get(key)!
      const beforeCity = getCityNameByCode(event.city_code_before)
      const afterCity = getCityNameByCode(event.city_code_after)

      // 編入の場合、存続自治体かどうかを判定（コードのプレフィックスが同じ場合）
      const beforePrefix = event.city_code_before.split('_')[0]
      const afterPrefix = event.city_code_after.split('_')[0]
      const isSurvivingCity = event.event_type === '編入' && beforePrefix === afterPrefix

      // 編入の場合で存続自治体の場合、変化前の先頭に追加（存続自治体を最初に表示）
      if (
        isSurvivingCity &&
        beforeCity &&
        !group.beforeCityCodes.includes(event.city_code_before)
      ) {
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

    // 最初のグループを返す（通常は1つのグループのみ）
    return Array.from(groups.values())[0] || null
  } catch (error) {
    console.error('Error in groupEvents:', error)
    return null
  }
}

// 直前のイベントをグループ化
const groupedBeforeEvent = computed(() => {
  return groupEvents(beforeEvent.value)
})

// 直後のイベントをグループ化
const groupedAfterEvent = computed(() => {
  return groupEvents(afterEvent.value)
})

// 市区町村コードから市区町村を選択
const selectCityByCode = async (cityCode: string) => {
  const city = dataStore.cityByCode.get(cityCode)
  if (city) {
    emit('citySelected', city)

    // スクロールして選択された市区町村の詳細を表示
    await nextTick()
    if (detailContainer.value) {
      detailContainer.value.scrollIntoView({ behavior: 'smooth' })
    }
  }
}

// 市区町村コードから名前を取得
const getCityNameByCode = (code: string) => {
  const city = dataStore.cityByCode.get(code)
  if (!city) return `不明な市区町村 (${code})`

  const pref = dataStore.prefByCode.get(city.prefecture_code)
  const county = dataStore.countyByCode.get(city.county_code)

  let name = ''
  if (pref?.name) name += pref.name + ' '
  if (county?.name) name += county.name + ' '
  name += city.name

  return name
}

// 市区町村情報を取得（都道府県名と郡名のみ、支庁は除外）
const getCityInfo = (city: City) => {
  const pref = dataStore.prefByCode.get(city.prefecture_code)
  const county = dataStore.countyByCode.get(city.county_code)

  const parts: string[] = []
  if (pref?.name) parts.push(pref.name)

  // 郡を表示
  if (county?.name) {
    // 郡名に読み仮名がある場合は追加
    if (county.yomi && county.yomi.trim() !== '') {
      parts.push(`${county.name} (${county.yomi})`)
    } else {
      parts.push(county.name)
    }
  }

  return parts.join(' ')
}

// 支庁情報を取得
const getSubprefectureInfo = (city: City) => {
  const subpref = dataStore.subprefByCode.get(city.subprefecture_code)

  if (!subpref?.name) return ''

  if (subpref.yomi && subpref.yomi.trim() !== '') {
    return `${subpref.name} (${subpref.yomi})`
  } else {
    return subpref.name
  }
}

// 市区町村名と読み方を組み合わせて表示
const formatCityWithYomi = (code: string) => {
  const city = dataStore.cityByCode.get(code)
  if (!city) return `不明な市区町村 (${code})`

  const pref = dataStore.prefByCode.get(city.prefecture_code)
  const county = dataStore.countyByCode.get(city.county_code)

  let display = ''
  if (pref?.name) display += pref.name + ' '
  if (county?.name) display += county.name + ' '
  display += city.name

  if (city.yomi && city.yomi.trim() !== '') {
    return `${display} (${city.yomi})`
  } else {
    return display
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
    validFromStr = format(parseISO(city.valid_from), 'yyyy/MM/dd')
  }

  if (city.valid_to && city.valid_to.trim() !== '') {
    // 消滅自治体の場合：開始日〜廃止日を表示
    const validToStr = format(parseISO(city.valid_to), 'yyyy/MM/dd')
    return validFromStr ? `${validFromStr}〜${validToStr}` : `〜${validToStr}`
  } else {
    // 現存自治体の場合：開始日〜現存
    return validFromStr ? `${validFromStr}〜現存` : '現存'
  }
}

// 日付フォーマット
const formatDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'yyyy年M月d日')
  } catch (error) {
    console.error('Error formatting date:', dateStr, error)
    return dateStr
  }
}

// WikipediaのURLを生成
const getWikipediaUrl = (city: City) => {
  // 市区町村名から不要な文字を除去（コード部分など）
  const cityName = city.name.trim()

  // Wikipedia日本語版のURL
  // 例: https://ja.wikipedia.org/wiki/弓削町
  // シンプルに市区町村名のみで検索
  // 曖昧さ回避ページや検索結果に遷移する可能性があるが、それでOK
  return `https://ja.wikipedia.org/wiki/${encodeURIComponent(cityName)}`
}
</script>
