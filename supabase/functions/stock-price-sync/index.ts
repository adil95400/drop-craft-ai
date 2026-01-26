import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SyncResult {
  productId: string;
  sku: string;
  field: 'price' | 'stock';
  oldValue: number;
  newValue: number;
  source: string;
}

interface SupplierApiResponse {
  cost_price?: number;
  stock?: number;
  available?: boolean;
  error?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get products that need sync (not synced in last hour or never synced)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: products, error: fetchError } = await supabase
      .from('products')
      .select('id, sku, title, price, cost_price, stock, supplier_id, source_url, last_sync_at')
      .eq('sync_enabled', true)
      .or(`last_sync_at.is.null,last_sync_at.lt.${oneHourAgo}`)
      .order('last_sync_at', { ascending: true, nullsFirst: true })
      .limit(100);

    if (fetchError) {
      throw new Error(`Failed to fetch products: ${fetchError.message}`);
    }

    const results = {
      total: products?.length || 0,
      priceUpdates: 0,
      stockUpdates: 0,
      noChanges: 0,
      errors: 0,
      outOfStock: 0,
      priceDrops: 0,
      priceIncreases: 0,
      changes: [] as SyncResult[],
    };

    for (const product of (products || [])) {
      try {
        // Fetch latest supplier data from real supplier APIs
        const supplierData = await fetchSupplierData(supabase, product);
        
        if (!supplierData || supplierData.error) {
          console.log(`No supplier data for product ${product.id}: ${supplierData?.error || 'Unknown'}`);
          results.noChanges++;
          continue;
        }

        const updates: Record<string, unknown> = {
          last_sync_at: new Date().toISOString(),
          sync_status: 'synced',
        };

        let hasChanges = false;

        // Check price changes
        if (supplierData.cost_price !== undefined && supplierData.cost_price !== product.cost_price) {
          const oldPrice = product.cost_price || 0;
          const newPrice = supplierData.cost_price;
          
          updates.cost_price = newPrice;
          
          // Calculate new sale price with margin
          const margin = product.price && product.cost_price 
            ? (product.price - product.cost_price) / product.cost_price 
            : 0.3; // Default 30% margin
          updates.price = Math.round(newPrice * (1 + margin) * 100) / 100;
          
          results.priceUpdates++;
          hasChanges = true;
          
          if (newPrice < oldPrice) {
            results.priceDrops++;
          } else {
            results.priceIncreases++;
          }
          
          results.changes.push({
            productId: product.id,
            sku: product.sku || 'N/A',
            field: 'price',
            oldValue: oldPrice,
            newValue: newPrice,
            source: 'supplier_sync',
          });
        }

        // Check stock changes
        if (supplierData.stock !== undefined && supplierData.stock !== product.stock) {
          const oldStock = product.stock || 0;
          const newStock = supplierData.stock;
          
          updates.stock = newStock;
          results.stockUpdates++;
          hasChanges = true;
          
          if (newStock === 0 && oldStock > 0) {
            results.outOfStock++;
            
            // Create alert for out of stock
            await supabase.from('active_alerts').insert({
              alert_type: 'stock_alert',
              title: `Rupture de stock: ${product.title}`,
              message: `Le produit ${product.sku || product.id} est maintenant en rupture de stock chez le fournisseur.`,
              severity: 'warning',
              status: 'active',
              metadata: {
                productId: product.id,
                sku: product.sku,
                previousStock: oldStock,
              },
            });
          }
          
          results.changes.push({
            productId: product.id,
            sku: product.sku || 'N/A',
            field: 'stock',
            oldValue: oldStock,
            newValue: newStock,
            source: 'supplier_sync',
          });
        }

        if (!hasChanges) {
          results.noChanges++;
        }

        // Apply updates
        await supabase
          .from('products')
          .update(updates)
          .eq('id', product.id);

      } catch (err) {
        console.error(`Sync error for product ${product.id}:`, err);
        results.errors++;
        
        await supabase
          .from('products')
          .update({ 
            sync_status: 'error',
            sync_error: err instanceof Error ? err.message : 'Unknown error',
            last_sync_at: new Date().toISOString(),
          })
          .eq('id', product.id);
      }
    }

    // Log execution
    await supabase.from('api_logs').insert({
      endpoint: '/stock-price-sync',
      method: 'CRON',
      status_code: 200,
      response_body: {
        total: results.total,
        priceUpdates: results.priceUpdates,
        stockUpdates: results.stockUpdates,
        noChanges: results.noChanges,
        errors: results.errors,
        outOfStock: results.outOfStock,
      },
    });

    return new Response(JSON.stringify({
      success: true,
      ...results,
      message: `Synced ${results.total} products: ${results.priceUpdates} price updates, ${results.stockUpdates} stock updates`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Stock price sync error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/**
 * Fetch real supplier data from configured supplier APIs
 * Supports: BigBuy, CJ Dropshipping, B2B Sports, and custom supplier APIs
 */
async function fetchSupplierData(
  supabase: ReturnType<typeof createClient>,
  product: { id: string; source_url?: string; supplier_id?: string; sku?: string }
): Promise<SupplierApiResponse> {
  
  // If no supplier configured, return empty
  if (!product.supplier_id && !product.source_url) {
    return { error: 'No supplier configured' };
  }

  // Get supplier details
  if (product.supplier_id) {
    const { data: supplier } = await supabase
      .from('suppliers')
      .select('name, api_type, api_config, credentials_encrypted')
      .eq('id', product.supplier_id)
      .single();

    if (supplier) {
      try {
        return await fetchFromSupplierApi(supplier, product);
      } catch (err) {
        console.error(`Supplier API error for ${supplier.name}:`, err);
        return { error: `API error: ${err instanceof Error ? err.message : 'Unknown'}` };
      }
    }
  }

  // Try to fetch from source_url if available
  if (product.source_url) {
    try {
      return await fetchFromSourceUrl(product.source_url);
    } catch (err) {
      console.error(`Source URL fetch error:`, err);
      return { error: `URL fetch error: ${err instanceof Error ? err.message : 'Unknown'}` };
    }
  }

  return { error: 'Could not fetch supplier data' };
}

/**
 * Fetch data from a specific supplier API based on api_type
 */
async function fetchFromSupplierApi(
  supplier: { name: string; api_type?: string; api_config?: Record<string, unknown>; credentials_encrypted?: string },
  product: { id: string; sku?: string }
): Promise<SupplierApiResponse> {
  const apiType = supplier.api_type?.toLowerCase() || '';
  
  switch (apiType) {
    case 'bigbuy': {
      const apiKey = Deno.env.get('BIGBUY_API_KEY');
      if (!apiKey) return { error: 'BigBuy API key not configured' };
      
      const response = await fetch(`https://api.bigbuy.eu/rest/catalog/productstock/${product.sku}.json`, {
        headers: { 
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) return { error: `BigBuy API error: ${response.status}` };
      
      const data = await response.json();
      return {
        stock: data.stock || 0,
        cost_price: data.retailPrice || undefined,
        available: (data.stock || 0) > 0
      };
    }
    
    case 'cjdropshipping': {
      const apiKey = Deno.env.get('CJ_API_KEY');
      if (!apiKey) return { error: 'CJ API key not configured' };
      
      const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/product/stock', {
        method: 'POST',
        headers: {
          'CJ-Access-Token': apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sku: product.sku })
      });
      
      if (!response.ok) return { error: `CJ API error: ${response.status}` };
      
      const data = await response.json();
      return {
        stock: data.data?.stock || 0,
        cost_price: data.data?.sellPrice || undefined,
        available: data.data?.isOnSale || false
      };
    }
    
    case 'b2bsports': {
      const authKey = Deno.env.get('B2B_SPORTS_AUTH_KEY');
      const userKey = Deno.env.get('B2B_SPORTS_USER_KEY');
      if (!authKey || !userKey) return { error: 'B2B Sports keys not configured' };
      
      const response = await fetch(`https://www.b2bsportswear.com/api/v1/products/${product.sku}/stock`, {
        headers: {
          'X-Auth-Key': authKey,
          'X-User-Key': userKey,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) return { error: `B2B Sports API error: ${response.status}` };
      
      const data = await response.json();
      return {
        stock: data.quantity || 0,
        cost_price: data.price || undefined,
        available: (data.quantity || 0) > 0
      };
    }
    
    default:
      // For custom APIs, use the config if available
      if (supplier.api_config) {
        const config = supplier.api_config as { endpoint?: string; method?: string; headers?: Record<string, string> };
        if (config.endpoint) {
          const response = await fetch(config.endpoint.replace('{sku}', product.sku || ''), {
            method: config.method || 'GET',
            headers: config.headers || {}
          });
          
          if (response.ok) {
            const data = await response.json();
            return {
              stock: data.stock ?? data.quantity ?? 0,
              cost_price: data.price ?? data.cost_price ?? undefined,
              available: data.available ?? true
            };
          }
        }
      }
      return { error: `Unsupported supplier API type: ${apiType}` };
  }
}

/**
 * Attempt to fetch product data from a source URL
 * This is a fallback when no supplier API is configured
 */
async function fetchFromSourceUrl(sourceUrl: string): Promise<SupplierApiResponse> {
  // Determine platform from URL
  if (sourceUrl.includes('aliexpress.com')) {
    // AliExpress requires special handling - would need API or scraping
    return { error: 'AliExpress direct scraping not supported - use supplier integration' };
  }
  
  if (sourceUrl.includes('amazon.')) {
    return { error: 'Amazon direct scraping not supported - use supplier integration' };
  }
  
  // For other URLs, we can't fetch reliably
  return { error: 'Source URL type not supported for automatic sync' };
}
