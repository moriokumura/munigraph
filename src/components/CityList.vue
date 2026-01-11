<script setup lang="ts">
import { format, parseISO } from 'date-fns'
import { useDataStore } from '@/stores/data'
import type { MunicipalityVersion, Municipality } from '@/types/municipality'

// Props定義
interface Props {
  municipalities: Municipality[]
  selectedCity?: MunicipalityVersion | null
}

// Emits定義
interface Emits {
  (e: 'municipalitySelected', municipality: Municipality): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const dataStore = useDataStore()

// 自治体選択
const selectMunicipality = (municipality: Municipality) => {
  emit('municipalitySelected', municipality)
}

// 日付をyyyy/MM/dd形式にフォーマット
const formatDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'yyyy/MM/dd')
  } catch (error) {
    console.error('Error formatting date:', dateStr, error)
    return dateStr
  }
}

// 一覧表示用：都道府県名、郡名、自治体名、読み方、存続期間を返す
const getMunicipalityDisplayParts = (m: Municipality) => {
  const pref = dataStore.prefByCode.get(m.prefecture_code)

  // バージョンがない場合のフォールバック
  if (m.versions.length === 0) {
    const yomiParts = []
    if (pref?.yomi) yomiParts.push(pref.yomi)
    yomiParts.push(m.yomi)
    return {
      pref: pref?.name || '',
      county: '',
      name: m.name || '',
      yomi: yomiParts.filter((p) => p && p.trim() !== '').join(' '),
      period: '',
    }
  }

  // 全バージョンの期間を算出
  const firstVersion = m.versions[0]!
  const lastVersion = m.versions[m.versions.length - 1]!

  // 最後のバージョンの郡名を取得
  const county = dataStore.countyByCode.get(lastVersion.county_code)

  const hasValidFrom = firstVersion.valid_from && firstVersion.valid_from.trim() !== ''
  const hasValidTo = lastVersion.valid_to && lastVersion.valid_to.trim() !== ''

  let period = ''
  if (!hasValidFrom && !hasValidTo) {
    period = '現存'
  } else if (!hasValidFrom && hasValidTo) {
    period = `〜${formatDate(lastVersion.valid_to)}`
  } else if (hasValidFrom && !hasValidTo) {
    period = `${formatDate(firstVersion.valid_from)}〜現存`
  } else if (hasValidFrom && hasValidTo) {
    period = `${formatDate(firstVersion.valid_from)}〜${formatDate(lastVersion.valid_to)}`
  }

  const yomiParts = []
  if (pref?.yomi) yomiParts.push(pref.yomi)
  if (county?.yomi) yomiParts.push(county.yomi)
  yomiParts.push(m.yomi)

  return {
    pref: pref?.name || '',
    county: county?.name || '',
    name: m.name || '',
    yomi: yomiParts.filter((p) => p && p.trim() !== '').join(' '),
    period: period,
  }
}
</script>

<template>
  <!-- 自治体一覧 -->
  <div
    class="flex-1 lg:w-1/2 bg-white border-r border-gray-200 flex flex-col max-h-[calc(100vh-200px)] lg:max-h-[calc(100vh-120px)]"
  >
    <div class="p-4 border-b border-gray-200 flex-shrink-0 flex items-baseline gap-2">
      <h3 class="text-lg font-semibold text-gray-900">検索結果</h3>
      <div class="text-sm text-gray-600">
        <span class="font-medium text-blue-600">{{ municipalities.length }}</span
        >件
      </div>
    </div>
    <div
      class="flex-1 overflow-y-auto min-h-0 max-h-[calc(100vh-280px)] lg:max-h-[calc(100vh-200px)]"
    >
      <div class="p-4">
        <div class="grid gap-2">
          <div
            v-for="municipality in municipalities"
            :key="municipality.id"
            class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            tabindex="0"
            role="button"
            @click="selectMunicipality(municipality)"
            @keydown.enter="selectMunicipality(municipality)"
            @keydown.space.prevent="selectMunicipality(municipality)"
          >
            <div class="flex justify-between items-center">
              <div class="flex-1">
                <h4 class="text-lg">
                  <span v-if="getMunicipalityDisplayParts(municipality).pref" class="mr-1">{{
                    getMunicipalityDisplayParts(municipality).pref
                  }}</span>
                  <span v-if="getMunicipalityDisplayParts(municipality).county" class="mr-1">{{
                    getMunicipalityDisplayParts(municipality).county
                  }}</span>
                  <span class="font-bold mr-1">{{
                    getMunicipalityDisplayParts(municipality).name
                  }}</span>
                  <span v-if="getMunicipalityDisplayParts(municipality).yomi">
                    ({{ getMunicipalityDisplayParts(municipality).yomi }})</span
                  >
                  <span
                    v-if="getMunicipalityDisplayParts(municipality).period"
                    class="ml-1 px-1.5 py-0.5 bg-gray-100 rounded text-sm"
                    >{{ getMunicipalityDisplayParts(municipality).period }}</span
                  >
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
