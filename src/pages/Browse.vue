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
      <div class="flex-1 flex flex-col lg:flex-row min-h-0">
        <!-- 市区町村一覧 -->
        <CityList
          :cities="filteredCities"
          :selected-city="selectedCity"
          @city-selected="handleCitySelected"
        />

        <!-- 自治体詳細 -->
        <div class="flex-1 lg:w-1/2 bg-white overflow-y-auto">
          <div class="p-4">
            <CityDetail :selected-city="selectedCity" @city-selected="handleCitySelected" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import type { City } from '@/types/municipality'
import CitySearch from '@/components/CitySearch.vue'
import CityList from '@/components/CityList.vue'
import CityDetail from '@/components/CityDetail.vue'

const dataStore = useDataStore()
const selectedCity = ref<City | null>(null)
const filteredCities = ref<City[]>([])

// 市区町村選択のハンドラー
const handleCitySelected = (city: City) => {
  selectedCity.value = city
}

// フィルタリング結果を受け取るハンドラー
const handleFilteredCitiesChanged = (cities: City[]) => {
  filteredCities.value = cities
}

// データを読み込み
onMounted(async () => {
  await dataStore.loadAll()
})
</script>
