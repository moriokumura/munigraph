<template>
  <div>
    <!-- 絞り込みフォーム -->
    <div class="mb-8">
      <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
        <!-- ヘッダー部分（折りたたみボタン付き） -->
        <div class="p-4 border-b border-gray-100">
          <div class="flex items-center justify-between">
            <h3 class="text-lg font-semibold text-gray-900">検索</h3>
            <button
              class="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
              :title="isCollapsed ? '検索フォームを表示' : '検索フォームを非表示'"
              @click="toggleCollapsed"
            >
              <svg
                class="w-4 h-4 transition-transform duration-200"
                :class="{ 'rotate-180': !isCollapsed }"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- フォーム内容（折りたたみ可能） -->
        <div
          class="transition-all duration-300 ease-in-out overflow-hidden"
          :class="isCollapsed ? 'max-h-0' : 'max-h-[500px]'"
        >
          <div class="p-6">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <!-- キーワード検索 -->
              <div>
                <div class="flex items-center gap-3">
                  <label
                    for="search-input"
                    class="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[100px]"
                  >
                    キーワード検索
                  </label>
                  <input
                    id="search-input"
                    v-model="searchQuery"
                    name="search"
                    type="text"
                    placeholder="市区町村名、郡名、都道府県名、読み仮名で検索..."
                    class="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base bg-white"
                    aria-describedby="search-help"
                  />
                </div>
              </div>

              <!-- 自治体の状態フィルター -->
              <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">自治体の状態</label>
                <div class="flex gap-4">
                  <label
                    class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50"
                  >
                    <input
                      v-model="showExisting"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span class="text-sm font-medium text-gray-700">現存</span>
                  </label>
                  <label
                    class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50"
                  >
                    <input
                      v-model="showExtinct"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span class="text-sm font-medium text-gray-700">消滅</span>
                  </label>
                </div>
              </div>

              <!-- 自治体の種類フィルター -->
              <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">自治体の種類</label>
                <div class="flex gap-4 flex-wrap">
                  <label
                    class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50"
                  >
                    <input
                      v-model="showCity"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span class="text-sm font-medium text-gray-700">市</span>
                  </label>
                  <label
                    class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50"
                  >
                    <input
                      v-model="showTown"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span class="text-sm font-medium text-gray-700">町</span>
                  </label>
                  <label
                    class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50"
                  >
                    <input
                      v-model="showVillage"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span class="text-sm font-medium text-gray-700">村</span>
                  </label>
                  <label
                    class="flex items-center gap-2 cursor-pointer p-2 rounded-lg hover:bg-gray-50"
                  >
                    <input
                      v-model="showSpecialWard"
                      type="checkbox"
                      class="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span class="text-sm font-medium text-gray-700">特別区</span>
                  </label>
                </div>
              </div>

              <!-- 地域フィルター -->
              <div>
                <label class="text-sm font-medium text-gray-700 mb-2 block">地域</label>
                <div class="space-y-2">
                  <div class="flex items-center gap-3">
                    <label
                      for="prefecture-filter"
                      class="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[80px]"
                    >
                      都道府県
                    </label>
                    <select
                      id="prefecture-filter"
                      v-model="selectedPrefecture"
                      class="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                    >
                      <option value="">すべて</option>
                      <option v-for="pref in dataStore.prefs" :key="pref.code" :value="pref.code">
                        {{ pref.name }}
                      </option>
                    </select>
                  </div>
                  <div class="flex items-center gap-3">
                    <label
                      for="county-filter"
                      class="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[80px]"
                    >
                      郡
                    </label>
                    <select
                      id="county-filter"
                      v-model="selectedCounty"
                      :disabled="!selectedPrefecture"
                      class="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 text-sm bg-white"
                    >
                      <option value="">すべて</option>
                      <option
                        v-for="county in availableCounties"
                        :key="county.code"
                        :value="county.code"
                      >
                        {{ county.name }} ({{ county.yomi }})
                      </option>
                    </select>
                  </div>
                  <div class="flex items-center gap-3">
                    <label
                      for="subprefecture-filter"
                      class="text-sm font-medium text-gray-700 whitespace-nowrap min-w-[80px]"
                    >
                      支庁
                    </label>
                    <select
                      id="subprefecture-filter"
                      v-model="selectedSubprefecture"
                      :disabled="!selectedPrefecture || availableSubprefectures.length === 0"
                      class="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 text-sm bg-white"
                    >
                      <option value="">すべて</option>
                      <option
                        v-for="subpref in availableSubprefectures"
                        :key="subpref.code"
                        :value="subpref.code"
                      >
                        {{ subpref.name }} ({{ subpref.yomi }})
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- アクションボタン -->
            <div class="flex justify-between items-center pt-6 border-t border-gray-100 mt-6">
              <div class="text-sm text-gray-600">
                <span class="font-medium text-blue-600">{{ filteredCities.length }}</span
                >件を表示中
              </div>
              <button
                class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                title="すべてのフィルターをリセット"
                @click="resetFilters"
              >
                リセット
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDataStore } from '@/stores/data'
import type { City } from '@/types/municipality'

