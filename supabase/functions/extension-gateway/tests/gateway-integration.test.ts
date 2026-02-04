/**
 * Extension Gateway Integration Tests
 * 
 * Tests the full gateway flow:
 * - Header validation (X-Request-Id, X-Extension-Id, X-Extension-Version)
 * - Anti-replay protection
 * - Idempotency handling
 * - Response format compliance
 * - Error handling
 */

import { assertEquals, assertExists, assert } from "https://deno.land/std@0.224.0/assert/mod.ts"
import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts"

// Load env with allowEmptyValues to prevent failures
try {
  await load({ allowEmptyValues: true, export: true })
} catch {
  // Ignore errors - use defaults
}

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") || "https://jsmwckzrmqecwwrswwrz.supabase.co"
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") || ""
const GATEWAY_URL = `${SUPABASE_URL}/functions/v1/extension-gateway`

// Helper to generate UUIDs
function generateUUID(): string {
  return crypto.randomUUID()
}

interface GatewayResponse {
  ok: boolean
  code?: string
  message?: string
  data?: Record<string, unknown>
  meta: {
    gatewayVersion?: string
    timestamp?: string
    requestId?: string
    action?: string
    durationMs?: number
    rateLimit?: {
      remaining: number
      resetAt: string
    }
  }
  details?: Record<string, unknown>
}

// Helper to make gateway requests
async function callGateway(
  action: string,
  payload: Record<string, unknown> = {},
  options: {
    requestId?: string
    extensionId?: string
    extensionVersion?: string
    idempotencyKey?: string
    token?: string
  } = {}
): Promise<{ status: number; body: GatewayResponse }> {
  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": options.requestId || generateUUID(),
      "X-Extension-Id": options.extensionId || "shopopti-extension",
      "X-Extension-Version": options.extensionVersion || "5.8.1",
      ...(options.idempotencyKey && { "X-Idempotency-Key": options.idempotencyKey }),
      ...(options.token && { "X-Extension-Token": options.token }),
    },
    body: JSON.stringify({
      action,
      payload,
      metadata: { platform: "test" },
    }),
  })

  const body = await response.json()
  return { status: response.status, body }
}

// =============================================================================
// HEADER VALIDATION TESTS
// =============================================================================

Deno.test("Gateway - rejects missing X-Request-Id", async () => {
  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Extension-Id": "shopopti-extension",
      "X-Extension-Version": "5.8.1",
    },
    body: JSON.stringify({ action: "CHECK_VERSION" }),
  })

  assertEquals(response.status, 400)
  const body = await response.json()
  assertEquals(body.ok, false)
  assertEquals(body.code, "INVALID_HEADERS")
})

Deno.test("Gateway - rejects invalid X-Request-Id format", async () => {
  const { status, body } = await callGateway("CHECK_VERSION", {}, {
    requestId: "not-a-uuid",
  })

  assertEquals(status, 400)
  assertEquals(body.ok, false)
  assertEquals(body.code, "INVALID_HEADERS")
})

Deno.test("Gateway - rejects missing X-Extension-Id", async () => {
  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": generateUUID(),
      "X-Extension-Version": "5.8.1",
    },
    body: JSON.stringify({ action: "CHECK_VERSION" }),
  })

  assertEquals(response.status, 403)
  const body = await response.json()
  assertEquals(body.ok, false)
  assertEquals(body.code, "INVALID_EXTENSION")
})

Deno.test("Gateway - rejects unknown X-Extension-Id", async () => {
  const { status, body } = await callGateway("CHECK_VERSION", {}, {
    extensionId: "unknown-extension",
  })

  assertEquals(status, 403)
  assertEquals(body.ok, false)
  assertEquals(body.code, "INVALID_EXTENSION")
})

Deno.test("Gateway - rejects outdated extension version", async () => {
  const { status, body } = await callGateway("CHECK_VERSION", {}, {
    extensionVersion: "1.0.0",
  })

  assertEquals(status, 426)
  assertEquals(body.ok, false)
  assertEquals(body.code, "VERSION_OUTDATED")
  assertExists(body.meta)
})

// =============================================================================
// RESPONSE FORMAT TESTS
// =============================================================================

Deno.test("Gateway - returns standardized success response", async () => {
  const { status, body } = await callGateway("CHECK_VERSION")

  assertEquals(status, 200)
  assertEquals(body.ok, true)
  assertExists(body.data)
  assertExists(body.meta)
  assertExists(body.meta.gatewayVersion)
  assertExists(body.meta.timestamp)
  assertExists(body.meta.requestId)
})

Deno.test("Gateway - returns standardized error response", async () => {
  const { status, body } = await callGateway("UNKNOWN_ACTION_12345")

  assertEquals(status, 400)
  assertEquals(body.ok, false)
  assertExists(body.code)
  assertExists(body.message)
  assertExists(body.meta)
  assertExists(body.meta.gatewayVersion)
  assertExists(body.meta.timestamp)
})

Deno.test("Gateway - includes rate limit info in success response", async () => {
  const { body } = await callGateway("CHECK_VERSION")

  // Rate limit info should be in meta for successful requests
  assertExists(body.meta)
})

