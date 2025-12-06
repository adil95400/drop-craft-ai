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

    // Parse products
    const products: any[] = []
    const maxProducts = limit > 0 ? Math.min(limit, lines.length - 1) : lines.length - 1

    for (let i = 1; i <= maxProducts; i++) {
      try {
        const values = parseCSVLine(lines[i])
        
        if (values.length < 5) continue

        const product = {
          supplier_id: supplierId,
          user_id: userId,
          external_sku: values[colIndex['id']] || values[0] || `BTS-${i}`,
          name: values[colIndex['name']] || values[1] || '',
          description: values[colIndex['description']] || values[2] || '',
          price: parsePrice(values[colIndex['price']] || values[3] || '0'),
          ean: values[colIndex['ean']] || values[4] || null,
          brand: values[colIndex['manufacturer']] || values[5] || 'BTS Wholesaler',
          stock_quantity: parseInt(values[colIndex['stock']] || values[6] || '0', 10) || 0,
          image_urls: values[colIndex['image']] ? [values[colIndex['image']] || values[7]] : [],
          category: values[colIndex['category']] || values[8] || 'Non classé',
          currency: 'EUR',
          last_updated: new Date().toISOString(),
          attributes: {
            cost_price: parsePrice(values[colIndex['price']] || values[3] || '0'),
            subcategory: values[colIndex['subcategory']] || values[9] || null,
            subsubcategory: values[colIndex['subsubcategory']] || values[10] || null,
            gender: values[colIndex['gender']] || values[11] || null,
            flammable: values[colIndex['flammable']] || values[12] || null,
            leadtime_to_ship: values[colIndex['leadtime_to_ship']] || values[13] || null,
            recommended_price: values[colIndex['recommended_price']] || values[14] || null,
            source: 'bts_wholesaler_api'
          }
        }

        // Skip products without name
        if (!product.name || product.name.trim() === '') continue

        products.push(product)

        // Log progress every 1000 products
        if (products.length % 1000 === 0) {
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
