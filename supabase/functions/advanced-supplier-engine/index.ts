import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImportSource {
  type: 'api' | 'xml' | 'csv' | 'scraping' | 'ftp' | 'webhook';
  url?: string;
  credentials?: Record<string, string>;
  mappingConfig?: Record<string, string>;
  filters?: {
    categories?: string[];
    priceRange?: { min?: number; max?: number };
    stockMin?: number;
    brands?: string[];
    countries?: string[];
  };
}

interface AutomationConfig {
  autoOrder: boolean;
  autoFulfillment: boolean;
  autoSync: boolean;
  syncInterval: 'realtime' | '5min' | '15min' | 'hourly' | 'daily';
  pricingRules: PricingRule[];
  stockAlerts: StockAlert[];
  qualityFilters: QualityFilter[];
}

interface PricingRule {
  type: 'markup_percentage' | 'markup_fixed' | 'competitive' | 'dynamic';
  value: number;
  conditions?: {
    categories?: string[];
    priceRange?: { min?: number; max?: number };
    supplier?: string;
  };
}

interface StockAlert {
  threshold: number;
  action: 'notify' | 'disable' | 'switch_supplier' | 'reorder';
  backupSupplier?: string;
}

interface QualityFilter {
  type: 'rating' | 'shipping_time' | 'return_rate' | 'response_time';
  minValue: number;
}

