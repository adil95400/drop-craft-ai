import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TranslationRequest {
  texts: string[]
  sourceLang: string
  targetLang: string
  context?: 'product' | 'description' | 'review' | 'general'
}

interface CacheEntry {
  translation: string
  cachedAt: string
}

// Simple in-memory cache (per function invocation)
const memoryCache = new Map<string, CacheEntry>()

// Rate limiting state
const rateLimitState = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT_MAX = 100 // requests per window
const RATE_LIMIT_WINDOW = 60000 // 1 minute

function getCacheKey(text: string, sourceLang: string, targetLang: string): string {
  // Create a hash-like key for caching
  const content = `${sourceLang}:${targetLang}:${text.toLowerCase().trim()}`
  return btoa(unescape(encodeURIComponent(content))).substring(0, 64)
}

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const state = rateLimitState.get(userId)
  
  if (!state || now > state.resetAt) {
    rateLimitState.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW })
    return true
  }
  
  if (state.count >= RATE_LIMIT_MAX) {
    return false
  }
  
  state.count++
  return true
}

async function translateWithLibreTranslate(
  text: string, 
  sourceLang: string, 
  targetLang: string
): Promise<string> {
  const libreTranslateUrl = Deno.env.get('LIBRETRANSLATE_URL') || 'http://localhost:5000'
  const apiKey = Deno.env.get('LIBRETRANSLATE_API_KEY') || ''
  
  const body: Record<string, string> = {
    q: text,
    source: sourceLang === 'auto' ? 'auto' : sourceLang,
    target: targetLang,
    format: 'text'
  }
  
  if (apiKey) {
    body.api_key = apiKey
  }
  
  const response = await fetch(`${libreTranslateUrl}/translate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  
  if (!response.ok) {
    const errorText = await response.text()
    console.error('LibreTranslate error:', response.status, errorText)
    throw new Error(`LibreTranslate error: ${response.status}`)
  }
  
  const result = await response.json()
  return result.translatedText
}

async function translateBatch(
  texts: string[], 
  sourceLang: string, 
  targetLang: string,
  supabase: any
): Promise<{ translations: string[]; cached: number; translated: number }> {
  const translations: string[] = []
  let cachedCount = 0
  let translatedCount = 0
  
  for (const text of texts) {
    if (!text || text.trim() === '') {
      translations.push('')
      continue
    }
    
    const cacheKey = getCacheKey(text, sourceLang, targetLang)
    
    // Check memory cache first
    const memoryCached = memoryCache.get(cacheKey)
    if (memoryCached) {
      translations.push(memoryCached.translation)
      cachedCount++
      continue
    }
    
    // Check database cache
    const { data: dbCache } = await supabase
      .from('translation_cache')
      .select('translated_text')
      .eq('cache_key', cacheKey)
      .single()
    
    if (dbCache) {
      translations.push(dbCache.translated_text)
      memoryCache.set(cacheKey, { 
        translation: dbCache.translated_text, 
        cachedAt: new Date().toISOString() 
      })
      cachedCount++
      continue
    }
    
    // Translate via LibreTranslate
    try {
      const translated = await translateWithLibreTranslate(text, sourceLang, targetLang)
      translations.push(translated)
      translatedCount++
      
      // Save to memory cache
      memoryCache.set(cacheKey, { 
        translation: translated, 
        cachedAt: new Date().toISOString() 
      })
      
      // Save to database cache (async, don't wait)
      supabase
        .from('translation_cache')
        .insert({
          cache_key: cacheKey,
          source_lang: sourceLang,
          target_lang: targetLang,
          original_text: text.substring(0, 5000), // Limit stored text
          translated_text: translated,
          char_count: text.length
        })
        .then(() => console.log('Cached translation'))
        .catch((err: Error) => console.error('Cache insert error:', err.message))
      
    } catch (error) {
      console.error('Translation failed for text:', text.substring(0, 100), error)
      // Return original text on failure
      translations.push(text)
    }
    
    // Small delay between requests to avoid overwhelming LibreTranslate
    if (texts.indexOf(text) < texts.length - 1) {
      await new Promise(r => setTimeout(r, 50))
    }
  }
  
  return { translations, cached: cachedCount, translated: translatedCount }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    let userId = 'anonymous'
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const { data: { user } } = await supabaseClient.auth.getUser(token)
      if (user) {
        userId = user.id
      }
    }

    // Rate limiting check
    if (!checkRateLimit(userId)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Rate limit exceeded. Please wait before making more requests.' 
        }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { texts, sourceLang, targetLang, context }: TranslationRequest = await req.json()

    // Validate input
    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'texts array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!targetLang) {
      return new Response(
        JSON.stringify({ success: false, error: 'targetLang is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Limit batch size
    const maxBatchSize = 50
    if (texts.length > maxBatchSize) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Batch size exceeds maximum of ${maxBatchSize}. Please split your request.` 
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const startTime = Date.now()
    
    const result = await translateBatch(
      texts, 
      sourceLang || 'auto', 
      targetLang, 
      supabaseClient
    )
    
    const processingTime = Date.now() - startTime

    // Log usage
    await supabaseClient
      .from('translation_usage')
      .insert({
        user_id: userId !== 'anonymous' ? userId : null,
        source_lang: sourceLang || 'auto',
        target_lang: targetLang,
        text_count: texts.length,
        char_count: texts.reduce((sum, t) => sum + (t?.length || 0), 0),
        cached_count: result.cached,
        translated_count: result.translated,
        processing_time_ms: processingTime,
        context: context || 'general'
      })
      .catch((err: Error) => console.error('Usage logging error:', err.message))

    return new Response(
      JSON.stringify({
        success: true,
        translations: result.translations,
        stats: {
          total: texts.length,
          cached: result.cached,
          translated: result.translated,
          processingTimeMs: processingTime
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('LibreTranslate Proxy Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
