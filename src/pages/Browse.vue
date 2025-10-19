<template>
  <section class="p-4">
    <h2 class="text-2xl font-bold mb-6">自治体ブラウズ</h2>

    <!-- ローディング表示 -->
    <div v-if="!dataStore.loaded" class="text-center py-8">
      <p>データを読み込み中...</p>
    </div>

    <!-- 検索と詳細表示 -->
    <div v-else>
      <!-- 自治体検索コンポーネント -->
      <CitySearch 
        :selected-city="selectedCity"
        @city-selected="handleCitySelected"
      />
      
      <!-- 自治体詳細表示コンポーネント -->
      <CityDetail 
        :selected-city="selectedCity"
        @city-selected="handleCitySelected"
      />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDataStore, type City } from '@/stores/data'
import CitySearch from '@/components/CitySearch.vue'
import CityDetail from '@/components/CityDetail.vue'

const dataStore = useDataStore()
const selectedCity = ref<City | null>(null)

// 市区町村選択のハンドラー
const handleCitySelected = (city: City) => {
  selectedCity.value = city
}

// データを読み込み
onMounted(async () => {
  await dataStore.loadAll()
})
</script>