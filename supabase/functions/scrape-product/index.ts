/**
 * scrape-product v2 — Full Product Data Engine
 * 
 * Features:
 * - Complete product extraction (title, price, variants, SEO, media)
 * - Reviews extraction with sentiment analysis
 * - Quality scoring
 * - Platform-specific extractors
 * - JWT auth + rate limiting + SSRF protection
 */
import { requireAuth, handlePreflight, errorResponse, successResponse } from '../_shared/jwt-auth.ts'
import { checkRateLimit, rateLimitResponse } from '../_shared/rate-limiter.ts'
import { logConsumption } from '../_shared/consumption.ts'

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

// Platform detection
function detectPlatform(url: string): string {
  const hostname = new URL(url).hostname.toLowerCase();
  const patterns: Record<string, RegExp> = {
    amazon: /amazon\.(com|fr|de|co\.uk|es|it|ca|co\.jp)/,
    aliexpress: /aliexpress\.(com|us|fr)/,
    ebay: /ebay\.(com|fr|de|co\.uk)/,
    temu: /temu\.com/,
    shein: /shein\.(com|fr)/,
    shopify: /myshopify\.com/,
    etsy: /etsy\.com/,
    walmart: /walmart\.com/,
    cjdropshipping: /cjdropshipping\.com/,
    cdiscount: /cdiscount\.com/,
    fnac: /fnac\.com/,
    rakuten: /rakuten\.(com|fr)/,
    banggood: /banggood\.com/,
    dhgate: /dhgate\.com/,
  };
  for (const [platform, pattern] of Object.entries(patterns)) {
    if (pattern.test(hostname)) return platform;
  }
  // Check for Shopify by looking at generic domains later
  return 'generic';
}

