import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('Non authentifié');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Utilisateur non trouvé');
    }

    const { config } = await req.json();
    
    if (!config || !config.url) {
      throw new Error('URL de l\'API requise');
    }

    const { data: importJob, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        user_id: user.id,
        source_type: 'api',
        source_url: config.url,
        mapping_config: config.field_mapping,
        status: 'processing'
      })
      .select()
      .single();

    if (jobError) {
      throw jobError;
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

    let allProducts: any[] = [];
    let currentPage = 1;
    const maxPages = config.pagination?.max_pages || 1;

    while (currentPage <= maxPages) {
      let url = config.url;
      
      if (config.pagination?.enabled) {
        const separator = url.includes('?') ? '&' : '?';
        const pageParam = config.pagination.page_param || 'page';
        const sizeParam = config.pagination.size_param || 'limit';
        
        if (config.pagination.type === 'page') {
          url += `${separator}${pageParam}=${currentPage}&${sizeParam}=100`;
        } else if (config.pagination.type === 'offset') {
          const offset = (currentPage - 1) * 100;
          url += `${separator}offset=${offset}&${sizeParam}=100`;
        }
      }

      const fetchOptions: RequestInit = {
        method: config.method || 'GET',
        headers,
      };

      if (config.method === 'POST' && config.body) {
        fetchOptions.body = config.body;
      }

      const response = await fetch(url, fetchOptions);
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

      if (products.length === 0) {
        break;
      }

      allProducts = allProducts.concat(products);

      if (!config.pagination?.enabled) {
        break;
      }

      currentPage++;
    }

    const mappedProducts = allProducts.map(product => {
      const mapped: any = {
        user_id: user.id,
        status: 'draft'
      };

      for (const [apiField, productField] of Object.entries(config.field_mapping || {})) {
        if (product[apiField] !== undefined) {
          mapped[productField] = product[apiField];
        }
      }

      if (!mapped.name && product.name) mapped.name = product.name;
      if (!mapped.name && product.title) mapped.name = product.title;
      if (!mapped.price && product.price) mapped.price = parseFloat(product.price);
      if (!mapped.description && product.description) mapped.description = product.description;

      return mapped;
    });

    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < mappedProducts.length; i += batchSize) {
      const batch = mappedProducts.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from('imported_products')
        .insert(batch);

      if (insertError) {
        console.error('Error inserting batch:', insertError);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
      }

      await supabase
        .from('import_jobs')
        .update({
          processed_rows: i + batch.length,
          success_rows: successCount,
          error_rows: errorCount
        })
        .eq('id', importJob.id);
    }

    await supabase
      .from('import_jobs')
      .update({
        status: 'completed',
        total_rows: allProducts.length,
        processed_rows: allProducts.length,
        success_rows: successCount,
        error_rows: errorCount
      })
      .eq('id', importJob.id);

    return new Response(
      JSON.stringify({
        success: true,
        job_id: importJob.id,
        total_products: allProducts.length,
        imported: successCount,
        errors: errorCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    console.error('Error executing import:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
