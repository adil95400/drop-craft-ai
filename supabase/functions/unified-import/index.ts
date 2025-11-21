import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { authenticateUser } from '../_shared/secure-auth.ts'
import { secureBatchInsert } from '../_shared/db-helpers.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  console.log('Unified Import Function called:', req.method, req.url)

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey)
    const { user } = await authenticateUser(req, supabase)
    
    const url = new URL(req.url)
    const endpoint = url.pathname.split('/').pop()
    const body = await req.json()

    console.log('Processing import endpoint:', endpoint, 'for user:', user.id)

    switch (endpoint) {
      case 'csv':
        return await handleCSVImport(supabase, body, user.id)
      
      case 'xml-json':
        return await handleXMLJSONImport(supabase, body, user.id)
      
      case 'url':
        return await handleURLImport(supabase, body, user.id)
      
      case 'ftp':
        return await handleFTPImport(supabase, body, user.id)
      
      default:
        return new Response(
          JSON.stringify({ error: 'Unknown import endpoint' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
  } catch (error) {
    console.error('Error in unified import:', error)
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function handleCSVImport(supabase: any, body: any, userId: string) {
  const { products } = body
  
  if (!products || !Array.isArray(products)) {
    throw new Error('Invalid products data')
  }

  console.log(`Importing ${products.length} products from CSV for user ${userId}`)

  const validProducts = products.map(p => ({
    name: p.name || 'Sans nom',
    description: p.description || '',
    price: parseFloat(p.price) || 0,
    cost_price: parseFloat(p.cost_price) || 0,
    sku: p.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    category: p.category || 'Autre',
    stock_quantity: parseInt(p.stock_quantity) || 0,
    status: p.status || 'active',
    image_url: p.image_url || null,
    user_id: userId
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

async function handleXMLJSONImport(supabase: any, body: any, userId: string) {
  const { format, data: importData } = body
  
  console.log(`Processing ${format} import for user ${userId}`)

  let products = []
  
  if (format === 'json') {
    products = Array.isArray(importData) ? importData : [importData]
  } else if (format === 'xml') {
    // Parse XML to JSON (simplified - would need proper XML parser)
    throw new Error('XML parsing not yet implemented')
  }

  const validProducts = products.map(p => ({
    name: p.name || p.title || 'Sans nom',
    description: p.description || '',
    price: parseFloat(p.price) || 0,
    sku: p.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    category: p.category || 'Autre',
    stock_quantity: parseInt(p.stock || p.quantity) || 0,
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

async function handleURLImport(supabase: any, body: any, userId: string) {
  const { url } = body
  
  if (!url) {
    throw new Error('URL is required')
  }

  console.log(`Importing from URL: ${url} for user ${userId}`)

  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch data from URL: ${response.statusText}`)
  }

  const data = await response.json()
  const products = Array.isArray(data) ? data : [data]

  const validProducts = products.map(p => ({
    name: p.name || p.title || 'Sans nom',
    description: p.description || '',
    price: parseFloat(p.price) || 0,
    sku: p.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    category: p.category || 'Autre',
    stock_quantity: parseInt(p.stock || p.quantity) || 0,
    status: 'active',
    user_id: userId
  }))

  const result = await secureBatchInsert(supabase, 'products', validProducts, userId)

  return new Response(
    JSON.stringify({
      success: true,
      message: 'URL import completed',
      data: {
        url,
        recordsProcessed: products.length,
        recordsImported: result.length,
        timestamp: new Date().toISOString()
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

async function handleFTPImport(supabase: any, body: any, userId: string) {
  const { server, username, path } = body
  
  console.log(`FTP import from ${server}${path} for user ${userId}`)

  // FTP implementation would require proper FTP client
  // For now, return a placeholder response
  throw new Error('FTP import not yet implemented - use CSV or URL import instead')
}