Deno.serve(async (req) => {
  const preflight = handlePreflight(req);
  if (preflight) return preflight;

  try {
    const auth = await requireAuth(req);
    
    const rateCheck = await checkRateLimit(auth.userId, 'scrape-product', 30, 60);
    if (!rateCheck.allowed) {
      return rateLimitResponse(auth.corsHeaders, 'Limite de scraping atteinte (30/heure).');
    }

    const body = await req.json();
    const { url, options = {} } = body;
    
    if (!url || typeof url !== 'string') {
      return errorResponse('URL is required', auth.corsHeaders);
    }

    let parsedUrl: URL;
    try { parsedUrl = new URL(url); } catch {
      return errorResponse('Invalid URL format', auth.corsHeaders);
    }

    // SSRF protection
    const hostname = parsedUrl.hostname.toLowerCase();
    if (hostname === 'localhost' || hostname.endsWith('.local') || hostname.includes('169.254')) {
      return errorResponse('URL not allowed', auth.corsHeaders, 403);
    }

    const platform = detectPlatform(url);
    const includeReviews = options.include_reviews !== false;
    const reviewLimit = Math.min(options.review_limit || 50, 200);

    // Create job
    const { data: job, error: jobError } = await auth.supabase
      .from('jobs')
      .insert({
        user_id: auth.userId,
        job_type: 'scraping',
        job_subtype: platform,
        status: 'running',
        name: `Scrape: ${hostname}`,
        started_at: new Date().toISOString(),
        input_data: { source_url: url, platform, options },
        total_items: 1,
        processed_items: 0,
        failed_items: 0,
        progress_percent: 5,
        progress_message: 'Fetching page...',
      })
      .select()
      .single();

    if (jobError) {
      console.error('Job creation error:', jobError);
      return errorResponse('Failed to create job', auth.corsHeaders, 500);
    }

    // Fetch the page
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent': randomUA(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,fr;q=0.8',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    });

    if (!pageResponse.ok) {
      await updateJob(auth.supabase, job.id, 'failed', `HTTP ${pageResponse.status}`);
      return errorResponse(`Failed to fetch: ${pageResponse.status}`, auth.corsHeaders);
    }

    const html = await pageResponse.text();

    // Update progress
    await updateJob(auth.supabase, job.id, 'running', null, 30, 'Extracting product data...');

    // Check if Shopify by inspecting HTML
    const detectedPlatform = platform === 'generic' && html.includes('Shopify.') ? 'shopify' : platform;

    // Extract product data
    const productData = extractFullProduct(html, url, detectedPlatform);

    await updateJob(auth.supabase, job.id, 'running', null, 50, 'Extracting SEO & media...');

    // Extract SEO
    const seoData = extractSeoData(html);

    // Extract variants
    const variants = extractVariants(html, detectedPlatform);

    // Extract reviews if requested
    let reviewsData: any = null;
    if (includeReviews) {
      await updateJob(auth.supabase, job.id, 'running', null, 65, 'Extracting reviews...');
      reviewsData = extractReviews(html, detectedPlatform, reviewLimit);
    }

    await updateJob(auth.supabase, job.id, 'running', null, 80, 'Calculating quality score...');

    // Quality score
    const qualityScore = calculateQualityScore(productData, variants, reviewsData, seoData);

    // Build normalized output
    const normalized = {
      title: productData.title,
      description: productData.description,
      short_description: productData.short_description,
      price: productData.price,
      compare_at_price: productData.compare_at_price,
      currency: productData.currency,
      stock_status: productData.stock_status,
      sku: productData.sku,
      brand: productData.brand,
      supplier: productData.supplier,
      images: productData.images,
      videos: productData.videos,
      category: productData.category,
      sub_category: productData.sub_category,
      breadcrumbs: productData.breadcrumbs,
      tags: productData.tags,
      variants,
      seo: seoData,
      reviews: reviewsData,
      quality_score: qualityScore,
      platform: detectedPlatform,
      source_url: url,
      scraped_at: new Date().toISOString(),
    };

    // Save to imported_products
    const { data: product, error: productError } = await auth.supabase
      .from('imported_products')
      .insert({
        user_id: auth.userId,
        name: normalized.title,
        description: normalized.description,
        price: normalized.price || 0,
        currency: normalized.currency,
        image_urls: normalized.images,
        source_url: url,
        status: 'draft',
        ai_optimized: false,
        scraped_data: normalized,
      })
      .select()
      .single();

    if (productError) {
      await updateJob(auth.supabase, job.id, 'failed', productError.message);
      return errorResponse('Failed to save product', auth.corsHeaders, 500);
    }

    // Complete job
    await updateJob(auth.supabase, job.id, 'completed', null, 100, 'Done', product.id);

    logConsumption(auth.supabase, {
      userId: auth.userId,
      action: 'scraping',
      metadata: { job_id: job.id, source_url: url, platform: detectedPlatform },
    }).catch(() => {});

    return successResponse({
      product,
      normalized,
      job_id: job.id,
      quality_score: qualityScore,
    }, auth.corsHeaders);

  } catch (error) {
    if (error instanceof Response) return error;
    console.error('scrape-product error:', error);
    const origin = req.headers.get('origin');
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts');
    return errorResponse(
      error instanceof Error ? error.message : 'Internal error',
      getSecureCorsHeaders(origin),
      500
    );
  }
});

// ── Job helpers ──────────────────────────────

async function updateJob(
  supabase: any, jobId: string, status: string,
  errorMessage?: string | null, progress?: number, message?: string, productId?: string
) {
  const update: any = { status, updated_at: new Date().toISOString() };
  if (progress !== undefined) update.progress_percent = progress;
  if (message) update.progress_message = message;
  if (errorMessage) {
    update.error_message = errorMessage;
    update.failed_items = 1;
    update.completed_at = new Date().toISOString();
  }
  if (status === 'completed') {
    update.processed_items = 1;
    update.completed_at = new Date().toISOString();
    if (productId) update.output_data = { product_id: productId };
  }
  await supabase.from('jobs').update(update).eq('id', jobId);
}

