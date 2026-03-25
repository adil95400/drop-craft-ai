import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

type FeedFormat = 'google_shopping' | 'facebook_catalog' | 'csv' | 'xml'

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function generateGoogleShoppingXml(products: any[], shopUrl: string): string {
  const items = products.map(p => {
    const imageUrl = p.image_urls?.[0] || p.image_url || ''
    const link = `${shopUrl}/products/${p.id}`
    return `
    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <title>${escapeXml(p.name || '')}</title>
      <description>${escapeXml((p.description || '').replace(/<[^>]*>/g, '').substring(0, 5000))}</description>
      <link>${escapeXml(link)}</link>
      <g:image_link>${escapeXml(imageUrl)}</g:image_link>
      <g:price>${p.price || 0} ${p.currency || 'EUR'}</g:price>
      ${p.compare_at_price ? `<g:sale_price>${p.price} ${p.currency || 'EUR'}</g:sale_price>` : ''}
      <g:availability>${(p.stock_quantity || 0) > 0 ? 'in_stock' : 'out_of_stock'}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${escapeXml(p.brand || 'Generic')}</g:brand>
      ${p.sku ? `<g:gtin>${escapeXml(p.sku)}</g:gtin>` : ''}
      ${p.category ? `<g:product_type>${escapeXml(p.category)}</g:product_type>` : ''}
      ${p.weight ? `<g:shipping_weight>${p.weight} kg</g:shipping_weight>` : ''}
    </item>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Product Feed</title>
    <link>${escapeXml(shopUrl)}</link>
    <description>Product feed for Google Shopping</description>
    ${items}
  </channel>
</rss>`
}

function generateFacebookCatalogXml(products: any[], shopUrl: string): string {
  const items = products.map(p => {
    const imageUrl = p.image_urls?.[0] || p.image_url || ''
    const link = `${shopUrl}/products/${p.id}`
    return `
    <item>
      <id>${escapeXml(p.id)}</id>
      <title>${escapeXml(p.name || '')}</title>
      <description>${escapeXml((p.description || '').replace(/<[^>]*>/g, '').substring(0, 5000))}</description>
      <availability>${(p.stock_quantity || 0) > 0 ? 'in stock' : 'out of stock'}</availability>
      <condition>new</condition>
      <price>${p.price || 0} ${p.currency || 'EUR'}</price>
      ${p.compare_at_price ? `<sale_price>${p.price} ${p.currency || 'EUR'}</sale_price>` : ''}
      <link>${escapeXml(link)}</link>
      <image_link>${escapeXml(imageUrl)}</image_link>
      <brand>${escapeXml(p.brand || 'Generic')}</brand>
      ${p.category ? `<product_type>${escapeXml(p.category)}</product_type>` : ''}
      <inventory>${p.stock_quantity || 0}</inventory>
    </item>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
  <channel>
    <title>Facebook Product Catalog</title>
    <link>${escapeXml(shopUrl)}</link>
    ${items}
  </channel>
</rss>`
}

function generateCsvFeed(products: any[]): string {
  const headers = ['id', 'title', 'description', 'price', 'currency', 'availability', 'image_link', 'brand', 'sku', 'category', 'stock']
  const rows = products.map(p => [
    p.id,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    `"${(p.description || '').replace(/<[^>]*>/g, '').replace(/"/g, '""').substring(0, 500)}"`,
    p.price || 0,
    p.currency || 'EUR',
    (p.stock_quantity || 0) > 0 ? 'in_stock' : 'out_of_stock',
    p.image_urls?.[0] || p.image_url || '',
    p.brand || '',
    p.sku || '',
    p.category || '',
    p.stock_quantity || 0,
  ].join(','))

  return [headers.join(','), ...rows].join('\n')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing authorization header')
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) throw new Error('Unauthorized')

    const { format = 'google_shopping', shopUrl = '', filters = {} } = await req.json()

    // Fetch active products
    let query = supabase
      .from('products')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (filters.category) query = query.eq('category', filters.category)
    if (filters.minPrice) query = query.gte('price', filters.minPrice)
    if (filters.inStockOnly) query = query.gt('stock_quantity', 0)

    const { data: products, error: prodError } = await query
    if (prodError) throw new Error(`Failed to fetch products: ${prodError.message}`)

    const productList = products || []
    const baseUrl = shopUrl || `https://${user.id}.shop`

    let feedContent: string
    let contentType: string

    switch (format as FeedFormat) {
      case 'google_shopping':
        feedContent = generateGoogleShoppingXml(productList, baseUrl)
        contentType = 'application/xml'
        break
      case 'facebook_catalog':
        feedContent = generateFacebookCatalogXml(productList, baseUrl)
        contentType = 'application/xml'
        break
      case 'csv':
        feedContent = generateCsvFeed(productList)
        contentType = 'text/csv'
        break
      default:
        feedContent = generateGoogleShoppingXml(productList, baseUrl)
        contentType = 'application/xml'
    }

    // Log the feed generation
    await supabase.from('publication_logs').insert({
      user_id: user.id,
      channel_type: 'feed',
      channel_id: format,
      channel_name: format === 'google_shopping' ? 'Google Shopping' : format === 'facebook_catalog' ? 'Facebook Catalog' : format.toUpperCase(),
      action: 'generate_feed',
      status: 'success',
      metadata: { product_count: productList.length, format, filters }
    })

    return new Response(feedContent, {
      headers: { ...corsHeaders, 'Content-Type': contentType },
    })
  } catch (error) {
    console.error('[generate-product-feed] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
