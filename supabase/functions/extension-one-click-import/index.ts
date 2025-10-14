import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OneClickImportRequest {
  urls: string[];
  importType: 'products' | 'reviews';
  autoPublish?: boolean;
  priceMultiplier?: number;
}

// Fonction pour extraire les données d'un produit depuis une URL
async function extractProductFromUrl(url: string): Promise<any> {
  // Simulation d'extraction de données produit
  // En production, utiliser un service de scraping ou API fournisseur
  
  const domain = new URL(url).hostname;
  
  // Génération de données simulées basées sur l'URL
  const productId = url.split('/').pop() || 'unknown';
  
  return {
    name: `Produit importé depuis ${domain}`,
    description: `Produit de qualité importé automatiquement. SKU: ${productId}`,
    price: Math.floor(Math.random() * 100) + 10,
    cost_price: Math.floor(Math.random() * 50) + 5,
    sku: `AUTO-${productId.substring(0, 8)}`,
    category: 'Import automatique',
    stock_quantity: Math.floor(Math.random() * 100) + 10,
    image_url: `https://picsum.photos/seed/${productId}/400/400`,
    supplier_url: url,
    supplier_name: domain,
    status: 'active'
  };
}

// Fonction pour extraire les avis depuis une URL
async function extractReviewsFromUrl(url: string): Promise<any[]> {
  // Simulation d'extraction d'avis
  // En production, utiliser un service de scraping ou API
  
  const productId = url.split('/').pop() || 'unknown';
  const reviewCount = Math.floor(Math.random() * 5) + 3;
  
  const reviews = [];
  for (let i = 0; i < reviewCount; i++) {
    reviews.push({
      product_name: `Produit ${productId}`,
      product_sku: `AUTO-${productId.substring(0, 8)}`,
      customer_name: `Client ${i + 1}`,
      rating: Math.floor(Math.random() * 2) + 4, // 4-5 étoiles
      title: `Excellent produit`,
      comment: `Très satisfait de cet achat. Livraison rapide et produit conforme.`,
      verified_purchase: true,
      review_date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'one_click_import'
    });
  }
  
  return reviews;
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

    const { urls, importType, autoPublish = true, priceMultiplier = 1.5 }: OneClickImportRequest = await req.json();

    if (!urls || urls.length === 0) {
      throw new Error('Aucune URL fournie');
    }

    let importedCount = 0;
    const results = [];

    if (importType === 'products') {
      // Import des produits
      for (const url of urls) {
        try {
          const productData = await extractProductFromUrl(url);
          
          // Appliquer le multiplicateur de prix
          productData.price = Math.ceil(productData.cost_price * priceMultiplier);
          productData.user_id = user.id;
          productData.status = autoPublish ? 'active' : 'draft';

          const { data: insertedProduct, error } = await supabaseClient
            .from('products')
            .insert(productData)
            .select()
            .single();

          if (error) throw error;

          results.push({ url, success: true, product: insertedProduct });
          importedCount++;
        } catch (error) {
          console.error(`Erreur import produit ${url}:`, error);
          results.push({ url, success: false, error: error.message });
        }
      }
    } else if (importType === 'reviews') {
      // Import des avis
      for (const url of urls) {
        try {
          const reviewsData = await extractReviewsFromUrl(url);
          
          reviewsData.forEach(review => {
            review.user_id = user.id;
          });

          const { data: insertedReviews, error } = await supabaseClient
            .from('imported_reviews')
            .insert(reviewsData)
            .select();

          if (error) throw error;

          results.push({ url, success: true, reviews: insertedReviews });
          importedCount += insertedReviews?.length || 0;
        } catch (error) {
          console.error(`Erreur import avis ${url}:`, error);
          results.push({ url, success: false, error: error.message });
        }
      }
    }

    // Log de l'activité
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'one_click_import',
        description: `Import ${importType} en un clic: ${importedCount} éléments importés`,
        metadata: {
          import_type: importType,
          urls_count: urls.length,
          imported_count: importedCount,
          timestamp: new Date().toISOString(),
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        imported: importedCount,
        total_urls: urls.length,
        results,
        message: `${importedCount} ${importType} importé(s) avec succès sur ${urls.length} URL(s)`,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erreur one-click import:', error);
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
