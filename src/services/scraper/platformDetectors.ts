/**
 * Platform & Page Type Detection
 */
import type { Platform, PageType, PlatformDetectionResult } from './types'

interface PlatformPattern {
  platform: Platform
  urlPatterns: RegExp[]
  productIdPattern?: RegExp[]
  pageTypePatterns?: { type: PageType; patterns: RegExp[] }[]
}

const PLATFORM_REGISTRY: PlatformPattern[] = [
  {
    platform: 'aliexpress',
    urlPatterns: [/aliexpress\.(com|fr|us)/i, /ali\.ski/i, /s\.click\.aliexpress/i],
    productIdPattern: [/item\/(\d+)\.html/, /\/(\d+)\.html/, /productId=(\d+)/],
    pageTypePatterns: [
      { type: 'product', patterns: [/\/item\//, /\/product\//] },
      { type: 'category', patterns: [/\/category\//, /\/wholesale/] },
      { type: 'store', patterns: [/\/store\//, /\.aliexpress\.com\/store/] },
    ],
  },
  {
    platform: 'amazon',
    urlPatterns: [/amazon\./i],
    productIdPattern: [/\/dp\/([A-Z0-9]+)/i, /\/gp\/product\/([A-Z0-9]+)/i, /asin=([A-Z0-9]+)/i],
    pageTypePatterns: [
      { type: 'product', patterns: [/\/dp\//, /\/gp\/product\//] },
      { type: 'category', patterns: [/\/b\?/, /\/s\?/] },
      { type: 'search', patterns: [/\/s\?k=/] },
    ],
  },
  {
    platform: 'ebay',
    urlPatterns: [/ebay\./i],
    productIdPattern: [/\/itm\/(\d+)/, /item=(\d+)/],
  },
  {
    platform: 'temu',
    urlPatterns: [/temu\.com/i, /share\.temu/i],
    productIdPattern: [/goods\/(\d+)/, /g-(\d+)/],
  },
  {
    platform: 'shopify',
    urlPatterns: [/\.myshopify\.com/i],
    productIdPattern: [/\/products\/([^\/\?#]+)/],
    pageTypePatterns: [
      { type: 'product', patterns: [/\/products\//] },
      { type: 'category', patterns: [/\/collections\//] },
    ],
  },
  {
    platform: 'woocommerce',
    urlPatterns: [/\/product\//i, /\/product-category\//i],
    productIdPattern: [/\/product\/([^\/\?]+)/],
  },
  {
    platform: 'etsy',
    urlPatterns: [/etsy\.com/i],
    productIdPattern: [/listing\/(\d+)/],
  },
  {
    platform: 'cjdropshipping',
    urlPatterns: [/cjdropshipping\.com/i],
    productIdPattern: [/product\/([^\/\?]+)/, /pid=([^&]+)/],
  },
  {
    platform: 'cdiscount',
    urlPatterns: [/cdiscount\.com/i],
    productIdPattern: [/\/([mf]p?d?)-([^\/\.]+)\.html/i, /\/dp\/([^\/\?]+)/],
  },
  {
    platform: 'fnac',
    urlPatterns: [/fnac\.com/i],
    productIdPattern: [/\/a(\d+)\//],
  },
  {
    platform: 'walmart',
    urlPatterns: [/walmart\.com/i],
    productIdPattern: [/\/ip\/[^\/]+\/(\d+)/],
  },
  {
    platform: 'wish',
    urlPatterns: [/wish\.com/i],
    productIdPattern: [/product\/([a-zA-Z0-9]+)/],
  },
  {
    platform: 'banggood',
    urlPatterns: [/banggood\.com/i],
    productIdPattern: [/-p-(\d+)\.html/],
  },
  {
    platform: 'dhgate',
    urlPatterns: [/dhgate\.com/i],
    productIdPattern: [/product\/([^\/\.]+)/],
  },
  {
    platform: 'shein',
    urlPatterns: [/shein\.(com|fr)/i],
    productIdPattern: [/-p-(\d+)/, /productId=(\d+)/],
  },
  {
    platform: 'rakuten',
    urlPatterns: [/rakuten\.(com|fr)/i],
    productIdPattern: [/\/product\/(\d+)/],
  },
]

export function detectPlatform(url: string): PlatformDetectionResult {
  const urlLower = url.toLowerCase()

  for (const entry of PLATFORM_REGISTRY) {
    const matchesUrl = entry.urlPatterns.some((p) => p.test(urlLower))
    if (!matchesUrl) continue

    let productId: string | undefined
    if (entry.productIdPattern) {
      for (const p of entry.productIdPattern) {
        const m = url.match(p)
        if (m) { productId = m[1]; break }
      }
    }

    let pageType: PageType = productId ? 'product' : 'unknown'
    if (entry.pageTypePatterns) {
      for (const pt of entry.pageTypePatterns) {
        if (pt.patterns.some((p) => p.test(urlLower))) { pageType = pt.type; break }
      }
    }

    return { platform: entry.platform, pageType, productId, confidence: 0.95 }
  }

  // Shopify generic (any site with /products/ path)
  if (/\/products\/[^\/]+/i.test(urlLower)) {
    const m = url.match(/\/products\/([^\/\?#]+)/)
    return { platform: 'shopify', pageType: 'product', productId: m?.[1], confidence: 0.6 }
  }

  // WooCommerce generic
  if (/\/product\/[^\/]+/i.test(urlLower)) {
    const m = url.match(/\/product\/([^\/\?]+)/)
    return { platform: 'woocommerce', pageType: 'product', productId: m?.[1], confidence: 0.5 }
  }

  return { platform: 'unknown', pageType: 'unknown', confidence: 0.1 }
}

export function getSupportedPlatforms(): Platform[] {
  return PLATFORM_REGISTRY.map((p) => p.platform)
}

export function isPlatformSupported(platform: string): platform is Platform {
  return PLATFORM_REGISTRY.some((p) => p.platform === platform) || platform === 'unknown'
}
