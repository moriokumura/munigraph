<template>
  <div>
    <!-- 絞り込みフォーム -->
    <div class="mb-8">
      <div class="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-6">
          自治体検索
        </h3>
        
        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <!-- キーワード検索 -->
          <div class="lg:col-span-2">
            <label for="search-input" class="text-sm font-medium text-gray-700 mb-2 block">
              キーワード検索
            </label>
            <input
              id="search-input"
              name="search"
              v-model="searchQuery"
              type="text"
              placeholder="市区町村名、郡名、都道府県名、読み仮名で検索..."
              class="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white"
              aria-describedby="search-help"
            />
          </div>
          
          <!-- 自治体の状態フィルター -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-3 block">自治体の状態</label>
            <div class="space-y-2">
              <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  v-model="showExisting"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <span class="text-sm font-medium text-gray-700">現存自治体</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50">
                <input 
                  type="checkbox" 
                  v-model="showExtinct"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <span class="text-sm font-medium text-gray-700">消滅自治体</span>
              </label>
            </div>
          </div>

          <!-- 地域フィルター -->
          <div>
            <label class="text-sm font-medium text-gray-700 mb-3 block">地域</label>
            <div class="space-y-3">
              <div>
                <label for="prefecture-filter" class="text-sm font-medium text-gray-700 mb-1 block">
                  都道府県
                </label>
                <select 
                  id="prefecture-filter"
                  v-model="selectedPrefecture"
                  class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                >
                  <option value="">すべての都道府県</option>
                  <option 
                    v-for="pref in dataStore.prefs" 
                    :key="pref.code" 
                    :value="pref.code"
                  >
                    {{ pref.name }}
                  </option>
                </select>
              </div>
              <div>
                <label for="county-filter" class="text-sm font-medium text-gray-700 mb-1 block">
                  郡
                </label>
                <select 
                  id="county-filter"
                  v-model="selectedCounty"
                  :disabled="!selectedPrefecture"
                  class="w-full px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 text-sm bg-white"
                >
                  <option value="">すべての郡</option>
                  <option 
                    v-for="county in availableCounties" 
                    :key="county.code" 
                    :value="county.code"
                  >
                    {{ county.name }} ({{ county.yomi }})
                  </option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <!-- アクションボタン -->
        <div class="flex justify-between items-center pt-6 border-t border-gray-100 mt-6">
          <div class="text-sm text-gray-600">
            <span class="font-medium text-blue-600">{{ filteredCities.length }}</span>件の市区町村を表示中
          </div>
          <button
            @click="resetFilters"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            title="すべてのフィルターをリセット"
          >
            リセット
          </button>
        </div>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDataStore, type City } from '@/stores/data'

// Props定義
interface Props {
  selectedCity?: City | null
}

// Emits定義
interface Emits {
  (e: 'citySelected', city: City): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dataStore = useDataStore()
const searchQuery = ref('')

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
</script>
