import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.CHROMIUM_PATH;
const launchOptions = executablePath ? { executablePath } : {};

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  // Fewer workers keep slower machines from timing out; raise it on a fast one.
  workers: process.env.CI ? 2 : 3,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'], launchOptions } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], launchOptions } },
  ],
  webServer: {
    command:
      'npm run build && npm run preview --workspace @ntd-watch/web -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
