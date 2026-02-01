/**
 * Unified Import - Secure Edge Function
 * P0.4 FIX: Replaced CORS * with restrictive allowlist
 * Already uses authenticateUser for P0.5 compliance
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateUser } from '../_shared/secure-auth.ts'
import { secureBatchInsert } from '../_shared/db-helpers.ts'
import { getSecureCorsHeaders, handleCorsPreflightSecure } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  console.log('Unified Import Function called:', req.method)

  // Handle CORS preflight with secure headers
  const preflightResponse = handleCorsPreflightSecure(req);
  if (preflightResponse) return preflightResponse;

  const origin = req.headers.get('origin');
  const corsHeaders = getSecureCorsHeaders(origin);

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { user } = await authenticateUser(req, supabase)
    
    const url = new URL(req.url)
    const endpoint = url.pathname.split('/').pop()
    const body = await req.json()

    console.log('Processing import endpoint:', endpoint, 'for user:', user.id.slice(0, 8))

    switch (endpoint) {
      case 'csv':
        return await handleCSVImport(supabase, body, user.id, corsHeaders)
      
      case 'xml-json':
        return await handleXMLJSONImport(supabase, body, user.id, corsHeaders)
      
      case 'url':
        return await handleURLImport(supabase, body, user.id, corsHeaders)
      
      case 'ftp':
        return await handleFTPImport(supabase, body, user.id, corsHeaders)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown import endpoint' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in unified import:', error)
    
    // Don't expose internal errors
    const isAuthError = error instanceof Error && error.message.includes('Authorization')
    return new Response(
      JSON.stringify({ 
        error: isAuthError ? error.message : 'Import failed',
      }),
      { status: isAuthError ? 401 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleCSVImport(supabase: any, body: any, userId: string, corsHeaders: Record<string, string>) {
  const { products } = body
  
  if (!products || !Array.isArray(products)) {
    throw new Error('Invalid products data')
  }

  // Rate limit: max 1000 products per import
  const limitedProducts = products.slice(0, 1000)
  console.log(`Importing ${limitedProducts.length} products from CSV`)

  const validProducts = limitedProducts.map(p => ({
    name: String(p.name || 'Sans nom').slice(0, 500),
    description: String(p.description || '').slice(0, 10000),
    price: Math.max(0, parseFloat(p.price) || 0),
    cost_price: Math.max(0, parseFloat(p.cost_price) || 0),
    sku: String(p.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`).slice(0, 100),
    category: String(p.category || 'Autre').slice(0, 200),
    stock_quantity: Math.max(0, parseInt(p.stock_quantity) || 0),
    status: p.status === 'active' || p.status === 'draft' ? p.status : 'active',
    image_url: p.image_url || null,
    user_id: userId // Always from auth
  }))

  const result = await secureBatchInsert(supabase, 'products', validProducts, userId)

  return new Response(
    JSON.stringify({
      success: true,
      message: 'CSV import completed',
      data: {
        recordsProcessed: products.length,
        recordsImported: result.length,
        timestamp: new Date().toISOString()
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleXMLJSONImport(supabase: any, body: any, userId: string, corsHeaders: Record<string, string>) {
  const { format, data: importData } = body
  
  console.log(`Processing ${format} import`)

  let products = []
  
  if (format === 'json') {
    products = Array.isArray(importData) ? importData : [importData]
  } else if (format === 'xml') {
    throw new Error('XML parsing not yet implemented')
  }

  const limitedProducts = products.slice(0, 1000)

  const validProducts = limitedProducts.map(p => ({
    name: String(p.name || p.title || 'Sans nom').slice(0, 500),
    description: String(p.description || '').slice(0, 10000),
    price: Math.max(0, parseFloat(p.price) || 0),
    sku: String(p.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`).slice(0, 100),
    category: String(p.category || 'Autre').slice(0, 200),
    stock_quantity: Math.max(0, parseInt(p.stock || p.quantity) || 0),
    status: 'active',
    user_id: userId
  }))

  const result = await secureBatchInsert(supabase, 'products', validProducts, userId)

  return new Response(
    JSON.stringify({
      success: true,
      message: `${format.toUpperCase()} import completed`,
      data: {
        format,
        recordsProcessed: products.length,
        recordsImported: result.length,
        timestamp: new Date().toISOString()
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleURLImport(supabase: any, body: any, userId: string, corsHeaders: Record<string, string>) {
  const { url } = body
  
  if (!url || typeof url !== 'string') {
    throw new Error('Valid URL is required')
  }

  // Basic URL validation
  try {
    const parsedUrl = new URL(url)
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      throw new Error('Only HTTP/HTTPS URLs allowed')
    }
  } catch {
    throw new Error('Invalid URL format')
  }

  console.log(`Importing from URL for user ${userId.slice(0, 8)}`)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'ShopOpti-Import/1.0' }
    })
    clearTimeout(timeout)

    if (!response.ok) {
      throw new Error(`Failed to fetch data from URL: ${response.status}`)
    }

    const data = await response.json()
    const products = Array.isArray(data) ? data : [data]
    const limitedProducts = products.slice(0, 500)

    const validProducts = limitedProducts.map(p => ({
      name: String(p.name || p.title || 'Sans nom').slice(0, 500),
      description: String(p.description || '').slice(0, 10000),
      price: Math.max(0, parseFloat(p.price) || 0),
      sku: String(p.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`).slice(0, 100),
      category: String(p.category || 'Autre').slice(0, 200),
      stock_quantity: Math.max(0, parseInt(p.stock || p.quantity) || 0),
      status: 'active',
      user_id: userId
    }))

    const result = await secureBatchInsert(supabase, 'products', validProducts, userId)

    return new Response(
      JSON.stringify({
        success: true,
        message: 'URL import completed',
        data: {
          recordsProcessed: products.length,
          recordsImported: result.length,
          timestamp: new Date().toISOString()
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    clearTimeout(timeout)
    throw error
  }
}

async function handleFTPImport(supabase: any, body: any, userId: string, corsHeaders: Record<string, string>) {
  throw new Error('FTP import not yet implemented - use CSV or URL import instead')
}
