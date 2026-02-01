/**
 * Unified Import - Secure Edge Function
 * P0.4 FIX: Replaced CORS * with restrictive allowlist
 * P1.3: Scope-based authorization with granular permissions
 * P3: Enhanced input validation and sanitization
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createEdgeFunction, z } from '../_shared/create-edge-function.ts'
import { secureBatchInsert } from '../_shared/db-helpers.ts'
import { SCOPE_PRESETS } from '../_shared/scope-middleware.ts'
import { sanitizeInput, sanitizeString, sanitizeUrl, containsXss } from '../_shared/input-sanitizer.ts'

// P3: Strict input schemas with sanitization rules
const ProductSchema = z.object({
  name: z.string().max(500).optional(),
  title: z.string().max(500).optional(),
  description: z.string().max(10000).optional(),
  price: z.union([z.string(), z.number()]).optional(),
  cost_price: z.union([z.string(), z.number()]).optional(),
  sku: z.string().max(100).optional(),
  category: z.string().max(200).optional(),
  stock_quantity: z.union([z.string(), z.number()]).optional(),
  stock: z.union([z.string(), z.number()]).optional(),
  quantity: z.union([z.string(), z.number()]).optional(),
  status: z.enum(['active', 'draft']).optional(),
  image_url: z.string().max(2048).optional(),
}).transform(data => {
  // P3: Sanitize all string fields
  const sanitized: typeof data = { ...data };
  
  if (data.name) sanitized.name = sanitizeString(data.name, { maxLength: 500, allowHtml: false });
  if (data.title) sanitized.title = sanitizeString(data.title, { maxLength: 500, allowHtml: false });
  if (data.description) sanitized.description = sanitizeString(data.description, { maxLength: 10000, allowHtml: false });
  if (data.sku) sanitized.sku = sanitizeString(data.sku, { maxLength: 100, allowHtml: false, allowNewlines: false });
  if (data.category) sanitized.category = sanitizeString(data.category, { maxLength: 200, allowHtml: false });
  if (data.image_url) sanitized.image_url = sanitizeUrl(data.image_url) || undefined;
  
  return sanitized;
});

// Input schema for import operations
const ImportInputSchema = z.object({
  endpoint: z.enum(['csv', 'xml-json', 'url', 'ftp', 'bulk']).optional(),
  products: z.array(ProductSchema).max(5000).optional(),
  format: z.enum(['json', 'xml', 'csv']).optional(),
  data: z.any().optional(),
  url: z.string().url().max(2048).optional().transform(val => val ? sanitizeUrl(val) : val),
  bulk: z.boolean().optional(),
}).refine(
  data => data.products || data.data || data.url,
  { message: 'At least one of products, data, or url is required' }
).refine(
  data => {
    // P3: Block XSS in URL parameter
    if (data.url && containsXss(data.url)) {
      return false;
    }
    return true;
  },
  { message: 'Invalid characters detected in URL' }
)

type ImportInput = z.infer<typeof ImportInputSchema>

// Determine required scopes based on operation
function getRequiredScopes(input: ImportInput): string[] {
  // Bulk operations require premium scope
  if (input.bulk || (input.products && input.products.length > 50)) {
    return SCOPE_PRESETS.PRODUCT_BULK
  }
  // Standard import
  return SCOPE_PRESETS.PRODUCT_IMPORT
}

// Create the edge function with scope-based authorization
const handler = createEdgeFunction<ImportInput>(
  {
    requireAuth: true,
    allowExtensionToken: true,
    // P1.3: Base scopes - additional checks done in handler for bulk
    requiredScopes: ['products:read', 'products:import'],
    requireAllScopes: true,
    logScopeUsage: true,
    inputSchema: ImportInputSchema,
    rateLimit: {
      maxRequests: 30,
      windowMinutes: 60,
      action: 'unified_import'
    }
  },
  async (ctx) => {
    const { user, adminClient, input, correlationId, hasScope } = ctx
    
    console.log(`[${correlationId}] Import request from user ${user.id.slice(0, 8)}`)
    console.log(`[${correlationId}] User scopes:`, user.scopes)
    
    // P1.3: Check if bulk scope is needed for large imports
    const productCount = input.products?.length || 0
    if (productCount > 50 && !hasScope('products:bulk')) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Bulk import requires "products:bulk" scope. Upgrade your plan or reduce import size.',
          code: 'BULK_SCOPE_REQUIRED',
          max_without_bulk: 50,
          attempted: productCount
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    // Route to appropriate handler
    const endpoint = input.endpoint || 'csv'
    
    switch (endpoint) {
      case 'csv':
        return await handleCSVImport(adminClient, input, user.id, correlationId)
      
      case 'xml-json':
        return await handleXMLJSONImport(adminClient, input, user.id, correlationId)
      
      case 'url':
        return await handleURLImport(adminClient, input, user.id, correlationId)
      
      case 'bulk':
        // Extra scope check for explicit bulk endpoint
        if (!hasScope('products:bulk')) {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Bulk import requires "products:bulk" scope',
              code: 'INSUFFICIENT_SCOPES'
            }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
          )
        }
        return await handleBulkImport(adminClient, input, user.id, correlationId)
      
      case 'ftp':
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'FTP import not yet implemented - use CSV or URL import instead' 
          }),
          { status: 501, headers: { 'Content-Type': 'application/json' } }
        )
      
      default:
        return new Response(
          JSON.stringify({ success: false, error: 'Unknown import endpoint' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }
  }
)

serve(handler)

// ============= Import Handlers =============

async function handleCSVImport(
  supabase: any, 
  input: ImportInput, 
  userId: string, 
  correlationId: string
) {
  const products = input.products || []
  
  if (products.length === 0) {
    return new Response(
      JSON.stringify({ success: false, error: 'No products to import' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  // Rate limit: max 1000 products per import
  const limitedProducts = products.slice(0, 1000)
  console.log(`[${correlationId}] Importing ${limitedProducts.length} products from CSV`)

  // P3: Products already sanitized by Zod transform, apply additional security
  const { sanitized: cleanProducts, warnings } = sanitizeInput(limitedProducts, {
    strings: { maxLength: 10000, stripHtml: true },
    checkInjection: true,
  });
  
  if (warnings.length > 0) {
    console.warn(`[${correlationId}] Sanitization warnings:`, warnings);
  }

  const validProducts = cleanProducts.map((p: any) => ({
    name: String(p.name || p.title || 'Sans nom').slice(0, 500),
    description: String(p.description || '').slice(0, 10000),
    price: Math.max(0, parseFloat(String(p.price)) || 0),
    cost_price: Math.max(0, parseFloat(String(p.cost_price)) || 0),
    sku: String(p.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`).slice(0, 100),
    category: String(p.category || 'Autre').slice(0, 200),
    stock_quantity: Math.max(0, parseInt(String(p.stock_quantity || p.stock || p.quantity)) || 0),
    status: p.status === 'active' || p.status === 'draft' ? p.status : 'active',
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
        sanitizationWarnings: warnings.length,
        timestamp: new Date().toISOString()
      }
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

async function handleXMLJSONImport(
  supabase: any, 
  input: ImportInput, 
  userId: string, 
  correlationId: string
) {
  const { format, data: importData } = input
  
  console.log(`[${correlationId}] Processing ${format} import`)

  let products = []
  
  if (format === 'json') {
    products = Array.isArray(importData) ? importData : [importData]
  } else if (format === 'xml') {
    return new Response(
      JSON.stringify({ success: false, error: 'XML parsing not yet implemented' }),
      { status: 501, headers: { 'Content-Type': 'application/json' } }
    )
  }

  const limitedProducts = products.slice(0, 1000)

  const validProducts = limitedProducts.map((p: any) => ({
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
      message: `${(format || 'JSON').toUpperCase()} import completed`,
      data: {
        format,
        recordsProcessed: products.length,
        recordsImported: result.length,
        timestamp: new Date().toISOString()
      }
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}

async function handleURLImport(
  supabase: any, 
  input: ImportInput, 
  userId: string, 
  correlationId: string
) {
  const { url } = input
  
  if (!url) {
    return new Response(
      JSON.stringify({ success: false, error: 'Valid URL is required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  console.log(`[${correlationId}] Importing from URL for user ${userId.slice(0, 8)}`)

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000) // 30s timeout

  try {
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'ShopOpti-Import/1.0' }
    })
    clearTimeout(timeout)

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `Failed to fetch data from URL: ${response.status}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const data = await response.json()
    const products = Array.isArray(data) ? data : [data]
    const limitedProducts = products.slice(0, 500)

    const validProducts = limitedProducts.map((p: any) => ({
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
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    clearTimeout(timeout)
    const message = error instanceof Error ? error.message : 'URL fetch failed'
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function handleBulkImport(
  supabase: any, 
  input: ImportInput, 
  userId: string, 
  correlationId: string
) {
  const products = input.products || []
  
  // Bulk import can handle up to 5000 products
  const limitedProducts = products.slice(0, 5000)
  console.log(`[${correlationId}] BULK importing ${limitedProducts.length} products`)

  const validProducts = limitedProducts.map(p => ({
    name: String(p.name || p.title || 'Sans nom').slice(0, 500),
    description: String(p.description || '').slice(0, 10000),
    price: Math.max(0, parseFloat(String(p.price)) || 0),
    cost_price: Math.max(0, parseFloat(String(p.cost_price)) || 0),
    sku: String(p.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`).slice(0, 100),
    category: String(p.category || 'Autre').slice(0, 200),
    stock_quantity: Math.max(0, parseInt(String(p.stock_quantity || p.stock || p.quantity)) || 0),
    status: p.status === 'active' || p.status === 'draft' ? p.status : 'active',
    image_url: p.image_url || null,
    user_id: userId
  }))

  // Batch insert in chunks of 500
  const batchSize = 500
  let totalImported = 0
  
  for (let i = 0; i < validProducts.length; i += batchSize) {
    const batch = validProducts.slice(i, i + batchSize)
    const result = await secureBatchInsert(supabase, 'products', batch, userId)
    totalImported += result.length
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Bulk import completed',
      data: {
        recordsProcessed: products.length,
        recordsImported: totalImported,
        timestamp: new Date().toISOString()
      }
    }),
    { headers: { 'Content-Type': 'application/json' } }
  )
}
