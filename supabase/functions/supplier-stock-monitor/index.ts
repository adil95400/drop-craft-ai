/**
 * Supplier Stock Monitor — SECURED (JWT-first, RLS-enforced)
 */

import { requireAuth, handlePreflight, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    const { supplierId, threshold = 10 } = await req.json()

    const { data: products, error: productsError } = await supabase
      .from('supplier_products')
      .select('*')
      .eq('user_id', userId)
      .eq('supplier_id', supplierId)

    if (productsError) throw productsError

    const alerts: any[] = []
    const outOfStock: any[] = []
    const lowStock: any[] = []
    let checkedCount = 0

    for (const product of products || []) {
      checkedCount++

      if (product.stock_quantity === 0) {
        outOfStock.push({ sku: product.sku, name: product.name, stock: 0, lastChecked: product.last_synced_at })

        await supabase.from('supplier_notifications').insert({
          user_id: userId, supplier_id: supplierId,
          notification_type: 'out_of_stock', severity: 'high',
          title: `Rupture de stock: ${product.name}`,
          message: `${product.name} (${product.sku}) est en rupture de stock`,
          data: { product_id: product.id, sku: product.sku, stock: 0 },
        })
        alerts.push({ type: 'out_of_stock', severity: 'high', product })
      } else if (product.stock_quantity <= threshold) {
        lowStock.push({ sku: product.sku, name: product.name, stock: product.stock_quantity, threshold, lastChecked: product.last_synced_at })

        await supabase.from('supplier_notifications').insert({
          user_id: userId, supplier_id: supplierId,
          notification_type: 'low_stock', severity: 'medium',
          title: `Stock bas: ${product.name}`,
          message: `${product.name} (${product.sku}) n'a plus que ${product.stock_quantity} unités`,
          data: { product_id: product.id, sku: product.sku, stock: product.stock_quantity, threshold },
        })
        alerts.push({ type: 'low_stock', severity: 'medium', product })
      }
    }

    // Check alternatives for OOS products
    const alternatives: any[] = []
    for (const outItem of outOfStock) {
      const { data: mappings } = await supabase
        .from('product_supplier_mapping')
        .select('*, supplier:supplier_id(*)')
        .eq('user_id', userId)
        .eq('product_sku', outItem.sku)
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .order('priority', { ascending: true })

      if (mappings && mappings.length > 0) {
        alternatives.push({
          sku: outItem.sku, name: outItem.name,
          alternativeSuppliers: mappings.map((m: any) => ({
            supplierId: m.supplier_id, supplierName: m.supplier?.name || 'Unknown',
            stock: m.stock_quantity, price: m.supplier_price,
          })),
        })
      }
    }

    await supabase.from('activity_logs').insert({
      user_id: userId, action: 'stock_monitoring', entity_type: 'supplier', entity_id: supplierId,
      description: `Vérifié ${checkedCount} produits: ${outOfStock.length} ruptures, ${lowStock.length} stocks bas`,
      details: { checked: checkedCount, out_of_stock: outOfStock.length, low_stock: lowStock.length, threshold },
    })

    return successResponse({
      success: true,
      summary: { totalChecked: checkedCount, outOfStock: outOfStock.length, lowStock: lowStock.length, alertsCreated: alerts.length },
      outOfStock, lowStock, alternatives, alerts: alerts.slice(0, 10),
    }, corsHeaders)

  } catch (err) {
    if (err instanceof Response) return err
    console.error('[supplier-stock-monitor] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})
