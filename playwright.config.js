import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4174/vue-daily-tomato-todo/',
    ...devices['Pixel 7'],
    browserName: 'chromium'
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4174 --strictPort',
    url: 'http://localhost:4174/vue-daily-tomato-todo/',
    reuseExistingServer: false,
    timeout: 120000
  }
})
