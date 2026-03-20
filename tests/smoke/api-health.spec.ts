import { test, expect } from '@playwright/test';

/**
 * Smoke — API & Edge Function health checks
 * Validates that critical edge functions respond correctly.
 */
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://jsmwckzrmqecwwrswwrz.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzbXdja3pybXFlY3d3cnN3d3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjY0NDEsImV4cCI6MjA4MTc0MjQ0MX0.jhrwOY7-tKeNF54E3Ec6yRzjmTW8zJyKuE9R4rvi41I';

test.describe('Smoke — Edge Function Health', () => {
  test('check-subscription returns 401 without auth', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/functions/v1/check-subscription`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: {},
    });
    expect(res.status()).toBe(401);
  });

  test('create-checkout returns 401 without auth', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/functions/v1/create-checkout`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { priceId: 'price_test123' },
    });
    expect(res.status()).toBe(401);
  });

  test('ai-hub returns 401 without auth', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/functions/v1/ai-hub`, {
      headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
      data: { action: 'chat', payload: { messages: [] } },
    });
    expect(res.status()).toBe(401);
  });

  test('ai-hub returns 400 with invalid action', async ({ request }) => {
    const res = await request.post(`${SUPABASE_URL}/functions/v1/ai-hub`, {
      headers: {
        apikey: ANON_KEY,
        Authorization: 'Bearer fake_token',
        'Content-Type': 'application/json',
      },
      data: { action: 'invalid-action', payload: {} },
    });
    // Either 400 (validation) or 401 (auth fails first)
    expect([400, 401]).toContain(res.status());
  });
});
