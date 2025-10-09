import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface ProfitRequest {
  userId: string
  productId: string
  sellingPrice: number
  costPrice: number
  additionalCosts?: {
    shipping?: number
    marketing?: number
    platform_fees?: number
    packaging?: number
    other?: number
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { userId, productId, sellingPrice, costPrice, additionalCosts = {} } = await req.json() as ProfitRequest

    console.log(`Calculating profit for product ${productId}`)

    // Calculer les coûts additionnels totaux
    const totalAdditionalCosts = Object.values(additionalCosts).reduce((sum, cost) => sum + (cost || 0), 0)

    // Calculs de profit
    const grossProfit = sellingPrice - costPrice
    const grossMarginPercent = sellingPrice > 0 ? (grossProfit / sellingPrice * 100) : 0
    
    const netProfit = grossProfit - totalAdditionalCosts
    const netMarginPercent = sellingPrice > 0 ? (netProfit / sellingPrice * 100) : 0
    
    // Break-even units (nombre d'unités à vendre pour atteindre le seuil de rentabilité)
    const breakEvenUnits = netProfit > 0 ? Math.ceil(totalAdditionalCosts / netProfit) : 0
    
    // ROI (Return on Investment)
    const totalInvestment = costPrice + totalAdditionalCosts
    const roiPercent = totalInvestment > 0 ? ((netProfit / totalInvestment) * 100) : 0

    // Insérer le calcul dans la base de données
    const { data: calculation, error } = await supabase
      .from('profit_calculations')
      .insert({
        user_id: userId,
        product_id: productId,
        selling_price: sellingPrice,
        cost_price: costPrice,
        additional_costs: additionalCosts,
        net_profit: netProfit,
        net_margin_percent: netMarginPercent,
        break_even_units: breakEvenUnits,
        roi_percent: roiPercent
      })
      .select()
      .single()

    if (error) throw error

    // Analyse et recommandations
    const recommendations = []
    
    if (netMarginPercent < 20) {
      recommendations.push({
        type: 'warning',
        message: 'Marge nette faible (<20%). Considérez augmenter le prix ou réduire les coûts.'
      })
    }
    
    if (netMarginPercent > 50) {
      recommendations.push({
        type: 'opportunity',
        message: 'Marge élevée. Vous pourriez baisser le prix pour être plus compétitif.'
      })
    }
    
    if (breakEvenUnits > 100) {
      recommendations.push({
        type: 'risk',
        message: `Seuil de rentabilité élevé (${breakEvenUnits} unités). Réduisez les coûts fixes.`
      })
    }

    return new Response(
      JSON.stringify({
        success: true,
        calculation: {
          ...calculation,
          gross_profit: grossProfit,
          gross_margin_percent: grossMarginPercent
        },
        analysis: {
          profitability: netMarginPercent > 30 ? 'excellent' : netMarginPercent > 20 ? 'good' : netMarginPercent > 10 ? 'fair' : 'poor',
          risk_level: breakEvenUnits > 100 ? 'high' : breakEvenUnits > 50 ? 'medium' : 'low',
          recommendations
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Profit calculation error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})