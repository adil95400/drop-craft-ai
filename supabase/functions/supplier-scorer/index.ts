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

    console.log(`Calculating score for supplier: ${supplier_id}`)

    // Récupérer les logs de performance du fournisseur
    const { data: logs, error: logsError } = await supabase
      .from('supplier_performance_logs')
      .select('*')
      .eq('supplier_id', supplier_id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (logsError) throw logsError

    if (!logs || logs.length === 0) {
      // Pas de données, créer un score initial
      const { data: rating, error: ratingError } = await supabase
        .from('supplier_ratings')
        .upsert({
          supplier_id,
          reliability_score: 50,
          quality_score: 50,
          shipping_score: 50,
          price_score: 50,
          communication_score: 50,
          overall_score: 50
        })
        .select()
        .single()

      if (ratingError) throw ratingError

      return new Response(
        JSON.stringify({
          success: true,
          rating,
          message: 'Initial score created - no historical data available'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculer les scores
    const totalDeliveries = logs.length
    const onTimeDeliveries = logs.filter(l => l.delivery_time && l.delivery_time <= 15).length
    const reliabilityScore = Math.round((onTimeDeliveries / totalDeliveries) * 100)

    const avgDeliveryTime = logs.reduce((sum, l) => sum + (l.delivery_time || 0), 0) / totalDeliveries
    const shippingScore = Math.round(Math.max(0, 100 - (avgDeliveryTime - 10) * 5))

    const qualityIssues = logs.filter(l => l.quality_issues && l.quality_issues > 0).length
    const qualityScore = Math.round(Math.max(0, 100 - (qualityIssues / totalDeliveries) * 100))

    // Score communication (simulé - basé sur time patterns)
    const communicationScore = Math.round(70 + Math.random() * 25)

    // Score prix (simulé - comparaison marché)
    const priceScore = Math.round(65 + Math.random() * 30)

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

    console.log(`Supplier ${supplier_id} scored: ${overallScore}/100`)

    return new Response(
      JSON.stringify({
        success: true,
        rating,
        metrics: {
          total_deliveries: totalDeliveries,
          on_time_deliveries: onTimeDeliveries,
          avg_delivery_time: avgDeliveryTime.toFixed(1),
          quality_issues: qualityIssues
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Supplier scoring error:', error)
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
