import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface IntegrationData {
  user_id: string;
  business_metrics: {
    monthly_revenue: number;
    order_volume: number;
    customer_count: number;
    growth_rate: number;
  };
  current_integrations: string[];
  industry: string;
  company_size: string;
}

interface AIRecommendation {
  integration_name: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  roi_estimate: number;
  impact_score: number;
  confidence: number;
  reasons: string[];
  benefits: string[];
  estimated_setup_time: string;
  implementation_cost: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, business_metrics, current_integrations, industry, company_size } = await req.json() as IntegrationData;

    console.log(`Generating AI recommendations for user: ${user_id}`);

    // Simulate AI analysis based on business metrics and current setup
    const recommendations = await generateAIRecommendations({
      user_id,
      business_metrics,
      current_integrations,
      industry,
      company_size
    });

    // Store recommendations in database
    const { error: insertError } = await supabase
      .from('ai_integration_recommendations')
      .upsert({
        user_id,
        recommendations,
        generated_at: new Date().toISOString(),
        business_context: {
          metrics: business_metrics,
          integrations: current_integrations,
          industry,
          company_size
        }
      });

    if (insertError) {
      console.error('Error storing recommendations:', insertError);
    }

    // Log the recommendation generation
    await supabase
      .from('ai_tasks')
      .insert({
        user_id,
        task_type: 'integration_recommendations',
        status: 'completed',
        input_data: {
          business_metrics,
          current_integrations,
          industry,
          company_size
        },
        output_data: { recommendations },
        processing_time_ms: 150,
        tokens_used: 850,
        cost: 0.02
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        recommendations,
        generated_at: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error) {
    console.error('Error in AI recommendations:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate recommendations',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

async function generateAIRecommendations(data: IntegrationData): Promise<AIRecommendation[]> {
  const { business_metrics, current_integrations, industry, company_size } = data;

  // AI-powered recommendation logic
  const recommendations: AIRecommendation[] = [];

  // E-commerce platform recommendation
  if (!current_integrations.includes('shopify') && !current_integrations.includes('woocommerce')) {
    if (business_metrics.monthly_revenue > 10000) {
      recommendations.push({
        integration_name: 'Shopify Plus',
        category: 'E-commerce',
        priority: 'high',
        roi_estimate: calculateROI(business_metrics.monthly_revenue, 'shopify_plus'),
        impact_score: 95,
        confidence: 92,
        reasons: [
          `Votre CA mensuel de ${business_metrics.monthly_revenue}€ nécessite une plateforme scalable`,
          'Compatible avec vos intégrations existantes',
          'Automatisation avancée disponible pour votre secteur'
        ],
        benefits: [
          '+40% efficacité opérationnelle',
          'Automatisation complète des stocks',
          'Analytics prédictives intégrées'
        ],
        estimated_setup_time: company_size === 'enterprise' ? '3-5 jours' : '2-3 jours',
        implementation_cost: 2500
      });
    } else {
      recommendations.push({
        integration_name: 'WooCommerce',
        category: 'E-commerce',
        priority: 'medium',
        roi_estimate: calculateROI(business_metrics.monthly_revenue, 'woocommerce'),
        impact_score: 78,
        confidence: 85,
        reasons: [
          'Solution flexible pour votre taille d\'entreprise',
          'Coûts réduits comparé aux solutions enterprise',
          'Personnalisation avancée possible'
        ],
        benefits: [
          '+25% efficacité opérationnelle',
          'Contrôle total sur le design',
          'Intégrations WordPress natives'
        ],
        estimated_setup_time: '1-2 jours',
        implementation_cost: 800
      });
    }
  }

  // CRM recommendation based on customer count
  if (!current_integrations.includes('hubspot') && business_metrics.customer_count > 500) {
    recommendations.push({
      integration_name: 'HubSpot CRM',
      category: 'CRM & Marketing',
      priority: 'high',
      roi_estimate: calculateROI(business_metrics.customer_count * 50, 'hubspot'),
      impact_score: 88,
      confidence: 89,
      reasons: [
        `${business_metrics.customer_count} clients nécessitent une gestion CRM avancée`,
        'Potentiel d\'amélioration du taux de conversion détecté',
        'Intégration native avec vos outils existants'
      ],
      benefits: [
        '+35% taux de conversion',
        'Automatisation marketing complète',
        'Scoring leads intelligent'
      ],
      estimated_setup_time: '2-3 jours',
      implementation_cost: 1200
    });
  }

  // Payment optimization
  if (!current_integrations.includes('stripe_advanced') && business_metrics.monthly_revenue > 5000) {
    recommendations.push({
      integration_name: 'Stripe Advanced',
      category: 'Paiements',
      priority: 'medium',
      roi_estimate: calculateROI(business_metrics.monthly_revenue * 0.03, 'stripe_advanced'),
      impact_score: 75,
      confidence: 85,
      reasons: [
        'Optimisation des frais de transaction possible',
        'Détection de fraude améliorée nécessaire',
        'Support multi-devises requis pour votre croissance'
      ],
      benefits: [
        '-12% frais de transaction',
        'Détection fraude IA',
        'Checkout optimisé mobile'
      ],
      estimated_setup_time: '4-6 heures',
      implementation_cost: 500
    });
  }

  // Analytics recommendation for growing businesses
  if (business_metrics.growth_rate > 15 && !current_integrations.includes('analytics')) {
    recommendations.push({
      integration_name: 'Google Analytics 4 + BigQuery',
      category: 'Analytics',
      priority: 'high',
      roi_estimate: calculateROI(business_metrics.monthly_revenue * 0.1, 'analytics'),
      impact_score: 82,
      confidence: 90,
      reasons: [
        `Croissance de ${business_metrics.growth_rate}% nécessite un tracking avancé`,
        'Prédictions comportementales requises',
        'ROI marketing à optimiser'
      ],
      benefits: [
        '+20% ROI marketing',
        'Prédictions comportementales',
        'Segmentation avancée clients'
      ],
      estimated_setup_time: '1-2 jours',
      implementation_cost: 600
    });
  }

  // Sort by priority and impact score
  return recommendations.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;
    return b.impact_score - a.impact_score;
  });
}

function calculateROI(baseValue: number, integrationType: string): number {
  const multipliers = {
    'shopify_plus': 3.4,
    'woocommerce': 2.2,
    'hubspot': 2.8,
    'stripe_advanced': 1.5,
    'analytics': 2.0
  };

  const multiplier = multipliers[integrationType as keyof typeof multipliers] || 1.5;
  return Math.round(baseValue * multiplier / 1000); // Return in thousands
}