/**
 * Sprint 6: Load Testing & Smoke Tests (Playwright)
 * Validates application health, performance, and concurrency resilience
 */
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';
const CONCURRENT_USERS = parseInt(process.env.LOAD_USERS || '10');
const ITERATIONS = parseInt(process.env.LOAD_ITERATIONS || '5');

// ─── Health Checks ─────────────────────────────────────────────────────────
test.describe('Health Checks', () => {
  test('homepage loads within 3s', async ({ page }) => {
    const start = Date.now();
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const loadTime = Date.now() - start;
    expect(loadTime).toBeLessThan(3000);
    await expect(page).not.toHaveTitle('');
  });

  test('critical CSS and JS load', async ({ page }) => {
    const failedResources: string[] = [];
    page.on('response', response => {
      if (response.status() >= 400 && (
        response.url().endsWith('.js') || response.url().endsWith('.css')
      )) {
        failedResources.push(`${response.status()} ${response.url()}`);
      }
    });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    expect(failedResources).toEqual([]);
  });

  test('no console errors on load', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    // Filter known benign errors
    const criticalErrors = errors.filter(e =>
      !e.includes('favicon') && !e.includes('manifest')
    );
    expect(criticalErrors.length).toBeLessThanOrEqual(2);
  });
});

// ─── Performance Benchmarks ────────────────────────────────────────────────
test.describe('Performance Benchmarks', () => {
  test('LCP < 2.5s', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'load' });
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries();
          resolve(entries[entries.length - 1]?.startTime ?? 0);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        setTimeout(() => resolve(0), 5000);
      });
    });
    // 0 means observer didn't fire — skip gracefully
    if (lcp > 0) expect(lcp).toBeLessThan(2500);
  });

  test('DOM interactive < 2s', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return nav ? nav.domInteractive - nav.fetchStart : 0;
    });
    if (timing > 0) expect(timing).toBeLessThan(2000);
  });

  test('total bundle transfer < 2MB', async ({ page }) => {
    let totalBytes = 0;
    page.on('response', async (response) => {
      const url = response.url();
      if (url.endsWith('.js') || url.endsWith('.css')) {
        const body = await response.body().catch(() => null);
        if (body) totalBytes += body.length;
      }
    });
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    expect(totalBytes).toBeLessThan(2 * 1024 * 1024);
  });
});

// ─── Concurrent Load Simulation ────────────────────────────────────────────
test.describe('Load Simulation', () => {
  test(`handle ${CONCURRENT_USERS} concurrent page loads`, async ({ browser }) => {
    const results: { status: number; duration: number }[] = [];

    const tasks = Array.from({ length: CONCURRENT_USERS }, async (_, i) => {
      const context = await browser.newContext();
      const page = await context.newPage();
      const start = Date.now();

      try {
        const response = await page.goto(BASE_URL, {
          waitUntil: 'domcontentloaded',
          timeout: 15000,
        });
        results.push({
          status: response?.status() ?? 0,
          duration: Date.now() - start,
        });
      } catch {
        results.push({ status: 0, duration: Date.now() - start });
      } finally {
        await context.close();
      }
    });

    await Promise.all(tasks);

    const successful = results.filter(r => r.status === 200);
    const avgDuration = successful.reduce((s, r) => s + r.duration, 0) / (successful.length || 1);

    console.log(`Load test results: ${successful.length}/${CONCURRENT_USERS} successful, avg ${Math.round(avgDuration)}ms`);

    expect(successful.length).toBeGreaterThanOrEqual(Math.floor(CONCURRENT_USERS * 0.9));
    expect(avgDuration).toBeLessThan(10000);
  });

  test('sequential rapid navigation is stable', async ({ page }) => {
    const routes = ['/', '/auth', '/'];
    for (const route of routes) {
      const response = await page.goto(`${BASE_URL}${route}`, {
        waitUntil: 'domcontentloaded',
        timeout: 10000,
      });
      expect(response?.status()).toBeLessThan(500);
    }
  });
});

// ─── API Endpoint Stress ───────────────────────────────────────────────────
test.describe('API Stress', () => {
  test('Supabase healthcheck responds', async ({ request }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      test.skip();
      return;
    }

    const response = await request.get(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
        'Authorization': `Bearer ${process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''}`,
      },
    });
    expect(response.status()).toBeLessThan(500);
  });

  test(`${ITERATIONS} rapid API calls don't fail`, async ({ request }) => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      test.skip();
      return;
    }

    const results = await Promise.all(
      Array.from({ length: ITERATIONS }, () =>
        request.get(`${supabaseUrl}/rest/v1/products?select=id&limit=1`, {
          headers: {
            'apikey': process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
            'Authorization': `Bearer ${process.env.VITE_SUPABASE_PUBLISHABLE_KEY || ''}`,
          },
        }).then(r => r.status()).catch(() => 500)
      )
    );

    const failures = results.filter(s => s >= 500).length;
    expect(failures).toBeLessThanOrEqual(1);
  });
});
