/**
 * Feed URL Import - Secure Edge Function
 * P0.4 FIX: Replaced CORS * with restrictive allowlist
 * P0.5 FIX: userId derived from JWT, not from body
 * P1: SSRF protection and input validation
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Secure CORS configuration
const ALLOWED_ORIGINS = [
  'https://shopopti.io',
  'https://www.shopopti.io',
  'https://app.shopopti.io',
  'https://drop-craft-ai.lovable.app'
];

function getSecureCorsHeaders(origin: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  
  return headers;
}

// SSRF Protection
function isPrivateIPv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return false;
  const [a, b] = parts;
  return (
    a === 10 || a === 127 || a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

function validateFeedUrl(urlString: string): URL {
  let url: URL;
  try { 
    url = new URL(urlString); 
  } catch { 
    throw new Error('URL invalide'); 
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('URL doit utiliser http ou https');
  }

  const host = url.hostname.toLowerCase();
  if (!host || host.length < 3) throw new Error('Hostname invalide');
  if (host === 'localhost' || host.endsWith('.local')) throw new Error('Hôte interdit');
  if (host.includes('@')) throw new Error('Format hôte interdit');
  if (isPrivateIPv4(host)) throw new Error('IP privée non autorisée');

  // Block cloud metadata endpoints
  const metadataHosts = ['169.254.169.254', 'metadata.google.internal'];
  if (metadataHosts.some(h => host.includes(h))) {
    throw new Error('Endpoints metadata non autorisés');
  }

  return url;
}

// Allowed presets
const ALLOWED_PRESETS = new Set(['auto', 'shopify', 'google', 'matterhorn', 'custom']);

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getSecureCorsHeaders(origin);
  
  if (req.method === 'OPTIONS') {
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      return new Response(null, { status: 403 });
    }
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // SECURITY: Get user from JWT, NOT from body
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Autorisation requise' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(
        JSON.stringify({ success: false, error: 'Token invalide ou expiré' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`[FEED-IMPORT] Authenticated user: ${userId.slice(0, 8)}...`);

    const body = await req.json();
    
    // SECURITY: Reject if userId is in body
    if ('userId' in body || 'user_id' in body) {
      return new Response(
        JSON.stringify({ success: false, error: 'Ne pas envoyer userId dans le body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { 
      feedUrl, 
      mode = 'preview', // 'preview' | 'import'
      mapping = {}, 
      config = {},
      preset = 'auto'
    } = body;

    // Validate inputs
    if (!feedUrl || typeof feedUrl !== 'string') {
      return new Response(
        JSON.stringify({ success: false, error: 'URL du flux requise' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (mode !== 'preview' && mode !== 'import') {
      return new Response(
        JSON.stringify({ success: false, error: 'Mode invalide (preview ou import)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!ALLOWED_PRESETS.has(preset)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Preset invalide' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Validate URL
    const validatedUrl = validateFeedUrl(feedUrl);
    console.log(`📥 Feed URL Import - Mode: ${mode}, URL: ${validatedUrl.hostname}`);

    // Fetch the feed content with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

    try {
      const response = await fetch(validatedUrl.toString(), {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'Accept': 'text/csv, application/json, application/xml, text/xml, */*',
          'User-Agent': 'ShopOpti-FeedImport/2.0'
        }
      });
      
      clearTimeout(timeout);

      // Handle redirect with validation
      if (response.status >= 300 && response.status < 400) {
        throw new Error('Redirection non autorisée pour des raisons de sécurité');
      }
      
      if (!response.ok) {
        throw new Error(`Impossible de récupérer le flux: ${response.status} ${response.statusText}`);
      }

      // Limit response size
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 10_000_000) {
        throw new Error('Flux trop volumineux (max 10MB)');
      }

      const content = await response.text();
      if (content.length > 10_000_000) {
        throw new Error('Flux trop volumineux (max 10MB)');
      }

      const contentType = response.headers.get('content-type') || '';
      console.log(`📄 Contenu récupéré: ${content.length} bytes, Content-Type: ${contentType}`);
      
      // Auto-detect format
      const detectedFormat = detectFormat(content, contentType);
      console.log(`🔍 Format détecté: ${detectedFormat}`);
      
      let products: any[] = [];
      let parseError: string | null = null;
      
      try {
        switch (detectedFormat) {
          case 'csv':
            products = parseCSV(content, mapping, preset);
            break;
          case 'json':
            products = parseJSON(content, mapping);
            break;
          case 'xml':
            products = parseXML(content, mapping);
            break;
          default:
            throw new Error(`Format non reconnu. Formats supportés: CSV, JSON, XML`);
        }
      } catch (e) {
        parseError = e.message;
        console.error('❌ Parse error:', e);
      }

      console.log(`📦 Produits parsés: ${products.length}`);

      // Preview mode - return sample data
      if (mode === 'preview') {
        const sampleProducts = products.slice(0, 10);
        const columns = products.length > 0 ? Object.keys(products[0]) : [];
        
        return new Response(
          JSON.stringify({
            success: products.length > 0,
            format: detectedFormat,
            total_products: products.length,
            sample_products: sampleProducts,
            columns_detected: columns,
            content_preview: content.substring(0, 1000),
            parse_error: parseError,
            preset_applied: preset
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        );
      }

      // Import mode - save to database
      if (products.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            error: parseError || 'Aucun produit trouvé dans le flux. Vérifiez le format et le mapping.',
            format: detectedFormat,
            content_preview: content.substring(0, 500)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
      }

      // Create import job - SECURITY: user_id from token only
      const { data: job } = await supabaseClient
        .from('import_jobs')
        .insert({
          user_id: userId, // CRITICAL: from token only
          source_type: `feed-${detectedFormat}`,
          source_url: validatedUrl.toString(),
          status: 'processing',
          total_rows: products.length,
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      const jobId = job?.id;

      // Insert products in batches
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      const batchSize = Math.min(config.batchSize || 100, 200); // Cap batch size

      for (let i = 0; i < Math.min(products.length, 5000); i += batchSize) { // Cap total
        const batch = products.slice(i, i + batchSize).map((product, idx) => ({
          user_id: userId, // CRITICAL: from token only
          name: String(product.name || product.title || `Produit Feed ${i + idx + 1}`).substring(0, 500),
          description: cleanHTML(String(product.description || product.body || '')).substring(0, 10000),
          price: parsePrice(product.price || product.variant_price),
          compare_at_price: parsePrice(product.compare_at_price),
          cost_price: parsePrice(product.cost_price),
          sku: String(product.sku || product.variant_sku || `FEED-${Date.now()}-${i + idx}`).substring(0, 100),
          barcode: product.barcode || product.variant_barcode || null,
          category: String(product.category || product.product_type || product.type || 'Import Feed').substring(0, 200),
          brand: String(product.brand || product.vendor || '').substring(0, 200),
          image_url: product.image_url || product.image_src || '',
          images: Array.isArray(product.images) ? product.images.slice(0, 20) : null,
          stock_quantity: Math.min(parseInt(product.stock_quantity || product.variant_inventory_qty) || 0, 999999),
          weight: parseFloat(product.weight || product.variant_grams) || null,
          weight_unit: product.weight_unit || product.variant_weight_unit || 'g',
          status: config.status || 'draft',
          review_status: 'pending',
          source_url: validatedUrl.toString(),
          external_id: String(product.handle || product.external_id || product.sku || '').substring(0, 200),
          supplier_name: String(config.supplierName || extractSupplierFromUrl(validatedUrl.toString())).substring(0, 200),
          import_job_id: jobId,
          tags: product.tags || null,
          options: product.options || null,
          variants: product.variants || null,
          seo_title: product.seo_title ? String(product.seo_title).substring(0, 200) : null,
          seo_description: product.seo_description ? String(product.seo_description).substring(0, 500) : null,
          metadata: {
            feed_url: validatedUrl.toString(),
            format: detectedFormat,
            preset: preset
          }
        }));

        const { data, error } = await supabaseClient
          .from('imported_products')
          .insert(batch)
          .select('id');

        if (error) {
          errorCount += batch.length;
          errors.push(`Lot ${Math.floor(i / batchSize) + 1}: ${error.message}`);
          console.error(`❌ Batch error:`, error.message);
        } else {
          successCount += data?.length || 0;
        }

        // Update job progress - SCOPED to user
        if (jobId) {
          await supabaseClient
            .from('import_jobs')
            .update({
              processed_rows: Math.min(i + batchSize, products.length),
              success_rows: successCount,
              error_rows: errorCount
            })
            .eq('id', jobId)
            .eq('user_id', userId); // SECURE: scope to user
        }
      }

      // Update job as completed - SCOPED to user
      if (jobId) {
        await supabaseClient
          .from('import_jobs')
          .update({
            status: errorCount === products.length ? 'failed' : 'completed',
            completed_at: new Date().toISOString(),
            processed_rows: products.length,
            success_rows: successCount,
            error_rows: errorCount,
            errors: errors.length > 0 ? errors : null
          })
          .eq('id', jobId)
          .eq('user_id', userId); // SECURE: scope to user
      }

      // Log activity - SCOPED to user
      await supabaseClient.from('activity_logs').insert({
        user_id: userId, // CRITICAL: from token only
        action: 'feed_import',
        description: `Import Feed ${detectedFormat.toUpperCase()}: ${successCount} produits importés depuis ${extractDomainFromUrl(validatedUrl.toString())}`,
        entity_type: 'import',
        metadata: {
          source_type: `feed-${detectedFormat}`,
          source_url: validatedUrl.toString(),
          success: successCount,
          errors: errorCount,
          job_id: jobId,
          preset: preset
        }
      });

      console.log(`✅ Import terminé: ${successCount} succès, ${errorCount} erreurs`);

      return new Response(
        JSON.stringify({
          success: successCount > 0,
          message: `Import du flux ${detectedFormat.toUpperCase()} réussi`,
          data: {
            products_imported: successCount,
            total_processed: products.length,
            errors: errorCount,
            error_details: errors.slice(0, 10),
            job_id: jobId,
            format: detectedFormat
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );

    } finally {
      clearTimeout(timeout);
    }

  } catch (error) {
    console.error('❌ Feed import error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { headers: { ...getSecureCorsHeaders(req.headers.get('Origin')), 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// Detect format from content and headers
function detectFormat(content: string, contentType: string): 'csv' | 'json' | 'xml' | 'unknown' {
  const trimmed = content.trim();
  
  if (contentType.includes('csv') || contentType.includes('text/plain')) {
    if (hasCSVStructure(trimmed)) return 'csv';
  }
  if (contentType.includes('json')) return 'json';
  if (contentType.includes('xml')) return 'xml';
  
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return 'json';
  if (trimmed.startsWith('<?xml') || trimmed.startsWith('<')) return 'xml';
  if (hasCSVStructure(trimmed)) return 'csv';
  
  return 'unknown';
}

function hasCSVStructure(content: string): boolean {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return false;
  
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';
  const firstCols = firstLine.split(delimiter).length;
  
  if (firstCols < 3) return false;
  
  const lowerHeader = firstLine.toLowerCase();
  const indicators = ['handle', 'title', 'variant', 'sku', 'price', 'image'];
  const matched = indicators.filter(ind => lowerHeader.includes(ind));
  
  return matched.length >= 2;
}

function parseCSV(content: string, mapping: Record<string, string>, preset: string): any[] {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];
  
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const headers = parseCSVLine(lines[0], delimiter);
  
  const effectiveMapping = { ...getPresetMapping(preset, headers), ...mapping };
  const productsByHandle = new Map<string, any>();
  
  for (let i = 1; i < Math.min(lines.length, 10001); i++) { // Cap at 10k lines
    const values = parseCSVLine(lines[i], delimiter);
    if (values.length < 3) continue;
    
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header.trim()] = values[idx]?.trim() || '';
    });
    
    const handle = row['Handle'] || row['handle'] || `product-${i}`;
    const title = row['Title'] || row['title'] || row['Titre'] || '';
    const isVariantRow = !title && productsByHandle.has(handle);
    
    if (isVariantRow) {
      const existingProduct = productsByHandle.get(handle)!;
      if (!existingProduct.variants) existingProduct.variants = [];
      
      existingProduct.variants.push({
        sku: row['Variant SKU'] || '',
        price: row['Variant Price'] || '',
        compare_at_price: row['Variant Compare At Price'] || '',
        option1: row['Option1 Value'] || '',
        option2: row['Option2 Value'] || '',
        option3: row['Option3 Value'] || ''
      });
      
      const imageSrc = row['Image Src'] || row['image_src'] || '';
      if (imageSrc && !existingProduct.images?.includes(imageSrc)) {
        existingProduct.images = existingProduct.images || [];
        if (existingProduct.images.length < 20) existingProduct.images.push(imageSrc);
      }
    } else {
      const product = mapCSVRowToProduct(row, effectiveMapping);
      product.handle = handle;
      
      const imageSrc = row['Image Src'] || row['image_src'] || '';
      if (imageSrc) {
        product.images = [imageSrc];
        product.image_url = imageSrc;
      }
      
      productsByHandle.set(handle, product);
    }
  }
  
  return Array.from(productsByHandle.values());
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function mapCSVRowToProduct(row: Record<string, string>, mapping: Record<string, string>): any {
  const product: any = {};
  
  for (const [csvField, productField] of Object.entries(mapping)) {
    if (row[csvField]) product[productField] = row[csvField];
  }
  
  product.name = product.name || row['Title'] || row['title'] || '';
  product.description = product.description || row['Body (HTML)'] || row['Description'] || '';
  product.vendor = product.vendor || row['Vendor'] || '';
  product.product_type = product.product_type || row['Product Category'] || row['Type'] || '';
  product.tags = product.tags || row['Tags'] || '';
  product.sku = product.sku || row['Variant SKU'] || '';
  product.price = product.price || row['Variant Price'] || '';
  
  return product;
}

function getPresetMapping(preset: string, _headers: string[]): Record<string, string> {
  const shopifyMapping: Record<string, string> = {
    'Title': 'name',
    'Body (HTML)': 'description',
    'Vendor': 'vendor',
    'Product Category': 'category',
    'Type': 'product_type',
    'Tags': 'tags',
    'Variant SKU': 'sku',
    'Variant Price': 'price',
    'Variant Compare At Price': 'compare_at_price',
    'Variant Inventory Qty': 'stock_quantity',
    'Image Src': 'image_url'
  };
  
  if (preset === 'shopify' || preset === 'auto') return shopifyMapping;
  return {};
}

function parseJSON(content: string, _mapping: Record<string, string>): any[] {
  try {
    const data = JSON.parse(content);
    if (Array.isArray(data)) return data.slice(0, 10000);
    if (data.products && Array.isArray(data.products)) return data.products.slice(0, 10000);
    if (data.items && Array.isArray(data.items)) return data.items.slice(0, 10000);
    return [data];
  } catch {
    return [];
  }
}

function parseXML(_content: string, _mapping: Record<string, string>): any[] {
  // Simplified XML parsing - would need proper parser for production
  return [];
}

function cleanHTML(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parsePrice(value: any): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = parseFloat(String(value).replace(/[^0-9.]/g, ''));
  return isNaN(num) || num < 0 ? null : Math.min(num, 999999.99);
}

function extractSupplierFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, '').split('.')[0];
  } catch {
    return 'unknown';
  }
}

function extractDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}
