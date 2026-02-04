/**
 * Import Reviews Handler v1.0
 * 
 * Async headless reviews extraction with quota enforcement.
 * 
 * Flow:
 * 1. Create job → return job_id immediately
 * 2. Background: Scrape reviews via headless
 * 3. Store in product_reviews table
 * 4. Update job status (completed|reviews_unavailable|error)
 */

import { z } from "zod"
import { GatewayContext, HandlerResult } from '../types.ts'
import { HeadlessScraper } from '../lib/headless-scraper.ts'

// =============================================================================
// SCHEMAS
// =============================================================================

const ImportReviewsPayload = z.object({
  product_id: z.string().uuid(),
  source_url: z.string().url().max(2000),
  limit: z.number().int().min(1).max(100).optional().default(50),
  platform: z.enum(['amazon', 'aliexpress', 'temu', 'shein', 'ebay', 'wish', 'alibaba', 'other']).optional(),
})

const ReviewJobStatusPayload = z.object({
  job_id: z.string().uuid(),
})

// =============================================================================
// PLAN LIMITS
// =============================================================================

const PLAN_REVIEW_LIMITS: Record<string, number> = {
  free: 0,
  starter: 0,
  pro: 50,
  ultra_pro: 200,
  enterprise: 500,
}

// =============================================================================
// MAIN HANDLER
// =============================================================================

export async function handleImportReviews(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = ImportReviewsPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Invalid reviews import payload',
        details: { issues: parsed.error.issues }
      }
    }
  }

  const { product_id, source_url, limit, platform } = parsed.data
  const userPlan = ctx.userPlan || 'free'

  // Check plan quota
  const maxReviews = PLAN_REVIEW_LIMITS[userPlan] || 0
  if (maxReviews === 0) {
    return {
      success: false,
      error: {
        code: 'QUOTA_EXCEEDED',
        message: 'L\'import d\'avis n\'est pas disponible avec votre plan. Passez à Pro pour débloquer cette fonctionnalité.',
        details: {
          plan: userPlan,
          upgrade_required: true
        }
      }
    }
  }

  // Verify product ownership
  const { data: product, error: productError } = await ctx.supabase
    .from('products')
    .select('id, title, source_url')
    .eq('id', product_id)
    .eq('user_id', ctx.userId)
    .single()

  if (productError || !product) {
    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Produit non trouvé ou non autorisé'
      }
    }
  }

  // Check existing reviews count for this product
  const { count: existingCount } = await ctx.supabase
    .from('product_reviews')
    .select('id', { count: 'exact', head: true })
    .eq('product_id', product_id)
    .eq('user_id', ctx.userId)

  const remainingSlots = Math.max(0, maxReviews - (existingCount || 0))
  const effectiveLimit = Math.min(limit, remainingSlots)

  if (effectiveLimit === 0) {
    return {
      success: false,
      error: {
        code: 'QUOTA_EXCEEDED',
        message: `Limite atteinte: ${existingCount} avis sur ${maxReviews} autorisés.`,
        details: {
          current_count: existingCount,
          max_allowed: maxReviews,
          plan: userPlan
        }
      }
    }
  }

  // Create import job
  const { data: job, error: jobError } = await ctx.supabase
    .from('review_import_jobs')
    .insert({
      user_id: ctx.userId,
      product_id,
      source_url,
      platform: platform || detectPlatform(source_url),
      status: 'pending',
      limit_requested: effectiveLimit,
    })
    .select('id, status')
    .single()

  if (jobError || !job) {
    console.error('[ImportReviews] Job creation error:', jobError)
    return {
      success: false,
      error: {
        code: 'HANDLER_ERROR',
        message: 'Impossible de créer le job d\'import'
      }
    }
  }

  // Start async processing (fire and forget)
  processReviewsAsync(job.id, product_id, source_url, effectiveLimit, ctx).catch(err => {
    console.error('[ImportReviews] Async processing error:', err)
  })

  return {
    success: true,
    data: {
      job_id: job.id,
      status: 'pending',
      message: 'Import des avis en cours...',
      limit: effectiveLimit,
      quota: {
        plan: userPlan,
        current: existingCount || 0,
        max: maxReviews,
        remaining: remainingSlots
      }
    }
  }
}

// =============================================================================
// ASYNC PROCESSOR
// =============================================================================

