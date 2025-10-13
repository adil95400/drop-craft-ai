import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReviewImportRequest {
  source: 'csv' | 'json' | 'trustpilot' | 'google' | 'amazon';
  data?: any[];
  apiUrl?: string;
  apiKey?: string;
  productMapping?: Record<string, string>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
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
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Non authentifié');
    }

    const { source, data, apiUrl, apiKey, productMapping }: ReviewImportRequest = await req.json();

    let reviews: any[] = [];

    // Import depuis différentes sources
    if (source === 'csv' || source === 'json') {
      reviews = data || [];
    } else if (source === 'trustpilot' && apiUrl) {
      // Import depuis Trustpilot
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`Erreur Trustpilot: ${response.statusText}`);
      }
      const trustpilotData = await response.json();
      reviews = trustpilotData.reviews || [];
    } else if (source === 'google' && apiUrl) {
      // Import depuis Google Reviews
      const response = await fetch(`${apiUrl}?key=${apiKey}`);
      if (!response.ok) {
        throw new Error(`Erreur Google: ${response.statusText}`);
      }
      const googleData = await response.json();
      reviews = googleData.result?.reviews || [];
    } else if (source === 'amazon' && data) {
      reviews = data;
    }

    // Créer la table imported_reviews si elle n'existe pas
    await supabaseClient.rpc('create_imported_reviews_table_if_not_exists');

    // Normalisation et insertion des avis
    const normalizedReviews = reviews.map(r => ({
      product_name: r.product_name || r.productName || '',
      product_sku: r.product_sku || r.sku || '',
      customer_name: r.customer_name || r.author_name || r.name || 'Anonyme',
      rating: parseFloat(r.rating || r.stars || 0),
      title: r.title || '',
      comment: r.comment || r.text || r.review || '',
      verified_purchase: r.verified_purchase || r.verified || false,
      review_date: r.review_date || r.date || new Date().toISOString(),
      source: source,
      user_id: user.id,
    }));

    const { data: insertedReviews, error } = await supabaseClient
      .from('imported_reviews')
      .insert(normalizedReviews)
      .select();

    if (error) throw error;

    // Mettre à jour les statistiques des produits
    for (const review of normalizedReviews) {
      if (review.product_sku) {
        const { data: product } = await supabaseClient
          .from('products')
          .select('id, rating, reviews_count')
          .eq('sku', review.product_sku)
          .eq('user_id', user.id)
          .single();

        if (product) {
          const newReviewsCount = (product.reviews_count || 0) + 1;
          const currentRating = product.rating || 0;
          const newRating = ((currentRating * (product.reviews_count || 0)) + review.rating) / newReviewsCount;

          await supabaseClient
            .from('products')
            .update({
              rating: newRating,
              reviews_count: newReviewsCount,
            })
            .eq('id', product.id);
        }
      }
    }

    // Log de l'activité
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'extension_review_import',
        description: `Import de ${insertedReviews?.length || 0} avis via extension`,
        metadata: {
          source,
          count: insertedReviews?.length || 0,
          timestamp: new Date().toISOString(),
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        imported: insertedReviews?.length || 0,
        reviews: insertedReviews,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erreur import avis:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
