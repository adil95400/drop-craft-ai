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

    // Récupérer les ratings des fournisseurs
    const supplierIds = suppliers?.map(s => s.id) || []
    const { data: ratings } = await supabase
      .from('supplier_ratings')
      .select('*')
      .in('supplier_id', supplierIds)

    const ratingsMap = new Map(ratings?.map(r => [r.supplier_id, r]) || [])

    // Récupérer les produits fournisseurs pour les vrais prix
    const { data: supplierProducts } = await supabase
      .from('supplier_products')
      .select('supplier_id, price, lead_time_days, min_order_quantity')
      .in('supplier_id', supplierIds)

    // Grouper les produits par fournisseur
    const productsBySupplier = new Map<string, any[]>()
    for (const sp of supplierProducts || []) {
      if (!productsBySupplier.has(sp.supplier_id)) {
        productsBySupplier.set(sp.supplier_id, [])
      }
      productsBySupplier.get(sp.supplier_id)!.push(sp)
    }

    // Récupérer les dernières commandes pour chaque fournisseur
    const { data: lastOrders } = await supabase
      .from('bulk_order_items')
      .select('supplier_id, created_at')
      .in('supplier_id', supplierIds)
      .order('created_at', { ascending: false })

    const lastOrderBySupplier = new Map<string, string>()
    for (const order of lastOrders || []) {
      if (!lastOrderBySupplier.has(order.supplier_id)) {
        lastOrderBySupplier.set(order.supplier_id, order.created_at)
      }
    }

    // Calculate backup supplier scores and details from REAL DATA
    const backupSuppliers = (suppliers || []).map(supplier => {
      const rating = ratingsMap.get(supplier.id)
      const products = productsBySupplier.get(supplier.id) || []
      
      // Calculate real reliability score from rating or supplier data
      const reliabilityScore = rating?.reliability_score || 
        (supplier.rating ? Math.round((supplier.rating / 5) * 100) : 50)

      // Calculate real estimated price from supplier products
      let estimatedPrice = product.cost_price || product.price * 0.6
      if (products.length > 0) {
        const avgPrice = products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length
        if (avgPrice > 0) estimatedPrice = avgPrice
      }

      // Calculate real lead time from supplier products or use supplier default
      let leadTimeDays = supplier.lead_time_days || 7
      if (products.length > 0) {
        const avgLeadTime = products
          .filter(p => p.lead_time_days)
          .reduce((sum, p) => sum + p.lead_time_days, 0) / 
          products.filter(p => p.lead_time_days).length
        if (avgLeadTime > 0) leadTimeDays = Math.round(avgLeadTime)
      } else if (supplier.country !== 'France' && supplier.country !== 'FR') {
        leadTimeDays = Math.max(leadTimeDays, 10) // International suppliers take longer
      }

      // Calculate real minimum order quantity from products
      let minimumOrderQuantity = supplier.min_order_quantity || 10
      if (products.length > 0) {
        const avgMoq = products
          .filter(p => p.min_order_quantity)
          .reduce((sum, p) => sum + p.min_order_quantity, 0) /
          products.filter(p => p.min_order_quantity).length
        if (avgMoq > 0) minimumOrderQuantity = Math.round(avgMoq)
      }

      // Get real last order date
      const lastOrderDate = lastOrderBySupplier.get(supplier.id)

      // Determine payment terms from supplier config
      const paymentTerms = supplier.payment_terms 
        ? (Array.isArray(supplier.payment_terms) ? supplier.payment_terms : [supplier.payment_terms])
        : ['Net 30']

      return {
        id: supplier.id,
        name: supplier.name,
        price: estimatedPrice,
        lead_time_days: leadTimeDays,
        minimum_order_quantity: minimumOrderQuantity,
        reliability_score: reliabilityScore,
        quality_score: rating?.quality_score || 50,
        overall_score: rating?.overall_score || reliabilityScore,
        last_order_date: lastOrderDate?.split('T')[0],
        supplier_type: supplier.supplier_type,
        country: supplier.country,
        rating: supplier.rating,
        contact_info: {
          email: supplier.contact_email ? 'Available' : 'Not available',
          phone: supplier.contact_phone ? 'Available' : 'Not available'
        },
        available_payment_terms: paymentTerms,
        estimated_capacity: supplier.capacity || (products.length * 100), // Estimate based on catalog size
        products_in_catalog: products.length,
        data_quality: {
          has_rating: !!rating,
          has_products: products.length > 0,
          has_order_history: !!lastOrderDate
        }
      }
    })

    // Sort backup suppliers based on criteria
    let sortedSuppliers = [...backupSuppliers]
    switch (sort_by) {
      case 'reliability_score':
        sortedSuppliers.sort((a, b) => b.reliability_score - a.reliability_score)
        break
      case 'overall_score':
        sortedSuppliers.sort((a, b) => b.overall_score - a.overall_score)
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
        details: {
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
