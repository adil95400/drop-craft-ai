/**
 * Import Products - Secure Edge Function
 * SECURITY: JWT authentication + input validation + user scoping
 */
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeaders } from '../_shared/cors.ts';
import { withErrorHandler, ValidationError } from '../_shared/error-handler.ts';
import { parseJsonValidated, z } from '../_shared/validators.ts';
import { checkRateLimit } from '../_shared/rate-limiter.ts';

const ImportSchema = z.object({
  source: z.enum(['url', 'csv', 'supplier']),
  data: z.object({
    url: z.string().url().max(2000).optional(),
    csvData: z.array(z.record(z.any())).max(1000).optional(),
    supplier: z.string().max(100).optional(),
    mapping: z.record(z.string().max(100)).optional(),
    config: z.record(z.any()).optional()
  })
});

serve(
  withErrorHandler(async (req) => {
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // SECURITY: Authenticate user via JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new ValidationError('Authorization required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !userData.user) {
      throw new ValidationError('Invalid authentication');
    }
    
    const userId = userData.user.id;
    console.log(`[IMPORT-PRODUCTS] User ${userId} starting import`);

    // SECURITY: Rate limiting - 10 imports per hour
    const rateLimitOk = await checkRateLimit(
      supabase,
      `import_products:${userId}`,
      10,
      3600000
    );
    if (!rateLimitOk) {
      throw new ValidationError('Too many import requests. Please try again later.');
    }

    // Validate input
    const { source, data } = await parseJsonValidated(req, ImportSchema);

    // SECURITY: Validate URL if provided
    if (source === 'url' && data.url) {
      const url = new URL(data.url);
      const blockedHosts = ['localhost', '127.0.0.1', '0.0.0.0', 'internal', 'metadata'];
      if (blockedHosts.some(h => url.hostname.includes(h))) {
        throw new ValidationError('Invalid URL');
      }
    }

    // Create import job record scoped to user
    const { data: importJob, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        user_id: userId,
        source_platform: source,
        job_type: 'import',
        status: 'processing',
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (jobError) {
      console.error('Job creation error:', jobError);
      throw new Error('Failed to create import job');
    }

    let importedProducts: any[] = [];
    const timeoutMs = 25000;
    
    try {
      const importPromise = (async () => {
        switch (source) {
          case 'url':
            return await importFromURL(data.url!, data.config);
          case 'csv':
            return await importFromCSV(data.csvData!, data.mapping!);
          case 'supplier':
            return await importFromSupplier(data.supplier!, data.config);
          default:
            throw new Error(`Unsupported import source: ${source}`);
        }
      })();

      importedProducts = await Promise.race([
        importPromise,
        new Promise<any[]>((_, reject) => 
          setTimeout(() => reject(new Error('Import timeout')), timeoutMs)
        )
      ]);
    } catch (error) {
      console.error('Import processing error:', error);
      
      await supabase
        .from('import_jobs')
        .update({
          status: 'failed',
          error_log: [(error as Error).message],
          completed_at: new Date().toISOString()
        })
        .eq('id', importJob.id)
        .eq('user_id', userId); // Double-check user ownership
      
      throw error;
    }

    // SECURITY: All products scoped to authenticated user
    if (importedProducts.length > 0) {
      const productsToInsert = importedProducts.map(product => ({
        user_id: userId, // CRITICAL: Always set user_id
        title: (product.name || 'Produit sans nom').substring(0, 500),
        description: (product.description || '').substring(0, 5000),
        price: Math.min(parseFloat(product.price) || 0, 999999.99),
        cost_price: Math.min(parseFloat(product.cost_price) || (parseFloat(product.price) * 0.7), 999999.99),
        sku: (product.sku || `IMP-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`).substring(0, 100),
        category: (product.category || 'Divers').substring(0, 100),
        supplier: product.supplier_name || (source === 'supplier' ? data.supplier : 'Import'),
        image_url: Array.isArray(product.images) ? product.images[0] : product.images || null,
        images: Array.isArray(product.images) ? product.images.slice(0, 10) : [],
        tags: product.tags || [`${source}-import`],
        status: 'draft',
      }));

      const { error: insertError } = await supabase
        .from('products')
        .insert(productsToInsert);

      if (insertError) {
        console.error('Insert error:', insertError);
        throw new Error('Failed to save products');
      }
    }

    // Update import job with ownership check
    await supabase
      .from('import_jobs')
      .update({
        status: 'completed',
        total_products: importedProducts.length,
        successful_imports: importedProducts.length,
        failed_imports: 0,
        completed_at: new Date().toISOString()
      })
      .eq('id', importJob.id)
      .eq('user_id', userId);

    console.log(`[IMPORT-PRODUCTS] User ${userId} imported ${importedProducts.length} products`);

    return new Response(JSON.stringify({
      success: true,
      import_id: importJob.id,
      products_imported: importedProducts.length,
      message: `${importedProducts.length} produits importés avec succès`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }, corsHeaders)
);

async function importFromURL(url: string, config: any = {}): Promise<any[]> {
  try {
    console.log(`[IMPORT-PRODUCTS] Fetching URL`);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const content = await response.text();
    const products: any[] = [];
    
    // Look for JSON-LD structured data
    const jsonLdMatches = content.match(/<script[^>]*type="application\/ld\+json"[^>]*>(.*?)<\/script>/gis);
    
    if (jsonLdMatches) {
      for (const match of jsonLdMatches.slice(0, 5)) {
        try {
          const jsonContent = match.replace(/<script[^>]*>|<\/script>/gi, '');
          const data = JSON.parse(jsonContent);
          
          if (data['@type'] === 'Product') {
            products.push({
              name: (data.name || '').slice(0, 200),
              description: (data.description || '').slice(0, 2000),
              price: data.offers?.price || 0,
              currency: data.offers?.priceCurrency || 'EUR',
              images: Array.isArray(data.image) ? data.image.slice(0, 5) : [data.image].filter(Boolean),
              category: (data.category || 'Divers').slice(0, 100),
              sku: data.sku || data.productID,
              supplier_url: url,
              supplier_name: new URL(url).hostname.replace('www.', '')
            });
          }
        } catch (e) {
          console.warn('Error parsing JSON-LD');
        }
      }
    }

    if (products.length === 0) {
      const titleMatch = content.match(/<title[^>]*>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1].trim() : 'Produit importé';
      
      const priceMatches = content.match(/[\$€£¥]\s*\d+(?:[.,]\d{2})?/g);
      const price = priceMatches ? parseFloat(priceMatches[0].replace(/[^\d.,]/g, '').replace(',', '.')) : 0;
      
      products.push({
        name: title.substring(0, 200),
        description: `Produit importé`,
        price,
        currency: 'EUR',
        images: [],
        category: 'Divers',
        supplier_url: url,
        supplier_name: new URL(url).hostname.replace('www.', '')
      });
    }

    return products;
    
  } catch (error) {
    console.error('URL import error:', error);
    return [];
  }
}

async function importFromCSV(csvData: any[], mapping: Record<string, string>): Promise<any[]> {
  if (!csvData || !Array.isArray(csvData)) {
    return [];
  }
  
  return csvData.slice(0, 1000).map((row, index) => ({
    name: row[mapping?.name] || `Produit ${index + 1}`,
    description: row[mapping?.description] || '',
    price: parseFloat(row[mapping?.price]) || 0,
    cost_price: parseFloat(row[mapping?.cost_price]) || 0,
    currency: row[mapping?.currency] || 'EUR',
    sku: row[mapping?.sku] || `CSV-${Date.now()}-${index}`,
    category: row[mapping?.category] || 'Divers',
    images: row[mapping?.images] ? [row[mapping?.images]] : [],
    supplier_name: 'Import CSV'
  }));
}

async function importFromSupplier(supplier: string, config: any = {}): Promise<any[]> {
  console.log(`[IMPORT-PRODUCTS] Importing from supplier: ${supplier}`);
  return [];
}
