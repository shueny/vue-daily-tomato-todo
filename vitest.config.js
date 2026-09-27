import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  test: {
    environment: 'jsdom',
    include: ['tests/unit/**/*.spec.js'],
    css: false,
    coverage: {
      provider: 'v8',
      include: [
        'src/stores/**/*.js',
        'src/components/RetroDial.vue',
        'src/components/DurationSheet.vue',
        'src/components/FocusOverlay.vue'
      ],
      reporter: ['text-summary', 'text'],
      thresholds: {
        lines: 85,
        statements: 85,
        functions: 85,
        branches: 75
      }
    }
  }
})