// ── Full product extraction ──────────────────

function extractFullProduct(html: string, url: string, platform: string) {
  // Try JSON-LD first
  const jsonLd = extractJsonLd(html);

  const title = jsonLd?.name || extractMeta(html, 'og:title') || extractTag(html, 'title') || '';
  const description = jsonLd?.description || extractMeta(html, 'og:description') || extractMeta(html, 'description') || '';
  
  // Price extraction
  let price = 0;
  let compareAtPrice: number | null = null;
  let currency = 'EUR';
  
  if (jsonLd?.offers) {
    const offer = Array.isArray(jsonLd.offers) ? jsonLd.offers[0] : jsonLd.offers;
    price = parseFloat(offer?.price) || 0;
    currency = offer?.priceCurrency || 'EUR';
  }
  if (!price) {
    const priceResult = extractPriceFromHtml(html, platform);
    price = priceResult.price;
    if (priceResult.compareAt) compareAtPrice = priceResult.compareAt;
    if (priceResult.currency) currency = priceResult.currency;
  }

  // Images
  const images = extractAllImages(html, platform, jsonLd);

  // Videos
  const videos = extractVideos(html);

  // Brand
  const brand = jsonLd?.brand?.name || jsonLd?.brand || extractMeta(html, 'product:brand') || '';

  // Stock
  const stockStatus = jsonLd?.offers?.availability?.includes('InStock') ? 'in_stock' : 
    jsonLd?.offers?.availability?.includes('OutOfStock') ? 'out_of_stock' : 'unknown';

  // SKU
  const sku = jsonLd?.sku || jsonLd?.mpn || extractMeta(html, 'product:retailer_item_id') || '';

  // Categories & breadcrumbs
  const breadcrumbs = extractBreadcrumbs(html);
  const category = breadcrumbs.length > 1 ? breadcrumbs[1] : '';
  const subCategory = breadcrumbs.length > 2 ? breadcrumbs[breadcrumbs.length - 1] : '';

  // Tags
  const keywords = extractMeta(html, 'keywords');
  const tags = keywords ? keywords.split(',').map((k: string) => k.trim()).filter(Boolean).slice(0, 20) : [];

  return {
    title: cleanText(title),
    description: cleanText(description),
    short_description: cleanText(description).substring(0, 300),
    price,
    compare_at_price: compareAtPrice,
    currency,
    stock_status: stockStatus,
    sku: sku.toString(),
    brand: cleanText(brand.toString()),
    supplier: new URL(url).hostname.replace('www.', ''),
    images,
    videos,
    category,
    sub_category: subCategory,
    breadcrumbs,
    tags,
  };
}

// ── JSON-LD extraction ──────────────────────

function extractJsonLd(html: string): any {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      if (data['@type'] === 'Product') return data;
      if (Array.isArray(data)) {
        const product = data.find((d: any) => d['@type'] === 'Product');
        if (product) return product;
      }
      if (data['@graph']) {
        const product = data['@graph'].find((d: any) => d['@type'] === 'Product');
        if (product) return product;
      }
    } catch { /* skip */ }
  }
  return null;
}

// ── SEO extraction ──────────────────────────

function extractSeoData(html: string) {
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h2Matches = [...html.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)];
  
  return {
    meta_title: extractMeta(html, 'og:title') || extractTag(html, 'title') || '',
    meta_description: extractMeta(html, 'description') || '',
    canonical: extractCanonical(html),
    h1: h1Match ? cleanText(h1Match[1]) : '',
    h2s: h2Matches.slice(0, 5).map(m => cleanText(m[1])),
    keywords: (extractMeta(html, 'keywords') || '').split(',').map((k: string) => k.trim()).filter(Boolean),
  };
}

// ── Variant extraction ──────────────────────