async function processReviewsAsync(
  jobId: string,
  productId: string,
  sourceUrl: string,
  limit: number,
  ctx: GatewayContext
): Promise<void> {
  const startTime = Date.now()

  try {
    // Update job status to scraping
    await ctx.supabase
      .from('review_import_jobs')
      .update({ status: 'scraping', progress_percent: 10 })
      .eq('id', jobId)

    // Initialize headless scraper
    const scraper = new HeadlessScraper(ctx)
    
    // Render the page
    const renderResult = await scraper.render(sourceUrl, {
      scrollToBottom: true,
      waitMs: 4000,
    })

    if (!renderResult.success) {
      await updateJobError(ctx, jobId, 'SCRAPE_FAILED', renderResult.error || 'Page rendering failed')
      return
    }

    await ctx.supabase
      .from('review_import_jobs')
      .update({ status: 'scraping', progress_percent: 40 })
      .eq('id', jobId)

    // Extract reviews
    const reviewsResult = await extractDetailedReviews(scraper, sourceUrl, limit)

    if (!reviewsResult.success || reviewsResult.reviews.length === 0) {
      await ctx.supabase
        .from('review_import_jobs')
        .update({
          status: 'reviews_unavailable',
          error_code: 'REVIEWS_UNAVAILABLE',
          error_message: 'Aucun avis trouvé ou les avis ne sont pas accessibles sur cette page.',
          completed_at: new Date().toISOString(),
        })
        .eq('id', jobId)
      return
    }

    await ctx.supabase
      .from('review_import_jobs')
      .update({ 
        status: 'processing', 
        progress_percent: 70,
        reviews_found: reviewsResult.reviews.length 
      })
      .eq('id', jobId)

    // Insert reviews into database
    const reviewsToInsert = reviewsResult.reviews.slice(0, limit).map((review, idx) => ({
      user_id: ctx.userId,
      product_id: productId,
      rating: normalizeRating(review.rating),
      text: sanitizeText(review.text || review.content || ''),
      author: sanitizeText(review.author || 'Anonymous'),
      review_date: parseReviewDate(review.date),
      country: review.country || null,
      helpful_count: review.helpfulCount || 0,
      verified_purchase: review.verified || false,
      images: (review.images || []).slice(0, 5),
      source_url: sourceUrl,
      source_platform: detectPlatform(sourceUrl),
      external_id: `${productId}-${idx}-${hashString(review.text || '')}`,
    }))

    const { data: insertedReviews, error: insertError } = await ctx.supabase
      .from('product_reviews')
      .upsert(reviewsToInsert, { 
        onConflict: 'user_id,product_id,external_id',
        ignoreDuplicates: false 
      })
      .select('id')

    if (insertError) {
      console.error('[ImportReviews] Insert error:', insertError)
      await updateJobError(ctx, jobId, 'INSERT_FAILED', insertError.message)
      return
    }

    const importedCount = insertedReviews?.length || 0

    // Update product with review stats
    const avgRating = reviewsToInsert.reduce((acc, r) => acc + r.rating, 0) / reviewsToInsert.length
    await ctx.supabase
      .from('products')
      .update({
        reviews_count: importedCount,
        rating: Math.round(avgRating * 10) / 10,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)

    // Complete job
    await ctx.supabase
      .from('review_import_jobs')
      .update({
        status: 'completed',
        progress_percent: 100,
        reviews_imported: importedCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    console.log(`[ImportReviews] Completed: ${importedCount} reviews imported in ${Date.now() - startTime}ms`)

  } catch (error) {
    console.error('[ImportReviews] Processing error:', error)
    await updateJobError(ctx, jobId, 'PROCESSING_ERROR', error.message || 'Unknown error')
  }
}

// =============================================================================
// REVIEW EXTRACTION
// =============================================================================

interface ExtractedReview {
  rating: number
  text?: string
  content?: string
  author?: string
  date?: string
  country?: string
  helpfulCount?: number
  verified?: boolean
  images?: string[]
}

async function extractDetailedReviews(
  scraper: HeadlessScraper,
  url: string,
  limit: number
): Promise<{ success: boolean; reviews: ExtractedReview[] }> {
  const reviews: ExtractedReview[] = []
  const platform = detectPlatform(url)

  try {
    // Get basic review data from scraper
    const basicReviews = scraper.extractReviews()
    
    // Try to extract individual reviews from HTML
    const html = (scraper as any).currentHtml || ''
    
    // Platform-specific extraction
    switch (platform) {
      case 'amazon':
        reviews.push(...extractAmazonReviews(html, limit))
        break
      case 'aliexpress':
        reviews.push(...extractAliExpressReviews(html, limit))
        break
      case 'temu':
        reviews.push(...extractTemuReviews(html, limit))
        break
      default:
        reviews.push(...extractGenericReviews(html, limit))
    }

    // Fallback: try JSON data in page
    if (reviews.length === 0) {
      reviews.push(...extractReviewsFromJson(html, limit))
    }

    return { success: reviews.length > 0, reviews }
  } catch (error) {
    console.error('[ExtractReviews] Error:', error)
    return { success: false, reviews: [] }
  }
}

function extractAmazonReviews(html: string, limit: number): ExtractedReview[] {
  const reviews: ExtractedReview[] = []
  
  // Pattern for Amazon review blocks
  const reviewPatterns = [
    /<div[^>]*data-hook="review"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi,
    /<div[^>]*class="[^"]*review[^"]*"[^>]*>([\s\S]*?)<span[^>]*data-hook="review-body"[^>]*>([\s\S]*?)<\/span>/gi,
  ]

  for (const pattern of reviewPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      if (reviews.length >= limit) break
      
      const block = match[0]
      
      // Extract rating
      const ratingMatch = block.match(/(\d(?:\.\d)?)\s*(?:out of|sur)\s*5|class="[^"]*a-star-(\d)[^"]*"/i)
      const rating = ratingMatch ? parseFloat(ratingMatch[1] || ratingMatch[2]) : 0
      
      // Extract text
      const textMatch = block.match(/<span[^>]*data-hook="review-body"[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i)
      const text = textMatch ? cleanHtml(textMatch[1]) : ''
      
      // Extract author
      const authorMatch = block.match(/class="[^"]*a-profile-name[^"]*"[^>]*>([^<]+)/i)
      const author = authorMatch ? cleanHtml(authorMatch[1]) : 'Amazon Customer'
      
      // Extract date
      const dateMatch = block.match(/Reviewed[^<]*on\s*([^<]+)|le\s*(\d{1,2}\s+\w+\s+\d{4})/i)
      const date = dateMatch ? (dateMatch[1] || dateMatch[2]) : undefined
      
      // Extract verified
      const verified = /verified\s*purchase|achat\s*vérifié/i.test(block)
      
      if (rating > 0 && (text || author !== 'Amazon Customer')) {
        reviews.push({ rating, text, author, date, verified })
      }
    }
  }

  return reviews
}

function extractAliExpressReviews(html: string, limit: number): ExtractedReview[] {
  const reviews: ExtractedReview[] = []
  
  // Try JSON data first
  const jsonMatch = html.match(/"feedbackList"\s*:\s*(\[[^\]]+\])/i)
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1])
      for (const item of data.slice(0, limit)) {
        reviews.push({
          rating: item.buyerEval || item.star || 5,
          text: item.buyerFeedback || item.content || '',
          author: item.buyerName || item.anonymous ? 'Anonymous' : item.buyerName,
          country: item.buyerCountry || item.countryCode,
          date: item.evalDate,
          images: item.images || [],
        })
      }
    } catch {}
  }

  // DOM fallback
  if (reviews.length === 0) {
    const reviewBlocks = html.matchAll(/<div[^>]*class="[^"]*feedback-item[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi)
    for (const match of reviewBlocks) {
      if (reviews.length >= limit) break
      
      const block = match[0]
      const ratingMatch = block.match(/(\d)\s*star|star-(\d)/i)
      const textMatch = block.match(/<span[^>]*class="[^"]*buyer-feedback[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
      
      reviews.push({
        rating: ratingMatch ? parseInt(ratingMatch[1] || ratingMatch[2]) : 5,
        text: textMatch ? cleanHtml(textMatch[1]) : '',
      })
    }
  }

  return reviews
}

