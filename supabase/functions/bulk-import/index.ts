import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BATCH_SIZE = 100; // Process 100 products at a time
const MAX_RETRIES = 3;

interface BulkImportRequest {
  job_id: string;
  source_url: string;
  source_platform: string;
  settings?: Record<string, any>;
}

interface ProductData {
  title: string;
  description?: string;
  price?: number;
  compare_at_price?: number;
  sku?: string;
  images?: string[];
  category?: string;
  vendor?: string;
  tags?: string[];
  variants?: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { job_id, source_url, source_platform, settings = {} } = await req.json() as BulkImportRequest;

    if (!job_id || !source_url) {
      return new Response(
        JSON.stringify({ error: 'job_id et source_url sont requis' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get job details
    const { data: job, error: jobError } = await supabase
      .from('import_jobs')
      .select('*')
      .eq('id', job_id)
      .single();

    if (jobError || !job) {
      console.error('Job not found:', jobError);
      return new Response(
        JSON.stringify({ error: 'Job non trouvé' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = job.user_id;
    let totalProducts = 0;
    let processedProducts = 0;
    let successfulImports = 0;
    let failedImports = 0;
    const errorLog: any[] = [];

    // Fetch products from source
    console.log(`Starting bulk import from ${source_platform}: ${source_url}`);

    try {
      // Determine fetch strategy based on platform
      const products = await fetchProductsFromSource(source_url, source_platform, settings);
      totalProducts = products.length;

      console.log(`Found ${totalProducts} products to import`);

      // Update job with total count
      await supabase
        .from('import_jobs')
        .update({ total_products: totalProducts })
        .eq('id', job_id);

      // Process in batches
      for (let i = 0; i < products.length; i += BATCH_SIZE) {
        const batch = products.slice(i, i + BATCH_SIZE);
        
        for (const productData of batch) {
          try {
            // Insert product
            const { data: product, error: insertError } = await supabase
              .from('products')
              .insert({
                user_id: userId,
                title: productData.title,
                description: productData.description || '',
                price: productData.price || 0,
                compare_at_price: productData.compare_at_price,
                sku: productData.sku,
                category: productData.category,
                vendor: productData.vendor,
                tags: productData.tags || [],
                images: productData.images || [],
                status: 'draft',
                source: source_platform,
                source_url: source_url
              })
              .select()
              .maybeSingle();

            if (insertError) {
              console.error('Insert error:', insertError);
              failedImports++;
              errorLog.push({
                product: productData.title,
                error: insertError.message,
                timestamp: new Date().toISOString()
              });
            } else {
              successfulImports++;

              // Create import history record
              await supabase
                .from('import_history')
                .insert({
                  user_id: userId,
                  import_job_id: job_id,
                  action_type: 'product_imported',
                  status: 'success',
                  metadata: {
                    product_id: product?.id,
                    title: productData.title,
                    source: source_platform
                  }
                });
            }

            processedProducts++;
          } catch (productError: any) {
            console.error('Product processing error:', productError);
            failedImports++;
            errorLog.push({
              product: productData.title,
              error: productError.message,
              timestamp: new Date().toISOString()
            });
            processedProducts++;
          }
        }

        // Update progress after each batch
        const progress_percentage = Math.round((processedProducts / totalProducts) * 100);
        await supabase
          .from('import_jobs')
          .update({
            processed_products: processedProducts,
            successful_imports: successfulImports,
            failed_imports: failedImports,
            progress_percentage,
            error_log: errorLog.slice(-50) // Keep last 50 errors
          })
          .eq('id', job_id);

        console.log(`Progress: ${processedProducts}/${totalProducts} (${progress_percentage}%)`);
      }

      // Finalize job
      const finalStatus = failedImports === totalProducts ? 'failed' : 'completed';
      await supabase
        .from('import_jobs')
        .update({
          status: finalStatus,
          completed_at: new Date().toISOString(),
          processed_products: processedProducts,
          successful_imports: successfulImports,
          failed_imports: failedImports,
          progress_percentage: 100,
          error_log: errorLog
        })
        .eq('id', job_id);

      console.log(`Import completed: ${successfulImports} success, ${failedImports} failed`);

      return new Response(
        JSON.stringify({
          success: true,
          job_id,
          total_products: totalProducts,
          successful_imports: successfulImports,
          failed_imports: failedImports,
          status: finalStatus
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (fetchError: any) {
      console.error('Fetch error:', fetchError);
      
      await supabase
        .from('import_jobs')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_log: [{ 
            error: fetchError.message, 
            type: 'fetch_error',
            timestamp: new Date().toISOString()
          }]
        })
        .eq('id', job_id);

      return new Response(
        JSON.stringify({ error: 'Erreur lors de la récupération des produits', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Bulk import error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function fetchProductsFromSource(
  sourceUrl: string, 
  platform: string,
  settings: Record<string, any>
): Promise<ProductData[]> {
  const products: ProductData[] = [];

  try {
    // Detect content type from URL
    const isCSV = sourceUrl.endsWith('.csv') || settings.format === 'csv';
    const isXML = sourceUrl.endsWith('.xml') || settings.format === 'xml';
    const isJSON = sourceUrl.endsWith('.json') || settings.format === 'json';

    const response = await fetch(sourceUrl, {
      headers: {
        'Accept': isCSV ? 'text/csv' : isXML ? 'application/xml' : 'application/json',
        'User-Agent': 'ShopOpti-Import/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();

    if (isCSV) {
      products.push(...parseCSV(content, settings));
    } else if (isXML) {
      products.push(...parseXML(content, settings));
    } else {
      // Default to JSON
      const jsonData = JSON.parse(content);
      products.push(...parseJSON(jsonData, platform, settings));
    }

  } catch (error) {
    console.error('Error fetching source:', error);
    throw error;
  }

  return products;
}

function parseCSV(content: string, settings: Record<string, any>): ProductData[] {
  const products: ProductData[] = [];
  const lines = content.split('\n');
  
  if (lines.length < 2) return products;

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
  
  // Find column indices
  const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('name') || h.includes('nom'));
  const descIdx = headers.findIndex(h => h.includes('description'));
  const priceIdx = headers.findIndex(h => h.includes('price') || h.includes('prix'));
  const skuIdx = headers.findIndex(h => h.includes('sku') || h.includes('reference'));
  const imageIdx = headers.findIndex(h => h.includes('image'));
  const categoryIdx = headers.findIndex(h => h.includes('category') || h.includes('categorie'));

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = parseCSVLine(line);
    
    const product: ProductData = {
      title: titleIdx >= 0 ? values[titleIdx] || `Produit ${i}` : `Produit ${i}`,
      description: descIdx >= 0 ? values[descIdx] : undefined,
      price: priceIdx >= 0 ? parseFloat(values[priceIdx]) || 0 : 0,
      sku: skuIdx >= 0 ? values[skuIdx] : undefined,
      images: imageIdx >= 0 && values[imageIdx] ? [values[imageIdx]] : [],
      category: categoryIdx >= 0 ? values[categoryIdx] : undefined
    };

    products.push(product);
  }

  return products;
}

function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (const char of line) {
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());

  return values;
}

function parseXML(content: string, settings: Record<string, any>): ProductData[] {
  const products: ProductData[] = [];
  
  // Simple XML parsing for product feeds
  const productMatches = content.match(/<product[^>]*>[\s\S]*?<\/product>/gi) ||
                         content.match(/<item[^>]*>[\s\S]*?<\/item>/gi) ||
                         content.match(/<entry[^>]*>[\s\S]*?<\/entry>/gi);

  if (!productMatches) return products;

  for (const productXml of productMatches) {
    const getValue = (tagName: string): string | undefined => {
      const match = productXml.match(new RegExp(`<${tagName}[^>]*>([^<]*)<\/${tagName}>`, 'i'));
      return match ? match[1].trim() : undefined;
    };

    const product: ProductData = {
      title: getValue('title') || getValue('name') || 'Sans titre',
      description: getValue('description') || getValue('content'),
      price: parseFloat(getValue('price') || getValue('sale_price') || '0') || 0,
      sku: getValue('sku') || getValue('id') || getValue('mpn'),
      images: [],
      category: getValue('category') || getValue('product_type')
    };

    const imageUrl = getValue('image_link') || getValue('image') || getValue('image_url');
    if (imageUrl) {
      product.images = [imageUrl];
    }

    products.push(product);
  }

  return products;
}

function parseJSON(data: any, platform: string, settings: Record<string, any>): ProductData[] {
  const products: ProductData[] = [];

  // Handle different JSON structures
  let items = [];
  
  if (Array.isArray(data)) {
    items = data;
  } else if (data.products) {
    items = data.products;
  } else if (data.items) {
    items = data.items;
  } else if (data.data) {
    items = Array.isArray(data.data) ? data.data : [data.data];
  }

  for (const item of items) {
    const product: ProductData = {
      title: item.title || item.name || item.product_name || 'Sans titre',
      description: item.description || item.body_html || item.content,
      price: parseFloat(item.price || item.sale_price || item.regular_price || '0') || 0,
      compare_at_price: item.compare_at_price ? parseFloat(item.compare_at_price) : undefined,
      sku: item.sku || item.id?.toString(),
      images: extractImages(item),
      category: item.category || item.product_type || item.type,
      vendor: item.vendor || item.brand,
      tags: item.tags ? (Array.isArray(item.tags) ? item.tags : item.tags.split(',')) : [],
      variants: item.variants
    };

    products.push(product);
  }

  return products;
}

function extractImages(item: any): string[] {
  const images: string[] = [];

  if (item.images && Array.isArray(item.images)) {
    for (const img of item.images) {
      if (typeof img === 'string') {
        images.push(img);
      } else if (img.src) {
        images.push(img.src);
      } else if (img.url) {
        images.push(img.url);
      }
    }
  } else if (item.image) {
    if (typeof item.image === 'string') {
      images.push(item.image);
    } else if (item.image.src) {
      images.push(item.image.src);
    }
  } else if (item.image_url) {
    images.push(item.image_url);
  }

  return images;
}
