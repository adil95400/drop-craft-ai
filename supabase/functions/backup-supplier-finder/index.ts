import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      product_id, 
      exclude_supplier_ids, 
      max_results = 5, 
      sort_by = 'reliability_score',
      include_pricing = true 
    } = await req.json()

    // Get the product to understand requirements
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*, user_id')
      .eq('id', product_id)
      .single()

    if (productError || !product) {
      throw new Error('Product not found')
    }

    // Get all active suppliers excluding specified ones
    let query = supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', product.user_id)
      .eq('status', 'active')

    if (exclude_supplier_ids && exclude_supplier_ids.length > 0) {
      query = query.not('id', 'in', `(${exclude_supplier_ids.join(',')})`)
    }

    const { data: suppliers, error: suppliersError } = await query

    if (suppliersError) {
      throw new Error('Failed to fetch suppliers')
    }

    // Calculate backup supplier scores and details
    const backupSuppliers = suppliers.map(supplier => {
      // Simulate reliability scoring based on historical data
      const baseReliability = supplier.rating ? (supplier.rating / 5) * 100 : 70
      const productCountBonus = Math.min(supplier.product_count / 10, 10)
      const reliabilityScore = Math.min(baseReliability + productCountBonus, 100)

      // Simulate pricing (in real implementation, this would come from supplier API or contracts)
      const estimatedPrice = product.cost_price ? 
        product.cost_price * (0.8 + Math.random() * 0.4) : // ±20% variation
        product.price * (0.5 + Math.random() * 0.2) // 50-70% of retail price

      // Simulate lead time based on location and supplier type
      const leadTimeDays = supplier.country === 'France' ? 
        Math.floor(Math.random() * 5) + 2 : // 2-7 days for local
        Math.floor(Math.random() * 10) + 5    // 5-15 days for international

      // Simulate minimum order quantity
      const minimumOrderQuantity = supplier.supplier_type === 'wholesale' ? 
        Math.floor(Math.random() * 100) + 50 : // 50-150 for wholesale
        Math.floor(Math.random() * 20) + 10    // 10-30 for retail

      return {
        id: supplier.id,
        name: supplier.name,
        price: estimatedPrice,
        lead_time_days: leadTimeDays,
        minimum_order_quantity: minimumOrderQuantity,
        reliability_score: Math.round(reliabilityScore),
        last_order_date: getRandomLastOrderDate(),
        supplier_type: supplier.supplier_type,
        country: supplier.country,
        rating: supplier.rating,
        contact_info: {
          email: supplier.contact_email ? 'Available' : 'Not available',
          phone: supplier.contact_phone ? 'Available' : 'Not available'
        },
        available_payment_terms: getRandomPaymentTerms(),
        estimated_capacity: Math.floor(Math.random() * 1000) + 100
      }
    })

    // Sort backup suppliers based on criteria
    let sortedSuppliers = [...backupSuppliers]
    switch (sort_by) {
      case 'reliability_score':
        sortedSuppliers.sort((a, b) => b.reliability_score - a.reliability_score)
        break
      case 'price':
        sortedSuppliers.sort((a, b) => a.price - b.price)
        break
      case 'lead_time':
        sortedSuppliers.sort((a, b) => a.lead_time_days - b.lead_time_days)
        break
      case 'rating':
        sortedSuppliers.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
    }

    // Limit results
    const finalResults = sortedSuppliers.slice(0, max_results)

    // Log the backup supplier search
    await supabase
      .from('activity_logs')
      .insert({
        user_id: product.user_id,
        action: 'backup_suppliers_found',
        entity_type: 'product',
        entity_id: product_id,
        description: `Found ${finalResults.length} backup suppliers for ${product.name}`,
        metadata: {
          product_name: product.name,
          suppliers_found: finalResults.length,
          sort_by,
          search_criteria: {
            exclude_supplier_ids,
            max_results
          }
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Backup suppliers found successfully',
        backup_suppliers: finalResults,
        total_found: finalResults.length,
        search_criteria: {
          product_id,
          sort_by,
          max_results,
          include_pricing
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Backup supplier finder error:', error)
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

function getRandomLastOrderDate(): string | undefined {
  const shouldHaveLastOrder = Math.random() > 0.3
  if (!shouldHaveLastOrder) return undefined
  
  const daysAgo = Math.floor(Math.random() * 180) + 30 // 30-210 days ago
  const lastOrderDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  return lastOrderDate.toISOString().split('T')[0]
}

function getRandomPaymentTerms(): string[] {
  const allTerms = ['Net 30', 'Net 15', 'COD', '2/10 Net 30', 'Prepayment', 'Letter of Credit']
  const numberOfTerms = Math.floor(Math.random() * 3) + 1
  const selectedTerms = []
  
  for (let i = 0; i < numberOfTerms; i++) {
    const randomTerm = allTerms[Math.floor(Math.random() * allTerms.length)]
    if (!selectedTerms.includes(randomTerm)) {
      selectedTerms.push(randomTerm)
    }
  }
  
  return selectedTerms
}