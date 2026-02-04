/**
 * NormalizationEngine Unit Tests
 * 
 * Tests the core normalization logic:
 * - Title normalization (sanitization, truncation)
 * - Price normalization (parsing, currency detection)
 * - Image normalization (deduplication, high-res upgrade)
 * - Variant normalization (option mapping)
 * - Completeness score calculation
 */

import { assertEquals, assertExists, assert } from "https://deno.land/std@0.224.0/assert/mod.ts"

// Import the normalizer (relative import for edge function tests)
import { NormalizationEngine, RawProductData, ProductNormalized } from '../lib/normalization-engine.ts'

// =============================================================================
// TITLE NORMALIZATION TESTS
// =============================================================================

Deno.test("NormalizationEngine - normalizes title correctly", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "  Buy Amazing Product - Free Shipping  ",
    price: 29.99,
    images: ["https://example.com/image.jpg"]
  })
  
  assert(result.success)
  assertExists(result.product)
  // Title should be cleaned and trimmed
  assert(result.product.title.includes("Amazing Product"))
})

Deno.test("NormalizationEngine - handles missing title as error", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    price: 29.99,
    images: ["https://example.com/image.jpg"]
  })
  
  // Should have error but still produce product
  assertExists(result.product)
  assertEquals(result.product?.status, "error_incomplete")
  assert(result.errors.some(e => e.field === "title"))
})

Deno.test("NormalizationEngine - truncates long titles", () => {
  const engine = new NormalizationEngine()
  const longTitle = "A".repeat(250)
  
  const result = engine.normalize({
    title: longTitle,
    price: 29.99,
    images: ["https://example.com/image.jpg"]
  })
  
  assertExists(result.product)
  assert(result.product.title.length <= 200)
  assert(result.product.title.endsWith("..."))
})

Deno.test("NormalizationEngine - strips HTML from title", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "<b>Product</b> with <script>alert('xss')</script> tags",
    price: 29.99,
    images: ["https://example.com/image.jpg"]
  })
  
  assertExists(result.product)
  // Title should not contain HTML tags
  assert(!result.product.title.includes("<"))
})

// =============================================================================
// PRICE NORMALIZATION TESTS
// =============================================================================

Deno.test("NormalizationEngine - normalizes numeric price", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Test Product",
    price: 29.99,
    images: ["https://example.com/image.jpg"]
  })
  
  assertExists(result.product)
  assertEquals(result.product.price, 29.99)
})

Deno.test("NormalizationEngine - parses string price with currency symbol", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Test Product",
    price: "€29,99",
    images: ["https://example.com/image.jpg"]
  })
  
  assertExists(result.product)
  assertEquals(result.product.price, 29.99)
  assertEquals(result.product.currency, "EUR")
})

Deno.test("NormalizationEngine - handles US format price", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Test Product",
    price: "$1,299.99",
    images: ["https://example.com/image.jpg"]
  })
  
  assertExists(result.product)
  // Should parse to a reasonable price
  assert(result.product.price > 0)
})

Deno.test("NormalizationEngine - handles European format price", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Test Product",
    price: "1.299,99",
    currency: "EUR",
    images: ["https://example.com/image.jpg"]
  })
  
  assertExists(result.product)
  assertEquals(result.product.price, 1299.99)
})

Deno.test("NormalizationEngine - rejects negative price", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Test Product",
    price: -10,
    images: ["https://example.com/image.jpg"]
  })
  
  assertExists(result.product)
  assertEquals(result.product.price, 0)
  assert(result.errors.some(e => e.field === "price"))
})

// =============================================================================
// IMAGE NORMALIZATION TESTS
// =============================================================================

Deno.test("NormalizationEngine - normalizes image array", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Test Product",
    price: 29.99,
    images: [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg"
    ]
  })
  
  assertExists(result.product)
  assertEquals(result.product.images.length, 2)
})

Deno.test("NormalizationEngine - deduplicates images", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Test Product",
    price: 29.99,
    images: [
      "https://example.com/image.jpg",
      "https://example.com/image.jpg",
      "https://example.com/image.jpg"
    ]
  })
  
  assertExists(result.product)
  assertEquals(result.product.images.length, 1)
})

Deno.test("NormalizationEngine - prioritizes single image_url", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Test Product",
    price: 29.99,
    image_url: "https://example.com/main.jpg",
    images: ["https://example.com/secondary.jpg"]
  })
  
  assertExists(result.product)
  assertEquals(result.product.images[0], "https://example.com/main.jpg")
})

Deno.test("NormalizationEngine - upgrades Amazon images to high-res", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Test Product",
    price: 29.99,
    images: ["https://m.media-amazon.com/images/I/test._SX300_.jpg"]
  })
  
  assertExists(result.product)
  assert(result.product.images[0].includes("_SL1500_"))
})

Deno.test("NormalizationEngine - requires at least one image", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Test Product",
    price: 29.99,
    images: []
  })
  
  assert(result.errors.some(e => e.field === "images"))
})

