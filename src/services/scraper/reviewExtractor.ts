/**
 * Review Extraction Engine
 * Client-side analysis and enrichment of reviews
 */
import type { ProductReview, ReviewDistribution } from './types'
import { analyzeSentiment, extractTopKeywords, calculateReviewDistribution } from './normalizer'

export interface ReviewAnalysis {
  distribution: ReviewDistribution
  topKeywords: Array<{ word: string; count: number; sentiment: string }>
  commonIssues: string[]
  qualityIndicators: {
    hasVerifiedPurchases: boolean
    hasImages: boolean
    averageContentLength: number
    reviewRecency: string | null
  }
}

/**
 * Analyze extracted reviews to produce insights
 */
export function analyzeReviews(reviews: ProductReview[]): ReviewAnalysis {
  if (!reviews.length) {
    return {
      distribution: { distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }, averageRating: 0, totalReviews: 0 },
      topKeywords: [],
      commonIssues: [],
      qualityIndicators: {
        hasVerifiedPurchases: false,
        hasImages: false,
        averageContentLength: 0,
        reviewRecency: null,
      },
    }
  }

  // Enrich reviews with sentiment
  const enrichedReviews = reviews.map((r) => ({
    ...r,
    sentiment: r.sentiment || analyzeSentiment(r.content),
  }))

  const distribution = calculateReviewDistribution(enrichedReviews)
  const topKeywords = extractTopKeywords(enrichedReviews)

  // Detect common issues from negative reviews
  const negativeReviews = enrichedReviews.filter((r) => r.sentiment === 'negative' || (r.rating && r.rating <= 2))
  const commonIssues = detectCommonIssues(negativeReviews)

  // Quality indicators
  const hasVerifiedPurchases = enrichedReviews.some((r) => r.verified)
  const hasImages = enrichedReviews.some((r) => (r.images?.length ?? 0) > 0)
  const avgLen = enrichedReviews.reduce((sum, r) => sum + r.content.length, 0) / enrichedReviews.length

  const dates = enrichedReviews.map((r) => r.date).filter(Boolean).sort().reverse()
  const reviewRecency = dates[0] || null

  return {
    distribution,
    topKeywords,
    commonIssues,
    qualityIndicators: {
      hasVerifiedPurchases,
      hasImages,
      averageContentLength: Math.round(avgLen),
      reviewRecency,
    },
  }
}

function detectCommonIssues(negativeReviews: ProductReview[]): string[] {
  const issuePatterns: Array<{ pattern: RegExp; label: string }> = [
    { pattern: /quality|qualité|cheap|fragile|broken|cassé/i, label: 'Problème de qualité' },
    { pattern: /shipping|livraison|delivery|délai|slow|lent/i, label: 'Problème de livraison' },
    { pattern: /size|taille|fit|ajustement|petit|grand/i, label: 'Problème de taille' },
    { pattern: /color|couleur|different|différent|photo|image/i, label: 'Ne correspond pas aux photos' },
    { pattern: /smell|odeur|toxic|toxique/i, label: 'Odeur ou matériaux' },
    { pattern: /refund|remboursement|return|retour/i, label: 'Demande de retour fréquente' },
    { pattern: /battery|batterie|charge/i, label: 'Problème de batterie' },
    { pattern: /instruction|manual|notice/i, label: 'Instructions manquantes' },
  ]

  const issues: string[] = []
  for (const { pattern, label } of issuePatterns) {
    const matchCount = negativeReviews.filter((r) => pattern.test(r.content)).length
    if (matchCount >= 2 || (negativeReviews.length <= 5 && matchCount >= 1)) {
      issues.push(label)
    }
  }
  return issues.slice(0, 5)
}

/**
 * Calculate review trust score (0-100)
 */
export function calculateReviewTrustScore(reviews: ProductReview[]): number {
  if (!reviews.length) return 0

  let score = 50 // base

  // Verified purchases boost
  const verifiedRatio = reviews.filter((r) => r.verified).length / reviews.length
  score += verifiedRatio * 20

  // Content quality (length variety)
  const avgLen = reviews.reduce((s, r) => s + r.content.length, 0) / reviews.length
  if (avgLen > 50) score += 5
  if (avgLen > 100) score += 5

  // Rating distribution (not all 5 stars = more trustworthy)
  const ratings = reviews.map((r) => r.rating || 3)
  const stdDev = Math.sqrt(ratings.reduce((s, r) => s + Math.pow(r - (ratings.reduce((a, b) => a + b, 0) / ratings.length), 2), 0) / ratings.length)
  if (stdDev > 0.5) score += 10

  // Has images
  if (reviews.some((r) => (r.images?.length ?? 0) > 0)) score += 5

  // Volume
  if (reviews.length >= 10) score += 5

  return Math.min(100, Math.round(score))
}