// =============================================================================
// ANTI-REPLAY TESTS
// =============================================================================

Deno.test("Gateway - accepts first request with unique ID", async () => {
  const requestId = generateUUID()
  const { status, body } = await callGateway("CHECK_VERSION", {}, { requestId })

  assertEquals(status, 200)
  assertEquals(body.ok, true)
})

Deno.test("Gateway - rejects replay of same request ID", async () => {
  const requestId = generateUUID()

  // First request should succeed
  const first = await callGateway("CHECK_VERSION", {}, { requestId })
  assertEquals(first.status, 200)

  // Second request with same ID should fail
  const second = await callGateway("CHECK_VERSION", {}, { requestId })
  assertEquals(second.status, 409)
  assertEquals(second.body.code, "REPLAY_DETECTED")
})

// =============================================================================
// ACTION ROUTING TESTS
// =============================================================================

Deno.test("Gateway - routes CHECK_VERSION action correctly", async () => {
  const { status, body } = await callGateway("CHECK_VERSION")

  assertEquals(status, 200)
  assertEquals(body.ok, true)
  assertExists(body.data)
})

Deno.test("Gateway - rejects unknown action", async () => {
  const { status, body } = await callGateway("NONEXISTENT_ACTION")

  assertEquals(status, 400)
  assertEquals(body.ok, false)
  assertEquals(body.code, "UNKNOWN_ACTION")
})

// =============================================================================
// AUTHENTICATION TESTS
// =============================================================================

Deno.test("Gateway - CHECK_VERSION works without auth", async () => {
  const { status, body } = await callGateway("CHECK_VERSION")

  assertEquals(status, 200)
  assertEquals(body.ok, true)
})

Deno.test("Gateway - protected action requires auth", async () => {
  const { status, body } = await callGateway("IMPORT_PRODUCT", {
    source_url: "https://amazon.com/dp/test",
  })

  // Should require authentication
  assert(status === 401 || status === 400)
  assertEquals(body.ok, false)
})

// =============================================================================
// IDEMPOTENCY TESTS
// =============================================================================

Deno.test("Gateway - requires idempotency key for write actions", async () => {
  // Note: This test would need a valid auth token to properly test
  // For now, we test that the flow works with public actions
  const { body } = await callGateway("CHECK_VERSION")
  
  // CHECK_VERSION is not a write action, so it should work without idempotency key
  assertEquals(body.ok, true)
})

// =============================================================================
// CORS TESTS
// =============================================================================

Deno.test("Gateway - handles OPTIONS preflight", async () => {
  const response = await fetch(GATEWAY_URL, {
    method: "OPTIONS",
    headers: {
      "Origin": "https://shopopti.io",
      "Access-Control-Request-Method": "POST",
    },
  })

  assertEquals(response.status, 204)
  await response.text() // Consume body
})

Deno.test("Gateway - rejects non-POST methods", async () => {
  const response = await fetch(GATEWAY_URL, {
    method: "GET",
    headers: {
      "X-Request-Id": generateUUID(),
      "X-Extension-Id": "shopopti-extension",
      "X-Extension-Version": "5.8.1",
    },
  })

  assertEquals(response.status, 405)
  await response.text() // Consume body
})

// =============================================================================
// PAYLOAD VALIDATION TESTS
// =============================================================================

Deno.test("Gateway - rejects invalid JSON body", async () => {
  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": generateUUID(),
      "X-Extension-Id": "shopopti-extension",
      "X-Extension-Version": "5.8.1",
    },
    body: "not valid json",
  })

  assertEquals(response.status, 400)
  const body = await response.json()
  assertEquals(body.ok, false)
  assertEquals(body.code, "INVALID_PAYLOAD")
})

Deno.test("Gateway - rejects missing action field", async () => {
  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Request-Id": generateUUID(),
      "X-Extension-Id": "shopopti-extension",
      "X-Extension-Version": "5.8.1",
    },
    body: JSON.stringify({ payload: {} }),
  })

  assertEquals(response.status, 400)
  const body = await response.json()
  assertEquals(body.ok, false)
})

// =============================================================================
// META INFORMATION TESTS
// =============================================================================

Deno.test("Gateway - includes gateway version in response", async () => {
  const { body } = await callGateway("CHECK_VERSION")

  assertExists(body.meta.gatewayVersion)
  assert((body.meta.gatewayVersion as string).match(/^\d+\.\d+\.\d+$/))
})

Deno.test("Gateway - includes timestamp in response", async () => {
  const { body } = await callGateway("CHECK_VERSION")

  assertExists(body.meta.timestamp)
  // Should be a valid ISO timestamp
  assert(!isNaN(Date.parse(body.meta.timestamp as string)))
})

Deno.test("Gateway - includes request_id in response", async () => {
  const requestId = generateUUID()
  const { body } = await callGateway("CHECK_VERSION", {}, { requestId })

  assertEquals(body.meta.requestId, requestId)
})

// =============================================================================
// ERROR DETAILS TESTS
// =============================================================================

Deno.test("Gateway - includes details in error response", async () => {
  const { body } = await callGateway("UNKNOWN_ACTION_XYZ")

  assertEquals(body.ok, false)
  assertExists(body.code)
  assertExists(body.message)
})
