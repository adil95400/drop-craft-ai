/**
 * Auto Stock Reorder — SECURED (JWT-first, RLS-enforced)
 */
import { requireAuth, handlePreflight, successResponse } from '../_shared/jwt-auth.ts'

Deno.serve(async (req) => {
  const preflight = handlePreflight(req)
  if (preflight) return preflight

  try {
    const { userId, supabase, corsHeaders } = await requireAuth(req)

    // RLS-scoped: get stock levels needing reorder
    const { data: stockLevels, error: stockError } = await supabase
      .from('stock_levels')
      .select('*, product:products(*), warehouse:warehouses(*)')
      .lte('available_quantity', 'reorder_point')

    if (stockError) throw stockError

    const reorderResults = []

    for (const level of stockLevels || []) {
      const reorderQuantity = level.optimal_reorder_quantity ||
        (level.max_stock_level - level.available_quantity)

      const { data: prediction } = await supabase
        .from('stock_predictions')
        .select('predicted_reorder_date, confidence_score')
        .eq('product_id', level.product_id)
        .eq('warehouse_id', level.warehouse_id)
        .gte('valid_until', new Date().toISOString())
        .single()

      const recommendation = {
        product_id: level.product_id,
        warehouse_id: level.warehouse_id,
        current_stock: level.available_quantity,
        reorder_point: level.reorder_point,
        recommended_quantity: reorderQuantity,
        estimated_cost: reorderQuantity * (level.product?.price || 0) * 0.6,
        urgency: level.available_quantity === 0 ? 'critical' :
                 level.available_quantity < level.reorder_point * 0.5 ? 'high' : 'medium',
        ai_prediction: prediction ? {
          predicted_stockout_date: prediction.predicted_reorder_date,
          confidence: prediction.confidence_score,
        } : null,
      }

      reorderResults.push(recommendation)

      if (recommendation.urgency === 'critical') {
        await supabase.from('stock_alerts').insert({
          user_id: userId,
          product_id: level.product_id,
          warehouse_id: level.warehouse_id,
          alert_type: 'out_of_stock',
          severity: 'critical',
          message: `Stock épuisé pour ${level.product?.name || level.product?.title} à ${level.warehouse?.name}`,
          current_quantity: 0,
          threshold_quantity: level.reorder_point,
          recommended_action: `Commander ${reorderQuantity} unités immédiatement`,
        })
      }
    }

    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'auto_reorder_check',
      entity_type: 'stock',
      description: `Vérification automatique: ${reorderResults.length} produits nécessitent un réapprovisionnement`,
      metadata: { recommendations_count: reorderResults.length },
    })

    return successResponse({
      success: true,
      reorder_recommendations: reorderResults,
      count: reorderResults.length,
    }, corsHeaders)

  } catch (err) {
    if (err instanceof Response) return err
    console.error('[auto-stock-reorder] Error:', err)
    const origin = req.headers.get('origin')
    const { getSecureCorsHeaders } = await import('../_shared/cors.ts')
    return new Response(
      JSON.stringify({ success: false, error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...getSecureCorsHeaders(origin), 'Content-Type': 'application/json' } }
    )
  }
})
