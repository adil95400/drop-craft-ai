# Extension Gateway v3.1 - Backend-First Import API

## Architecture Overview

The Extension Gateway v3.1 implements a **backend-first** extraction strategy, replacing the previous client-side DOM scraping approach. This ensures:

- **100% data completeness** via API → Headless → HTML cascade
- **Progressive import** with job tracking
- **Strict normalization** of product data with field attribution
- **Detailed completeness logs**
- **Anti-replay protection** (30-day TTL)
- **Idempotency for writes** (7-day TTL)

## Endpoint

```
POST /functions/v1/extension-gateway
```

## Authentication

### Required Headers

| Header | Required | Description |
|--------|----------|-------------|
| `Authorization` | Yes | `Bearer <extension_token>` |
| `X-Extension-Id` | Yes | Extension identifier |
| `X-Extension-Version` | Yes | Extension version (min: 5.7.0) |
| `X-Request-Id` | Yes | UUID v4 for anti-replay |
| `X-Idempotency-Key` | For writes | Stable string for idempotency |

### Token Generation

First, generate an extension token:

```json
{
  "action": "AUTH_GENERATE_TOKEN",
  "payload": {}
}
```

## Security Protections

### Anti-Replay Protection

Every request requires a unique `X-Request-Id` (UUID v4). If the same request_id is seen again within 30 days:

```json
{
  "ok": false,
  "code": "REPLAY_DETECTED",
  "message": "Request already processed",
  "details": { "requestId": "uuid-v4" }
}
```

### Idempotency (Write Operations)

Write actions require `X-Idempotency-Key`. Behavior:

| State | Response |
|-------|----------|
| Key not seen | Execute operation, cache result |
| Key seen + succeeded | Return cached response |
| Key seen + started | Return `409 IN_PROGRESS` |
| Key seen + failed | Re-execute operation |

Write actions requiring idempotency:
- `IMPORT_PRODUCT`, `IMPORT_PRODUCT_BACKEND`
- `IMPORT_BULK`, `IMPORT_BULK_BACKEND`
- `IMPORT_REVIEWS`, `UPSERT_PRODUCT`, `PUBLISH_TO_STORE`
- `AI_OPTIMIZE_*`, `AI_GENERATE_*`
- `SYNC_STOCK`, `SYNC_PRICE`

## Import Product (Backend-First)

### Request

```json
{
  "action": "IMPORT_PRODUCT_BACKEND",
  "payload": {
    "source_url": "https://aliexpress.com/item/123456.html",
    "platform": "aliexpress",
    "shop_id": "uuid-optional",
    "options": {
      "include_reviews": true,
      "include_video": true,
      "include_variants": true,
      "include_shipping": true,
      "preferred_currency": "EUR",
      "target_language": "fr",
      "auto_translate": false
    },
    "request_id": "uuid-v4",
    "idempotency_key": "stable-string",
    "timestamp": 1730000000
  }
}
```

### Response (Success)

