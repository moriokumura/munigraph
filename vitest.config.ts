import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['src/**/*.unit.test.ts'],
      exclude: ['node_modules', 'dist', 'src/**/*.e2e.test.ts'],
      env: {
        BASE_URL: '/',
      },
    },
  }),
)
