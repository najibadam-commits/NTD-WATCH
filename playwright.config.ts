import { defineConfig, devices } from '@playwright/test';

const executablePath = process.env.CHROMIUM_PATH;
const launchOptions = executablePath ? { executablePath } : {};

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  projects: [
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'], launchOptions } },
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], launchOptions } },
  ],
  webServer: {
    command: 'npm run build && npm run preview --workspace @ntd-watch/web -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
