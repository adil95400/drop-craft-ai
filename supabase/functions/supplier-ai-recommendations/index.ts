import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const {
      data: { user },
    } = await supabaseClient.auth.getUser()

    if (!user) {
      throw new Error('User not authenticated')
    }

    console.log(`[AI-RECOMMENDATIONS] Generating recommendations for user ${user.id}`)

    const recommendations: any[] = []

    // 1. RECOMMANDATION: Produits à fort potentiel
    const { data: highPotentialProducts } = await supabaseClient
      .from('supplier_products_unified')
      .select('*')
      .eq('user_id', user.id)
      .gte('profit_margin', 30)
      .gte('stock_quantity', 50)
      .eq('is_active', true)
      .order('ai_score', { ascending: false })
      .limit(5)

    if (highPotentialProducts && highPotentialProducts.length > 0) {
      for (const product of highPotentialProducts) {
        recommendations.push({
          user_id: user.id,
          recommendation_type: 'product_to_import',
          target_entity_type: 'product',
          target_entity_id: product.id,
          title: `Produit à fort potentiel : ${product.title}`,
          description: `Marge de ${product.profit_margin}%, stock de ${product.stock_quantity} unités. Score IA: ${(product.ai_score * 100).toFixed(0)}%`,
          confidence_score: product.ai_score || 0.75,
          suggested_actions: [
            {
              action: 'import',
              label: 'Importer dans le catalogue',
              params: { product_id: product.id }
            },
            {
              action: 'analyze',
              label: 'Analyse détaillée',
              params: { product_id: product.id }
            }
          ],
          estimated_impact: {
            revenue: (product.retail_price * 50),
            profit: ((product.retail_price - product.cost_price) * 50),
            margin: product.profit_margin
          },
          reasoning: {
            factors: [
              `Marge bénéficiaire élevée (${product.profit_margin}%)`,
              `Stock disponible (${product.stock_quantity} unités)`,
              product.ai_score > 0.8 ? 'Score IA excellent' : 'Score IA bon'
            ]
          },
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 jours
          is_active: true,
          status: 'pending'
        })
      }
    }

    // 2. RECOMMANDATION: Ajustement de prix
    const { data: pricingProducts } = await supabaseClient
      .from('supplier_products_unified')
      .select('*')
      .eq('user_id', user.id)
      .lt('profit_margin', 15)
      .eq('is_active', true)
      .limit(5)

    if (pricingProducts && pricingProducts.length > 0) {
      for (const product of pricingProducts) {
        const suggestedPrice = product.cost_price * 1.4 // 40% de marge
        const additionalProfit = (suggestedPrice - product.retail_price) * 20 // Estimation sur 20 ventes
        
        recommendations.push({
          user_id: user.id,
          recommendation_type: 'price_adjustment',
          target_entity_type: 'product',
          target_entity_id: product.id,
          title: `Augmenter le prix de ${product.title}`,
          description: `Marge actuelle faible (${product.profit_margin}%). Prix suggéré: ${suggestedPrice.toFixed(2)}€ pour une marge de 40%`,
          confidence_score: 0.85,
          suggested_actions: [
            {
              action: 'update_price',
              label: 'Appliquer le nouveau prix',
              params: { product_id: product.id, new_price: suggestedPrice }
            }
          ],
          estimated_impact: {
            revenue_increase: additionalProfit,
            new_margin: 40,
            current_margin: product.profit_margin
          },
          reasoning: {
            current_price: product.retail_price,
            suggested_price: suggestedPrice,
            justification: 'Marge trop faible par rapport aux standards du marché'
          },
          expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true,
          status: 'pending'
        })
      }
    }

    // 3. RECOMMANDATION: Alerte stock faible
    const { data: lowStockProducts } = await supabaseClient
      .from('supplier_products_unified')
      .select('*')
      .eq('user_id', user.id)
      .eq('stock_status', 'low_stock')
      .eq('is_active', true)
      .order('conversion_rate', { ascending: false })
      .limit(5)

    if (lowStockProducts && lowStockProducts.length > 0) {
      for (const product of lowStockProducts) {
        // Vérifier s'il existe des fournisseurs alternatifs
        const { data: alternativeSuppliers } = await supabaseClient
          .from('product_supplier_mapping')
          .select('backup_suppliers')
          .eq('product_id', product.id)
          .single()

        const hasAlternatives = alternativeSuppliers?.backup_suppliers?.length > 0

        recommendations.push({
          user_id: user.id,
          recommendation_type: 'stock_alert',
          target_entity_type: 'product',
          target_entity_id: product.id,
          title: `Stock faible : ${product.title}`,
          description: `Seulement ${product.stock_quantity} unités restantes. ${hasAlternatives ? 'Fournisseurs alternatifs disponibles.' : 'Aucun fournisseur alternatif.'}`,
          confidence_score: 0.9,
          suggested_actions: hasAlternatives ? [
            {
              action: 'switch_supplier',
              label: 'Basculer vers fournisseur alternatif',
              params: { product_id: product.id }
            }
          ] : [
            {
              action: 'find_alternative',
              label: 'Rechercher fournisseur alternatif',
              params: { product_id: product.id }
            }
          ],
          estimated_impact: {
            risk_level: 'high',
            potential_lost_sales: product.conversion_rate * 100
          },
          reasoning: {
            current_stock: product.stock_quantity,
            conversion_rate: product.conversion_rate,
            has_alternatives: hasAlternatives
          },
          expires_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 jours
          is_active: true,
          status: 'pending'
        })
      }
    }

    // Insérer toutes les recommandations
    if (recommendations.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('supplier_ai_recommendations')
        .insert(recommendations)

      if (insertError) {
        console.error('[AI-RECOMMENDATIONS] Error inserting recommendations:', insertError)
      }

      // Créer notification
      await supabaseClient.rpc('create_supplier_notification', {
        p_user_id: user.id,
        p_type: 'ai_recommendations',
        p_title: 'Nouvelles recommandations IA',
        p_message: `${recommendations.length} nouvelles recommandations disponibles`,
        p_priority: 'medium',
        p_data: { count: recommendations.length }
      })
    }

    console.log(`[AI-RECOMMENDATIONS] Generated ${recommendations.length} recommendations`)

    return new Response(
      JSON.stringify({
        success: true,
        count: recommendations.length,
        recommendations: recommendations.map(r => ({
          type: r.recommendation_type,
          title: r.title,
          confidence: r.confidence_score
        }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[AI-RECOMMENDATIONS] Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})