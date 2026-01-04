<template>
  <!-- 市区町村一覧 -->
  <div
    class="flex-1 lg:w-1/2 bg-white border-r border-gray-200 flex flex-col max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-120px)]"
  >
    <div class="p-4 border-b border-gray-200 flex-shrink-0">
      <h3 class="text-lg font-semibold text-gray-900 mb-2">市区町村一覧</h3>
      <div class="text-sm text-gray-600">
        <span class="font-medium text-blue-600">{{ cities.length }}</span
        >件の市区町村
      </div>
    </div>
    <div
      class="flex-1 overflow-y-auto min-h-0 max-h-[calc(100vh-280px)] lg:max-h-[calc(100vh-200px)]"
    >
      <div class="p-4">
        <div class="grid gap-2">
          <div
            v-for="city in cities"
            :key="city.code"
            class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            tabindex="0"
            role="button"
            :aria-label="`${city.name}の詳細を表示 (${getCityInfo(city)})`"
            @click="selectCity(city)"
            @keydown.enter="selectCity(city)"
            @keydown.space.prevent="selectCity(city)"
          >
            <div class="flex justify-between items-center">
              <div class="flex-1">
                <h4 class="text-lg">
                  <span v-if="getCityDisplayParts(city).pref" class="mr-1">{{ getCityDisplayParts(city).pref }}</span>
                  <span v-if="getCityDisplayParts(city).county" class="mr-1">{{ getCityDisplayParts(city).county }}</span>
                  <span class="font-bold mr-1">{{ getCityDisplayParts(city).name }}</span>
                  <span v-if="getCityDisplayParts(city).yomi"> ({{ getCityDisplayParts(city).yomi }})</span>
                  <span v-if="getCityDisplayParts(city).period" class="ml-1 px-1.5 py-0.5 bg-gray-100 rounded text-sm">{{ getCityDisplayParts(city).period }}</span>
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDataStore } from '@/stores/data'
import type { City } from '@/types/municipality'

// Props定義
interface Props {
  cities: City[]
  selectedCity?: City | null
}

// Emits定義
interface Emits {
  (e: 'citySelected', city: City): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dataStore = useDataStore()

// 市区町村選択
const selectCity = (city: City) => {
  emit('citySelected', city)
}

// 市区町村情報を取得（都道府県名と郡名のみ、支庁は除外）
const getCityInfo = (city: City) => {
  const pref = dataStore.prefByCode.get(city.prefecture_code)
  const county = dataStore.countyByCode.get(city.county_code)
  const parts = [pref?.name, county?.name].filter(Boolean)
  return parts.join(' ')
}

// 日付をYYYY/MM/DD形式にフォーマット
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

// 一覧表示用：都道府県名、郡名、自治体名、読み方、存続期間を返す
const getCityDisplayParts = (city: City) => {
  const pref = dataStore.prefByCode.get(city.prefecture_code)
  const county = dataStore.countyByCode.get(city.county_code)
  
  // 存続期間をフォーマット
  const hasValidFrom = city.valid_from && city.valid_from.trim() !== ''
  const hasValidTo = city.valid_to && city.valid_to.trim() !== ''
  
  let period = ''
  if (!hasValidFrom && !hasValidTo) {
    period = '現存'
  } else if (!hasValidFrom && hasValidTo) {
    period = `〜${formatDate(city.valid_to)}`
  } else if (hasValidFrom && !hasValidTo) {
    period = `${formatDate(city.valid_from)}〜現存`
  } else if (hasValidFrom && hasValidTo) {
    period = `${formatDate(city.valid_from)}〜${formatDate(city.valid_to)}`
  }
  
  return {
    pref: pref?.name || '',
    county: county?.name || '',
    name: city.name || '',
    yomi: city.yomi && city.yomi.trim() !== '' ? city.yomi : '',
    period: period,
  }
}
</script>