```json
{
  "ok": true,
  "data": {
    "action": "created",
    "job_id": "uuid",
    "product": {
      "id": "uuid",
      "name": "Product Title",
      "price": 29.99,
      "images": ["url1", "url2"],
      "...": "full product object"
    },
    "extraction": {
      "method": "firecrawl",
      "completeness_score": 85,
      "missing_fields": ["reviews", "video_url"],
      "attempts": [
        {"method": "api", "success": false},
        {"method": "firecrawl", "success": true}
      ]
    }
  },
  "meta": {
    "action": "IMPORT_PRODUCT_BACKEND",
    "requestId": "uuid",
    "durationMs": 3542,
    "rateLimit": {
      "remaining": 29,
      "resetAt": "2024-01-01T01:00:00Z"
    },
    "gatewayVersion": "2.1.0",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### Response (Error)

```json
{
  "ok": false,
  "code": "EXTRACTION_FAILED",
  "message": "Unable to extract product data from the provided URL",
  "details": {
    "platform": "aliexpress",
    "attempts": [
      {"method": "api", "success": false},
      {"method": "firecrawl", "success": false},
      {"method": "html_fallback", "success": false}
    ],
    "hint": "The page may be protected or the platform may not be supported."
  },
  "meta": {
    "gatewayVersion": "2.1.0",
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## Bulk Import (Backend-First)

### Request

```json
{
  "action": "IMPORT_BULK_BACKEND",
  "payload": {
    "urls": [
      "https://aliexpress.com/item/123.html",
      "https://amazon.com/dp/ABC123",
      "https://temu.com/product/456"
    ],
    "platform": "other",
    "options": {
      "include_reviews": false,
      "include_variants": true
    },
    "request_id": "uuid-v4",
    "idempotency_key": "bulk-import-12345",
    "timestamp": 1730000000
  }
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "job_id": "uuid",
    "total": 3,
    "succeeded": 2,
    "failed": 1,
    "products": [
      {"id": "uuid1", "name": "..."},
      {"id": "uuid2", "name": "..."}
    ],
    "errors": [
      {"url": "https://...", "error": {"code": "EXTRACTION_FAILED", "message": "..."}}
    ]
  }
}
```

## Job Status Tracking

### Request

```json
{
  "action": "GET_IMPORT_JOB",
  "payload": {
    "job_id": "uuid"
  }
}
```

### Response

```json
{
  "ok": true,
  "data": {
    "job_id": "uuid",
    "job_type": "product_import",
    "status": "processing",
    "progress": {
      "percent": 45,
      "message": "Extracting variants..."
    },
    "result": null,
    "error": null,
    "timing": {
      "created_at": "...",
      "started_at": "...",
      "completed_at": null,
      "duration_ms": null
    }
  }
}
```

## Extraction Cascade (Import Orchestrator v3.1)

The backend uses a three-tier extraction strategy with field attribution:

### 1. Platform API (Fastest, Most Reliable)
- Amazon Product Advertising API
- AliExpress Affiliate API
- eBay Browse API
- **Confidence: 98%**
- *Requires API keys - falls back to next tier if unavailable*

### 2. Headless Firecrawl (AI-Powered)
- Uses Firecrawl's `/v1/scrape` endpoint with actions
- Platform-specific scroll/wait actions
- Handles JavaScript-rendered pages
- **Confidence: 85%**

### 3. HTML Fallback
- Direct HTTP fetch with browser User-Agent
- JSON-LD structured data extraction (highest HTML confidence: 95%)
- Platform-specific regex patterns (confidence: 75-85%)
- Open Graph meta tag parsing (fallback confidence: 55-70%)

### Field Attribution

Each extracted field tracks its source:

```json
{
  "field_sources": {
    "title": { "source": "headless", "confidence": 85 },
    "price": { "source": "html", "confidence": 95 },
    "images": { "source": "headless", "confidence": 85 },
    "rating": { "source": "html", "confidence": 90 }
  }
}
```

## Supported Platforms

| Platform | API | Firecrawl | HTML Fallback |
|----------|-----|-----------|---------------|
| Amazon | 🟡 | ✅ | ✅ |
| AliExpress | 🟡 | ✅ | ✅ |
| Temu | ❌ | ✅ | ✅ |
| Shein | ❌ | ✅ | ✅ |
| eBay | 🟡 | ✅ | ✅ |
| Wish | ❌ | ✅ | ✅ |
| Alibaba | 🟡 | ✅ | ✅ |
| Banggood | ❌ | ✅ | ✅ |
| DHgate | ❌ | ✅ | ✅ |

Legend: ✅ Implemented | 🟡 Planned | ❌ Not Available

## Normalized Product Schema

All extracted products are normalized to a unified schema:

```typescript
interface NormalizedProduct {
  // Core Identity
  source_url: string
  external_id: string | null
  platform: string
  
  // Basic Info
  title: string
  description: string | null
  short_description: string | null
  
  // Pricing
  price: number
  original_price: number | null
  currency: string
  discount_percentage: number | null
  
  // Media
  images: string[]
  video_url: string | null
  thumbnail_url: string | null
  
  // Inventory
  sku: string | null
  stock_status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'unknown'
  stock_quantity: number | null
  
  // Classification
  category: string | null
  brand: string | null
  tags: string[]
  
  // Variants
  has_variants: boolean
  variants: ProductVariant[]
  options: ProductOption[]
  
  // Reviews
  rating: number | null
  reviews_count: number | null
  
  // Seller
  seller_name: string | null
  seller_rating: number | null
  
  // Metadata
  extraction_method: 'api' | 'firecrawl' | 'html_fallback' | 'hybrid'
  completeness_score: number  // 0-100
  missing_fields: string[]
  extracted_at: string
}
```

## Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `INVALID_TOKEN` | 401 | Token expired or revoked |
| `FORBIDDEN_SCOPE` | 403 | Missing required scope |
| `VERSION_OUTDATED` | 426 | Extension update required |
| `INVALID_PAYLOAD` | 400 | Malformed request body |
| `EXTRACTION_FAILED` | 422 | All extraction methods failed |
| `QUOTA_EXCEEDED` | 429 | Rate limit reached |
| `HANDLER_ERROR` | 500 | Internal processing error |

## Rate Limits

| Action | Requests | Window |
|--------|----------|--------|
| `IMPORT_PRODUCT_BACKEND` | 30 | 60 min |
| `IMPORT_BULK_BACKEND` | 5 | 60 min |
| `GET_IMPORT_JOB` | 100 | 60 min |

## Security

- All requests require valid extension token
- Anti-replay protection via X-Request-Id (30-day TTL)
- Idempotency for write operations (7-day TTL)
- Origin validation (CORS whitelist)
- User-scoped data access (RLS enforced)