function extractVariants(html: string, platform: string): any[] {
  const variants: any[] = [];

  // Try Shopify JSON
  if (platform === 'shopify') {
    const shopifyMatch = html.match(/var\s+meta\s*=\s*(\{[\s\S]*?\});/);
    if (shopifyMatch) {
      try {
        const meta = JSON.parse(shopifyMatch[1]);
        if (meta.product?.variants) {
          return meta.product.variants.map((v: any) => ({
            id: v.id?.toString(),
            title: v.name || v.title || '',
            price: v.price ? v.price / 100 : 0,
            sku: v.sku || '',
            available: v.available !== false,
            options: v.options || {},
          }));
        }
      } catch { /* skip */ }
    }

    // Also try product JSON
    const productJsonMatch = html.match(/product:\s*(\{[\s\S]*?\})\s*[,;]/);
    if (productJsonMatch) {
      try {
        const prod = JSON.parse(productJsonMatch[1]);
        if (prod.variants) {
          return prod.variants.map((v: any) => ({
            id: v.id?.toString(),
            title: v.title || '',
            price: typeof v.price === 'number' ? v.price / 100 : parseFloat(v.price) || 0,
            sku: v.sku || '',
            available: v.available !== false,
            image: v.featured_image?.src || null,
          }));
        }
      } catch { /* skip */ }
    }
  }

  // Try JSON-LD offers
  const jsonLd = extractJsonLd(html);
  if (jsonLd?.offers && Array.isArray(jsonLd.offers) && jsonLd.offers.length > 1) {
    return jsonLd.offers.map((offer: any, i: number) => ({
      id: offer.sku || `variant-${i}`,
      title: offer.name || `Variante ${i + 1}`,
      price: parseFloat(offer.price) || 0,
      sku: offer.sku || '',
      available: offer.availability?.includes('InStock') !== false,
    }));
  }

  return variants;
}

// ── Reviews extraction ──────────────────────

function extractReviews(html: string, platform: string, limit: number) {
  const jsonLd = extractJsonLd(html);
  
  // Aggregate rating from JSON-LD
  let rating = 0;
  let reviewCount = 0;
  if (jsonLd?.aggregateRating) {
    rating = parseFloat(jsonLd.aggregateRating.ratingValue) || 0;
    reviewCount = parseInt(jsonLd.aggregateRating.reviewCount || jsonLd.aggregateRating.ratingCount) || 0;
  }

  // Extract individual reviews from JSON-LD
  const reviews: any[] = [];
  if (jsonLd?.review && Array.isArray(jsonLd.review)) {
    for (const r of jsonLd.review.slice(0, limit)) {
      reviews.push({
        author: r.author?.name || r.author || 'Anonymous',
        rating: parseFloat(r.reviewRating?.ratingValue) || 0,
        title: r.name || '',
        content: r.reviewBody || r.description || '',
        date: r.datePublished || '',
        verified: false,
        images: [],
        videos: [],
        variant: '',
      });
    }
  }

  // Extract from HTML with platform-specific selectors
  if (reviews.length === 0) {
    const htmlReviews = extractReviewsFromHtml(html, platform, limit);
    reviews.push(...htmlReviews);
  }

  // Calculate distribution
  const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  for (const review of reviews) {
    const r = Math.round(review.rating);
    if (r >= 1 && r <= 5) distribution[r]++;
  }

  // If no individual reviews but we have rating, estimate distribution
  if (reviews.length === 0 && rating > 0 && reviewCount > 0) {
    const estimated = estimateDistribution(rating, reviewCount);
    Object.assign(distribution, estimated);
  }

  // Sentiment analysis
  const sentiment = analyzeSentiment(reviews);

  // Keyword extraction
  const keywords = extractReviewKeywords(reviews);

  return {
    average_rating: rating || (reviews.length > 0 ? reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length : 0),
    total_count: reviewCount || reviews.length,
    distribution,
    reviews: reviews.slice(0, limit),
    sentiment,
    keywords,
    confidence: reviews.length > 0 ? 'high' : (rating > 0 ? 'medium' : 'low'),
  };
}