function extractTemuReviews(html: string, limit: number): ExtractedReview[] {
  const reviews: ExtractedReview[] = []
  
  // Temu uses JSON data in script tags
  const jsonMatch = html.match(/"reviewList"\s*:\s*(\[[^\]]+\])/i) || 
                    html.match(/"reviews"\s*:\s*(\[[^\]]+\])/i)
  
  if (jsonMatch) {
    try {
      const data = JSON.parse(jsonMatch[1])
      for (const item of data.slice(0, limit)) {
        reviews.push({
          rating: item.rating || item.star || 5,
          text: item.content || item.comment || '',
          author: item.userName || item.nickname || 'User',
          country: item.country,
          date: item.createTime || item.date,
          images: item.images || item.pics || [],
          verified: true, // Temu shows only verified
        })
      }
    } catch {}
  }

  return reviews
}

function extractGenericReviews(html: string, limit: number): ExtractedReview[] {
  const reviews: ExtractedReview[] = []
  
  // Generic patterns
  const patterns = [
    /<div[^>]*(?:class|id)="[^"]*review[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
    /<article[^>]*(?:class|id)="[^"]*review[^"]*"[^>]*>([\s\S]*?)<\/article>/gi,
  ]

  for (const pattern of patterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      if (reviews.length >= limit) break
      
      const block = match[0]
      
      // Extract rating (various patterns)
      const ratingMatch = block.match(/(\d(?:\.\d)?)\s*(?:\/|out of|sur)\s*5|rating[:\s]*(\d)/i)
      const rating = ratingMatch ? parseFloat(ratingMatch[1] || ratingMatch[2]) : 0
      
      // Extract text
      const textMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i) ||
                        block.match(/<div[^>]*class="[^"]*(?:content|text|body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
      const text = textMatch ? cleanHtml(textMatch[1]) : ''
      
      if (rating > 0 || text.length > 20) {
        reviews.push({ rating: rating || 5, text })
      }
    }
  }

  return reviews
}

