import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface SupplierPerformance {
  supplier_id: string
  on_time_deliveries: number
  total_deliveries: number
  avg_delivery_time: number
  quality_issues: number
  total_orders: number
  avg_response_time: number
  price_competitiveness: number
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Authorization required')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      throw new Error('Invalid authentication')
    }

    const { supplier_id } = await req.json()

    console.log(`[SUPPLIER-SCORER] Calculating score for supplier: ${supplier_id}`)

    // Récupérer les logs de performance du fournisseur
    const { data: logs, error: logsError } = await supabase
      .from('supplier_performance_logs')
      .select('*')
      .eq('supplier_id', supplier_id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (logsError) throw logsError

    // Récupérer les commandes fournisseur pour calculer les vrais scores
    const { data: supplierOrders, error: ordersError } = await supabase
      .from('bulk_order_items')
      .select('*, bulk_orders(*)')
      .eq('supplier_id', supplier_id)
      .order('created_at', { ascending: false })
      .limit(50)

    // Récupérer les messages/communications du fournisseur
    const { data: communications, error: commsError } = await supabase
      .from('activity_logs')
      .select('created_at, details')
      .eq('entity_type', 'supplier')
      .eq('entity_id', supplier_id)
      .in('action', ['message_sent', 'message_received', 'response_received'])
      .order('created_at', { ascending: false })
      .limit(20)

    // Récupérer les produits du fournisseur pour comparer les prix
    const { data: supplierProducts, error: productsError } = await supabase
      .from('supplier_products')
      .select('price, market_price, cost_price')
      .eq('supplier_id', supplier_id)
      .not('price', 'is', null)
      .limit(50)

    // Calculer le score de fiabilité basé sur les données réelles
    let reliabilityScore = 50 // Score de base
    let qualityScore = 50
    let shippingScore = 50
    let communicationScore = 50
    let priceScore = 50

    // Score de fiabilité basé sur les logs de performance
    if (logs && logs.length > 0) {
      const totalDeliveries = logs.length
      const onTimeDeliveries = logs.filter(l => l.delivery_time && l.delivery_time <= 15).length
      reliabilityScore = Math.round((onTimeDeliveries / totalDeliveries) * 100)

      const avgDeliveryTime = logs.reduce((sum, l) => sum + (l.delivery_time || 0), 0) / totalDeliveries
      shippingScore = Math.round(Math.max(0, 100 - (avgDeliveryTime - 10) * 5))

      const qualityIssues = logs.filter(l => l.quality_issues && l.quality_issues > 0).length
      qualityScore = Math.round(Math.max(0, 100 - (qualityIssues / totalDeliveries) * 100))
    } else if (supplierOrders && supplierOrders.length > 0) {
      // Fallback: calculer à partir des commandes
      const completedOrders = supplierOrders.filter(o => o.status === 'completed' || o.status === 'delivered')
      reliabilityScore = supplierOrders.length > 0 
        ? Math.round((completedOrders.length / supplierOrders.length) * 100)
        : 50
    }

    // Score de communication basé sur les temps de réponse réels
    if (communications && communications.length >= 2) {
      const responseTimes: number[] = []
      for (let i = 1; i < communications.length; i++) {
        const diff = new Date(communications[i-1].created_at).getTime() - 
                     new Date(communications[i].created_at).getTime()
        if (diff > 0 && diff < 72 * 60 * 60 * 1000) { // Less than 72 hours
          responseTimes.push(diff)
        }
      }
      if (responseTimes.length > 0) {
        const avgResponseMs = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        const avgResponseHours = avgResponseMs / (1000 * 60 * 60)
        // <4h = 100, 4-12h = 80, 12-24h = 60, 24-48h = 40, >48h = 20
        if (avgResponseHours < 4) communicationScore = 100
        else if (avgResponseHours < 12) communicationScore = 80
        else if (avgResponseHours < 24) communicationScore = 60
        else if (avgResponseHours < 48) communicationScore = 40
        else communicationScore = 20
      }
    }

    // Score de prix basé sur la comparaison marché réelle
    if (supplierProducts && supplierProducts.length > 0) {
      const priceRatios: number[] = []
      for (const product of supplierProducts) {
        const marketPrice = product.market_price || product.cost_price
        if (marketPrice && product.price) {
          priceRatios.push(product.price / marketPrice)
        }
      }
      if (priceRatios.length > 0) {
        const avgRatio = priceRatios.reduce((a, b) => a + b, 0) / priceRatios.length
        // Ratio < 0.8 = excellent (90+), 0.8-1.0 = good (70-90), 1.0-1.2 = average (50-70), >1.2 = poor (<50)
        if (avgRatio < 0.8) priceScore = 90 + Math.round((0.8 - avgRatio) * 50)
        else if (avgRatio < 1.0) priceScore = 70 + Math.round((1.0 - avgRatio) * 100)
        else if (avgRatio < 1.2) priceScore = 50 + Math.round((1.2 - avgRatio) * 100)
        else priceScore = Math.max(10, 50 - Math.round((avgRatio - 1.2) * 50))
        priceScore = Math.min(100, Math.max(0, priceScore))
      }
    }

    // Score global (pondéré)
    const overallScore = Math.round(
      reliabilityScore * 0.30 +
      qualityScore * 0.25 +
      shippingScore * 0.20 +
      priceScore * 0.15 +
      communicationScore * 0.10
    )

    // Mettre à jour ou créer le rating
    const { data: rating, error: ratingError } = await supabase
      .from('supplier_ratings')
      .upsert({
        supplier_id,
        reliability_score: reliabilityScore,
        quality_score: qualityScore,
        shipping_score: shippingScore,
        price_score: priceScore,
        communication_score: communicationScore,
        overall_score: overallScore,
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (ratingError) throw ratingError

    console.log(`[SUPPLIER-SCORER] Supplier ${supplier_id} scored: ${overallScore}/100`)

    return new Response(
      JSON.stringify({
        success: true,
        rating,
        metrics: {
          total_performance_logs: logs?.length || 0,
          total_orders: supplierOrders?.length || 0,
          total_communications: communications?.length || 0,
          products_analyzed: supplierProducts?.length || 0,
          data_sources: {
            has_performance_logs: (logs?.length || 0) > 0,
            has_orders: (supplierOrders?.length || 0) > 0,
            has_communications: (communications?.length || 0) > 0,
            has_products: (supplierProducts?.length || 0) > 0
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[SUPPLIER-SCORER] Error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
