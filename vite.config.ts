import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'node:path'

export default defineConfig({
  plugins: [vue()],
  base: '/munigraph/', // GitHub Pages用のベースパス
  resolve: { alias: { '@': path.resolve(__dirname, 'src') } },
  server: {
    // 開発環境ではCSPを無効にして、eval警告を回避
    // headers: {
    //   'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' 'wasm-unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ws: wss:;"
    // }
    hmr: {
      overlay: true
    }
  },
  define: {
    __VUE_PROD_DEVTOOLS__: false,
  },
  esbuild: {
    // eval の使用を避けるための設定
    target: 'esnext',
    format: 'esm'
  },
  optimizeDeps: {
    // 依存関係の最適化設定
    include: ['vue', 'pinia', 'papaparse', 'zod']
  }
})