// Props定義
interface Props {
  selectedCity?: City | null
}

// Emits定義
interface Emits {
  (e: 'citySelected', city: City): void
  (e: 'filteredCitiesChanged', cities: City[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dataStore = useDataStore()
const searchQuery = ref('')

// 折りたたみ状態
const isCollapsed = ref(false)

// フィルター設定
const showExisting = ref(true)
const showExtinct = ref(true)
const showCity = ref(true)
const showTown = ref(true)
const showVillage = ref(true)
const showSpecialWard = ref(true)
const selectedPrefecture = ref('')
const selectedSubprefecture = ref('')
const selectedCounty = ref('')

// 選択された都道府県の支庁一覧を取得
const availableSubprefectures = computed(() => {
  if (!selectedPrefecture.value) return []
  return dataStore.subprefectures.filter(
    subpref => subpref.prefecture_code === selectedPrefecture.value
  )
})

// 選択された都道府県の郡一覧を取得
const availableCounties = computed(() => {
  if (!selectedPrefecture.value) return []
  return dataStore.counties.filter(county => county.prefecture_code === selectedPrefecture.value)
})

// 都道府県が変更されたときに支庁と郡の選択をリセット
watch(selectedPrefecture, () => {
  selectedSubprefecture.value = ''
  selectedCounty.value = ''
})

// 折りたたみ状態を切り替え
const toggleCollapsed = () => {
  isCollapsed.value = !isCollapsed.value
}

// すべてのフィルターをリセット
const resetFilters = () => {
  showExisting.value = true
  showExtinct.value = true
  showCity.value = true
  showTown.value = true
  showVillage.value = true
  showSpecialWard.value = true
  selectedPrefecture.value = ''
  selectedSubprefecture.value = ''
  selectedCounty.value = ''
  searchQuery.value = ''
}

// 検索結果を計算（検索クエリとフィルター条件を組み合わせて適用）
const filteredCities = computed(() => {
  if (!dataStore.loaded) return []

  // まず検索クエリで絞り込み（市区町村名、読み仮名、都道府県名、郡名で検索）
  let cities = dataStore.searchCities(searchQuery.value)

  // フィルター適用（現存/消滅、都道府県、支庁、郡、自治体の種類での絞り込み）
  cities = cities.filter(city => {
    // 現存/消滅フィルター：valid_toが空の場合は現存自治体
    const isExisting = !city.valid_to || city.valid_to.trim() === ''
    if (isExisting && !showExisting.value) return false
    if (!isExisting && !showExtinct.value) return false

    // 自治体の種類フィルター
    const cityType = city.name?.endsWith('市') ? 'city' :
                     city.name?.endsWith('町') ? 'town' :
                     city.name?.endsWith('村') ? 'village' :
                     city.name?.endsWith('区') ? 'ward' : null

    if (cityType === 'city' && !showCity.value) return false
    if (cityType === 'town' && !showTown.value) return false
    if (cityType === 'village' && !showVillage.value) return false
    if (cityType === 'ward' && !showSpecialWard.value) return false

    // 都道府県フィルター
    if (selectedPrefecture.value && city.prefecture_code !== selectedPrefecture.value) return false

    // 支庁フィルター（都道府県が選択されている場合のみ適用）
    if (selectedSubprefecture.value && city.subprefecture_code !== selectedSubprefecture.value)
      return false

    // 郡フィルター（都道府県が選択されている場合のみ適用）
    if (selectedCounty.value && city.county_code !== selectedCounty.value) return false

    return true
  })

  return cities
})

// フィルタリング結果を親コンポーネントに通知
watch(
  filteredCities,
  newCities => {
    emit('filteredCitiesChanged', newCities)
  },
  { immediate: true }
)

// 市区町村情報を取得
const getCityInfo = (city: City) => {
  const pref = dataStore.prefByCode.get(city.prefecture_code)
  const county = dataStore.countyByCode.get(city.county_code)
  const parts = [pref?.name, county?.name].filter(Boolean)
  return parts.join(' ')
}
</script>
