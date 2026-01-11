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

<template>
  <main class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <!-- ヘッダー -->
      <header class="text-center mb-12">
        <h1 class="text-5xl font-bold text-gray-800 mb-4">munigraph</h1>
        <p class="text-xl text-gray-600">日本の自治体データベース</p>
      </header>
      <!-- ナビゲーション -->
      <nav class="flex justify-center space-x-8">
        <router-link
          :to="{ name: 'browse' }"
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
          :to="{ name: 'quiz' }"
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

<style scoped>
/* Tailwind CSSが適用されているため、追加のスタイルは不要 */
</style>