function extractReviewsFromHtml(html: string, platform: string, limit: number): any[] {
  const reviews: any[] = [];
  
  // Platform-specific review patterns
  const patterns: Record<string, { item: RegExp; content: RegExp; rating: RegExp }> = {
    amazon: {
      item: /data-hook="review"[\s\S]*?<\/div>\s*<\/div>\s*<\/div>/gi,
      content: /data-hook="review-body"[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i,
      rating: /(\d(?:\.\d)?)\s*out\s*of\s*5/i,
    },
    aliexpress: {
      item: /feedback-item[\s\S]*?(?=feedback-item|$)/gi,
      content: /feedback-content[^>]*>([\s\S]*?)<\/div>/i,
      rating: /star-view[^>]*width:\s*(\d+)%/i,
    },
  };

  // Generic review extraction via HTML patterns
  const reviewItemRegex = /class="[^"]*review[^"]*"[^>]*>([\s\S]*?)(?=class="[^"]*review[^"]*"|$)/gi;
  let match;
  let count = 0;
  
  while ((match = reviewItemRegex.exec(html)) !== null && count < limit) {
    const block = match[1];
    const ratingMatch = block.match(/(\d(?:\.\d)?)\s*(?:out of|\/)\s*5/i) || 
                        block.match(/star.*?(\d)/i);
    const contentMatch = block.match(/review-(?:text|body|content)[^>]*>[\s\S]*?<(?:span|p|div)[^>]*>([\s\S]*?)<\/(?:span|p|div)>/i);
    
    if (contentMatch || ratingMatch) {
      reviews.push({
        author: extractFromBlock(block, /(?:author|user|name)[^>]*>([^<]+)</i) || 'Anonymous',
        rating: ratingMatch ? parseFloat(ratingMatch[1]) : 0,
        title: extractFromBlock(block, /review-title[^>]*>[\s\S]*?<span[^>]*>([^<]+)<\/span>/i) || '',
        content: contentMatch ? cleanText(contentMatch[1]) : '',
        date: extractFromBlock(block, /(?:date|time)[^>]*>([^<]+)</i) || '',
        verified: /verified|achat vérifié/i.test(block),
        images: extractImagesFromBlock(block),
        videos: [],
        variant: extractFromBlock(block, /(?:variant|color|size|taille|couleur)[^>]*>([^<]+)</i) || '',
      });
      count++;
    }
  }

  return reviews;
}

function extractFromBlock(block: string, regex: RegExp): string {
  const match = block.match(regex);
  return match ? cleanText(match[1]) : '';
}

function extractImagesFromBlock(block: string): string[] {
  const imgs: string[] = [];
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let m;
  while ((m = regex.exec(block)) !== null) {
    if (m[1].startsWith('http') && !m[1].includes('avatar') && !m[1].includes('icon')) {
      imgs.push(m[1]);
    }
  }
  return imgs.slice(0, 5);
}

function estimateDistribution(avg: number, total: number): Record<number, number> {
  // Bell curve estimation around the average
  const dist: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const weights: Record<number, number> = {};
  let totalWeight = 0;
  for (let i = 1; i <= 5; i++) {
    weights[i] = Math.exp(-Math.pow(i - avg, 2) / 1.5);
    totalWeight += weights[i];
  }
  for (let i = 1; i <= 5; i++) {
    dist[i] = Math.round((weights[i] / totalWeight) * total);
  }
  return dist;
}

function analyzeSentiment(reviews: any[]): { positive: number; neutral: number; negative: number } {
  if (reviews.length === 0) return { positive: 0, neutral: 0, negative: 0 };
  
  let positive = 0, neutral = 0, negative = 0;
  const positiveWords = /excellent|great|amazing|perfect|love|best|fantastic|wonderful|awesome|recommend|happy|pleased|quality|beautiful/i;
  const negativeWords = /terrible|awful|worst|broken|fake|scam|cheap|poor|bad|disappointing|waste|refund|return|damaged|horrible/i;

  for (const review of reviews) {
    const text = `${review.title} ${review.content}`.toLowerCase();
    const rating = review.rating || 0;
    
    if (rating >= 4 || positiveWords.test(text)) positive++;
    else if (rating <= 2 || negativeWords.test(text)) negative++;
    else neutral++;
  }

  return { positive, neutral, negative };
}

function extractReviewKeywords(reviews: any[]): string[] {
  const wordCount: Record<string, number> = {};
  const stopWords = new Set(['the', 'a', 'an', 'is', 'it', 'was', 'and', 'or', 'but', 'for', 'not', 'this', 'that', 'with', 'have', 'has', 'had', 'are', 'be', 'been', 'to', 'of', 'in', 'on', 'at', 'i', 'my', 'me', 'very', 'so', 'just', 'le', 'la', 'les', 'de', 'du', 'des', 'un', 'une', 'et', 'est', 'en', 'ce', 'que', 'qui', 'dans', 'pour', 'pas', 'ne', 'se', 'sur', 'au', 'avec', 'il', 'je', 'son', 'sa', 'ses', 'mais', 'ou', 'par']);

  for (const review of reviews) {
    const text = `${review.title} ${review.content}`.toLowerCase();
    const words = text.split(/\W+/).filter(w => w.length > 3 && !stopWords.has(w));
    for (const word of words) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
  }

  return Object.entries(wordCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([word]) => word);
}

// ── Quality score ──────────────────────────

function calculateQualityScore(
  product: any, variants: any[], reviews: any, seo: any
): { score: number; breakdown: Record<string, number>; grade: string } {
  const breakdown: Record<string, number> = {};

  // Title (15 pts)
  breakdown.title = product.title ? Math.min(15, Math.floor(product.title.length / 5) + 5) : 0;

  // Description (15 pts)
  breakdown.description = product.description ? Math.min(15, Math.floor(product.description.length / 50) + 3) : 0;

  // Images (20 pts)
  const imgCount = product.images?.length || 0;
  breakdown.images = Math.min(20, imgCount * 4);

  // Price (10 pts)
  breakdown.price = product.price > 0 ? 10 : 0;

  // Variants (10 pts)
  breakdown.variants = Math.min(10, (variants?.length || 0) * 2);

  // Reviews (15 pts)
  if (reviews) {
    breakdown.reviews = reviews.total_count > 0 ? Math.min(15, Math.floor(Math.log10(reviews.total_count + 1) * 5) + 5) : 0;
  } else {
    breakdown.reviews = 0;
  }

  // SEO (10 pts)
  let seoScore = 0;
  if (seo?.meta_title) seoScore += 3;
  if (seo?.meta_description) seoScore += 3;
  if (seo?.h1) seoScore += 2;
  if (seo?.keywords?.length > 0) seoScore += 2;
  breakdown.seo = seoScore;

  // Brand/SKU (5 pts)
  breakdown.metadata = (product.brand ? 3 : 0) + (product.sku ? 2 : 0);

  const score = Object.values(breakdown).reduce((s, v) => s + v, 0);
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : score >= 30 ? 'D' : 'F';

  return { score, breakdown, grade };
}

// ── Utility helpers ──────────────────────────

function extractMeta(html: string, name: string): string {
  const regex = new RegExp(
    `<meta[^>]*(?:property|name)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'
  );
  const match = html.match(regex);
  return match ? match[1] : '';
}

function extractTag(html: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, 'i');
  const match = html.match(regex);
  return match ? match[1].trim() : '';
}

function extractCanonical(html: string): string {
  const match = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i);
  return match ? match[1] : '';
}

function extractPriceFromHtml(html: string, platform: string): { price: number; compareAt: number | null; currency: string } {
  let price = 0;
  let compareAt: number | null = null;
  let currency = 'EUR';

  // Platform-specific patterns
  const pricePatterns = [
    /€\s*(\d+[,.]?\d*)/,
    /(\d+[,.]?\d*)\s*€/,
    /\$\s*(\d+[.,]?\d*)/,
    /(\d+[.,]?\d*)\s*\$/,
    /£\s*(\d+[.,]?\d*)/,
    /price["']?\s*[:=]\s*["']?(\d+\.?\d*)/i,
    /data-price=["'](\d+\.?\d*)/i,
  ];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      price = parseFloat(match[1].replace(',', '.'));
      if (match[0].includes('$')) currency = 'USD';
      else if (match[0].includes('£')) currency = 'GBP';
      if (!isNaN(price) && price > 0) break;
    }
  }

  // Try to find compare-at price
  const compareMatch = html.match(/(?:was|original|compare|regular|ancien)[^>]*?(\d+[,.]?\d*)\s*[€$£]/i);
  if (compareMatch) {
    compareAt = parseFloat(compareMatch[1].replace(',', '.'));
  }

  return { price, compareAt, currency };
}

function extractAllImages(html: string, platform: string, jsonLd: any): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  const addImage = (url: string) => {
    if (url && url.startsWith('http') && !seen.has(url) && !url.includes('logo') && 
        !url.includes('icon') && !url.includes('avatar') && !url.includes('pixel') &&
        !url.includes('1x1') && !url.includes('spacer')) {
      seen.add(url);
      images.push(url);
    }
  };

  // JSON-LD images
  if (jsonLd?.image) {
    const imgs = Array.isArray(jsonLd.image) ? jsonLd.image : [jsonLd.image];
    imgs.forEach((img: any) => addImage(typeof img === 'string' ? img : img?.url));
  }

  // OG image
  const ogImage = extractMeta(html, 'og:image');
  if (ogImage) addImage(ogImage);

  // Product images from HTML
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null && images.length < 20) {
    const src = match[1];
    // Filter for product images (larger ones)
    const isLargeImage = /\d{3,4}x\d{3,4}|large|zoom|main|product/i.test(match[0]);
    if (isLargeImage || images.length < 5) {
      addImage(src);
    }
  }

  return images.slice(0, 15);
}

function extractVideos(html: string): string[] {
  const videos: string[] = [];
  const videoRegex = /<(?:video|source)[^>]+src=["']([^"']+)["']/gi;
  let match;
  while ((match = videoRegex.exec(html)) !== null && videos.length < 5) {
    if (match[1].startsWith('http')) videos.push(match[1]);
  }
  return videos;
}

function extractBreadcrumbs(html: string): string[] {
  // Try JSON-LD BreadcrumbList
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;
  while ((match = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      const breadcrumb = data['@type'] === 'BreadcrumbList' ? data :
        data['@graph']?.find?.((d: any) => d['@type'] === 'BreadcrumbList');
      if (breadcrumb?.itemListElement) {
        return breadcrumb.itemListElement
          .sort((a: any, b: any) => (a.position || 0) - (b.position || 0))
          .map((item: any) => item.name || item.item?.name || '');
      }
    } catch { /* skip */ }
  }

  // HTML breadcrumbs
  const bcMatch = html.match(/(?:breadcrumb|fil-ariane|nav-breadcrumb)[^>]*>([\s\S]*?)<\/(?:nav|ol|ul|div)>/i);
  if (bcMatch) {
    const items = [...bcMatch[1].matchAll(/<(?:a|li|span)[^>]*>([^<]+)<\/(?:a|li|span)>/gi)];
    return items.map(m => cleanText(m[1])).filter(Boolean);
  }

  return [];
}

function cleanText(text: string): string {
  return text
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
