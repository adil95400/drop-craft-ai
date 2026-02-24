/**
 * Competitor Analysis API - ENTERPRISE SECURED v2.0
 * P0.1 Fix: JWT authentication required, userId from JWT only
 * P0.4 Fix: Restricted CORS origins
 * P0.5 Fix: Strict SSRF protection, no userId in body
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'
import { authenticateUser } from '../_shared/secure-auth.ts'
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from '../_shared/rate-limit.ts'
import { handleError, ValidationError, AuthenticationError } from '../_shared/error-handler.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

// Strict CORS allowlist
const ALLOWED_ORIGINS = [
  'https://shopopti.io',
  'https://www.shopopti.io',
  'https://app.shopopti.io',
  'https://drop-craft-ai.lovable.app',
]

const LOVABLE_PREVIEW_PATTERN = /^https:\/\/[a-z0-9-]+--[a-f0-9-]+\.lovable\.app$/

function isAllowedOrigin(origin: string): boolean {
  if (ALLOWED_ORIGINS.includes(origin)) return true
  if (LOVABLE_PREVIEW_PATTERN.test(origin)) return true
  return false
}

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') || ''
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Max-Age': '86400',
  }
  if (origin && isAllowedOrigin(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
    headers['Access-Control-Allow-Credentials'] = 'true'
  }
  return headers
}

// ==========================================
// SSRF PROTECTION - STRICT IMPLEMENTATION
// ==========================================

/**
 * Check if IP is private/internal (IPv4)
 */
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return false // Invalid IP format
  }
  const [a, b, c, d] = parts

  // Loopback (127.0.0.0/8)
  if (a === 127) return true
  // Private Class A (10.0.0.0/8)
  if (a === 10) return true
  // Private Class B (172.16.0.0/12)
  if (a === 172 && b >= 16 && b <= 31) return true
  // Private Class C (192.168.0.0/16)
  if (a === 192 && b === 168) return true
  // Link-local (169.254.0.0/16)
  if (a === 169 && b === 254) return true
  // CGNAT (100.64.0.0/10)
  if (a === 100 && b >= 64 && b <= 127) return true
  // Broadcast (255.255.255.255)
  if (a === 255 && b === 255 && c === 255 && d === 255) return true
  // Current network (0.0.0.0/8)
  if (a === 0) return true
  // TEST-NET-1 (192.0.2.0/24)
  if (a === 192 && b === 0 && c === 2) return true
  // TEST-NET-2 (198.51.100.0/24)
  if (a === 198 && b === 51 && c === 100) return true
  // TEST-NET-3 (203.0.113.0/24)
  if (a === 203 && b === 0 && c === 113) return true
  // Multicast (224.0.0.0/4)
  if (a >= 224 && a <= 239) return true
  // Reserved (240.0.0.0/4)
  if (a >= 240) return true

  return false
}

/**
 * Check if hostname is forbidden (internal/dangerous)
 */
function isForbiddenHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase()

  // Explicit localhost variants
  if (lower === 'localhost' || lower === 'localhost.localdomain') return true

  // Local domains
  if (lower.endsWith('.local') || lower.endsWith('.localhost')) return true
  if (lower.endsWith('.internal') || lower.endsWith('.intranet')) return true

  // Cloud metadata endpoints (AWS, GCP, Azure, etc.)
  if (lower === '169.254.169.254') return true
  if (lower === 'metadata.google.internal') return true
  if (lower.includes('metadata')) return true

  // Kubernetes/Docker internal
  if (lower.endsWith('.cluster.local') || lower.endsWith('.svc')) return true
  if (lower.startsWith('kubernetes') || lower.startsWith('docker')) return true

  // IPv6 localhost
  if (lower === '::1' || lower === '[::1]') return true

  // Check for IP literal that might be private
  if (isPrivateIPv4(lower)) return true

  // Check for userinfo in host (potential bypass)
  if (lower.includes('@')) return true

  return false
}

/**
 * Validate and sanitize competitor URL with strict SSRF protection
 */
function validateCompetitorUrl(rawUrl: string): URL {
  // Basic length check
  if (typeof rawUrl !== 'string' || rawUrl.length < 8 || rawUrl.length > 2048) {
    throw new ValidationError('Invalid URL length')
  }

  // Parse URL
  let url: URL
  try {
    url = new URL(rawUrl.trim())
  } catch {
    throw new ValidationError('Invalid URL format')
  }

  // Protocol check - ONLY http/https
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new ValidationError('URL must use http or https protocol')
  }

  // Get hostname
  const hostname = url.hostname.toLowerCase()

  // Hostname validation
  if (!hostname || hostname.length < 3) {
    throw new ValidationError('Invalid hostname')
  }

  // SSRF protection - check forbidden hostnames
  if (isForbiddenHostname(hostname)) {
    throw new ValidationError('Access to this host is forbidden')
  }

  // Check for numeric IP (could be trying to bypass)
  if (/^[\d.]+$/.test(hostname) && isPrivateIPv4(hostname)) {
    throw new ValidationError('Private IP addresses not allowed')
  }

  // Port check - only standard ports
  if (url.port && !['80', '443', ''].includes(url.port)) {
    throw new ValidationError('Non-standard ports not allowed')
  }

  // Check for dangerous patterns in URL
  if (url.username || url.password) {
    throw new ValidationError('Credentials in URL not allowed')
  }

  return url
}

