import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()

// HMR対応のための設定
if (import.meta.hot) {
  import.meta.hot.accept()
}

app.use(pinia)
app.use(router)
app.mount('#app')
