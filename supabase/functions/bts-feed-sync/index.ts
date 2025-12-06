import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface BTSProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  ean: string;
  manufacturer: string;
  stock: string;
  image: string;
  category: string;
  subcategory?: string;
  subsubcategory?: string;
  gender?: string;
  flammable?: string;
  leadtime_to_ship?: string;
  recommended_price?: string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      result.push(current.trim().replace(/^"|"$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ''));
  
  return result;
}

function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  // Remove € symbol and convert comma to dot
  const cleaned = priceStr.replace('€', '').replace(',', '.').trim();
  const price = parseFloat(cleaned);
  return isNaN(price) ? 0 : price;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { supplierId, userId, action = 'sync', limit = 0 } = await req.json()

    console.log('BTS Feed Sync:', { supplierId, userId, action, limit })

    // Validate required parameters
    if (!supplierId) {
      return new Response(
        JSON.stringify({ success: false, error: 'supplierId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'userId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get BTS credentials
    const { data: credentials } = await supabase
      .from('supplier_credentials_vault')
      .select('*')
      .eq('supplier_id', supplierId)
      .single()

    // BTS Wholesaler credentials
    const btsUserId = credentials?.oauth_data?.user_id_bts || '908383'
    const btsPassword = credentials?.oauth_data?.password || 'Adil1979@@'
    const language = credentials?.oauth_data?.language || 'fr-FR'
    const format = 'csv' // CSV is more reliable for large datasets

    console.log('Using BTS credentials:', { btsUserId, language, format })

    // Build the feed URL
    const feedUrl = `https://www.btswholesaler.com/generatefeedbts?user_id=${btsUserId}&pass=${encodeURIComponent(btsPassword)}&format=${format}&language_code=${language}`

    console.log('Fetching BTS feed from URL...')

    // Fetch the CSV feed
    const response = await fetch(feedUrl, {
      headers: {
        'User-Agent': 'ShopOpti/1.0',
        'Accept': 'text/csv, application/csv, */*'
      }
    })

    if (!response.ok) {
      console.error('BTS API Error:', response.status, response.statusText)
      throw new Error(`BTS API returned ${response.status}: ${response.statusText}`)
    }

    const csvText = await response.text()
    console.log('CSV received, length:', csvText.length, 'chars')

    // Parse CSV
    const lines = csvText.split('\n').filter(line => line.trim())
    console.log('Total lines in CSV:', lines.length)

    if (lines.length < 2) {
      throw new Error('CSV file is empty or invalid')
    }

    // Parse headers
    const headers = parseCSVLine(lines[0])
    console.log('CSV Headers:', headers)

    // Find column indices
    const colIndex: Record<string, number> = {}
    headers.forEach((h, i) => {
      colIndex[h.toLowerCase().trim()] = i
    })

    console.log('Column indices:', colIndex)

    // Log first few headers for debugging
    console.log('First 15 headers:', headers.slice(0, 15))

    // Parse products - use direct column mapping based on BTS CSV structure
    // Expected columns: id;name;description;price;ean;manufacturer;stock;image;category;subcategory;subsubcategory;gender;flammable;leadtime_to_ship;recommended_price
    const products: any[] = []
    const maxProducts = limit > 0 ? Math.min(limit, lines.length - 1) : lines.length - 1

    for (let i = 1; i <= maxProducts; i++) {
      try {
        const values = parseCSVLine(lines[i])
        
        if (values.length < 5) continue

        // Map by column name if available, otherwise by index
        const getId = () => values[colIndex['id'] ?? 0] || values[0] || `BTS-${i}`
        const getName = () => values[colIndex['name'] ?? 1] || values[1] || ''
        const getDesc = () => values[colIndex['description'] ?? 2] || values[2] || ''
        const getPrice = () => values[colIndex['price'] ?? 3] || values[3] || '0'
        const getEan = () => values[colIndex['ean'] ?? 4] || values[4] || null
        const getBrand = () => values[colIndex['manufacturer'] ?? 5] || values[5] || 'BTS Wholesaler'
        const getStock = () => values[colIndex['stock'] ?? 6] || values[6] || '0'
        const getImage = () => values[colIndex['image'] ?? 7] || values[7] || ''
        const getCategory = () => values[colIndex['category'] ?? 8] || values[8] || 'Non classé'
        const getSubcat = () => values[colIndex['subcategory'] ?? 9] || values[9] || null
        const getSubsubcat = () => values[colIndex['subsubcategory'] ?? 10] || values[10] || null
        const getGender = () => values[colIndex['gender'] ?? 11] || values[11] || null
        const getFlammable = () => values[colIndex['flammable'] ?? 12] || values[12] || null
        const getLeadtime = () => values[colIndex['leadtime_to_ship'] ?? 13] || values[13] || null
        const getRecPrice = () => values[colIndex['recommended_price'] ?? 14] || values[14] || null

        const imageUrl = getImage()
        
        const product = {
          supplier_id: supplierId,
          user_id: userId,
          external_sku: getId(),
          name: getName(),
          description: getDesc(),
          price: parsePrice(getPrice()),
          ean: getEan(),
          brand: getBrand(),
          stock_quantity: parseInt(getStock(), 10) || 0,
          image_urls: imageUrl ? [imageUrl] : [],
          category: getCategory(),
          subcategory: getSubcat(),
          currency: 'EUR',
          last_updated: new Date().toISOString(),
          attributes: {
            cost_price: parsePrice(getPrice()),
            subsubcategory: getSubsubcat(),
            gender: getGender(),
            flammable: getFlammable(),
            leadtime_to_ship: getLeadtime(),
            recommended_price: getRecPrice(),
            source: 'bts_wholesaler_api'
          }
        }

        // Skip products without name
        if (!product.name || product.name.trim() === '') continue

        products.push(product)

        // Log progress every 5000 products
        if (products.length % 5000 === 0) {
          console.log(`Parsed ${products.length} products...`)
        }
      } catch (parseError) {
        console.error(`Error parsing line ${i}:`, parseError)
      }
    }

    console.log(`Total products parsed: ${products.length}`)

    if (products.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'No products found in CSV',
          debug: {
            csvLength: csvText.length,
            linesCount: lines.length,
            headers: headers
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Insert products in batches
    const batchSize = 500
    let insertedCount = 0
    let errorCount = 0

    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize)
      
      const { error: insertError } = await supabase
        .from('supplier_products')
        .upsert(batch, { 
          onConflict: 'supplier_id,external_sku',
          ignoreDuplicates: false 
        })

      if (insertError) {
        console.error(`Batch insert error at ${i}:`, insertError)
        errorCount += batch.length
      } else {
        insertedCount += batch.length
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(products.length / batchSize)} (${insertedCount} products)`)
      }
    }

    // Update supplier sync status
    await supabase
      .from('suppliers')
      .update({
        last_sync_at: new Date().toISOString(),
        product_count: insertedCount,
        sync_status: 'synced'
      })
      .eq('id', supplierId)

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        user_id: userId,
        action: 'bts_feed_sync',
        description: `Synchronized ${insertedCount} products from BTS Wholesaler`,
        metadata: {
          supplier_id: supplierId,
          total_in_feed: lines.length - 1,
          parsed: products.length,
          inserted: insertedCount,
          errors: errorCount
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully synchronized ${insertedCount} products from BTS Wholesaler`,
        stats: {
          total_in_feed: lines.length - 1,
          parsed: products.length,
          inserted: insertedCount,
          errors: errorCount
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('BTS Feed Sync error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.stack 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
