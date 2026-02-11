import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  timeout: 30_000,
  reporter: process.env.CI
    ? [['github'], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['html'], ['json', { outputFile: 'test-results/results.json' }]],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    /* ── Smoke suite (CI gate) ── */
    {
      name: 'smoke',
      testDir: './tests/smoke',
      use: { ...devices['Desktop Chrome'] },
    },

    /* ── Auth tests ── */
    {
      name: 'auth',
      testDir: './tests/auth',
      use: { ...devices['Desktop Chrome'] },
    },

    /* ── Full suite (all browsers) ── */
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: process.env.CI
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:8080',
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
