<script setup lang="ts">
import { ref, nextTick, computed } from 'vue'
import { format, parseISO } from 'date-fns'
import { useDataStore } from '@/stores/data'
import { EVENT_METADATA, type EventType } from '@/types/municipality'
import type { MunicipalityVersion, Municipality, Change } from '@/types/municipality'

// Props定義
interface Props {
  selectedCity: MunicipalityVersion | null
  selectedMunicipality: Municipality | null
}

// Emits定義
interface Emits {
  (e: 'citySelected', city: MunicipalityVersion): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const dataStore = useDataStore()
const detailContainer = ref<HTMLElement | null>(null)

// 自治体のフルネーム（都道府県名 + [郡名] + 自治体名）
const fullMunicipalityName = computed(() => {
  if (!props.selectedMunicipality) return ''
  const pref = dataStore.prefByCode.get(props.selectedMunicipality.prefecture_code)

  // 選択されたバージョンがあればその郡、なければ最後のバージョンの郡名を取得
  const displayVersion =
    props.selectedCity ||
    props.selectedMunicipality.versions[props.selectedMunicipality.versions.length - 1]
  const county = displayVersion ? dataStore.countyByCode.get(displayVersion.county_code) : null

  const parts = []
  if (pref) parts.push(pref.name)
  if (county) parts.push(county.name)
  parts.push(displayVersion?.name || props.selectedMunicipality.name)

  return parts.join(' ')
})

// 自治体のフル読みがな（都道府県読み + [郡読み] + 自治体読み）
const fullMunicipalityYomi = computed(() => {
  if (!props.selectedMunicipality) return ''
  const pref = dataStore.prefByCode.get(props.selectedMunicipality.prefecture_code)

  // 選択されたバージョンがあればその郡、なければ最後のバージョンの郡名を取得
  const displayVersion =
    props.selectedCity ||
    props.selectedMunicipality.versions[props.selectedMunicipality.versions.length - 1]
  const county = displayVersion ? dataStore.countyByCode.get(displayVersion.county_code) : null

  const parts = []
  if (pref?.yomi) parts.push(pref.yomi)
  if (county?.yomi) parts.push(county.yomi)
  parts.push(displayVersion?.yomi || props.selectedMunicipality.yomi)

  return parts.join(' ')
})

// 最新の支庁情報
const latestSubprefectureInfo = computed(() => {
  const versions = props.selectedMunicipality?.versions
  if (!versions || versions.length === 0) return ''

  const lastVersion = versions[versions.length - 1]
  if (!lastVersion) return ''

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
const extinctionEvents = computed(() => {
  const versions = props.selectedMunicipality?.versions
  if (isExisting.value || !versions || versions.length === 0) return []

  const lastVersion = versions[versions.length - 1]
  if (!lastVersion) return []

  // 直前のバージョンを取得（もしあれば）
  const prevVersion = versions.length > 1 ? versions[versions.length - 2] : null

  const events = getGroupedEvents(props.selectedMunicipality!.id, lastVersion, prevVersion)
  return events.after
})

// タイムライン項目（初期状態 + イベント）
const milestones = computed(() => {
  if (!props.selectedMunicipality?.versions.length) return []

  // 1. まず時系列順（最古が先頭）にソートする
  const sortedVersions = [...props.selectedMunicipality.versions].sort((a, b) => {
    const dateA = a.valid_from || '0000-00-00'
    const dateB = b.valid_from || '0000-00-00'
    if (dateA !== dateB) return dateA.localeCompare(dateB)

    const toA = a.valid_to || '9999-12-31'
    const toB = b.valid_to || '9999-12-31'
    return toA.localeCompare(toB)
  })

  // 2. 時系列順に基づいて属性変更や誕生フラグを計算する
  const items = sortedVersions.map((v, index) => {
    const prevVersion = index > 0 ? sortedVersions[index - 1] : null
    const events = getGroupedEvents(props.selectedMunicipality!.id, v, prevVersion)
    const attributeChanges = []

    if (prevVersion) {
      if (v.subprefecture_code !== prevVersion.subprefecture_code) {
        const before = dataStore.subprefByCode.get(prevVersion.subprefecture_code)?.name || 'なし'
        const after = dataStore.subprefByCode.get(v.subprefecture_code)?.name || 'なし'
        attributeChanges.push({ type: '支庁', before, after })
      }
      if (v.county_code !== prevVersion.county_code) {
        const before = dataStore.countyByCode.get(prevVersion.county_code)?.name || 'なし'
        const after = dataStore.countyByCode.get(v.county_code)?.name || 'なし'
        attributeChanges.push({ type: '郡', before, after })
      }
      if (v.city_code !== prevVersion.city_code) {
        attributeChanges.push({
          type: 'JISコード',
          before: prevVersion.city_code,
          after: v.city_code,
        })
      }
    }

    return {
      version: v,
      beforeEvents: events.before,
      attributeChanges,
      isBirth: index === 0,
      isUnknownBirth:
        index === 0 && events.before.length === 0 && (!v.valid_from || v.valid_from.trim() === ''),
    }
  })

  // 3. 表示用に最新順（最新が先頭）へ反転させる
  return items.reverse()
})

// イベントグループの型定義
interface GroupedEvent {
  date: string
  event_type: string
  beforeCities: string[]
  afterCities: string[]
  beforeMunicipalityIds: string[]
  afterMunicipalityIds: string[]
  beforeDates: string[]
  afterDates: string[]
}

// 各バージョンのイベントをキャッシュ (キーは municipalityId-valid_from)
const eventsCache = new Map<string, { before: GroupedEvent[]; after: GroupedEvent[] }>()

const getGroupedEvents = (
  municipalityId: string,
  version: MunicipalityVersion,
  prevVersion?: MunicipalityVersion | null,
) => {
  const key = `${municipalityId}-${version.valid_from}-${version.name}`
  const cached = eventsCache.get(key)
  if (cached) return cached

  const adjacent = dataStore.getAdjacentEvents(municipalityId, version)

  // 内部イベントの重複排除：複数のバージョンが同じ日に始まる場合、
  // そのバージョン間の変化に一致するイベントのみを抽出する
  let filteredBefore = adjacent.before
  if (prevVersion && adjacent.before.length > 1) {
    filteredBefore = adjacent.before.filter((ev) => {
      // 外部との合体などは常に保持
      if (ev.municipality_id_before !== ev.municipality_id_after) return true

      // 内部イベントの場合、直前のバージョンからの変化と一致するかチェック
      const prevName = prevVersion.name || ''
      const currName = version.name || ''
      const prevSuffix = prevName.slice(-1)
      const currSuffix = currName.slice(-1)

      if (ev.event_type === '名称変更') {
        // 名称のみが変わった（町->町, 市->市など）場合のみを抽出
        return prevName !== currName && prevSuffix === currSuffix
      }
      if (ev.event_type === '市制施行') {
        // 町・村から市になった場合
        return (prevSuffix === '町' || prevSuffix === '村') && currSuffix === '市'
      }
      if (ev.event_type === '町制施行') {
        // 村から町になった場合
        return prevSuffix === '村' && currSuffix === '町'
      }
      return true
    })
  }

  const result = {
    before: groupEvents(filteredBefore, true),
    after: groupEvents(adjacent.after, false),
  }
  eventsCache.set(key, result)
  return result
}

// イベントをグループ化する関数
const groupEvents = (events: Change[], isBefore: boolean): GroupedEvent[] => {
  try {
    if (!events || events.length === 0) return []

    const groups = new Map<string, GroupedEvent>()

    for (const event of events) {
      if (!event || !event.date || !event.event_type) continue

      const bMId = event.municipality_id_before
      const aMId = event.municipality_id_after

      // 消滅側（isBefore = false）の表示において、自分自身のIDへの遷移はスキップする
      // (それは次のバージョンの「誕生側」イベントとして表示されるため)
      if (!isBefore && aMId === props.selectedMunicipality?.id) {
        continue
      }

      // 自治体IDと日付をキーにする
      // event_type ごとにグループ化することで、同日の複数イベントを表示できるようにする
      const targetMId = isBefore ? event.municipality_id_after : event.municipality_id_before
      const key = `${event.date}-${event.event_type}-${targetMId}`

      if (!groups.has(key)) {
        groups.set(key, {
          date: event.date,
          event_type: event.event_type,
          beforeCities: [],
          afterCities: [],
          beforeMunicipalityIds: [],
          afterMunicipalityIds: [],
          beforeDates: [],
          afterDates: [],
        })
      }

      const group = groups.get(key)!
      const beforeCity = getCityNameByIdAndDate(bMId, event.date, true)
      const afterCity = getCityNameByIdAndDate(aMId, event.date, false)

      // マスターIDが同じなら「自分自身」とみなす
      const isSelf = props.selectedMunicipality && bMId === props.selectedMunicipality.id
      const isInternalEvent = ['名称変更', '市制施行', '町制施行'].includes(event.event_type)

      // 内部イベントの場合は、自分自身であっても表示に含める（旧字体などの変化を示すため）
      if (
        beforeCity &&
        (!isSelf || isInternalEvent) &&
        !group.beforeMunicipalityIds.includes(bMId)
      ) {
        group.beforeCities.push(beforeCity)
        group.beforeMunicipalityIds.push(bMId)
        group.beforeDates.push(event.date)
      }

      if (afterCity && !group.afterMunicipalityIds.includes(aMId)) {
        group.afterCities.push(afterCity)
        group.afterMunicipalityIds.push(aMId)
        group.afterDates.push(event.date)
      }
    }

    // 内容があるグループのみを返す
    return Array.from(groups.values()).filter(
      (g) => g.beforeCities.length > 0 || g.afterCities.length > 0,
    )
  } catch (error) {
    console.error('Error in groupEvents:', error)
    return []
  }
}

// 自治体IDと日付から、該当するバージョンの名前を取得
const getCityNameByIdAndDate = (mId: string, date: string, isEnd: boolean) => {
  const m = dataStore.municipalityById.get(mId)
  if (!m) return `不明な自治体 (${mId})`

  // 日付に一致するバージョンを探す
  // isEnd=true の場合、その日に「消滅」したバージョンを探す
  // isEnd=false の場合、その日に「誕生」したバージョンを探す
  let version = m.versions.find((v) => (isEnd ? v.valid_to === date : v.valid_from === date))

  // 成立時の名称取得の場合、最初のバージョンを使用する
  if (!version && !isEnd && (date === '' || date === m.versions[0]?.valid_from)) {
    version = m.versions[0]
  }

  const pref = dataStore.prefByCode.get(m.prefecture_code)
  const county = version ? dataStore.countyByCode.get(version.county_code) : null

  let name = ''
  if (pref?.name) name += pref.name + ' '
  if (county?.name) name += county.name + ' '

  // バージョン固有の名称があればそれを使用し、なければマスターの名称を使用する
  name += version?.name || m.name

  // 読みがなを追加
  const yomi = version?.yomi || m.yomi
  if (yomi) {
    name += ` (${yomi})`
  }

  return name
}

// 自治体を選択
const selectCityByIdAndDate = async (mId: string, date: string, isStart: boolean) => {
  const m = dataStore.municipalityById.get(mId)
  if (m) {
    // 指定した日付に開始(isStart=true)または終了(isStart=false)するバージョンを探す
    const v = m.versions.find((v) => (isStart ? v.valid_from === date : v.valid_to === date))
    if (v) {
      emit('citySelected', v)

      await nextTick()
      if (detailContainer.value) {
        detailContainer.value.scrollIntoView({ behavior: 'smooth' })
      }
    } else if (m.versions.length > 0) {
      // 該当するバージョンがなくても、とりあえず最新のバージョンを表示する（フォールバック）
      emit('citySelected', m.versions[m.versions.length - 1]!)
    }
  }
}

// 日付フォーマット
const formatDate = (dateStr: string) => {
  try {
    return format(parseISO(dateStr), 'yyyy年M月d日')
  } catch {
    return dateStr
  }
}

// WikipediaのURLを生成
const getWikipediaUrl = (name: string) => {
  return `https://ja.wikipedia.org/wiki/${encodeURIComponent(name.trim())}`
}

// イベントの表示名を取得
const getEventDisplayName = (type: string, isBirth: boolean) => {
  const metadata = EVENT_METADATA[type as EventType]
  if (!metadata) return type
  return isBirth ? metadata.birthName : metadata.extinctionName
}
</script>

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
      <template v-if="!isExisting && extinctionEvents.length > 0">
        <div
          v-for="(event, eIdx) in extinctionEvents"
          :key="`extinction-${eIdx}`"
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
              {{ formatDate(event.date) }}
            </div>
            <div class="font-semibold text-slate-700 mb-1">
              {{ getEventDisplayName(event.event_type, false) }}
            </div>
            <div class="space-y-2 mt-2">
              <div
                v-for="(name, idx) in event.afterCities"
                :key="idx"
                class="block p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer text-xs text-slate-700 font-medium"
                @click="
                  event.afterMunicipalityIds[idx] &&
                  event.afterDates[idx] &&
                  selectCityByIdAndDate(
                    event.afterMunicipalityIds[idx],
                    event.afterDates[idx]!,
                    true,
                  )
                "
              >
                {{ name }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- イベントカード (誕生含む) -->
      <div
        v-for="item in milestones"
        :key="`${selectedMunicipality?.id}-${item.version.valid_from}`"
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
                : formatDate(item.beforeEvents[0]?.date || item.version.valid_from)
            }}
          </div>

          <!-- 誕生 (イベントがない場合でも「成立」として表示) -->
          <div v-if="item.isBirth" class="mb-4">
            <div class="font-semibold mb-1 text-slate-700">
              {{
                item.beforeEvents.length > 0
                  ? getEventDisplayName(item.beforeEvents[0]!.event_type, true)
                  : '成立'
              }}
            </div>
            <!-- 初期の名称（または名称変更後の名称）を表示 -->
            <div class="space-y-2 mt-2">
              <div
                class="block p-3 rounded-lg border border-slate-200 bg-slate-100 text-xs text-slate-700 font-semibold cursor-default"
              >
                <!-- バージョン名称を表示 -->
                {{
                  getCityNameByIdAndDate(selectedMunicipality!.id, item.version.valid_from, false)
                }}
              </div>
            </div>

            <!-- 他の自治体が関わるイベント（新設合併など）がある場合は、前身を表示 -->
            <template v-if="item.beforeEvents.length > 0">
              <div v-for="(event, eIdx) in item.beforeEvents" :key="eIdx" class="mt-4">
                <div
                  v-if="event.event_type !== '名称変更' && event.event_type !== '成立'"
                  class="space-y-2 mt-2"
                >
                  <div
                    v-for="(name, idx) in event.beforeCities"
                    :key="idx"
                    class="block p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer text-xs text-slate-700 font-medium"
                    @click="
                      event.beforeMunicipalityIds[idx] &&
                      event.beforeDates[idx] &&
                      selectCityByIdAndDate(
                        event.beforeMunicipalityIds[idx],
                        event.beforeDates[idx]!,
                        false,
                      )
                    "
                  >
                    {{ name }}
                  </div>
                </div>
              </div>
            </template>
          </div>
          <!-- 通常のイベント (合併・編入・名称変更など) -->
          <template v-else>
            <div v-for="(event, eIdx) in item.beforeEvents" :key="eIdx" class="mb-4">
              <div class="font-semibold mb-1 text-slate-700">
                {{ getEventDisplayName(event.event_type, true) }}
              </div>
              <div class="space-y-2 mt-2">
                <!-- 名称変更・市制施行・町制施行の場合は「変更後の名称」を表示、それ以外は「前身の名称」を表示 -->
                <template v-if="['名称変更', '市制施行', '町制施行'].includes(event.event_type)">
                  <div
                    v-for="(name, idx) in event.afterCities"
                    :key="idx"
                    class="block p-3 rounded-lg border border-slate-200 bg-slate-100 text-xs text-slate-700 font-semibold cursor-default"
                  >
                    {{ name }}
                  </div>
                </template>
                <template v-else>
                  <div
                    v-for="(name, idx) in event.beforeCities"
                    :key="idx"
                    class="block p-3 rounded-lg border border-slate-200 bg-slate-50 hover:bg-white hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer text-xs text-slate-700 font-medium"
                    @click="
                      event.beforeMunicipalityIds[idx] &&
                      event.beforeDates[idx] &&
                      selectCityByIdAndDate(
                        event.beforeMunicipalityIds[idx],
                        event.beforeDates[idx]!,
                        false,
                      )
                    "
                  >
                    {{ name }}
                  </div>
                </template>
              </div>
            </div>
          </template>
          <!-- 属性変更（イベントがある場合も、その他の属性変化があれば表示） -->
          <div v-if="item.attributeChanges.length > 0" class="mb-4">
            <div v-if="item.beforeEvents.length === 0" class="font-semibold mb-1 text-slate-500">
              属性変更
            </div>
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