Deno.test("NormalizationEngine - limits to 20 images", () => {
  const engine = new NormalizationEngine()
  const manyImages = Array.from({ length: 30 }, (_, i) => `https://example.com/image${i}.jpg`)
  
  const result = engine.normalize({
    title: "Test Product",
    price: 29.99,
    images: manyImages
  })
  
  assertExists(result.product)
  assertEquals(result.product.images.length, 20)
})

// =============================================================================
// VARIANT NORMALIZATION TESTS
// =============================================================================

Deno.test("NormalizationEngine - normalizes variants", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Test Product",
    price: 29.99,
    images: ["https://example.com/image.jpg"],
    variants: [
      { title: "Small", price: 29.99, sku: "SKU-S" },
      { title: "Medium", price: 34.99, sku: "SKU-M" },
      { title: "Large", price: 39.99, sku: "SKU-L" }
    ]
  })
  
  assertExists(result.product)
  assertEquals(result.product.variants.length, 3)
  assertEquals(result.product.has_variants, true)
})

Deno.test("NormalizationEngine - generates variant IDs", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Test Product",
    price: 29.99,
    images: ["https://example.com/image.jpg"],
    variants: [
      { title: "Small", price: 29.99 }
    ]
  })
  
  assertExists(result.product)
  assertExists(result.product.variants[0].id)
  assert(result.product.variants[0].id.length > 0)
})

// =============================================================================
// COMPLETENESS SCORE TESTS
// =============================================================================

Deno.test("NormalizationEngine - calculates high completeness for full product", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Complete Product",
    price: 29.99,
    currency: "EUR",
    description: "A detailed product description with lots of information about the product.",
    images: [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
      "https://example.com/image3.jpg"
    ],
    category: "Electronics",
    brand: "TestBrand",
    sku: "SKU-001",
    rating: 4.5,
    reviews_count: 100,
    variants: [
      { title: "Small", price: 29.99 },
      { title: "Large", price: 39.99 }
    ]
  })
  
  assertExists(result.product)
  assert(result.product.completeness_score >= 50, `Expected score >= 50, got ${result.product.completeness_score}`)
})

Deno.test("NormalizationEngine - calculates low completeness for minimal product", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Minimal Product",
    price: 29.99,
    images: ["https://example.com/image.jpg"]
  })
  
  assertExists(result.product)
  assert(result.product.completeness_score < 50, `Expected score < 50, got ${result.product.completeness_score}`)
})

// =============================================================================
// STATUS DETERMINATION TESTS
// =============================================================================

Deno.test("NormalizationEngine - sets status to draft for valid product", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Valid Product",
    price: 29.99,
    images: ["https://example.com/image.jpg"]
  })
  
  assertExists(result.product)
  assertEquals(result.product.status, "draft")
})

Deno.test("NormalizationEngine - sets status to error_incomplete for critical missing fields", () => {
  const engine = new NormalizationEngine()
  
  // Missing title AND price AND images
  const result = engine.normalize({})
  
  assertExists(result.product)
  assertEquals(result.product.status, "error_incomplete")
})

// =============================================================================
// CATEGORY NORMALIZATION TESTS
// =============================================================================

Deno.test("NormalizationEngine - normalizes category", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Test Product",
    price: 29.99,
    images: ["https://example.com/image.jpg"],
    category: "ELECTRONICS & Gadgets"
  })
  
  assertExists(result.product)
  assertEquals(result.product.category, "electronics")
})

Deno.test("NormalizationEngine - defaults to uncategorized", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Test Product",
    price: 29.99,
    images: ["https://example.com/image.jpg"]
  })
  
  assertExists(result.product)
  assertEquals(result.product.category, "uncategorized")
})

// =============================================================================
// FIELD SOURCES TESTS
// =============================================================================

Deno.test("NormalizationEngine - preserves field sources", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Test Product",
    price: 29.99,
    images: ["https://example.com/image.jpg"],
    field_sources: {
      title: { source: "api", confidence: 0.95 },
      price: { source: "headless", confidence: 0.85 }
    }
  })
  
  assertExists(result.product)
  assertExists(result.product.field_sources.title)
  assertEquals(result.product.field_sources.title.source, "api")
})

// =============================================================================
// EDGE CASES
// =============================================================================

Deno.test("NormalizationEngine - handles null input gracefully", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({} as RawProductData)
  
  assertExists(result)
  assert(result.errors.length > 0)
})

Deno.test("NormalizationEngine - includes normalized_at timestamp", () => {
  const engine = new NormalizationEngine()
  
  const result = engine.normalize({
    title: "Test Product",
    price: 29.99,
    images: ["https://example.com/image.jpg"]
  })
  
  assertExists(result.product)
  assertExists(result.product.normalized_at)
  // Should be a valid ISO timestamp
  assert(!isNaN(Date.parse(result.product.normalized_at)))
})
