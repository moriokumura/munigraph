<script setup lang="ts">
// クイズ機能の実装は今後追加予定
</script>

<template>
  <main class="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <!-- ヘッダー -->
      <header class="text-center mb-12">
        <div
          class="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4"
        >
          <svg
            class="text-purple-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            style="width: 32px; height: 32px"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            ></path>
          </svg>
        </div>
        <h1 class="text-4xl font-bold text-gray-800 mb-4">自治体クイズ</h1>
        <p class="text-xl text-gray-600">日本の自治体について学んでみましょう</p>
      </header>

      <!-- メインコンテンツ -->
      <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div class="text-center py-12">
          <div
            class="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6"
          >
            <svg
              class="text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style="width: 40px; height: 40px"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              ></path>
            </svg>
          </div>
          <h2 class="text-2xl font-semibold text-gray-800 mb-4">クイズ機能</h2>
          <p class="text-gray-600 mb-8">日本の自治体に関するクイズ機能は現在開発中です。</p>
        </div>
      </div>

      <!-- ナビゲーション -->
      <div class="flex justify-center space-x-4">
        <router-link
          :to="{ name: 'home' }"
          class="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
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
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            ></path>
          </svg>
          ホーム
        </router-link>
        <router-link
          :to="{ name: 'browse' }"
          class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
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
      </div>
    </div>
  </main>
</template>