/**
 * Safe fetch with timeout, size limit, and redirect protection
 */
async function safeFetchHtml(url: URL): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10_000) // 10s timeout

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      redirect: 'manual', // Don't follow redirects automatically
      signal: controller.signal,
      headers: {
        'User-Agent': 'ShopOptiCompetitorBot/1.0 (+https://shopopti.io/bot)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
    })

    // Handle redirects manually with SSRF check
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location')
      if (!location) {
        throw new ValidationError('Redirect without location header')
      }

      // Validate redirect target
      const redirectUrl = validateCompetitorUrl(new URL(location, url).toString())

      // Fetch redirect with same protections (one redirect max)
      const redirectResponse = await fetch(redirectUrl.toString(), {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'ShopOptiCompetitorBot/1.0 (+https://shopopti.io/bot)',
          'Accept': 'text/html,application/xhtml+xml',
        },
      })

      if (!redirectResponse.ok) {
        throw new ValidationError(`Redirect target returned status ${redirectResponse.status}`)
      }

      const contentType = (redirectResponse.headers.get('content-type') || '').toLowerCase()
      if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
        throw new ValidationError('Response is not HTML content')
      }

      const buffer = await redirectResponse.arrayBuffer()
      if (buffer.byteLength > 2_000_000) { // 2MB limit
        throw new ValidationError('Response too large (max 2MB)')
      }

      return new TextDecoder().decode(buffer)
    }

    if (!response.ok) {
      throw new ValidationError(`Failed to fetch URL: HTTP ${response.status}`)
    }

    // Validate content type
    const contentType = (response.headers.get('content-type') || '').toLowerCase()
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
      throw new ValidationError('Response is not HTML content')
    }

    // Read with size limit
    const buffer = await response.arrayBuffer()
    if (buffer.byteLength > 2_000_000) { // 2MB limit
      throw new ValidationError('Response too large (max 2MB)')
    }

    return new TextDecoder().decode(buffer)

  } finally {
    clearTimeout(timeout)
  }
}

// ==========================================
// HTML ANALYSIS FUNCTIONS
// ==========================================