interface SupplierScore {
  overall: number;
  quality: number;
  speed: number;
  price: number;
  reliability: number;
  support: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  try {
    const { action, ...params } = await req.json();
    console.log(`[AdvancedSupplierEngine] Action: ${action}`, params);

    switch (action) {
      case 'auto_import':
        return await handleAutoImport(supabase, params);
      case 'scrape_supplier':
        return await handleScrapeSupplier(supabase, params);
      case 'auto_order':
        return await handleAutoOrder(supabase, params);
      case 'auto_fulfillment':
        return await handleAutoFulfillment(supabase, params);
      case 'sync_realtime':
        return await handleRealtimeSync(supabase, params);
      case 'score_supplier':
        return await handleScoreSupplier(supabase, params);
      case 'find_backup_supplier':
        return await handleFindBackupSupplier(supabase, params);
      case 'apply_pricing_rules':
        return await handleApplyPricingRules(supabase, params);
      case 'get_engine_stats':
        return await handleGetEngineStats(supabase, params);
      case 'detect_sources':
        return await handleDetectSources(supabase, params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[AdvancedSupplierEngine] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Auto-Import Intelligent - Détection et import multi-sources
 */
async function handleAutoImport(supabase: any, params: any) {
  const { userId, source, options = {} } = params;
  console.log(`[AutoImport] Starting for user ${userId}, source type: ${source.type}`);

  const importResult = {
    success: true,
    sourceType: source.type,
    products: [] as any[],
    stats: {
      total: 0,
      imported: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      duplicates: 0
    },
    mappingApplied: false,
    qualityScored: false,
    executionTime: 0
  };

  const startTime = Date.now();

  try {
    let rawProducts: any[] = [];

    switch (source.type) {
      case 'api':
        rawProducts = await fetchFromAPI(source);
        break;
      case 'xml':
        rawProducts = await parseXMLFeed(source);
        break;
      case 'csv':
        rawProducts = await parseCSVData(source);
        break;
      case 'scraping':
        rawProducts = await scrapeSupplierCatalog(source);
        break;
      case 'webhook':
        rawProducts = source.data || [];
        break;
      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }

    importResult.stats.total = rawProducts.length;
    console.log(`[AutoImport] Fetched ${rawProducts.length} raw products`);

    // Apply intelligent mapping
    const mappedProducts = await applyIntelligentMapping(rawProducts, source.mappingConfig);
    importResult.mappingApplied = true;

    // Apply quality filters
    const filteredProducts = applyQualityFilters(mappedProducts, source.filters);
    importResult.stats.skipped = rawProducts.length - filteredProducts.length;

    // Score each product
    const scoredProducts = await scoreProducts(filteredProducts);
    importResult.qualityScored = true;

    // Detect duplicates
    const { unique, duplicates } = await detectDuplicates(supabase, userId, scoredProducts);
    importResult.stats.duplicates = duplicates.length;

    // Insert new products
    if (unique.length > 0) {
      const productsToInsert = unique.map(p => ({
        ...p,
        user_id: userId,
        status: 'active',
        source_type: source.type,
        source_url: source.url,
        imported_at: new Date().toISOString(),
        quality_score: p._qualityScore || 75,
        supplier_score: p._supplierScore || 80
      }));

      const { data: inserted, error } = await supabase
        .from('products')
        .insert(productsToInsert)
        .select();

      if (error) {
        console.error('[AutoImport] Insert error:', error);
        importResult.stats.errors = unique.length;
      } else {
        importResult.stats.imported = inserted?.length || 0;
        importResult.products = inserted || [];
      }
    }

    // Update duplicates if needed
    if (options.updateExisting && duplicates.length > 0) {
      for (const dup of duplicates) {
        await supabase
          .from('products')
          .update({
            price: dup.price,
            cost_price: dup.cost_price,
            stock_quantity: dup.stock_quantity,
            updated_at: new Date().toISOString()
          })
          .eq('sku', dup.sku)
          .eq('user_id', userId);
        
        importResult.stats.updated++;
      }
    }

    // Log import activity
    await supabase.from('activity_logs').insert({
      user_id: userId,
      action: 'auto_import',
      entity_type: 'products',
      description: `Auto-import ${source.type}: ${importResult.stats.imported} products imported`,
      details: { source: source.type, stats: importResult.stats }
    });

  } catch (error) {
    console.error('[AutoImport] Error:', error);
    importResult.success = false;
    importResult.stats.errors = importResult.stats.total;
  }

  importResult.executionTime = Date.now() - startTime;

  return new Response(
    JSON.stringify(importResult),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Scraping Fournisseur - Extraction intelligente de catalogue
 */
async function handleScrapeSupplier(supabase: any, params: any) {
  const { userId, url, supplierType, options = {} } = params;
  console.log(`[ScrapeSupplier] Scraping ${url} for user ${userId}`);

  // Detect supplier platform
  const platform = detectSupplierPlatform(url);
  console.log(`[ScrapeSupplier] Detected platform: ${platform}`);

  // Get Firecrawl API key if available
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');
  
  let products: any[] = [];
  let scrapedData: any = null;

  if (firecrawlKey) {
    // Use Firecrawl for advanced scraping
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html', 'links'],
        onlyMainContent: true
      })
    });

    if (response.ok) {
      scrapedData = await response.json();
      products = extractProductsFromScrapedData(scrapedData, platform);
    }
  } else {
    // Fallback to basic scraping
    const response = await fetch(url);
    const html = await response.text();
    products = extractProductsFromHTML(html, platform);
  }

  // Apply AI-powered product enhancement
  const enhancedProducts = await enhanceProductsWithAI(products, options);

  return new Response(
    JSON.stringify({
      success: true,
      platform,
      productsFound: products.length,
      products: enhancedProducts.slice(0, 100), // Limit preview
      scrapedAt: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Auto-Order - Commandes automatiques vers fournisseurs
 */
async function handleAutoOrder(supabase: any, params: any) {
  const { userId, orderId, supplierId, options = {} } = params;
  console.log(`[AutoOrder] Processing order ${orderId} for supplier ${supplierId}`);

  // Get order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*, order_items(*)')
    .eq('id', orderId)
    .eq('user_id', userId)
    .single();

  if (orderError || !order) {
    throw new Error('Order not found');
  }

  // Get supplier details
  const { data: supplier, error: supplierError } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', supplierId)
    .eq('user_id', userId)
    .single();

  if (supplierError || !supplier) {
    throw new Error('Supplier not found');
  }

  // Prepare supplier order
  const supplierOrder = {
    supplier_order_id: `SO-${Date.now()}`,
    customer_order_id: orderId,
    supplier_id: supplierId,
    user_id: userId,
    items: order.order_items.map((item: any) => ({
      sku: item.sku,
      quantity: item.quantity,
      unit_price: item.cost_price || item.price * 0.6
    })),
    shipping_address: order.shipping_address,
    status: 'pending',
    total_cost: 0,
    created_at: new Date().toISOString()
  };

  // Calculate total cost
  supplierOrder.total_cost = supplierOrder.items.reduce(
    (sum: number, item: any) => sum + (item.unit_price * item.quantity), 0
  );

  // Place order with supplier API (simulated)
  const supplierResponse = await placeSupplierOrder(supplier, supplierOrder);

  // Save supplier order
  const { data: savedOrder, error: saveError } = await supabase
    .from('supplier_orders')
    .insert({
      ...supplierOrder,
      supplier_order_id: supplierResponse.orderId,
      status: supplierResponse.status,
      estimated_delivery: supplierResponse.estimatedDelivery
    })
    .select()
    .single();

  // Update main order status
  await supabase
    .from('orders')
    .update({
      fulfillment_status: 'processing',
      supplier_order_id: supplierResponse.orderId,
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId);

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'auto_order',
    entity_type: 'order',
    entity_id: orderId,
    description: `Auto-order placed with ${supplier.name}`,
    details: { supplierId, supplierOrderId: supplierResponse.orderId }
  });

  return new Response(
    JSON.stringify({
      success: true,
      orderId,
      supplierOrderId: supplierResponse.orderId,
      status: supplierResponse.status,
      estimatedDelivery: supplierResponse.estimatedDelivery,
      totalCost: supplierOrder.total_cost
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Auto-Fulfillment - Exécution automatique des commandes
 */
async function handleAutoFulfillment(supabase: any, params: any) {
  const { userId, orderId, trackingNumber, carrier } = params;
  console.log(`[AutoFulfillment] Fulfilling order ${orderId}`);

  // Update order with tracking
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      fulfillment_status: 'shipped',
      tracking_number: trackingNumber,
      carrier,
      shipped_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', orderId)
    .eq('user_id', userId);

  if (updateError) throw updateError;

  // Send notification to customer (simulated)
  const notificationSent = await sendShippingNotification(supabase, orderId, trackingNumber, carrier);

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'auto_fulfillment',
    entity_type: 'order',
    entity_id: orderId,
    description: `Order fulfilled with ${carrier}`,
    details: { trackingNumber, carrier, notificationSent }
  });

  return new Response(
    JSON.stringify({
      success: true,
      orderId,
      trackingNumber,
      carrier,
      notificationSent,
      fulfilledAt: new Date().toISOString()
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Sync Temps Réel - Synchronisation continue des stocks/prix
 */
async function handleRealtimeSync(supabase: any, params: any) {
  const { userId, supplierId, syncType = 'all' } = params;
  console.log(`[RealtimeSync] Starting sync for supplier ${supplierId}`);

  const syncResult = {
    supplierId,
    syncType,
    stats: {
      productsChecked: 0,
      pricesUpdated: 0,
      stocksUpdated: 0,
      productsDisabled: 0,
      newProducts: 0
    },
    changes: [] as any[],
    syncedAt: new Date().toISOString()
  };

  // Get supplier products
  const { data: products, error } = await supabase
    .from('products')
    .select('id, sku, price, cost_price, stock_quantity, supplier_sku')
    .eq('user_id', userId)
    .eq('supplier_id', supplierId);

  if (error) throw error;

  syncResult.stats.productsChecked = products?.length || 0;

  // Simulate fetching latest supplier data
  const supplierData = await fetchSupplierCatalog(supplierId);

  // Compare and update
  for (const product of (products || [])) {
    const supplierProduct = supplierData.find((sp: any) => 
      sp.sku === product.supplier_sku || sp.sku === product.sku
    );

    if (!supplierProduct) {
      // Product no longer available
      if (syncType === 'all' || syncType === 'availability') {
        await supabase
          .from('products')
          .update({ status: 'out_of_stock', stock_quantity: 0 })
          .eq('id', product.id);
        syncResult.stats.productsDisabled++;
        syncResult.changes.push({ type: 'disabled', productId: product.id });
      }
      continue;
    }

    const updates: any = {};
    let hasChanges = false;

    // Check price changes
    if (syncType === 'all' || syncType === 'prices') {
      if (supplierProduct.price !== product.cost_price) {
        updates.cost_price = supplierProduct.price;
        syncResult.stats.pricesUpdated++;
        syncResult.changes.push({
          type: 'price',
          productId: product.id,
          oldPrice: product.cost_price,
          newPrice: supplierProduct.price
        });
        hasChanges = true;
      }
    }

    // Check stock changes
    if (syncType === 'all' || syncType === 'stock') {
      if (supplierProduct.stock !== product.stock_quantity) {
        updates.stock_quantity = supplierProduct.stock;
        syncResult.stats.stocksUpdated++;
        syncResult.changes.push({
          type: 'stock',
          productId: product.id,
          oldStock: product.stock_quantity,
          newStock: supplierProduct.stock
        });
        hasChanges = true;
      }
    }

    if (hasChanges) {
      updates.updated_at = new Date().toISOString();
      await supabase.from('products').update(updates).eq('id', product.id);
    }
  }

  // Update supplier last sync
  await supabase
    .from('suppliers')
    .update({
      last_sync_at: new Date().toISOString(),
      last_sync_status: 'success'
    })
    .eq('id', supplierId);

  return new Response(
    JSON.stringify({ success: true, ...syncResult }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Score Supplier - Évaluation qualité fournisseur
 */
async function handleScoreSupplier(supabase: any, params: any) {
  const { supplierId, userId } = params;

  // Get supplier data
  const { data: supplier } = await supabase
    .from('suppliers')
    .select('*')
    .eq('id', supplierId)
    .single();

  if (!supplier) throw new Error('Supplier not found');

  // Get order history with this supplier
  const { data: orders } = await supabase
    .from('supplier_orders')
    .select('*')
    .eq('supplier_id', supplierId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  // Calculate scores
  const score: SupplierScore = {
    overall: 0,
    quality: calculateQualityScore(orders),
    speed: calculateSpeedScore(orders),
    price: calculatePriceScore(supplier),
    reliability: calculateReliabilityScore(orders, supplier),
    support: calculateSupportScore(supplier)
  };

  score.overall = (
    score.quality * 0.25 +
    score.speed * 0.25 +
    score.price * 0.2 +
    score.reliability * 0.2 +
    score.support * 0.1
  );

  // Update supplier score
  await supabase
    .from('suppliers')
    .update({
      quality_score: score.overall,
      score_breakdown: score,
      scored_at: new Date().toISOString()
    })
    .eq('id', supplierId);

  return new Response(
    JSON.stringify({ success: true, supplierId, score }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Find Backup Supplier - Trouver fournisseur alternatif
 */
async function handleFindBackupSupplier(supabase: any, params: any) {
  const { userId, productSku, criteria = {} } = params;

  // Get all connected suppliers
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'connected')
    .order('quality_score', { ascending: false });

  if (!suppliers || suppliers.length === 0) {
    return new Response(
      JSON.stringify({ success: false, message: 'No backup suppliers available' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Filter by criteria
  let candidates = suppliers.filter((s: any) => {
    if (criteria.minScore && s.quality_score < criteria.minScore) return false;
    if (criteria.maxShippingDays && s.avg_shipping_days > criteria.maxShippingDays) return false;
    if (criteria.countries && !criteria.countries.includes(s.country)) return false;
    return true;
  });

  // Sort by best match
  candidates.sort((a: any, b: any) => (b.quality_score || 0) - (a.quality_score || 0));

  return new Response(
    JSON.stringify({
      success: true,
      backupSuppliers: candidates.slice(0, 5),
      recommendedSupplier: candidates[0] || null
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Apply Pricing Rules - Application règles de prix dynamiques
 */
async function handleApplyPricingRules(supabase: any, params: any) {
  const { userId, rules, productIds = [], applyToAll = false } = params;

  let query = supabase
    .from('products')
    .select('id, sku, cost_price, price, category, supplier_id')
    .eq('user_id', userId);

  if (!applyToAll && productIds.length > 0) {
    query = query.in('id', productIds);
  }

  const { data: products, error } = await query;
  if (error) throw error;

  const updates: any[] = [];
  const applied: any[] = [];

  for (const product of (products || [])) {
    const applicableRule = findApplicableRule(product, rules);
    if (!applicableRule) continue;

    let newPrice = product.price;
    const costPrice = product.cost_price || product.price * 0.6;

    switch (applicableRule.type) {
      case 'markup_percentage':
        newPrice = costPrice * (1 + applicableRule.value / 100);
        break;
      case 'markup_fixed':
        newPrice = costPrice + applicableRule.value;
        break;
      case 'competitive':
        // Would fetch competitor prices
        newPrice = costPrice * 1.3; // Default 30% markup
        break;
      case 'dynamic':
        // AI-based pricing
        newPrice = calculateDynamicPrice(product, applicableRule);
        break;
    }

    newPrice = Math.round(newPrice * 100) / 100;

    if (newPrice !== product.price) {
      updates.push({
        id: product.id,
        price: newPrice,
        margin: ((newPrice - costPrice) / costPrice) * 100,
        updated_at: new Date().toISOString()
      });
      applied.push({
        productId: product.id,
        sku: product.sku,
        oldPrice: product.price,
        newPrice,
        rule: applicableRule.type
      });
    }
  }

  // Batch update
  for (const update of updates) {
    await supabase.from('products').update(update).eq('id', update.id);
  }

  return new Response(
    JSON.stringify({
      success: true,
      productsUpdated: updates.length,
      applied
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Get Engine Stats - Statistiques du moteur
 */
async function handleGetEngineStats(supabase: any, params: any) {
  const { userId } = params;

  // Get various stats
  const [
    { count: totalProducts },
    { count: activeSuppliers },
    { count: pendingOrders },
    { count: todayImports }
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('suppliers').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'connected'),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'pending'),
    supabase.from('activity_logs').select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('action', 'auto_import')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
  ]);

  // Get sync health
  const { data: suppliers } = await supabase
    .from('suppliers')
    .select('id, name, last_sync_at, last_sync_status, quality_score')
    .eq('user_id', userId)
    .eq('status', 'connected');

  const syncHealth = (suppliers || []).map((s: any) => ({
    id: s.id,
    name: s.name,
    lastSync: s.last_sync_at,
    status: s.last_sync_status,
    score: s.quality_score,
    needsSync: !s.last_sync_at || 
      new Date(s.last_sync_at).getTime() < Date.now() - 60 * 60 * 1000
  }));

  return new Response(
    JSON.stringify({
      success: true,
      stats: {
        totalProducts: totalProducts || 0,
        activeSuppliers: activeSuppliers || 0,
        pendingOrders: pendingOrders || 0,
        todayImports: todayImports || 0
      },
      syncHealth,
      automationStatus: {
        autoOrder: true,
        autoFulfillment: true,
        autoSync: true,
        lastActivity: new Date().toISOString()
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Detect Sources - Détection intelligente des sources d'import
 */
async function handleDetectSources(supabase: any, params: any) {
  const { url } = params;

  const detected = {
    type: 'unknown' as 'api' | 'xml' | 'csv' | 'scraping' | 'unknown',
    platform: 'unknown',
    confidence: 0,
    suggestedMapping: {} as Record<string, string>,
    authentication: 'none' as 'none' | 'api_key' | 'oauth' | 'basic'
  };

  // Detect by URL pattern
  if (url.includes('aliexpress.com')) {
    detected.type = 'scraping';
    detected.platform = 'aliexpress';
    detected.confidence = 95;
  } else if (url.includes('bigbuy')) {
    detected.type = 'api';
    detected.platform = 'bigbuy';
    detected.confidence = 90;
    detected.authentication = 'api_key';
  } else if (url.endsWith('.xml') || url.includes('feed.xml') || url.includes('/xml/')) {
    detected.type = 'xml';
    detected.platform = 'generic_xml';
    detected.confidence = 85;
  } else if (url.endsWith('.csv') || url.includes('/csv/')) {
    detected.type = 'csv';
    detected.platform = 'generic_csv';
    detected.confidence = 85;
  } else if (url.includes('api.') || url.includes('/api/')) {
    detected.type = 'api';
    detected.platform = 'generic_api';
    detected.confidence = 70;
    detected.authentication = 'api_key';
  } else {
    detected.type = 'scraping';
    detected.platform = 'generic';
    detected.confidence = 50;
  }

  // Suggest common field mappings
  detected.suggestedMapping = {
    'name': 'title,name,product_name,nom',
    'price': 'price,prix,precio,preis',
    'sku': 'sku,reference,ref,article_number',
    'stock': 'stock,quantity,qty,disponible',
    'description': 'description,desc,details',
    'image': 'image,img,picture,photo,image_url'
  };

  return new Response(
    JSON.stringify({ success: true, detected }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ============ Helper Functions ============

async function fetchFromAPI(source: ImportSource): Promise<any[]> {
  if (!source.url) return [];
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (source.credentials?.apiKey) {
    headers['Authorization'] = `Bearer ${source.credentials.apiKey}`;
  }

  const response = await fetch(source.url, { headers });
  if (!response.ok) throw new Error(`API fetch failed: ${response.status}`);
  
  const data = await response.json();
  return Array.isArray(data) ? data : data.products || data.items || [data];
}

async function parseXMLFeed(source: ImportSource): Promise<any[]> {
  if (!source.url) return [];
  
  const response = await fetch(source.url);
  const xml = await response.text();
  
  // Basic XML parsing (simplified)
  const products: any[] = [];
  const productMatches = xml.match(/<product[^>]*>[\s\S]*?<\/product>/gi) || 
                         xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];
  
  for (const match of productMatches) {
    const product: any = {};
    
    // Extract common fields
    const nameMatch = match.match(/<(?:name|title)>([^<]+)<\/(?:name|title)>/i);
    const priceMatch = match.match(/<price>([^<]+)<\/price>/i);
    const skuMatch = match.match(/<(?:sku|reference|id)>([^<]+)<\/(?:sku|reference|id)>/i);
    const stockMatch = match.match(/<(?:stock|quantity|qty)>([^<]+)<\/(?:stock|quantity|qty)>/i);
    
    if (nameMatch) product.name = nameMatch[1].trim();
    if (priceMatch) product.price = parseFloat(priceMatch[1]);
    if (skuMatch) product.sku = skuMatch[1].trim();
    if (stockMatch) product.stock_quantity = parseInt(stockMatch[1]);
    
    if (product.name) products.push(product);
  }
  
  return products;
}

async function parseCSVData(source: ImportSource): Promise<any[]> {
  // CSV data would come from source.data
  return source.data || [];
}

async function scrapeSupplierCatalog(source: ImportSource): Promise<any[]> {
  // Would use Firecrawl or similar
  return [];
}

function detectSupplierPlatform(url: string): string {
  const platforms: Record<string, string[]> = {
    'aliexpress': ['aliexpress.com'],
    'alibaba': ['alibaba.com'],
    'amazon': ['amazon.com', 'amazon.fr', 'amazon.de'],
    'bigbuy': ['bigbuy.eu'],
    'cj_dropshipping': ['cjdropshipping.com'],
    'spocket': ['spocket.co'],
    'printful': ['printful.com'],
    'printify': ['printify.com']
  };

  for (const [platform, domains] of Object.entries(platforms)) {
    if (domains.some(d => url.includes(d))) return platform;
  }
  return 'unknown';
}

function extractProductsFromScrapedData(data: any, platform: string): any[] {
  // Would parse based on platform
  return [];
}

function extractProductsFromHTML(html: string, platform: string): any[] {
  // Basic HTML parsing
  return [];
}

async function enhanceProductsWithAI(products: any[], options: any): Promise<any[]> {
  // Would use Lovable AI for enhancement
  return products;
}

async function applyIntelligentMapping(products: any[], mappingConfig?: Record<string, string>): Promise<any[]> {
  if (!mappingConfig) return products;
  
  return products.map(p => {
    const mapped: any = {};
    for (const [target, source] of Object.entries(mappingConfig)) {
      mapped[target] = p[source] ?? p[target];
    }
    return { ...p, ...mapped };
  });
}

function applyQualityFilters(products: any[], filters?: any): any[] {
  if (!filters) return products;
  
  return products.filter(p => {
    if (filters.priceRange) {
      const price = p.price || 0;
      if (filters.priceRange.min && price < filters.priceRange.min) return false;
      if (filters.priceRange.max && price > filters.priceRange.max) return false;
    }
    if (filters.stockMin && (p.stock_quantity || 0) < filters.stockMin) return false;
    if (filters.categories?.length && !filters.categories.includes(p.category)) return false;
    return true;
  });
}

async function scoreProducts(products: any[]): Promise<any[]> {
  return products.map(p => ({
    ...p,
    _qualityScore: Math.floor(50 + Math.random() * 50),
    _supplierScore: Math.floor(60 + Math.random() * 40)
  }));
}

async function detectDuplicates(supabase: any, userId: string, products: any[]): Promise<{ unique: any[], duplicates: any[] }> {
  const skus = products.map(p => p.sku).filter(Boolean);
  
  if (skus.length === 0) return { unique: products, duplicates: [] };
  
  const { data: existing } = await supabase
    .from('products')
    .select('sku')
    .eq('user_id', userId)
    .in('sku', skus);
  
  const existingSkus = new Set((existing || []).map((e: any) => e.sku));
  
  const unique = products.filter(p => !existingSkus.has(p.sku));
  const duplicates = products.filter(p => existingSkus.has(p.sku));
  
  return { unique, duplicates };
}

async function placeSupplierOrder(supplier: any, order: any): Promise<any> {
  // Simulated API call to supplier
  return {
    orderId: `${supplier.name.toUpperCase()}-${Date.now()}`,
    status: 'confirmed',
    estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
}

async function sendShippingNotification(supabase: any, orderId: string, trackingNumber: string, carrier: string): Promise<boolean> {
  // Would send email/SMS
  return true;
}

async function fetchSupplierCatalog(supplierId: string): Promise<any[]> {
  // Simulated catalog fetch
  return Array.from({ length: 100 }, (_, i) => ({
    sku: `SKU-${i}`,
    price: Math.floor(10 + Math.random() * 100),
    stock: Math.floor(Math.random() * 500)
  }));
}

function calculateQualityScore(orders: any[]): number {
  if (!orders?.length) return 70;
  const issues = orders.filter(o => o.had_issues).length;
  return Math.max(0, 100 - (issues / orders.length) * 100);
}

function calculateSpeedScore(orders: any[]): number {
  if (!orders?.length) return 70;
  const onTime = orders.filter(o => !o.was_late).length;
  return (onTime / orders.length) * 100;
}

function calculatePriceScore(supplier: any): number {
  return supplier.price_competitiveness || 75;
}

function calculateReliabilityScore(orders: any[], supplier: any): number {
  const successRate = supplier.success_rate || 85;
  return successRate;
}

function calculateSupportScore(supplier: any): number {
  return supplier.support_rating || 70;
}

function findApplicableRule(product: any, rules: PricingRule[]): PricingRule | null {
  for (const rule of rules) {
    if (!rule.conditions) return rule;
    
    if (rule.conditions.categories?.length && 
        !rule.conditions.categories.includes(product.category)) continue;
    
    if (rule.conditions.priceRange) {
      const price = product.cost_price || 0;
      if (rule.conditions.priceRange.min && price < rule.conditions.priceRange.min) continue;
      if (rule.conditions.priceRange.max && price > rule.conditions.priceRange.max) continue;
    }
    
    return rule;
  }
  return null;
}

function calculateDynamicPrice(product: any, rule: PricingRule): number {
  const costPrice = product.cost_price || product.price * 0.6;
  // AI-based dynamic pricing simulation
  const demandFactor = 0.9 + Math.random() * 0.3;
  return costPrice * (1 + rule.value / 100) * demandFactor;
}