function extractReviewsFromJson(html: string, limit: number): ExtractedReview[] {
  const reviews: ExtractedReview[] = []
  
  // Try common JSON patterns
  const jsonPatterns = [
    /"reviews"\s*:\s*(\[[^\]]*\])/gi,
    /"reviewData"\s*:\s*(\[[^\]]*\])/gi,
    /"customerReviews"\s*:\s*(\[[^\]]*\])/gi,
  ]

  for (const pattern of jsonPatterns) {
    const matches = html.matchAll(pattern)
    for (const match of matches) {
      try {
        const data = JSON.parse(match[1])
        if (Array.isArray(data)) {
          for (const item of data.slice(0, limit - reviews.length)) {
            reviews.push({
              rating: item.rating || item.score || item.stars || 5,
              text: item.text || item.content || item.body || item.comment || '',
              author: item.author || item.name || item.reviewer || 'Anonymous',
              date: item.date || item.createdAt || item.timestamp,
            })
          }
        }
      } catch {}
    }
  }

  return reviews
}

// =============================================================================
// JOB STATUS HANDLER
// =============================================================================

export async function handleReviewJobStatus(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = ReviewJobStatusPayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: { code: 'INVALID_PAYLOAD', message: 'Job ID invalide' }
    }
  }

  const { data: job, error } = await ctx.supabase
    .from('review_import_jobs')
    .select('*')
    .eq('id', parsed.data.job_id)
    .eq('user_id', ctx.userId)
    .single()

  if (error || !job) {
    return {
      success: false,
      error: { code: 'NOT_FOUND', message: 'Job non trouvé' }
    }
  }

  // If completed, also return imported reviews
  let reviews = null
  if (job.status === 'completed' && job.reviews_imported > 0) {
    const { data } = await ctx.supabase
      .from('product_reviews')
      .select('id, rating, text, author, review_date, country, verified_purchase')
      .eq('product_id', job.product_id)
      .eq('user_id', ctx.userId)
      .order('created_at', { ascending: false })
      .limit(job.reviews_imported)

    reviews = data
  }

  return {
    success: true,
    data: {
      job_id: job.id,
      product_id: job.product_id,
      status: job.status,
      progress_percent: job.progress_percent,
      reviews_found: job.reviews_found,
      reviews_imported: job.reviews_imported,
      error_code: job.error_code,
      error_message: job.error_message,
      created_at: job.created_at,
      completed_at: job.completed_at,
      reviews,
    }
  }
}

// =============================================================================
// HELPERS
// =============================================================================

async function updateJobError(
  ctx: GatewayContext,
  jobId: string,
  errorCode: string,
  errorMessage: string
): Promise<void> {
  await ctx.supabase
    .from('review_import_jobs')
    .update({
      status: 'error',
      error_code: errorCode,
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
}

function detectPlatform(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase()
  if (hostname.includes('amazon')) return 'amazon'
  if (hostname.includes('aliexpress')) return 'aliexpress'
  if (hostname.includes('temu')) return 'temu'
  if (hostname.includes('shein')) return 'shein'
  if (hostname.includes('ebay')) return 'ebay'
  if (hostname.includes('wish')) return 'wish'
  return 'other'
}

function normalizeRating(rating: number | string | undefined): number {
  const num = typeof rating === 'string' ? parseFloat(rating) : (rating || 5)
  return Math.max(1, Math.min(5, Math.round(num)))
}

function sanitizeText(text: string): string {
  return text
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 5000)
}

function cleanHtml(html: string): string {
  return sanitizeText(html)
}

function parseReviewDate(dateStr?: string): string | null {
  if (!dateStr) return null
  
  try {
    const date = new Date(dateStr)
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }
  } catch {}
  
  return null
}

function hashString(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}
