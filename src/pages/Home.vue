<template>
  <main class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <!-- ヘッダー -->
      <header class="text-center mb-12">
        <h1 class="text-5xl font-bold text-gray-800 mb-4">munigraph</h1>
        <p class="text-xl text-gray-600">日本の自治体データベース</p>
      </header>

      <!-- ステータス表示 -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div v-if="error || store.error" class="bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800">エラーが発生しました</h3>
              <div class="mt-2 text-sm text-red-700">
                {{ error || store.error }}
              </div>
            </div>
          </div>
        </div>

        <div v-else-if="store.loading" class="text-center py-8">
          <div
            class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-indigo-500 hover:bg-indigo-400 transition ease-in-out duration-150 cursor-not-allowed"
          >
            <svg
              class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              ></circle>
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            データを読み込み中...
          </div>
        </div>

        <div v-else-if="!store.loaded" class="text-center py-8">
          <div
            class="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-gray-500"
          >
            データを初期化中...
          </div>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div class="bg-blue-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-blue-600">{{ store.prefs.length }}</div>
            <div class="text-sm text-blue-800 mt-1">都道府県</div>
          </div>
          <div class="bg-green-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-green-600">{{ store.counties.length }}</div>
            <div class="text-sm text-green-800 mt-1">郡</div>
          </div>
          <div class="bg-purple-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-purple-600">{{ store.cities.length }}</div>
            <div class="text-sm text-purple-800 mt-1">市区町村</div>
          </div>
          <div class="bg-orange-50 rounded-lg p-4 text-center">
            <div class="text-3xl font-bold text-orange-600">{{ store.changes.length }}</div>
            <div class="text-sm text-orange-800 mt-1">変更イベント</div>
          </div>
        </div>
      </div>

      <!-- ナビゲーション -->
      <nav class="flex justify-center space-x-8">
        <router-link
          to="/browse"
          class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
        >
          <svg
            class="mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style="width: 20px; height: 20px"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            ></path>
          </svg>
          ブラウズ
        </router-link>
        <router-link
          to="/quiz"
          class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
        >
          <svg
            class="mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style="width: 20px; height: 20px"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            ></path>
          </svg>
          クイズ
        </router-link>
      </nav>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick } from 'vue'
import { useDataStore } from '@/stores/data'
const store = useDataStore()
const error = ref<string | null>(null)

onMounted(async () => {
  console.log('Home component mounted, store state:', {
    loaded: store.loaded,
    loading: store.loading,
    error: store.error,
  })

  try {
    // 次のティックまで待機してからデータを読み込み
    await nextTick()
    await store.loadAll()
    console.log('Data loaded successfully in Home component')
  } catch (err) {
    console.error('Failed to load data in Home component:', err)
    error.value = 'データの読み込みに失敗しました'
  }
})
</script>

<style scoped>
/* Tailwind CSSが適用されているため、追加のスタイルは不要 */
</style>
