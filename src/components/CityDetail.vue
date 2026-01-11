<template>
  <div v-if="selectedMunicipality" ref="detailContainer" class="mt-8 border-t pt-6">
    <!-- 自治体名表示 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-2">
        <h3 class="text-3xl font-bold text-gray-900">
          {{ selectedMunicipality.name }}
        </h3>
        <a
          :href="getWikipediaUrl(selectedMunicipality.name)"
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
      <p class="text-gray-600">{{ selectedMunicipality.yomi }}</p>
    </div>

    <!-- タイムライン表示 -->
    <div
      class="space-y-8 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent"
    >
      <div
        v-for="version in selectedMunicipality.versions"
        :key="version.code"
        class="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active"
      >
        <!-- ドット -->
        <div
          class="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-300 group-[.is-active]:bg-blue-500 text-slate-500 group-[.is-active]:text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
            />
          </svg>
        </div>
        <!-- カード -->
        <div
          class="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded border border-slate-200 shadow"
        >
          <div class="flex items-center justify-between space-x-2 mb-1">
            <div class="font-bold text-slate-900">{{ getValidityPeriod(version) }}</div>
          </div>
          <div class="text-slate-500 text-sm mb-4">
            <div><span class="font-medium">所在地:</span> {{ getCityInfo(version) }}</div>
            <div v-if="getSubprefectureInfo(version)">
              <span class="font-medium">支庁:</span> {{ getSubprefectureInfo(version) }}
            </div>
          </div>

          <!-- このバージョンに関連するイベント -->
          <div class="space-y-4">
            <!-- 変化前イベント (このバージョンが新設された時) -->
            <div
              v-if="getGroupedEvents(version.code).before"
              class="bg-blue-50 p-3 rounded text-xs"
            >
              <div class="font-semibold text-blue-800 mb-1">
                {{ formatDate(getGroupedEvents(version.code).before.date) }}
                {{ getGroupedEvents(version.code).before.event_type }}
              </div>
              <div class="text-blue-700">
                <span class="font-medium">変化前:</span>
                <span
                  v-for="(name, idx) in getGroupedEvents(version.code).before.beforeCities"
                  :key="idx"
                  class="inline-block ml-1 cursor-pointer hover:underline"
                  @click="
                    selectCityByCode(getGroupedEvents(version.code).before.beforeCityCodes[idx])
                  "
                >
                  {{ name
                  }}{{
                    idx < getGroupedEvents(version.code).before.beforeCities.length - 1 ? ',' : ''
                  }}
                </span>
              </div>
            </div>

            <!-- 変化後イベント (このバージョンが終了した時) -->
            <div
              v-if="getGroupedEvents(version.code).after"
              class="bg-green-50 p-3 rounded text-xs"
            >
              <div class="font-semibold text-green-800 mb-1">
                {{ formatDate(getGroupedEvents(version.code).after.date) }}
                {{ getGroupedEvents(version.code).after.event_type }}
              </div>
              <div class="text-green-700">
                <span class="font-medium">変化後:</span>
                <span
                  v-for="(name, idx) in getGroupedEvents(version.code).after.afterCities"
                  :key="idx"
                  class="inline-block ml-1 cursor-pointer hover:underline"
                  @click="
                    selectCityByCode(getGroupedEvents(version.code).after.afterCityCodes[idx])
                  "
                >
                  {{ name
                  }}{{
                    idx < getGroupedEvents(version.code).after.afterCities.length - 1 ? ',' : ''
                  }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { format, parseISO } from 'date-fns'
import { useDataStore } from '@/stores/data'
import type { City, Municipality } from '@/types/municipality'

// Props定義
interface Props {
  selectedCity: City | null
  selectedMunicipality: Municipality | null
}

// Emits定義
interface Emits {
  (e: 'citySelected', city: City): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const dataStore = useDataStore()
const detailContainer = ref<HTMLElement | null>(null)

// 各バージョンのイベントをキャッシュ
const eventsCache = new Map<string, any>()

const getGroupedEvents = (cityCode: string) => {
  if (eventsCache.has(cityCode)) return eventsCache.get(cityCode)

  const adjacent = dataStore.getAdjacentEvents(cityCode)
  const result = {
    before: groupEvents(adjacent.before),
    after: groupEvents(adjacent.after),
  }
  eventsCache.set(cityCode, result)
  return result
}

// イベントをグループ化する関数
const groupEvents = (events: any[]) => {
  try {
    if (!events || events.length === 0) return null

    const groups = new Map<string, any>()

    for (const event of events) {
      if (!event || !event.date || !event.event_type) continue

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

      if (beforeCity && !group.beforeCityCodes.includes(event.city_code_before)) {
        group.beforeCities.push(beforeCity)
        group.beforeCityCodes.push(event.city_code_before)
      }

      if (afterCity && !group.afterCityCodes.includes(event.city_code_after)) {
        group.afterCities.push(afterCity)
        group.afterCityCodes.push(event.city_code_after)
      }
    }

    return Array.from(groups.values())[0] || null
  } catch (error) {
    console.error('Error in groupEvents:', error)
    return null
  }
}

// 市区町村コードから市区町村を選択
const selectCityByCode = async (cityCode: string) => {
  const city = dataStore.cityByCode.get(cityCode)
  if (city) {
    emit('citySelected', city)

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

// 市区町村情報を取得
const getCityInfo = (city: City) => {
  const pref = dataStore.prefByCode.get(city.prefecture_code)
  const county = dataStore.countyByCode.get(city.county_code)

  const parts: string[] = []
  if (pref?.name) parts.push(pref.name)
  if (county?.name) {
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
  return subpref.yomi && subpref.yomi.trim() !== ''
    ? `${subpref.name} (${subpref.yomi})`
    : subpref.name
}

// 存続期間を取得
const getValidityPeriod = (city: City) => {
  let validFromStr = ''
  if (city.valid_from && city.valid_from.trim() !== '') {
    validFromStr = format(parseISO(city.valid_from), 'yyyy/MM/dd')
  }

  if (city.valid_to && city.valid_to.trim() !== '') {
    const validToStr = format(parseISO(city.valid_to), 'yyyy/MM/dd')
    return validFromStr ? `${validFromStr}〜${validToStr}` : `〜${validToStr}`
  } else {
    return validFromStr ? `${validFromStr}〜現存` : '現存'
  }
}

// 日付フォーマット
const formatDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'yyyy年M月d日')
  } catch (error) {
    return dateStr
  }
}

// WikipediaのURLを生成
const getWikipediaUrl = (name: string) => {
  return `https://ja.wikipedia.org/wiki/${encodeURIComponent(name.trim())}`
}
</script>
