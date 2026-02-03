/**
 * Scrape Handler
 * Handles SCRAPE_URL action for product analysis
 */

import { z } from "zod"
import { GatewayContext, HandlerResult } from '../types.ts'

// =============================================================================
// SCHEMAS
// =============================================================================

const ScrapePayload = z.object({
  url: z.string().url().max(2000),
  extractImages: z.boolean().optional().default(true),
  extractReviews: z.boolean().optional().default(false),
})

// =============================================================================
// PLATFORM DETECTION
// =============================================================================

function detectPlatform(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase()
  
  const platformPatterns: Record<string, string[]> = {
    'aliexpress': ['aliexpress.com', 'aliexpress.ru', 'aliexpress.us'],
    'amazon': ['amazon.com', 'amazon.fr', 'amazon.de', 'amazon.co.uk', 'amazon.es', 'amazon.it'],
    'ebay': ['ebay.com', 'ebay.fr', 'ebay.de', 'ebay.co.uk'],
    'wish': ['wish.com'],
    'alibaba': ['alibaba.com', '1688.com'],
    'temu': ['temu.com'],
    'shein': ['shein.com', 'shein.fr'],
    'banggood': ['banggood.com'],
    'gearbest': ['gearbest.com'],
    'dhgate': ['dhgate.com'],
  }

  for (const [platform, domains] of Object.entries(platformPatterns)) {
    if (domains.some(domain => hostname.includes(domain))) {
      return platform
    }
  }

  return 'unknown'
}

// =============================================================================
// HANDLER
// =============================================================================

async function handleScrapeUrl(
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  const parsed = ScrapePayload.safeParse(payload)
  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: 'INVALID_PAYLOAD',
        message: 'Invalid scrape payload',
        details: { issues: parsed.error.issues }
      }
    }
  }

  const { url, extractImages, extractReviews } = parsed.data
  const platform = detectPlatform(url)

  try {
    // Log the scrape attempt
    await ctx.supabase.from('extension_action_logs').insert({
      user_id: ctx.userId,
      action_type: 'SCRAPE_URL',
      action_status: 'pending',
      platform,
      product_url: url,
      metadata: {
        extractImages,
        extractReviews,
        hostname: new URL(url).hostname,
      },
      extension_version: ctx.extensionVersion,
    }).catch(() => {})

    // For now, return a placeholder response
    // The actual scraping is done by the extension's content scripts
    // This endpoint is used for logging and future server-side scraping
    return {
      success: true,
      data: {
        url,
        platform,
        supported: platform !== 'unknown',
        message: platform !== 'unknown' 
          ? `URL analyzed. Platform: ${platform}. Use extension content scripts for extraction.`
          : 'Unknown platform. Manual extraction may be required.',
        extractors: {
          images: extractImages,
          reviews: extractReviews,
        },
      }
    }
  } catch (error) {
    return {
      success: false,
      error: { code: 'HANDLER_ERROR', message: error.message }
    }
  }
}

// =============================================================================
// ROUTER
// =============================================================================

export async function handleScrapeAction(
  action: string,
  payload: Record<string, unknown>,
  ctx: GatewayContext
): Promise<HandlerResult> {
  switch (action) {
    case 'SCRAPE_URL':
      return handleScrapeUrl(payload, ctx)
    default:
      return {
        success: false,
        error: { code: 'UNKNOWN_ACTION', message: `Unknown scrape action: ${action}` }
      }
  }
}
