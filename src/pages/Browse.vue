<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import type { MunicipalityVersion, Municipality } from '@/types/municipality'
import CitySearch from '@/components/CitySearch.vue'
import CityList from '@/components/CityList.vue'
import CityDetail from '@/components/CityDetail.vue'

const dataStore = useDataStore()
const route = useRoute()
const router = useRouter()

const selectedCity = ref<MunicipalityVersion | null>(null)
const selectedMunicipality = ref<Municipality | null>(null)
const filteredMunicipalities = ref<Municipality[]>([])
const detailSection = ref<HTMLElement | null>(null)

// 選択状態をURLに同期
const syncStateToUrl = (municipalityId: string | null) => {
  if (route.query.id === municipalityId) return

  router.push({
    query: {
      ...route.query,
      id: municipalityId || undefined,
    },
  })
}

// モバイル時に詳細エリアへスクロール
const scrollToDetailIfNeeded = async () => {
  if (window.innerWidth < 1024) {
    await nextTick()
    detailSection.value?.scrollIntoView({ behavior: 'smooth' })
  }
}

// 市区町村（バージョン）選択のハンドラー
const handleCitySelected = (version: MunicipalityVersion) => {
  selectedCity.value = version
  // 該当する自治体エンティティも選択状態にする
  const municipality = dataStore.municipalityById.get(version.municipality_id) || null
  selectedMunicipality.value = municipality

  if (municipality) {
    syncStateToUrl(municipality.id)
  }
  scrollToDetailIfNeeded()
}

// 自治体エンティティ選択のハンドラー
const handleMunicipalitySelected = (municipality: Municipality) => {
  selectedMunicipality.value = municipality
  // 規定のバージョン（最新または現存）を選択
  selectedCity.value = municipality.versions[municipality.versions.length - 1] || null

  syncStateToUrl(municipality.id)
  scrollToDetailIfNeeded()
}

// URLから状態を復元
const restoreStateFromUrl = () => {
  const id = route.query.id as string
  if (id) {
    const municipality = dataStore.municipalityById.get(id)
    if (municipality) {
      selectedMunicipality.value = municipality
      selectedCity.value = municipality.versions[municipality.versions.length - 1] || null
    }
  } else {
    selectedMunicipality.value = null
    selectedCity.value = null
  }
}

// URL（クエリパラメータ）の変化を監視
watch(
  () => route.query.id,
  () => {
    restoreStateFromUrl()
  },
)

// フィルタリング結果を受け取るハンドラー
const handleFilteredMunicipalitiesChanged = (municipalities: Municipality[]) => {
  filteredMunicipalities.value = municipalities
}

// データを読み込み
onMounted(async () => {
  await dataStore.loadAll()
  restoreStateFromUrl()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- ヘッダー -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="p-4 flex items-center justify-between">
        <h2 class="text-2xl font-bold text-gray-900">自治体ブラウズ</h2>
        <router-link
          :to="{ name: 'home' }"
          class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
        >
          ホームへ戻る
        </router-link>
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
          @filtered-municipalities-changed="handleFilteredMunicipalitiesChanged"
        />
      </div>

      <!-- コンテンツエリア -->
      <div class="flex-1 flex flex-col lg:flex-row min-h-0">
        <!-- 市区町村一覧 -->
        <CityList
          :municipalities="filteredMunicipalities"
          :selected-city="selectedCity"
          @municipality-selected="handleMunicipalitySelected"
        />

        <!-- 自治体詳細 -->
        <div ref="detailSection" class="flex-1 lg:w-1/2 bg-white overflow-y-auto">
          <div class="p-4">
            <CityDetail
              :selected-city="selectedCity"
              :selected-municipality="selectedMunicipality"
              @city-selected="handleCitySelected"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
