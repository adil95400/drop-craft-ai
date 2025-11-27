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

    const { supplierId, threshold = 10 } = await req.json()
    
    console.log('Monitoring stock for supplier:', supplierId, 'threshold:', threshold)
    
    // Get all products from supplier
    const { data: products, error: productsError } = await supabase
      .from('supplier_products')
      .select('*')
      .eq('user_id', user.id)
      .eq('supplier_id', supplierId)
    
    if (productsError) throw productsError
    
    const alerts = []
    const outOfStock = []
    const lowStock = []
    let checkedCount = 0
    
    for (const product of products || []) {
      checkedCount++
      
      if (product.stock_quantity === 0) {
        outOfStock.push({
          sku: product.sku,
          name: product.name,
          stock: 0,
          lastChecked: product.last_synced_at
        })
        
        // Create high priority notification
        await supabase
          .from('supplier_notifications')
          .insert({
            user_id: user.id,
            supplier_id: supplierId,
            notification_type: 'out_of_stock',
            severity: 'high',
            title: `Out of stock: ${product.name}`,
            message: `${product.name} (${product.sku}) is out of stock`,
            data: {
              product_id: product.id,
              sku: product.sku,
              stock: 0
            }
          })
        
        alerts.push({
          type: 'out_of_stock',
          severity: 'high',
          product
        })
      } else if (product.stock_quantity <= threshold) {
        lowStock.push({
          sku: product.sku,
          name: product.name,
          stock: product.stock_quantity,
          threshold,
          lastChecked: product.last_synced_at
        })
        
        // Create medium priority notification
        await supabase
          .from('supplier_notifications')
          .insert({
            user_id: user.id,
            supplier_id: supplierId,
            notification_type: 'low_stock',
            severity: 'medium',
            title: `Low stock: ${product.name}`,
            message: `${product.name} (${product.sku}) has only ${product.stock_quantity} units left`,
            data: {
              product_id: product.id,
              sku: product.sku,
              stock: product.stock_quantity,
              threshold
            }
          })
        
        alerts.push({
          type: 'low_stock',
          severity: 'medium',
          product
        })
      }
    }
    
    // Check for multi-supplier alternatives for out-of-stock products
    const alternatives = []
    for (const outItem of outOfStock) {
      const { data: mappings } = await supabase
        .from('product_supplier_mapping')
        .select('*, supplier:supplier_id(*)')
        .eq('user_id', user.id)
        .eq('product_sku', outItem.sku)
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('priority', { ascending: true })
      
      if (mappings && mappings.length > 0) {
        alternatives.push({
          sku: outItem.sku,
          name: outItem.name,
          alternativeSuppliers: mappings.map(m => ({
            supplierId: m.supplier_id,
            supplierName: m.supplier?.name || 'Unknown',
            stock: m.stock_quantity,
            price: m.supplier_price
          }))
        })
      }
    }
    
    // Update analytics
    await supabase
      .from('supplier_analytics')
      .upsert({
        user_id: user.id,
        supplier_id: supplierId,
        date: new Date().toISOString().split('T')[0],
        out_of_stock_count: outOfStock.length,
        low_stock_count: lowStock.length,
        last_stock_check: new Date().toISOString()
      }, {
        onConflict: 'user_id,supplier_id,date'
      })
    
    // Log monitoring event
    await supabase
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'stock_monitoring',
        entity_type: 'supplier',
        entity_id: supplierId,
        description: `Checked ${checkedCount} products: ${outOfStock.length} out of stock, ${lowStock.length} low stock`,
        metadata: {
          checked: checkedCount,
          out_of_stock: outOfStock.length,
          low_stock: lowStock.length,
          threshold
        }
      })
    
    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          totalChecked: checkedCount,
          outOfStock: outOfStock.length,
          lowStock: lowStock.length,
          alertsCreated: alerts.length
        },
        outOfStock,
        lowStock,
        alternatives,
        alerts: alerts.slice(0, 10) // Return first 10 alerts
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Stock monitoring error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
