import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Missing authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error('Unauthorized');

    const { action, productId, config } = await req.json();

    if (action === 'monitor_prices') {
      // Récupérer le produit
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .eq('user_id', user.id)
        .single();

      if (productError || !product) {
        throw new Error('Product not found');
      }

      // Récupérer les prix des concurrents
      const { data: competitorPrices } = await supabase
        .from('competitor_prices')
        .select('*')
        .eq('product_id', productId)
        .order('last_checked_at', { ascending: false })
        .limit(10);

      if (!competitorPrices || competitorPrices.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'No competitor prices found'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Calculer le prix moyen des concurrents
      const avgCompetitorPrice = competitorPrices.reduce((sum, cp) => sum + Number(cp.competitor_price), 0) / competitorPrices.length;
      const minCompetitorPrice = Math.min(...competitorPrices.map(cp => Number(cp.competitor_price)));

      // Stratégie de pricing basée sur la configuration
      const strategy = config?.pricingStrategy || 'match_lowest';
      let newPrice = product.price;

      switch (strategy) {
        case 'match_lowest':
          newPrice = minCompetitorPrice - (config?.priceOffset || 0.01);
          break;
        case 'match_average':
          newPrice = avgCompetitorPrice - (config?.priceOffset || 0);
          break;
        case 'undercut_percentage':
          newPrice = minCompetitorPrice * (1 - (config?.undercutPercentage || 5) / 100);
          break;
        case 'fixed_margin':
          const costPrice = product.cost_price || 0;
          const minPrice = costPrice * (1 + (config?.minMargin || 20) / 100);
          newPrice = Math.max(minCompetitorPrice * 0.98, minPrice);
          break;
      }

      // Appliquer les limites min/max
      const minPrice = config?.minPrice || product.cost_price * 1.1 || 1;
      const maxPrice = config?.maxPrice || product.price * 2;
      newPrice = Math.max(minPrice, Math.min(maxPrice, newPrice));

      // Ne mettre à jour que si le changement est significatif
      const priceChange = Math.abs(newPrice - product.price);
      const significantChange = config?.minChangeAmount || 0.5;

      if (priceChange >= significantChange) {
        await supabase
          .from('products')
          .update({ 
            price: newPrice,
            updated_at: new Date().toISOString()
          })
          .eq('id', productId);

        // Logger le changement
        await supabase.from('activity_logs').insert({
          user_id: user.id,
          action: 'auto_price_update',
          entity_type: 'product',
          entity_id: productId,
          description: `Price updated from ${product.price} to ${newPrice} (${strategy})`,
          metadata: {
            old_price: product.price,
            new_price: newPrice,
            strategy,
            avg_competitor_price: avgCompetitorPrice,
            min_competitor_price: minCompetitorPrice
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Price updated successfully',
            old_price: product.price,
            new_price: newPrice,
            strategy,
            competitors_analyzed: competitorPrices.length
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Price unchanged (change not significant)',
          current_price: product.price,
          suggested_price: newPrice,
          change: priceChange
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'configure') {
      const { data: extension } = await supabase
        .from('extensions')
        .select('*')
        .eq('user_id', user.id)
        .eq('name', 'smart-price-monitor')
        .single();

      if (extension) {
        await supabase
          .from('extensions')
          .update({ 
            configuration: config,
            updated_at: new Date().toISOString()
          })
          .eq('id', extension.id);
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Configuration saved' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
