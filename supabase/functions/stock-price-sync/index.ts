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
        // Fetch latest supplier data (simulated - replace with real API calls)
        const supplierData = await fetchSupplierData(product);
        
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

// Simulated supplier data fetch - replace with real supplier API calls
async function fetchSupplierData(product: { id: string; source_url?: string; supplier_id?: string }) {
  // In production, integrate with:
  // - CJ Dropshipping API
  // - AliExpress API
  // - BigBuy API
  // - Custom supplier APIs
  
  // Simulate random small variations
  const priceVariation = (Math.random() - 0.5) * 2; // -1 to +1
  const stockVariation = Math.floor(Math.random() * 20) - 5; // -5 to +15
  
  return {
    cost_price: Math.max(1, 10 + priceVariation),
    stock: Math.max(0, 50 + stockVariation),
    available: true,
  };
}
