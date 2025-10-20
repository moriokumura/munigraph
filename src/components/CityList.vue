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
                <h4 class="font-semibold text-lg">
                  {{ formatCityWithYomiAndPeriod(city) }}
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

// 市区町村情報を取得
const getCityInfo = (city: City) => {
  const pref = dataStore.prefByCode.get(city.prefecture_code)
  const county = dataStore.countyByCode.get(city.county_code)
  const parts = [pref?.name, county?.name].filter(Boolean)
  return parts.join(' ')
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
    validFromStr = validFromDate
      .toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(/\//g, '/')
  }

  // 存続期間を追加（現存/消滅の区別を明確に表示）
  if (city.valid_to && city.valid_to.trim() !== '') {
    // 消滅自治体の場合：開始日〜廃止日を表示
    const validToDate = new Date(city.valid_to)
    const validToStr = validToDate
      .toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
      .replace(/\//g, '/')
    const period = validFromStr ? `${validFromStr}〜${validToStr}` : `〜${validToStr}`
    return `${baseDisplay} ${period})`
  } else {
    // 現存自治体の場合：開始日〜現存
    const period = validFromStr ? `${validFromStr}〜現存` : '現存'
    return `${baseDisplay} ${period})`
  }
}
</script>
