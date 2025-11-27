import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { userId, productIds, optimizationTypes, simulationName } = await req.json()

    if (!userId || !productIds || !optimizationTypes) {
      throw new Error('Missing required parameters')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Calculer l'impact prédit basé sur les types d'optimisation
    const impactFactors: Record<string, any> = {
      title: { seo: 20, conversion: 5 },
      description: { seo: 15, conversion: 15 },
      seo: { seo: 25, conversion: 10 },
      pricing: { conversion: 8, revenue: 12 },
      images: { conversion: 18, engagement: 25 },
      attributes: { multiChannel: 30, seo: 10 }
    }

    let totalSeoImprovement = 0
    let totalConversionIncrease = 0
    let estimatedRevenueIncrease = 0

    optimizationTypes.forEach((type: string) => {
      const factors = impactFactors[type] || {}
      totalSeoImprovement += factors.seo || 0
      totalConversionIncrease += factors.conversion || 0
      estimatedRevenueIncrease += factors.revenue || 0
    })

    // Facteur multiplicateur basé sur le nombre de produits
    const productCount = productIds.length
    const revenuePerProduct = 50 // Estimation conservatrice
    estimatedRevenueIncrease = Math.round(
      (estimatedRevenueIncrease / 100) * revenuePerProduct * productCount
    )

    // Niveau de confiance basé sur le nombre d'optimisations
    const confidence = Math.min(0.95, 0.6 + (optimizationTypes.length * 0.07))

    const predictedImpact = {
      seo_improvement: Math.round(totalSeoImprovement),
      conversion_increase: Math.round(totalConversionIncrease),
      revenue_increase: estimatedRevenueIncrease,
      engagement_boost: optimizationTypes.includes('images') ? 25 : 0,
      multi_channel_readiness: optimizationTypes.includes('attributes') ? 30 : 0
    }

    // Enregistrer la simulation
    const { data: simulation, error: simError } = await supabaseClient
      .from('optimization_simulations')
      .insert({
        user_id: userId,
        simulation_name: simulationName,
        product_ids: productIds,
        optimization_types: optimizationTypes,
        predicted_impact: predictedImpact,
        confidence_level: confidence
      })
      .select()
      .single()

    if (simError) throw simError

    return new Response(
      JSON.stringify({
        success: true,
        simulationId: simulation.id,
        predicted_impact: predictedImpact,
        confidence_level: confidence,
        products_count: productCount,
        message: `Simulation créée: ${optimizationTypes.length} type(s) d'optimisation sur ${productCount} produit(s)`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Simulation error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
