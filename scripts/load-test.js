/**
 * k6 Load Testing Script — ShopOpti Production Endpoints
 * 
 * Usage:
 *   k6 run scripts/load-test.js
 *   k6 run --vus 50 --duration 2m scripts/load-test.js
 *   k6 run --env BASE_URL=https://shopopti.io scripts/load-test.js
 * 
 * Thresholds:
 *   - 95th percentile response time < 2s
 *   - Error rate < 5%
 *   - Requests per second > 50
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const healthLatency = new Trend('health_check_duration');
const authLatency = new Trend('auth_flow_duration');
const apiLatency = new Trend('api_call_duration');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Warm-up
    { duration: '1m', target: 50 },    // Ramp-up
    { duration: '2m', target: 50 },    // Sustained load
    { duration: '30s', target: 100 },  // Spike
    { duration: '1m', target: 100 },   // Sustained spike
    { duration: '30s', target: 0 },    // Cool-down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    errors: ['rate<0.05'],
    http_reqs: ['rate>50'],
    health_check_duration: ['p(95)<500'],
    auth_flow_duration: ['p(95)<3000'],
    api_call_duration: ['p(95)<2000'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'https://jsmwckzrmqecwwrswwrz.supabase.co';
const ANON_KEY = __ENV.ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzbXdja3pybXFlY3d3cnN3d3J6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYxNjY0NDEsImV4cCI6MjA4MTc0MjQ0MX0.jhrwOY7-tKeNF54E3Ec6yRzjmTW8zJyKuE9R4rvi41I';

const headers = {
  'Content-Type': 'application/json',
  'apikey': ANON_KEY,
  'Authorization': `Bearer ${ANON_KEY}`,
};

export default function () {
  // ── 1. Health Check ──
  group('Health Check', () => {
    const start = Date.now();
    const res = http.post(`${BASE_URL}/functions/v1/health-check`, '{}', { headers });
    healthLatency.add(Date.now() - start);
    const passed = check(res, {
      'health: status 200': (r) => r.status === 200,
      'health: body has status': (r) => {
        try { return JSON.parse(r.body).status !== undefined; } catch { return false; }
      },
    });
    errorRate.add(!passed);
  });

  sleep(0.5);

  // ── 2. Public Product Listing (via REST) ──
  group('Product Listing', () => {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/rest/v1/products?select=id,title,price,status&status=eq.active&limit=20`,
      { headers: { ...headers, 'Prefer': 'count=exact' } }
    );
    apiLatency.add(Date.now() - start);
    const passed = check(res, {
      'products: status 200': (r) => r.status === 200,
      'products: returns array': (r) => {
        try { return Array.isArray(JSON.parse(r.body)); } catch { return false; }
      },
    });
    errorRate.add(!passed);
  });

  sleep(0.5);

  // ── 3. Auth Flow (signup attempt — will fail on duplicate, but tests latency) ──
  group('Auth Flow', () => {
    const start = Date.now();
    const email = `loadtest+${__VU}_${__ITER}@test.invalid`;
    const res = http.post(
      `${BASE_URL}/auth/v1/signup`,
      JSON.stringify({ email, password: 'LoadTest123!@#' }),
      { headers }
    );
    authLatency.add(Date.now() - start);
    const passed = check(res, {
      'auth: responds': (r) => r.status < 500,
    });
    errorRate.add(!passed);
  });

  sleep(0.5);

  // ── 4. Edge Function Invocation ──
  group('Edge Function — SEO Hub', () => {
    const start = Date.now();
    const res = http.post(
      `${BASE_URL}/functions/v1/seo-hub`,
      JSON.stringify({ action: 'get_scores', product_ids: [] }),
      { headers }
    );
    apiLatency.add(Date.now() - start);
    const passed = check(res, {
      'seo-hub: responds < 500': (r) => r.status < 500,
    });
    errorRate.add(!passed);
  });

  sleep(1);

  // ── 5. Database Query — Orders aggregation ──
  group('Orders Query', () => {
    const start = Date.now();
    const res = http.get(
      `${BASE_URL}/rest/v1/orders?select=id,total_amount,status&limit=50&order=created_at.desc`,
      { headers }
    );
    apiLatency.add(Date.now() - start);
    const passed = check(res, {
      'orders: status 200': (r) => r.status === 200,
    });
    errorRate.add(!passed);
  });

  sleep(0.5);
}

export function handleSummary(data) {
  const p95 = data.metrics.http_req_duration?.values?.['p(95)'] || 0;
  const errRate = data.metrics.errors?.values?.rate || 0;
  const rps = data.metrics.http_reqs?.values?.rate || 0;

  console.log('\n╔══════════════════════════════════════════╗');
  console.log('║       LOAD TEST RESULTS SUMMARY          ║');
  console.log('╠══════════════════════════════════════════╣');
  console.log(`║ P95 Latency:    ${p95.toFixed(0)}ms`.padEnd(43) + '║');
  console.log(`║ Error Rate:     ${(errRate * 100).toFixed(2)}%`.padEnd(43) + '║');
  console.log(`║ Requests/sec:   ${rps.toFixed(1)}`.padEnd(43) + '║');
  console.log(`║ Health P95:     ${(data.metrics.health_check_duration?.values?.['p(95)'] || 0).toFixed(0)}ms`.padEnd(43) + '║');
  console.log(`║ Auth P95:       ${(data.metrics.auth_flow_duration?.values?.['p(95)'] || 0).toFixed(0)}ms`.padEnd(43) + '║');
  console.log(`║ API P95:        ${(data.metrics.api_call_duration?.values?.['p(95)'] || 0).toFixed(0)}ms`.padEnd(43) + '║');
  console.log('╚══════════════════════════════════════════╝\n');

  return {};
}
