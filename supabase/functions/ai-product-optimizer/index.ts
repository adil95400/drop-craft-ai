import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { productIds, userId } = await req.json();

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      throw new Error('productIds array is required');
    }

    console.log(`Optimizing ${productIds.length} products for user ${userId}`);

    // Récupérer les produits
    const { data: products, error: fetchError } = await supabase
      .from('imported_products')
      .select('*')
      .in('id', productIds)
      .eq('user_id', userId);

    if (fetchError) throw fetchError;

    const optimizedCount = [];
    const errors = [];

    // Optimiser chaque produit
    for (const product of products) {
      try {
        // Amélioration du titre (ajouter des mots-clés)
        const optimizedTitle = optimizeTitle(product.name);
        
        // Amélioration de la description
        const optimizedDescription = optimizeDescription(product.description, product.name);
        
        // Calcul du prix optimal (prix arrondi, marge optimale)
        const optimizedPrice = optimizePrice(product.price, product.cost_price);

        // Mise à jour du produit
        const { error: updateError } = await supabase
          .from('imported_products')
          .update({
            name: optimizedTitle,
            description: optimizedDescription,
            price: optimizedPrice,
            ai_optimized: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id)
          .eq('user_id', userId);

        if (updateError) throw updateError;

        optimizedCount.push(product.id);

        // Logger l'optimisation
        await supabase
          .from('activity_logs')
          .insert({
            user_id: userId,
            action: 'product_optimized',
            entity_type: 'product',
            entity_id: product.id,
            description: `Product optimized by AI: ${product.name}`,
            metadata: {
              original_title: product.name,
              optimized_title: optimizedTitle,
              original_price: product.price,
              optimized_price: optimizedPrice
            }
          });

      } catch (error) {
        console.error(`Error optimizing product ${product.id}:`, error);
        errors.push({
          productId: product.id,
          error: error.message
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        optimized: optimizedCount.length,
        failed: errors.length,
        errors: errors
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in ai-product-optimizer:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

function optimizeTitle(title: string): string {
  // Capitaliser les mots importants
  const words = title.split(' ');
  const capitalized = words.map(word => {
    if (word.length <= 2) return word.toLowerCase();
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  
  return capitalized.join(' ');
}

function optimizeDescription(description: string | null, productName: string): string {
  if (!description || description.length < 20) {
    return `Découvrez ${productName} - Un produit de qualité supérieure qui répond à vos besoins. Commandez maintenant et profitez d'une livraison rapide.`;
  }
  
  // Nettoyer et améliorer la description existante
  let optimized = description.trim();
  
  // Ajouter un appel à l'action si absent
  if (!optimized.toLowerCase().includes('commandez') && !optimized.toLowerCase().includes('achetez')) {
    optimized += ' Commandez dès maintenant!';
  }
  
  return optimized;
}

function optimizePrice(price: number | null, costPrice: number | null): number {
  if (!price || price <= 0) {
    // Si pas de prix, utiliser le coût + 50% marge si disponible
    if (costPrice && costPrice > 0) {
      return Math.round(costPrice * 1.5 * 100) / 100;
    }
    return 9.99; // Prix par défaut
  }

  // Arrondir à des prix psychologiques (.99, .95, .00)
  const rounded = Math.round(price);
  
  // Si le prix est inférieur à 100, utiliser .99
  if (rounded < 100) {
    return rounded - 0.01;
  }
  
  // Si supérieur à 100, arrondir à la dizaine proche avec .95
  const tens = Math.round(rounded / 10) * 10;
  return tens - 0.05;
}
