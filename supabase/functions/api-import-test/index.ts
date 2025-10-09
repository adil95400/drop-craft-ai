import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { config } = await req.json();
    
    if (!config || !config.url) {
      throw new Error('URL de l\'API requise');
    }

    const headers: Record<string, string> = { ...config.headers };
    
    if (config.authentication) {
      switch (config.authentication.type) {
        case 'bearer':
          if (config.authentication.token) {
            headers['Authorization'] = `Bearer ${config.authentication.token}`;
          }
          break;
        case 'api_key':
          if (config.authentication.api_key_header && config.authentication.api_key_value) {
            headers[config.authentication.api_key_header] = config.authentication.api_key_value;
          }
          break;
        case 'basic':
          if (config.authentication.username && config.authentication.password) {
            const credentials = btoa(`${config.authentication.username}:${config.authentication.password}`);
            headers['Authorization'] = `Basic ${credentials}`;
          }
          break;
      }
    }

    const fetchOptions: RequestInit = {
      method: config.method || 'GET',
      headers,
    };

    if (config.method === 'POST' && config.body) {
      fetchOptions.body = config.body;
    }

    const response = await fetch(config.url, fetchOptions);
    const data = await response.json();

    let products = data;
    if (config.data_path && config.data_path !== '$') {
      const path = config.data_path.replace(/^\$\./, '').split('.');
      for (const key of path) {
        products = products?.[key];
      }
    }

    if (!Array.isArray(products)) {
      products = [products];
    }

    return new Response(
      JSON.stringify({
        success: true,
        status: response.status,
        data,
        products_found: products.length,
        sample_product: products[0] || null
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error testing API:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        products_found: 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  }
});
