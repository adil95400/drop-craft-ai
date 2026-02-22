/**
 * XML/JSON Import — Thin proxy to robust-import-pipeline
 * P0.1: Parses XML/JSON feed then delegates to unified pipeline.
 * Writes to canonical `products` table via pipeline (not `imported_products`).
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // JWT auth
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) throw new Error('Unauthorized')

    const { sourceUrl, sourceType, mapping = {}, config = {} } = await req.json()

    // Fetch & parse the feed
    const response = await fetch(sourceUrl, {
      headers: { 'Accept': 'application/json, application/xml, text/xml, */*', 'User-Agent': 'ShopOpti-Import/1.0' },
    })
    if (!response.ok) throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`)

    const content = await response.text()
    let products: any[] = []

    if (sourceType === 'json') { products = parseJSON(content, mapping) }
    else if (sourceType === 'xml') { products = parseXML(content, mapping) }
    else {
      if (content.trim().startsWith('{') || content.trim().startsWith('[')) { products = parseJSON(content, mapping) }
      else if (content.trim().startsWith('<')) { products = parseXML(content, mapping) }
      else throw new Error('Unable to detect file format.')
    }

    if (products.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No products found in file.',
        debug: { content_preview: content.substring(0, 500), detected_type: sourceType },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 })
    }

    // Map to pipeline items
    const pipelineItems = products.map((p) => ({
      title: p.name || undefined,
      name: p.name,
      description: cleanDescription(p.description || ''),
      price: p.price,
      cost_price: p.cost_price,
      sku: p.sku,
      category: p.category,
      brand: p.brand,
      image_url: p.image_url,
      stock_quantity: p.stock_quantity,
      supplier: p.supplier_name || config.supplierName || `Import ${(sourceType || 'feed').toUpperCase()}`,
      source_url: sourceUrl,
    }))

    console.log(`[xml-json-import] Delegating ${pipelineItems.length} items to robust-import-pipeline for user ${user.id.slice(0, 8)}`)

    // Delegate to robust-import-pipeline
    const pipelineResponse = await fetch(`${supabaseUrl}/functions/v1/robust-import-pipeline`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        action: 'start',
        items: pipelineItems,
        source: sourceType === 'xml' ? 'api' : 'api',
      }),
    })

    const pipelineResult = await pipelineResponse.json()

    if (!pipelineResponse.ok) {
      return new Response(JSON.stringify({ success: false, error: pipelineResult.error || 'Pipeline error' }), {
        status: pipelineResponse.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: user.id,
      action: 'product_import',
      description: `Import ${(sourceType || 'feed').toUpperCase()}: ${products.length} produits via pipeline`,
      entity_type: 'import',
      metadata: { source_type: sourceType, source_url: sourceUrl, total: products.length, job_id: pipelineResult.job_id },
    })

    return new Response(JSON.stringify({
      success: true,
      job_id: pipelineResult.job_id,
      total: products.length,
      status: 'processing',
      message: `${products.length} products queued via robust-import-pipeline`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 202 })

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500,
    })
  }
})

// ── Parsers (kept locally for format-specific logic) ─────────────────────────

function parseJSON(content: string, mapping: Record<string, string>): any[] {
  try {
    const data = JSON.parse(content)
    let items = Array.isArray(data) ? data : null
    if (!items) {
      const paths = ['products', 'items', 'data', 'results', 'articles', 'entries', 'catalog', 'inventory']
      for (const path of paths) {
        if (data[path] && Array.isArray(data[path])) { items = data[path]; break }
      }
    }
    if (!items) items = [data]
    return items.map((item: any) => mapProduct(item, mapping)).filter((p: any) => p.name || p.sku)
  } catch { return [] }
}

function parseXML(content: string, mapping: Record<string, string>): any[] {
  const patterns = [
    /<product[^>]*>([\s\S]*?)<\/product>/gi, /<item[^>]*>([\s\S]*?)<\/item>/gi,
    /<article[^>]*>([\s\S]*?)<\/article>/gi, /<entry[^>]*>([\s\S]*?)<\/entry>/gi,
    /<offer[^>]*>([\s\S]*?)<\/offer>/gi, /<g:item[^>]*>([\s\S]*?)<\/g:item>/gi,
  ]
  let matches: string[] = []
  for (const pattern of patterns) {
    const found = content.match(pattern)
    if (found && found.length > 0) { matches = found; break }
  }
  if (matches.length === 0) {
    const product = extractXMLFields(content, mapping)
    return (product.name || product.sku) ? [product] : []
  }
  return matches.map((m) => extractXMLFields(m, mapping)).filter((p) => p.name || p.sku)
}

function extractXMLFields(xml: string, mapping: Record<string, string>): any {
  const product: any = {}
  const fieldMappings: Record<string, string[]> = {
    name: ['name', 'title', 'nom', 'titre', 'g:title', 'product_name'],
    description: ['description', 'desc', 'body', 'content', 'g:description'],
    price: ['price', 'prix', 'sale_price', 'g:price', 'regular_price'],
    cost_price: ['cost', 'cost_price', 'wholesale_price'],
    sku: ['sku', 'reference', 'ref', 'id', 'g:id', 'mpn', 'g:mpn'],
    category: ['category', 'categorie', 'g:product_type'],
    brand: ['brand', 'marque', 'manufacturer', 'g:brand'],
    image_url: ['image', 'image_url', 'picture', 'g:image_link'],
    stock_quantity: ['stock', 'quantity', 'stock_quantity', 'g:quantity'],
  }
  for (const [xmlField, productField] of Object.entries(mapping)) {
    const value = extractXMLValue(xml, xmlField)
    if (value) product[productField] = value
  }
  for (const [productField, xmlFields] of Object.entries(fieldMappings)) {
    if (!product[productField]) {
      for (const xmlField of xmlFields) {
        const value = extractXMLValue(xml, xmlField)
        if (value) { product[productField] = value; break }
      }
    }
  }
  return product
}

function extractXMLValue(xml: string, tag: string): string | null {
  const escapedTag = tag.replace(/:/g, '\\:')
  const patterns = [
    new RegExp(`<${escapedTag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${escapedTag}>`, 'i'),
    new RegExp(`<${escapedTag}[^>]*>([\\s\\S]*?)<\\/${escapedTag}>`, 'i'),
    new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'),
    new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'),
  ]
  for (const pattern of patterns) {
    const match = xml.match(pattern)
    if (match && match[1]) return match[1].trim()
  }
  return null
}

function mapProduct(item: any, mapping: Record<string, string>): any {
  const product: any = {}
  for (const [srcField, destField] of Object.entries(mapping)) {
    if (item[srcField] !== undefined) product[destField] = item[srcField]
  }
  product.name = product.name || item.name || item.title
  product.description = product.description || item.description || ''
  product.price = product.price || item.price
  product.cost_price = product.cost_price || item.cost_price
  product.sku = product.sku || item.sku || item.reference || item.id
  product.category = product.category || item.category
  product.brand = product.brand || item.brand || item.manufacturer
  product.image_url = product.image_url || item.image_url || item.image
  product.stock_quantity = product.stock_quantity || item.stock_quantity || item.stock
  return product
}

function cleanDescription(desc: string): string {
  if (!desc) return ''
  return desc.replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ').trim()
}