function extractMetaTag(html: string, property: string): string | null {
  const regex = new RegExp(`<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i')
  const match = html.match(regex)
  return match ? match[1].slice(0, 500) : null // Limit length
}

function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i)
  return match ? match[1].trim().slice(0, 200) : ''
}

function countProducts(html: string): number {
  const indicators = [
    /<article/gi,
    /class="product/gi,
    /data-product-id/gi,
    /itemtype="[^"]*Product"/gi
  ]
  let maxCount = 0
  for (const pattern of indicators) {
    const matches = html.match(pattern)
    if (matches) maxCount = Math.max(maxCount, matches.length)
  }
  return Math.min(maxCount, 1000) // Cap at 1000
}

function extractPrices(html: string): number[] {
  const prices: number[] = []
  const patterns = [
    /€\s*(\d+[,.]?\d*)/g,
    /(\d+[,.]?\d*)\s*€/g,
    /\$\s*(\d+[.,]?\d*)/g,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(html)) !== null && prices.length < 50) {
      const price = parseFloat(match[1].replace(',', '.'))
      if (!isNaN(price) && price > 0 && price < 100000) {
        prices.push(price)
      }
    }
  }

  return prices
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req)

  // CORS preflight
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('Origin')
    if (!origin || !isAllowedOrigin(origin)) {
      return new Response(null, { status: 403 })
    }
    return new Response(null, { headers: corsHeaders })
  }

  // Only POST allowed
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Use ANON_KEY + user JWT for RLS enforcement
  const authHeader = req.headers.get('Authorization') || ''
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  })

  try {
    // 1) Authentication required
    const { user } = await authenticateUser(req, supabase)
    const userId = user.id

    // 2) Rate limiting (strict for scraping)
    const rateLimitResult = await checkRateLimit(
      supabase,
      userId,
      'analyze_competitor',
      RATE_LIMITS.ANALYZE_COMPETITOR
    )

    if (!rateLimitResult.allowed) {
      return createRateLimitResponse(rateLimitResult, corsHeaders)
    }

    // 3) Parse and validate input
    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      throw new ValidationError('Invalid JSON body')
    }

    // P0.5 CRITICAL: Reject any userId in body
    if ('userId' in body || 'user_id' in body) {
      await supabase.from('security_events').insert({
        user_id: userId,
        event_type: 'security_violation_attempt',
        severity: 'critical',
        description: 'Attempt to pass userId in analyze-competitor body',
        metadata: { blocked: true }
      })
      throw new ValidationError('Do not send userId in request body')
    }

    const urlRaw = body.url
    const competitorName = body.competitorName

    // Validate URL
    if (typeof urlRaw !== 'string' || urlRaw.length < 8) {
      throw new ValidationError('Valid URL required')
    }

    // Validate competitor name
    if (typeof competitorName !== 'string' || competitorName.length < 1 || competitorName.length > 100) {
      throw new ValidationError('Competitor name required (max 100 chars)')
    }

    const sanitizedName = competitorName.trim().slice(0, 100)

    // 4) SSRF-safe URL validation
    const url = validateCompetitorUrl(urlRaw)

    console.log(`[analyze-competitor] User ${userId} analyzing: ${url.hostname}`)

    // 5) Safe fetch with protections
    const html = await safeFetchHtml(url)

    // 6) Analyze content
    const title = extractTitle(html)
    const description = extractMetaTag(html, 'description') || extractMetaTag(html, 'og:description') || ''
    const productCount = countProducts(html)
    const prices = extractPrices(html)

    const avgPrice = prices.length > 0
      ? prices.reduce((a, b) => a + b, 0) / prices.length
      : 0
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0

    // SEO analysis
    const hasH1 = /<h1/i.test(html)
    const hasStructuredData = /application\/ld\+json/i.test(html)
    const metaKeywords = extractMetaTag(html, 'keywords')
    const ogImage = extractMetaTag(html, 'og:image')

    const competitiveData = {
      url: url.toString(),
      title,
      description: description.slice(0, 500),
      productCount,
      priceAnalysis: {
        averagePrice: avgPrice.toFixed(2),
        minPrice: minPrice.toFixed(2),
        maxPrice: maxPrice.toFixed(2),
        priceRange: `${minPrice.toFixed(2)} - ${maxPrice.toFixed(2)} €`,
        sampleSize: prices.length
      },
      seoAnalysis: {
        hasH1,
        hasStructuredData,
        hasMetaKeywords: !!metaKeywords,
        hasOgImage: !!ogImage,
        titleLength: title.length,
        descriptionLength: description.length
      },
      analyzedAt: new Date().toISOString()
    }

    // Market position scoring
    const seoScore = (
      (hasH1 ? 25 : 0) +
      (hasStructuredData ? 25 : 0) +
      (metaKeywords ? 15 : 0) +
      (ogImage ? 15 : 0) +
      (title.length > 30 && title.length < 60 ? 10 : 0) +
      (description.length > 120 && description.length < 160 ? 10 : 0)
    )

    const marketPosition = {
      priceCompetitiveness: avgPrice > 0 ? Math.min(100, Math.round((50 / avgPrice) * 100)) : 50,
      seoScore,
      productRange: productCount > 100 ? 'large' : productCount > 50 ? 'medium' : 'small'
    }

    // Threat level
    let threatLevel = 'low'
    if (seoScore > 70 && productCount > 100) threatLevel = 'high'
    else if (seoScore > 50 || productCount > 50) threatLevel = 'medium'

    // Gap opportunities
    const gapOpportunities: Array<{type: string; opportunity: string; impact: string; recommendation: string}> = []

    if (!hasStructuredData) {
      gapOpportunities.push({
        type: 'seo',
        opportunity: 'Données structurées manquantes',
        impact: 'high',
        recommendation: 'Implémentez Schema.org pour améliorer votre référencement'
      })
    }
    if (avgPrice > 50) {
      gapOpportunities.push({
        type: 'pricing',
        opportunity: 'Prix moyens élevés',
        impact: 'medium',
        recommendation: 'Opportunité de proposer des prix plus compétitifs'
      })
    }
    if (productCount < 50) {
      gapOpportunities.push({
        type: 'catalog',
        opportunity: 'Catalogue limité',
        impact: 'medium',
        recommendation: 'Élargissez votre catalogue pour gagner des parts de marché'
      })
    }

    // 7) Save to database with user_id scoping
    const { data: intelligence, error: dbError } = await supabase
      .from('competitive_intelligence')
      .insert({
        user_id: userId, // ALWAYS from JWT
        competitor_name: sanitizedName,
        competitive_data: competitiveData,
        price_analysis: competitiveData.priceAnalysis,
        market_position: marketPosition,
        threat_level: threatLevel,
        gap_opportunities: gapOpportunities
      })
      .select()
      .single()

    if (dbError) {
      console.error('[analyze-competitor] DB error:', dbError)
      throw new Error('Failed to save analysis')
    }

    console.log(`[analyze-competitor] Analysis saved: ${intelligence.id}`)

    return new Response(
      JSON.stringify({
        success: true,
        intelligence,
        summary: {
          competitorName: sanitizedName,
          url: url.toString(),
          productCount,
          avgPrice: avgPrice.toFixed(2),
          seoScore,
          threatLevel,
          opportunities: gapOpportunities.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return handleError(error, corsHeaders)
  }
})
