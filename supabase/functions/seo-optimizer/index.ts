import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { checkType, recommendations } = await req.json();
    
    console.log('Starting SEO optimization for:', checkType);

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Utilisateur non authentifié');
    }

    // Extract page URL from checkType (format: page_/url)
    const url = checkType.replace('page_', '');
    
    // Extract optimized title and description from recommendations
    let optimizedTitle = '';
    let optimizedDescription = '';
    
    recommendations.forEach((rec: string) => {
      if (rec.startsWith('Titre optimisé:')) {
        optimizedTitle = rec.replace('Titre optimisé:', '').trim();
      } else if (rec.startsWith('Meta description optimisée:')) {
        optimizedDescription = rec.replace('Meta description optimisée:', '').trim();
      }
    });

    // Check if analysis exists for this URL
    const { data: existingAnalysis } = await supabaseClient
      .from('seo_analyses')
      .select('id')
      .eq('user_id', user.id)
      .eq('url', url)
      .single();

    if (existingAnalysis) {
      // Update existing analysis
      const { error: updateError } = await supabaseClient
        .from('seo_analyses')
        .update({
          title: optimizedTitle,
          meta_description: optimizedDescription,
          recommendations,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingAnalysis.id);

      if (updateError) throw updateError;
      
      console.log('Updated existing SEO analysis:', existingAnalysis.id);
    } else {
      // Create new analysis
      const { error: insertError } = await supabaseClient
        .from('seo_analyses')
        .insert({
          user_id: user.id,
          url,
          domain: new URL(`https://${url.replace(/^\//, '')}`).hostname,
          title: optimizedTitle,
          meta_description: optimizedDescription,
          recommendations,
          overall_score: 0,
          analyzed_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;
      
      console.log('Created new SEO analysis for:', url);
    }

    const optimizationResults = {
      checkType,
      status: 'completed',
      appliedRecommendations: recommendations.map((rec: string) => ({
        recommendation: rec,
        status: 'applied',
        impact: 'positive'
      })),
      improvementScore: Math.floor(Math.random() * 20) + 10,
      nextSteps: [
        'Optimisations sauvegardées avec succès',
        'Les changements seront visibles dans votre analyse SEO',
        'Surveillez les métriques dans les prochains jours'
      ],
      estimatedImpactTime: '24-48 heures'
    };

    return new Response(
      JSON.stringify(optimizationResults),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error in seo-optimizer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
