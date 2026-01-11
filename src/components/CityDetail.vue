<template>
  <div v-if="selectedMunicipality" ref="detailContainer" class="mt-8 pt-6 px-4 md:px-12 lg:px-24">
    <!-- 自治体名表示 -->
    <div class="mb-8">
      <div class="flex items-center gap-3 mb-2">
        <h3 class="text-3xl font-bold text-gray-900">
          {{ fullMunicipalityName }}
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
      <p class="text-gray-600">{{ fullMunicipalityYomi }}</p>
      <p v-if="latestSubprefectureInfo" class="text-sm text-gray-500 mt-1">
        {{ latestSubprefectureInfo }}
      </p>
    </div>

    <!-- タイムライン表示 -->
    <div
      class="space-y-8 relative before:absolute before:inset-x-0 before:top-5 before:bottom-5 before:ml-5 before:-translate-x-px before:w-0.5 before:bg-slate-200"
    >
      <!-- 現在マーカー -->
      <div v-if="isExisting" class="relative flex items-center justify-start group is-active">
        <!-- ドット -->
        <div
          class="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-blue-600 text-white shadow shrink-0 z-10"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" />
          </svg>
        </div>
        <!-- ラベル -->
        <div class="flex-1 max-w-xl px-4">
          <div class="font-bold text-xl">現在</div>
        </div>
      </div>

      <!-- 消滅イベントマーカー -->
      <div
        v-if="!isExisting && extinctionEvent"
        class="relative flex items-center justify-start group is-active"
      >
        <!-- ドット -->
        <div
          class="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-slate-400 text-white shadow shrink-0 z-10"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
        </div>
        <!-- カード -->
        <div class="flex-1 max-w-xl bg-white p-4 rounded border border-slate-200 shadow ml-4">
          <div class="font-bold text-lg text-slate-900 mb-2">
            {{ formatDate(extinctionEvent.date) }}
          </div>
          <div class="font-semibold text-slate-700 mb-1">
            {{ extinctionEvent.event_type }}
          </div>
          <div class="space-y-2 mt-2">
            <div
              v-for="(name, idx) in extinctionEvent.afterCities"
              :key="idx"
              class="block p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer text-xs text-slate-700 font-medium"
              @click="selectCityByCode(extinctionEvent.afterCityCodes[idx])"
            >
              {{ name }}
            </div>
          </div>
        </div>
      </div>

      <!-- イベントカード (誕生含む) -->
      <div
        v-for="item in milestones"
        :key="item.version.code"
        class="relative flex items-center justify-start group is-active"
      >
        <!-- ドット -->
        <div
          class="flex items-center justify-center w-10 h-10 rounded-full border border-white shadow shrink-0 z-10"
          :class="item.isBirth ? 'bg-slate-400 text-white' : 'bg-slate-300 text-white'"
        >
          <!-- 誕生アイコン (Sparkles) -->
          <svg v-if="item.isBirth" class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M19 9l1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z"
            />
          </svg>
          <!-- 通常アイコン (Circle) -->
          <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"
            />
          </svg>
        </div>
        <!-- カード -->
        <div class="flex-1 max-w-xl bg-white p-4 rounded border border-slate-200 shadow ml-4">
          <div class="font-bold text-lg text-slate-900 mb-2">
            {{
              item.isUnknownBirth
                ? '日付未登録'
                : formatDate(item.beforeEvent?.date || item.version.valid_from)
            }}
          </div>

          <!-- 誕生 (Unknown) -->
          <div v-if="item.isUnknownBirth" class="mb-4">
            <div class="font-semibold mb-1 text-slate-700">成立</div>
          </div>
          <!-- 誕生 (Known) or 通常イベント -->
          <div v-else-if="item.beforeEvent" class="mb-4">
            <div class="font-semibold mb-1 text-slate-700">
              {{ item.beforeEvent.event_type }}
            </div>
            <div class="space-y-2 mt-2">
              <div
                v-for="(name, idx) in item.beforeEvent.beforeCities"
                :key="idx"
                class="block p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer text-xs text-slate-700 font-medium"
                @click="selectCityByCode(item.beforeEvent.beforeCityCodes[idx])"
              >
                {{ name }}
              </div>
            </div>
          </div>
          <!-- 属性変更（イベントがある場合も、その他の属性変化があれば表示） -->
          <div v-if="item.attributeChanges.length > 0" class="mb-4">
            <div v-if="!item.beforeEvent" class="font-semibold mb-1 text-slate-500">属性変更</div>
            <div class="space-y-1">
              <div
                v-for="(change, cIdx) in item.attributeChanges"
                :key="cIdx"
                class="text-sm text-slate-600"
              >
                <span class="font-medium">{{ change.type }}:</span>
                {{ change.before }} → {{ change.after }}
              </div>
            </div>
          </div>

          <!-- 属性情報（現在は空、将来的に他の属性を追加する場合に使用） -->
          <div class="text-slate-500 text-sm"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'
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

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dataStore = useDataStore()
const detailContainer = ref<HTMLElement | null>(null)

