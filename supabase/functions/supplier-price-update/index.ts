import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    
    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { supplierId, mode = 'auto' } = await req.json()
    
    console.log('Updating prices for supplier:', supplierId, 'mode:', mode)
    
    // Get pricing rules for this supplier
    const { data: pricingRules, error: rulesError } = await supabase
      .from('supplier_pricing_rules')
      .select('*')
      .eq('user_id', user.id)
      .eq('supplier_id', supplierId)
      .eq('is_active', true)
      .order('priority', { ascending: false })
    
    if (rulesError) throw rulesError
    
    if (!pricingRules || pricingRules.length === 0) {
      console.log('No active pricing rules found, using default markup')
      // Use default 50% markup if no rules
      pricingRules.push({
        rule_type: 'fixed_markup',
        rule_config: { markup_percentage: 50 },
        is_active: true
      })
    }
    
    // Get all products from this supplier
    const { data: supplierProducts, error: productsError } = await supabase
      .from('supplier_products')
      .select('*')
      .eq('user_id', user.id)
      .eq('supplier_id', supplierId)
    
    if (productsError) throw productsError
    
    let updatedCount = 0
    let changedPrices = []
    
    for (const product of supplierProducts || []) {
      const costPrice = product.cost_price || product.price * 0.7
      
      // Apply pricing rules
      let newPrice = costPrice
      
      for (const rule of pricingRules) {
        switch (rule.rule_type) {
          case 'fixed_markup': {
            const markup = rule.rule_config.markup_percentage || 50
            newPrice = costPrice * (1 + markup / 100)
            break
          }
          case 'target_margin': {
            const margin = rule.rule_config.target_margin_percentage || 30
            newPrice = costPrice / (1 - margin / 100)
            break
          }
          case 'competitive': {
            const basePrice = costPrice * 1.5
            const adjustment = rule.rule_config.competitive_adjustment || 0
            newPrice = basePrice * (1 + adjustment / 100)
            break
          }
          case 'minimum_threshold': {
            const minPrice = rule.rule_config.minimum_price || costPrice * 1.2
            newPrice = Math.max(newPrice, minPrice)
            break
          }
        }
      }
      
      // Round to 2 decimals
      newPrice = Math.round(newPrice * 100) / 100
      
      // Check if price changed
      if (Math.abs(newPrice - product.price) > 0.01) {
        const { error: updateError } = await supabase
          .from('supplier_products')
          .update({
            price: newPrice,
            price_last_updated: new Date().toISOString()
          })
          .eq('id', product.id)
        
        if (!updateError) {
          updatedCount++
          changedPrices.push({
            sku: product.sku,
            oldPrice: product.price,
            newPrice,
            change: ((newPrice - product.price) / product.price * 100).toFixed(2) + '%'
          })
          
          // Create notification for significant price changes (>10%)
          const changePercent = Math.abs((newPrice - product.price) / product.price * 100)
          if (changePercent > 10) {
            await supabase
              .from('supplier_notifications')
              .insert({
                user_id: user.id,
                supplier_id: supplierId,
                notification_type: 'price_change',
                severity: changePercent > 20 ? 'high' : 'medium',
                title: `Price change: ${product.name}`,
                message: `Price changed from $${product.price} to $${newPrice} (${changePercent.toFixed(1)}%)`,
                data: {
                  product_id: product.id,
                  sku: product.sku,
                  old_price: product.price,
                  new_price: newPrice,
                  change_percent: changePercent
                }
              })
          }
        }
      }
    }
    
    // Log price update event
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'supplier_prices_updated',
        entity_type: 'supplier',
        entity_id: supplierId,
        description: `Updated prices for ${updatedCount} products`,
        metadata: {
          updated_count: updatedCount,
          total_products: supplierProducts?.length || 0,
          sample_changes: changedPrices.slice(0, 5)
        }
      })
    
    return new Response(
      JSON.stringify({
        success: true,
        updatedCount,
        totalProducts: supplierProducts?.length || 0,
        changedPrices: changedPrices.slice(0, 20), // Return first 20 for preview
        rulesApplied: pricingRules.map(r => r.rule_type)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Price update error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
