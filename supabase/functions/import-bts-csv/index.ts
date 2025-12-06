import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BTSProduct {
  handle: string;
  title: string;
  body_html: string;
  vendor: string;
  product_category: string;
  type: string;
  tags: string;
  published: boolean;
  option1_name: string;
  option1_value: string;
  variant_sku: string;
  variant_grams: number;
  variant_inventory_qty: number;
  variant_inventory_policy: string;
  variant_fulfillment_service: string;
  variant_price: number;
  variant_compare_at_price: number;
  variant_requires_shipping: boolean;
  variant_taxable: boolean;
  variant_barcode: string;
  image_src: string;
  image_position: number;
  gift_card: boolean;
}

function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  // Remove € symbol, spaces, and convert comma to dot
  const cleaned = priceStr
    .replace(/€/g, '')
    .replace(/\s/g, '')
    .replace(',', '.')
    .trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

function parseBoolean(val: string): boolean {
  return val?.toUpperCase() === 'TRUE';
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

function parseCSV(csvContent: string): BTSProduct[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  const headers = parseCSVLine(lines[0]);
  const products: BTSProduct[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue;
    
    const product: BTSProduct = {
      handle: values[0] || '',
      title: values[1] || '',
      body_html: values[2] || '',
      vendor: values[3] || '',
      product_category: values[4] || '',
      type: values[5] || '',
      tags: values[6] || '',
      published: parseBoolean(values[7]),
      option1_name: values[8] || '',
      option1_value: values[9] || '',
      variant_sku: values[10] || '',
      variant_grams: parseInt(values[11]) || 0,
      variant_inventory_qty: parseInt(values[13]) || 0,
      variant_inventory_policy: values[14] || 'deny',
      variant_fulfillment_service: values[15] || 'manual',
      variant_price: parsePrice(values[16]),
      variant_compare_at_price: parsePrice(values[17]),
      variant_requires_shipping: parseBoolean(values[18]),
      variant_taxable: parseBoolean(values[19]),
      variant_barcode: values[10] || '', // Use SKU as barcode if not provided
      image_src: values[21] || '',
      image_position: parseInt(values[22]) || 1,
      gift_card: parseBoolean(values[23]),
    };
    
    // Only add if has valid SKU and title
    if (product.variant_sku && product.title) {
      products.push(product);
    }
  }
  
  return products;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }
    
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (authError || !user) {
      throw new Error('Non authentifié');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const supplierIdFromForm = formData.get('supplier_id') as string;
    
    if (!file) {
      throw new Error('Fichier CSV requis');
    }

    // Find or get BTS Wholesaler supplier ID
    let btsSupplierUUID = supplierIdFromForm;
    
    if (!btsSupplierUUID) {
      // Try to find existing BTS Wholesaler supplier
      const { data: existingSupplier } = await supabaseClient
        .from('suppliers')
        .select('id')
        .ilike('name', '%bts%wholesaler%')
        .single();
      
      btsSupplierUUID = existingSupplier?.id || null;
    }

    const csvContent = await file.text();
    const btsProducts = parseCSV(csvContent);
    
    console.log(`Parsed ${btsProducts.length} products from CSV, supplier_id: ${btsSupplierUUID}`);

    if (btsProducts.length === 0) {
      throw new Error('Aucun produit valide trouvé dans le CSV');
    }

    // Create import job
    const { data: job, error: jobError } = await supabaseClient
      .from('import_jobs')
      .insert({
        user_id: user.id,
        job_type: 'csv_import',
        supplier_id: 'btswholesaler',
        status: 'processing',
        total_products: btsProducts.length,
        processed_products: 0,
        failed_imports: 0,
        error_log: []
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Process in batches of 100
    const BATCH_SIZE = 100;
    let processed = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < btsProducts.length; i += BATCH_SIZE) {
      const batch = btsProducts.slice(i, i + BATCH_SIZE);
      
      const productsToInsert = batch.map(p => ({
        user_id: user.id,
        name: p.title,
        description: p.body_html,
        handle: p.handle,
        vendor: p.vendor || 'BTSWholesaler',
        product_type: p.type || p.product_category,
        tags: p.tags ? p.tags.split(',').map(t => t.trim()) : [],
        sku: p.variant_sku,
        barcode: p.variant_sku,
        price: p.variant_price,
        compare_at_price: p.variant_compare_at_price,
        cost_price: p.variant_price * 0.7, // Estimate cost at 70% of price
        stock_quantity: p.variant_inventory_qty,
        inventory_policy: p.variant_inventory_policy,
        fulfillment_service: p.variant_fulfillment_service,
        requires_shipping: p.variant_requires_shipping,
        taxable: p.variant_taxable,
        weight: p.variant_grams,
        weight_unit: 'g',
        image_url: p.image_src,
        status: p.published ? 'active' : 'draft',
        source: 'btswholesaler',
        supplier_id: btsSupplierUUID, // Use real UUID from suppliers table
        external_id: p.variant_sku,
      }));

      // Upsert products (update if SKU exists, insert if not)
      const { data: inserted, error: insertError } = await supabaseClient
        .from('products')
        .upsert(productsToInsert, {
          onConflict: 'sku,user_id',
          ignoreDuplicates: false
        })
        .select('id');

      if (insertError) {
        console.error('Batch insert error:', insertError);
        failed += batch.length;
        errors.push(`Batch ${Math.floor(i/BATCH_SIZE)}: ${insertError.message}`);
      } else {
        processed += inserted?.length || batch.length;
      }

      // Update job progress
      await supabaseClient
        .from('import_jobs')
        .update({
          processed_products: processed,
          failed_imports: failed,
          error_log: errors
        })
        .eq('id', job.id);
    }

    // Finalize job
    const finalStatus = failed === 0 ? 'completed' : (processed > 0 ? 'partial' : 'failed');
    
    await supabaseClient
      .from('import_jobs')
      .update({
        status: finalStatus,
        processed_products: processed,
        failed_imports: failed,
        error_log: errors,
        completed_at: new Date().toISOString()
      })
      .eq('id', job.id);

    // Log activity
    await supabaseClient
      .from('activity_logs')
      .insert({
        user_id: user.id,
        action: 'bts_csv_import',
        description: `Import BTSWholesaler: ${processed} produits importés, ${failed} échecs`,
        metadata: {
          job_id: job.id,
          total: btsProducts.length,
          processed,
          failed,
          source: 'bts_csv'
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        job_id: job.id,
        total: btsProducts.length,
        processed,
        failed,
        status: finalStatus
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('BTS CSV import error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