// 自治体のフルネーム（都道府県名 + [郡名] + 自治体名）
const fullMunicipalityName = computed(() => {
  if (!props.selectedMunicipality) return ''
  const pref = dataStore.prefByCode.get(props.selectedMunicipality.prefecture_code)

  // 最後のバージョンの郡名を取得
  const lastVersion =
    props.selectedMunicipality.versions[props.selectedMunicipality.versions.length - 1]
  const county = lastVersion ? dataStore.countyByCode.get(lastVersion.county_code) : null

  const parts = []
  if (pref) parts.push(pref.name)
  if (county) parts.push(county.name)
  parts.push(props.selectedMunicipality.name)

  return parts.join(' ')
})

// 自治体のフル読みがな（都道府県読み + [郡読み] + 自治体読み）
const fullMunicipalityYomi = computed(() => {
  if (!props.selectedMunicipality) return ''
  const pref = dataStore.prefByCode.get(props.selectedMunicipality.prefecture_code)

  // 最後のバージョンの郡名を取得
  const lastVersion =
    props.selectedMunicipality.versions[props.selectedMunicipality.versions.length - 1]
  const county = lastVersion ? dataStore.countyByCode.get(lastVersion.county_code) : null

  const parts = []
  if (pref?.yomi) parts.push(pref.yomi)
  if (county?.yomi) parts.push(county.yomi)
  parts.push(props.selectedMunicipality.yomi)

  return parts.join(' ')
})

// 最新の支庁情報
const latestSubprefectureInfo = computed(() => {
  if (!props.selectedMunicipality?.versions.length) return ''
  const lastVersion =
    props.selectedMunicipality.versions[props.selectedMunicipality.versions.length - 1]!
  const subpref = dataStore.subprefByCode.get(lastVersion.subprefecture_code)
  if (!subpref?.name) return ''
  return subpref.yomi && subpref.yomi.trim() !== ''
    ? `${subpref.name} (${subpref.yomi})`
    : subpref.name
})

// 現存するかどうか
const isExisting = computed(() => {
  if (!props.selectedMunicipality?.versions.length) return false
  const lastVersion =
    props.selectedMunicipality.versions[props.selectedMunicipality.versions.length - 1]
  return !lastVersion?.valid_to || lastVersion.valid_to.trim() === ''
})

// 消滅イベント
const extinctionEvent = computed(() => {
  if (isExisting.value || !props.selectedMunicipality?.versions.length) return null
  const lastVersion =
    props.selectedMunicipality.versions[props.selectedMunicipality.versions.length - 1]!
  const events = getGroupedEvents(lastVersion.code)
  return events.after
})

// タイムライン項目（初期状態 + イベント）
const milestones = computed(() => {
  if (!props.selectedMunicipality?.versions.length) return []

  const items = props.selectedMunicipality.versions.map((v, index) => {
    const events = getGroupedEvents(v.code)
    const prevVersion = index > 0 ? props.selectedMunicipality!.versions[index - 1] : null
    const attributeChanges = []

    if (prevVersion) {
      // 支庁の変更をチェック
      if (v.subprefecture_code !== prevVersion.subprefecture_code) {
        const before = dataStore.subprefByCode.get(prevVersion.subprefecture_code)?.name || 'なし'
        const after = dataStore.subprefByCode.get(v.subprefecture_code)?.name || 'なし'
        attributeChanges.push({ type: '支庁', before, after })
      }
      // 郡の変更をチェック
      if (v.county_code !== prevVersion.county_code) {
        const before = dataStore.countyByCode.get(prevVersion.county_code)?.name || 'なし'
        const after = dataStore.countyByCode.get(v.county_code)?.name || 'なし'
        attributeChanges.push({ type: '郡', before, after })
      }
    }

    return {
      version: v,
      beforeEvent: events.before,
      attributeChanges,
      isBirth: index === 0,
      isUnknownBirth: index === 0 && !events.before,
    }
  })
  return items.reverse()
})

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
      const beforeCityData = dataStore.cityByCode.get(event.city_code_before)
      const beforeCity = getCityNameByCode(event.city_code_before)
      const afterCity = getCityNameByCode(event.city_code_after)

      // 管轄変更や境界変更の場合は、名称が同じでも表示に含める（変化を辿りやすくするため）
      // endsWithだと「上湧別町」が「湧別町」にマッチしてしまうため、名称そのものを比較する
      const isSelf =
        props.selectedMunicipality &&
        beforeCityData?.name === props.selectedMunicipality.name &&
        event.event_type !== '管轄変更' &&
        event.event_type !== '境界変更'

      if (beforeCity && !isSelf && !group.beforeCityCodes.includes(event.city_code_before)) {
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
