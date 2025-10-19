<template>
  <div class="min-h-screen bg-gray-50">
    <!-- ヘッダー -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="p-4">
        <h2 class="text-2xl font-bold text-gray-900">自治体ブラウズ</h2>
      </div>
    </header>

    <!-- ローディング表示 -->
    <div v-if="!dataStore.loaded" class="text-center py-8">
      <p>データを読み込み中...</p>
    </div>

    <!-- メインコンテンツ -->
    <div v-else class="flex flex-col min-h-[calc(100vh-80px)]">
      <!-- 絞り込みフォーム（全画面サイズで表示） -->
      <div class="w-full">
        <CitySearch 
          :selected-city="selectedCity"
          @city-selected="handleCitySelected"
          @filtered-cities-changed="handleFilteredCitiesChanged"
        />
      </div>

      <!-- コンテンツエリア -->
      <div class="flex-1 flex flex-col lg:flex-row">
        <!-- 市区町村一覧 -->
        <div class="flex-1 lg:w-1/2 bg-white border-r border-gray-200 overflow-y-auto">
          <div class="p-4">
            <h3 class="text-lg font-semibold text-gray-900 mb-4">市区町村一覧</h3>
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
                    <h4 class="font-semibold text-lg">
                      {{ formatCityWithYomiAndPeriod(city) }}
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 自治体詳細 -->
        <div class="flex-1 lg:w-1/2 bg-white overflow-y-auto">
          <div class="p-4">
            <CityDetail 
              :selected-city="selectedCity"
              @city-selected="handleCitySelected"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDataStore, type City } from '@/stores/data'
import CitySearch from '@/components/CitySearch.vue'
import CityDetail from '@/components/CityDetail.vue'

const dataStore = useDataStore()
const selectedCity = ref<City | null>(null)
const filteredCities = ref<City[]>([])

// 市区町村選択のハンドラー
const handleCitySelected = (city: City) => {
  selectedCity.value = city
}

// 市区町村選択（直接選択用）
const selectCity = (city: City) => {
  selectedCity.value = city
}

// フィルタリング結果を受け取るハンドラー
const handleFilteredCitiesChanged = (cities: City[]) => {
  filteredCities.value = cities
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

// データを読み込み
onMounted(async () => {
  await dataStore.loadAll()
})
</script>