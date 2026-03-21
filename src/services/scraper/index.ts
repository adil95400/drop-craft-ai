/**
 * Product Data Engine — Public API
 */

// Types
export type {
  Platform,
  PageType,
  ScrapeStatus,
  NormalizedProduct,
  ProductVariant,
  ProductReview,
  ReviewDistribution,
  SeoData,
  ShippingData,
  SellerData,
  QualityScore,
  ScrapeJob,
  ScrapeOptions,
  PlatformDetectionResult,
  ExtractionResult,
} from './types'

// Platform Detection
export { detectPlatform, getSupportedPlatforms, isPlatformSupported } from './platformDetectors'

// Normalizer
export {
  normalizeProduct,
  calculateQualityScore,
  calculateReviewDistribution,
  analyzeSentiment,
  extractTopKeywords,
} from './normalizer'

// Review Engine
export { analyzeReviews, calculateReviewTrustScore } from './reviewExtractor'
export type { ReviewAnalysis } from './reviewExtractor'

// Pipeline
export { scrapeProduct, importProduct, bulkScrape, deduplicateProducts } from './pipeline'
