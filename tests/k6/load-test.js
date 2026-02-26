/**
 * k6 Load Test Suite — ShopOpti+ Platform
 * 
 * Usage:
 *   k6 run tests/k6/load-test.js
 *   k6 run --vus 50 --duration 2m tests/k6/load-test.js
 *   k6 run --env BASE_URL=https://your-domain.com tests/k6/load-test.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ── Custom Metrics ──────────────────────────────────────────────────────────
const errorRate = new Rate('errors');
const apiDuration = new Trend('api_duration', true);
const pageLoadDuration = new Trend('page_load_duration', true);
const successfulLogins = new Counter('successful_logins');

// ── Configuration ───────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://jsmwckzrmqecwwrswwrz.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || '';

export const options = {
  scenarios: {
    // Smoke test: basic functionality check
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '30s',
      tags: { scenario: 'smoke' },
      startTime: '0s',
    },
    // Load test: normal expected load
    load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 20 },   // ramp up
        { duration: '3m', target: 20 },   // steady state
        { duration: '1m', target: 50 },   // peak
        { duration: '2m', target: 50 },   // sustained peak
        { duration: '1m', target: 0 },    // ramp down
      ],
      tags: { scenario: 'load' },
      startTime: '30s',
    },
    // Stress test: beyond normal capacity
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 200 },
        { duration: '1m', target: 200 },
        { duration: '1m', target: 0 },
      ],
      tags: { scenario: 'stress' },
      startTime: '9m',
    },
    // Spike test: sudden burst
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 300 },
        { duration: '30s', target: 300 },
        { duration: '10s', target: 0 },
      ],
      tags: { scenario: 'spike' },
      startTime: '13m',
    },
  },
  thresholds: {
    http_req_duration: ['p(95)<2000', 'p(99)<5000'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.1'],
    api_duration: ['p(95)<1500'],
    page_load_duration: ['p(95)<3000'],
  },
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function supabaseHeaders(token) {
  const headers = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

// ── Test Scenarios ──────────────────────────────────────────────────────────
export default function () {
  group('🏠 Homepage & Static Assets', () => {
    const res = http.get(BASE_URL);
    const passed = check(res, {
      'homepage status 200': (r) => r.status === 200,
      'homepage has content': (r) => r.body.length > 1000,
      'response time < 2s': (r) => r.timings.duration < 2000,
    });
    errorRate.add(!passed);
    pageLoadDuration.add(res.timings.duration);
  });

  sleep(1);

  group('📊 Dashboard Load', () => {
    const res = http.get(`${BASE_URL}/dashboard`);
    check(res, {
      'dashboard loads': (r) => r.status === 200 || r.status === 302,
    });
    pageLoadDuration.add(res.timings.duration);
  });

  sleep(0.5);

  group('🔑 Auth Endpoint', () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

    const loginRes = http.post(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`,
      JSON.stringify({
        email: `loadtest+${__VU}@example.com`,
        password: 'loadtest-password-123',
      }),
      { headers: supabaseHeaders() }
    );

    const passed = check(loginRes, {
      'auth responds': (r) => r.status < 500,
      'auth time < 3s': (r) => r.timings.duration < 3000,
    });
    errorRate.add(!passed);
    apiDuration.add(loginRes.timings.duration);

    if (loginRes.status === 200) {
      successfulLogins.add(1);
    }
  });

  sleep(0.5);

  group('📦 Products API', () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

    const res = http.get(
      `${SUPABASE_URL}/rest/v1/products?select=id,title,price,status&limit=20`,
      { headers: supabaseHeaders() }
    );

    const passed = check(res, {
      'products API responds': (r) => r.status < 500,
      'products time < 1.5s': (r) => r.timings.duration < 1500,
    });
    errorRate.add(!passed);
    apiDuration.add(res.timings.duration);
  });

  sleep(0.5);

  group('📋 Orders API', () => {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return;

    const res = http.get(
      `${SUPABASE_URL}/rest/v1/orders?select=id,order_number,status,total_amount&limit=20&order=created_at.desc`,
      { headers: supabaseHeaders() }
    );

    check(res, {
      'orders API responds': (r) => r.status < 500,
      'orders time < 1.5s': (r) => r.timings.duration < 1500,
    });
    apiDuration.add(res.timings.duration);
  });

  sleep(0.5);

  group('🔍 Search Simulation', () => {
    const queries = ['shoes', 'phone', 'bag', 'watch', 'shirt'];
    const q = queries[Math.floor(Math.random() * queries.length)];

    const res = http.get(
      `${SUPABASE_URL}/rest/v1/products?title=ilike.*${q}*&limit=10`,
      { headers: supabaseHeaders() }
    );

    check(res, {
      'search responds': (r) => r.status < 500,
      'search time < 2s': (r) => r.timings.duration < 2000,
    });
    apiDuration.add(res.timings.duration);
  });

  sleep(Math.random() * 2 + 1);
}

// ── Summary Reporter ────────────────────────────────────────────────────────
export function handleSummary(data) {
  const summary = {
    timestamp: new Date().toISOString(),
    scenarios: Object.keys(options.scenarios),
    metrics: {
      http_req_duration_p95: data.metrics?.http_req_duration?.values?.['p(95)'],
      http_req_duration_p99: data.metrics?.http_req_duration?.values?.['p(99)'],
      http_req_failed_rate: data.metrics?.http_req_failed?.values?.rate,
      error_rate: data.metrics?.errors?.values?.rate,
      api_duration_p95: data.metrics?.api_duration?.values?.['p(95)'],
      total_requests: data.metrics?.http_reqs?.values?.count,
      vus_max: data.metrics?.vus_max?.values?.value,
    },
    thresholds_passed: Object.entries(data.root_group?.checks || {}).every(
      ([, v]) => v.passes > 0
    ),
  };

  return {
    'tests/k6/results/summary.json': JSON.stringify(summary, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data) {
  return `
╔══════════════════════════════════════════════════╗
║       ShopOpti+ Load Test Results                ║
╠══════════════════════════════════════════════════╣
║  Total Requests:  ${data.metrics?.http_reqs?.values?.count || 'N/A'}
║  p95 Duration:    ${Math.round(data.metrics?.http_req_duration?.values?.['p(95)'] || 0)}ms
║  p99 Duration:    ${Math.round(data.metrics?.http_req_duration?.values?.['p(99)'] || 0)}ms  
║  Error Rate:      ${((data.metrics?.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%
║  Max VUs:         ${data.metrics?.vus_max?.values?.value || 'N/A'}
╚══════════════════════════════════════════════════╝
`;
}
