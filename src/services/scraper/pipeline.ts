/**
 * Scraping Pipeline — Orchestrates the full extraction flow
 * URL → Detect Platform → Scrape via Edge Function → Normalize → Enrich → Return
 */
import { supabase } from '@/integrations/supabase/client'
import { detectPlatform } from './platformDetectors'
import { normalizeProduct, calculateQualityScore, calculateReviewDistribution } from './normalizer'
import { analyzeReviews, calculateReviewTrustScore } from './reviewExtractor'
import type { NormalizedProduct, ScrapeOptions, ScrapeJob, ScrapeStatus, Platform } from './types'

export type ProgressCallback = (status: ScrapeStatus, progress: number, message: string) => void

/**
 * Full scrape pipeline: detect → scrape → normalize → analyze
 */
export async function scrapeProduct(
  url: string,
  options: ScrapeOptions = {},
  onProgress?: ProgressCallback
): Promise<NormalizedProduct> {
  // Step 1: Detect platform
  onProgress?.('pending', 5, 'Détection de la plateforme...')
  const detection = detectPlatform(url)

  // Step 2: Scrape via Edge Function
  onProgress?.('scraping', 15, `Extraction depuis ${detection.platform}...`)
  const { data, error } = await supabase.functions.invoke('quick-import-url', {
    body: {
      url,
      action: 'preview',
      price_multiplier: options.priceMultiplier ?? 1.5,
      extract_reviews: options.extractReviews ?? true,
      extract_variants: options.extractVariants ?? true,
    },
  })

  if (error) throw new Error(error.message || 'Erreur de scraping')
  if (!data?.success) throw new Error(data?.error || 'Extraction échouée')

  onProgress?.('extracting', 50, 'Traitement des données...')

  // Step 3: Normalize
  onProgress?.('normalizing', 65, 'Normalisation...')
  const rawProduct = data.data || data
  const normalized = normalizeProduct(rawProduct, detection.platform, url)

  // Step 4: Enrich with client-side analysis
  onProgress?.('enriching', 80, 'Analyse des avis...')
  if (normalized.reviews?.length) {
    const reviewAnalysis = analyzeReviews(normalized.reviews)
    normalized.reviewDistribution = {
      ...reviewAnalysis.distribution,
      topKeywords: reviewAnalysis.topKeywords,
      commonIssues: reviewAnalysis.commonIssues,
    }

    // Add sentiment to individual reviews
    for (const review of normalized.reviews) {
      if (!review.sentiment) {
        const { analyzeSentiment } = await import('./normalizer')
        review.sentiment = analyzeSentiment(review.content)
      }
    }
  }

  // Step 5: Quality score
  onProgress?.('enriching', 90, 'Calcul du score qualité...')
  normalized.qualityScore = calculateQualityScore(rawProduct, detection.platform)

  onProgress?.('success', 100, 'Extraction terminée')
  return normalized
}

/**
 * Import product: scrape + save to database
 */
export async function importProduct(
  url: string,
  overrideData?: Record<string, unknown>,
  onProgress?: ProgressCallback
): Promise<{ success: boolean; productId?: string }> {
  onProgress?.('scraping', 20, 'Import en cours...')

  const { data, error } = await supabase.functions.invoke('quick-import-url', {
    body: { url, action: 'import', override_data: overrideData },
  })

  if (error) throw new Error(error.message || 'Erreur d\'import')

  onProgress?.('success', 100, 'Produit importé')
  return { success: true, productId: data?.data?.id }
}

/**
 * Bulk scrape: scrape multiple URLs
 */
export async function bulkScrape(
  urls: string[],
  options: ScrapeOptions = {},
  onProgress?: (completed: number, total: number, current: string) => void
): Promise<Array<{ url: string; result?: NormalizedProduct; error?: string }>> {
  const results: Array<{ url: string; result?: NormalizedProduct; error?: string }> = []

  // Process in batches of 3 for concurrency
  const batchSize = 3
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize)
    const batchResults = await Promise.allSettled(
      batch.map((url) => scrapeProduct(url, options))
    )

    for (let j = 0; j < batch.length; j++) {
      const result = batchResults[j]
      if (result.status === 'fulfilled') {
        results.push({ url: batch[j], result: result.value })
      } else {
        results.push({ url: batch[j], error: result.reason?.message || 'Erreur' })
      }
      onProgress?.(results.length, urls.length, batch[j])
    }
  }

  return results
}

/**
 * Deduplicate products by title similarity
 */
export function deduplicateProducts(products: NormalizedProduct[]): NormalizedProduct[] {
  const seen = new Map<string, NormalizedProduct>()

  for (const p of products) {
    const key = normalizeTitle(p.title)
    const existing = seen.get(key)
    if (!existing || (p.qualityScore?.score ?? 0) > (existing.qualityScore?.score ?? 0)) {
      seen.set(key, p)
    }
  }

  return Array.from(seen.values())
}

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 50)
}
