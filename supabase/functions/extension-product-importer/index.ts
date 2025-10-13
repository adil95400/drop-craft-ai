import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProductImportRequest {
  source: 'csv' | 'json' | 'api';
  data?: any[];
  apiUrl?: string;
  apiKey?: string;
  mapping?: Record<string, string>;
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

    const { source, data, apiUrl, apiKey, mapping }: ProductImportRequest = await req.json();

    let products: any[] = [];

    // Import depuis différentes sources
    if (source === 'csv' || source === 'json') {
      products = data || [];
    } else if (source === 'api' && apiUrl) {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await fetch(apiUrl, { headers });
      if (!response.ok) {
        throw new Error(`Erreur API: ${response.statusText}`);
      }
      products = await response.json();
    }

    // Mapping des champs si nécessaire
    if (mapping) {
      products = products.map(p => {
        const mapped: any = {};
        Object.entries(mapping).forEach(([target, source]) => {
          mapped[target] = p[source];
        });
        return mapped;
      });
    }

    // Normalisation et insertion
    const normalizedProducts = products.map(p => ({
      name: p.name || p.title || '',
      description: p.description || '',
      price: parseFloat(p.price || 0),
      cost_price: parseFloat(p.cost_price || p.costPrice || 0),
      sku: p.sku || '',
      category: p.category || 'Non catégorisé',
      stock_quantity: parseInt(p.stock_quantity || p.stock || 0),
      image_url: p.image_url || p.image || '',
      status: 'active',
      user_id: user.id,
    }));

    const { data: insertedProducts, error } = await supabaseClient
      .from('products')
      .insert(normalizedProducts)
      .select();

    if (error) throw error;

    // Log de l'activité
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'extension_product_import',
        description: `Import de ${insertedProducts?.length || 0} produits via extension`,
        metadata: {
          source,
          count: insertedProducts?.length || 0,
          timestamp: new Date().toISOString(),
        },
      });

    return new Response(
      JSON.stringify({
        success: true,
        imported: insertedProducts?.length || 0,
        products: insertedProducts,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Erreur import produits:', error);
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
