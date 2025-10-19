<script setup lang="ts">
import { onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import './style.css'

const store = useDataStore()

onMounted(() => {
  console.log('App component mounted, store state:', {
    loaded: store.loaded,
    loading: store.loading,
    error: store.error
  })
})
</script>

<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <router-view />
  </div>
</template>

<!-- Tailwind CSSは ./style.css でインポート済み -->
