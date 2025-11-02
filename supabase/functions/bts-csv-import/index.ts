import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface CSVRow {
  id: string
  ean: string
  categories: string
  manufacturer: string
  name: string
  description: string
  recommended_price: string
  price: string
  stock: string
  image: string
  leadtime_to_ship: string
  gender: string
  flammable: string
  restricted_countries: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { userId, supplierId, csvContent } = await req.json()

    console.log('🔄 Starting BTS CSV import...')

    // Parse CSV content
    const lines = csvContent.split('\n')
    const headers = lines[0].split(';').map((h: string) => h.trim())
    
    console.log(`📊 Headers found:`, headers)

    // Vérifier si le fournisseur existe
    const { data: supplier, error: supplierError } = await supabase
      .from('premium_suppliers')
      .select('*')
      .eq('id', supplierId)
      .single()

    if (supplierError || !supplier) {
      throw new Error('Supplier not found')
    }

    const products: any[] = []
    
    // Parse each line (skip header)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      const values = line.split(';')
      
      if (values.length < headers.length) continue

      const row: any = {}
      headers.forEach((header, index) => {
        row[header] = values[index]?.replace(/^"|"$/g, '').trim() || ''
      })

      // Parse price (remove € and convert to number)
      const parsePrice = (priceStr: string): number => {
        if (!priceStr) return 0
        return parseFloat(priceStr.replace('€', '').replace(',', '.').trim()) || 0
      }

      const costPrice = parsePrice(row.price)
      const recommendedPrice = parsePrice(row.recommended_price)
      const sellPrice = recommendedPrice || (costPrice * 1.3)

      products.push({
        user_id: userId,
        name: row.name || 'Unnamed Product',
        description: row.description || '',
        price: sellPrice,
        cost_price: costPrice,
        currency: 'EUR',
        sku: row.ean || row.id,
        category: row.categories?.split('/')[0] || 'Parfums & Cosmétiques',
        stock_quantity: parseInt(row.stock) || 0,
        status: parseInt(row.stock) > 0 ? 'active' as const : 'inactive' as const,
        supplier_name: supplier.name,
        supplier_product_id: row.id,
        image_urls: row.image ? [row.image] : [],
        tags: ['BTS Wholesaler', row.manufacturer, row.gender].filter(Boolean),
        brand: row.manufacturer || null,
        ean: row.ean || null,
        supplier_sku: row.id,
        shipping_time: row.leadtime_to_ship ? `${row.leadtime_to_ship}h` : null
      })

      // Process in batches of 100
      if (products.length >= 100) {
        await importBatch(supabase, products.splice(0, 100))
      }
    }

    // Import remaining products
    if (products.length > 0) {
      await importBatch(supabase, products)
    }

    console.log(`✅ CSV import completed: ${lines.length - 1} products processed`)

    // Update connection status
    await supabase
      .from('premium_supplier_connections')
      .update({
        status: 'active',
        last_sync_at: new Date().toISOString()
      })
      .eq('supplier_id', supplierId)
      .eq('user_id', userId)

    // Create sync log
    await supabase
      .from('premium_sync_logs')
      .insert({
        connection_id: null,
        user_id: userId,
        supplier_id: supplierId,
        sync_type: 'csv_import',
        status: 'completed',
        items_synced: lines.length - 1,
        items_failed: 0,
        sync_details: {
          import_type: 'csv',
          total_lines: lines.length
        },
        completed_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        success: true,
        imported: lines.length - 1,
        message: `Successfully imported ${lines.length - 1} products from CSV`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    )

  } catch (error) {
    console.error('❌ CSV import error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Failed to import CSV products'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    )
  }
})

async function importBatch(supabase: any, products: any[]) {
  const { data, error } = await supabase
    .from('imported_products')
    .upsert(products, {
      onConflict: 'user_id,supplier_product_id',
      ignoreDuplicates: false
    })
    .select()

  if (error) {
    console.error('❌ Batch import error:', error)
    throw error
  }

  console.log(`✅ Imported batch of ${products.length} products`)
  return data
}
