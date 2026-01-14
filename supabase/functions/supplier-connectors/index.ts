import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ============================================
// CONFIGURATION DES CONNECTEURS FOURNISSEURS
// ============================================

interface SupplierConnector {
  id: string;
  name: string;
  logo: string;
  type: 'api' | 'scraping' | 'feed' | 'oauth';
  category: 'china' | 'europe' | 'us' | 'print_on_demand' | 'wholesale' | 'marketplace';
  baseUrl: string;
  authType: 'api_key' | 'oauth2' | 'basic' | 'custom';
  endpoints: Record<string, string>;
  rateLimit: { requests: number; window: string };
  features: string[];
}

const SUPPLIER_CONNECTORS: Record<string, SupplierConnector> = {
  aliexpress: {
    id: 'aliexpress',
    name: 'AliExpress',
    logo: 'https://ae01.alicdn.com/kf/S3b6cd19c9e5a4c31b64db1c45dfe79d1v.png',
    type: 'api',
    category: 'china',
    baseUrl: 'https://api-sg.aliexpress.com/sync',
    authType: 'oauth2',
    endpoints: {
      products: '/aliexpress.affiliate.product.query',
      productDetails: '/aliexpress.affiliate.productdetail.get',
      orders: '/aliexpress.affiliate.order.list',
      categories: '/aliexpress.affiliate.category.get',
      shipping: '/aliexpress.logistics.buyer.freight.get',
      tracking: '/aliexpress.logistics.ds.trackinginfo.query'
    },
    rateLimit: { requests: 40, window: '1s' },
    features: ['product_search', 'order_placement', 'tracking', 'price_sync', 'stock_sync']
  },
  
  cj_dropshipping: {
    id: 'cj_dropshipping',
    name: 'CJ Dropshipping',
    logo: 'https://cjdropshipping.com/favicon.ico',
    type: 'api',
    category: 'china',
    baseUrl: 'https://developers.cjdropshipping.com/api2.0/v1',
    authType: 'api_key',
    endpoints: {
      products: '/product/list',
      productDetails: '/product/query',
      variants: '/product/variant',
      categories: '/product/category',
      orders: '/shopping/order/createOrder',
      orderStatus: '/shopping/order/getOrderDetail',
      tracking: '/logistics/getTrackInfo',
      shipping: '/logistics/freightCalculate',
      inventory: '/product/stock'
    },
    rateLimit: { requests: 100, window: '1m' },
    features: ['product_search', 'order_placement', 'tracking', 'warehousing', 'custom_packaging', 'print_on_demand']
  },
  
  bigbuy: {
    id: 'bigbuy',
    name: 'BigBuy',
    logo: 'https://www.bigbuy.eu/favicon.ico',
    type: 'api',
    category: 'europe',
    baseUrl: 'https://api.bigbuy.eu/rest',
    authType: 'api_key',
    endpoints: {
      products: '/catalog/products.json',
      productDetails: '/catalog/product/{id}.json',
      categories: '/catalog/categories.json',
      stock: '/catalog/productsstockbyhandlingdays.json',
      prices: '/catalog/productsstock.json',
      orders: '/order/create.json',
      orderStatus: '/order/status/{id}.json',
      tracking: '/order/delivery/{id}.json',
      shipping: '/shipping/carriers.json'
    },
    rateLimit: { requests: 250, window: '5m' },
    features: ['product_search', 'order_placement', 'tracking', 'eu_warehousing', 'fast_shipping', 'vat_included']
  },
  
  spocket: {
    id: 'spocket',
    name: 'Spocket',
    logo: 'https://spocket.co/favicon.ico',
    type: 'api',
    category: 'us',
    baseUrl: 'https://api.spocket.co/v1',
    authType: 'oauth2',
    endpoints: {
      products: '/products',
      productDetails: '/products/{id}',
      suppliers: '/suppliers',
      orders: '/orders',
      tracking: '/orders/{id}/tracking',
      inventory: '/inventory'
    },
    rateLimit: { requests: 100, window: '1m' },
    features: ['product_search', 'order_placement', 'tracking', 'us_eu_suppliers', 'quality_verified']
  },
  
  zendrop: {
    id: 'zendrop',
    name: 'Zendrop',
    logo: 'https://zendrop.com/favicon.ico',
    type: 'api',
    category: 'us',
    baseUrl: 'https://api.zendrop.com/v1',
    authType: 'api_key',
    endpoints: {
      products: '/products',
      productDetails: '/products/{id}',
      orders: '/orders',
      orderStatus: '/orders/{id}',
      tracking: '/orders/{id}/tracking',
      shipping: '/shipping/rates'
    },
    rateLimit: { requests: 60, window: '1m' },
    features: ['product_search', 'order_placement', 'tracking', 'us_warehousing', 'fast_shipping', 'custom_branding']
  },
  
  printful: {
    id: 'printful',
    name: 'Printful',
    logo: 'https://www.printful.com/favicon.ico',
    type: 'api',
    category: 'print_on_demand',
    baseUrl: 'https://api.printful.com',
    authType: 'api_key',
    endpoints: {
      products: '/products',
      productDetails: '/products/{id}',
      variants: '/products/{id}/variants',
      orders: '/orders',
      orderStatus: '/orders/{id}',
      shipping: '/shipping/rates',
      mockups: '/mockup-generator/create-task/{id}',
      files: '/files'
    },
    rateLimit: { requests: 120, window: '1m' },
    features: ['product_search', 'order_placement', 'tracking', 'custom_print', 'mockup_generator', 'global_fulfillment']
  },
  
  printify: {
    id: 'printify',
    name: 'Printify',
    logo: 'https://printify.com/favicon.ico',
    type: 'api',
    category: 'print_on_demand',
    baseUrl: 'https://api.printify.com/v1',
    authType: 'api_key',
    endpoints: {
      shops: '/shops.json',
      products: '/shops/{shop_id}/products.json',
      productDetails: '/shops/{shop_id}/products/{id}.json',
      blueprints: '/catalog/blueprints.json',
      providers: '/catalog/blueprints/{id}/print_providers.json',
      orders: '/shops/{shop_id}/orders.json',
      shipping: '/shops/{shop_id}/orders/shipping.json'
    },
    rateLimit: { requests: 600, window: '1m' },
    features: ['product_search', 'order_placement', 'tracking', 'custom_print', 'multi_provider', 'global_fulfillment']
  },
  
  syncee: {
    id: 'syncee',
    name: 'Syncee',
    logo: 'https://syncee.com/favicon.ico',
    type: 'api',
    category: 'marketplace',
    baseUrl: 'https://api.syncee.com/v1',
    authType: 'api_key',
    endpoints: {
      products: '/products',
      suppliers: '/suppliers',
      orders: '/orders',
      sync: '/sync',
      categories: '/categories'
    },
    rateLimit: { requests: 100, window: '1m' },
    features: ['product_search', 'order_placement', 'auto_sync', 'multi_supplier', 'global_network']
  },
  
  modalyst: {
    id: 'modalyst',
    name: 'Modalyst',
    logo: 'https://modalyst.co/favicon.ico',
    type: 'api',
    category: 'us',
    baseUrl: 'https://api.modalyst.co/v1',
    authType: 'oauth2',
    endpoints: {
      products: '/products',
      suppliers: '/suppliers',
      orders: '/orders',
      inventory: '/inventory'
    },
    rateLimit: { requests: 100, window: '1m' },
    features: ['product_search', 'order_placement', 'tracking', 'brand_suppliers', 'fashion_focus']
  },
  
  doba: {
    id: 'doba',
    name: 'Doba',
    logo: 'https://doba.com/favicon.ico',
    type: 'api',
    category: 'wholesale',
    baseUrl: 'https://api.doba.com/v2',
    authType: 'api_key',
    endpoints: {
      products: '/products',
      productDetails: '/products/{id}',
      suppliers: '/suppliers',
      orders: '/orders',
      inventory: '/inventory',
      categories: '/categories'
    },
    rateLimit: { requests: 60, window: '1m' },
    features: ['product_search', 'order_placement', 'tracking', 'wholesale_prices', 'multi_supplier']
  },
  
  salehoo: {
    id: 'salehoo',
    name: 'SaleHoo',
    logo: 'https://salehoo.com/favicon.ico',
    type: 'api',
    category: 'wholesale',
    baseUrl: 'https://api.salehoo.com/v1',
    authType: 'api_key',
    endpoints: {
      suppliers: '/suppliers',
      products: '/products',
      search: '/search',
      categories: '/categories'
    },
    rateLimit: { requests: 100, window: '1m' },
    features: ['supplier_directory', 'product_search', 'verified_suppliers', 'market_research']
  },
  
  banggood: {
    id: 'banggood',
    name: 'Banggood',
    logo: 'https://www.banggood.com/favicon.ico',
    type: 'api',
    category: 'china',
    baseUrl: 'https://api.banggood.com/v1',
    authType: 'api_key',
    endpoints: {
      products: '/getProductList',
      productDetails: '/getProductInfo',
      categories: '/getCategoryList',
      stock: '/getProductStock',
      orders: '/createOrder',
      orderStatus: '/getOrderInfo',
      shipping: '/getShippingMethod'
    },
    rateLimit: { requests: 100, window: '1m' },
    features: ['product_search', 'order_placement', 'tracking', 'electronics_focus', 'global_warehouses']
  },
  
  dsers: {
    id: 'dsers',
    name: 'DSers',
    logo: 'https://dsers.com/favicon.ico',
    type: 'api',
    category: 'china',
    baseUrl: 'https://api.dsers.com/v1',
    authType: 'api_key',
    endpoints: {
      products: '/products',
      suppliers: '/suppliers',
      orders: '/orders',
      tracking: '/tracking',
      mapping: '/mapping'
    },
    rateLimit: { requests: 100, window: '1m' },
    features: ['aliexpress_integration', 'bulk_orders', 'supplier_optimizer', 'variant_mapping']
  },
  
  b2b_sports: {
    id: 'b2b_sports',
    name: 'B2B Sports',
    logo: '/connectors/b2b-sports.png',
    type: 'api',
    category: 'europe',
    baseUrl: 'https://api.b2bsports.eu',
    authType: 'custom',
    endpoints: {
      products: '/products',
      stock: '/stock',
      orders: '/orders',
      tracking: '/tracking'
    },
    rateLimit: { requests: 100, window: '1m' },
    features: ['sports_products', 'eu_warehousing', 'fast_shipping', 'brand_products']
  },
  
  wholesale2b: {
    id: 'wholesale2b',
    name: 'Wholesale2B',
    logo: 'https://wholesale2b.com/favicon.ico',
    type: 'feed',
    category: 'wholesale',
    baseUrl: 'https://api.wholesale2b.com',
    authType: 'api_key',
    endpoints: {
      products: '/products',
      categories: '/categories',
      inventory: '/inventory',
      orders: '/orders'
    },
    rateLimit: { requests: 60, window: '1m' },
    features: ['product_feed', 'auto_sync', 'multi_supplier', 'us_suppliers']
  }
};

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
    console.log(`[SupplierConnectors] Action: ${action}`, params);

    switch (action) {
      case 'list_connectors':
        return handleListConnectors();
      case 'get_connector':
        return handleGetConnector(params);
      case 'test_connection':
        return await handleTestConnection(params);
      case 'connect':
        return await handleConnect(supabase, params);
      case 'disconnect':
        return await handleDisconnect(supabase, params);
      case 'get_products':
        return await handleGetProducts(supabase, params);
      case 'get_product_details':
        return await handleGetProductDetails(supabase, params);
      case 'search_products':
        return await handleSearchProducts(supabase, params);
      case 'import_products':
        return await handleImportProducts(supabase, params);
      case 'sync_inventory':
        return await handleSyncInventory(supabase, params);
      case 'place_order':
        return await handlePlaceOrder(supabase, params);
      case 'get_tracking':
        return await handleGetTracking(supabase, params);
      case 'get_shipping_rates':
        return await handleGetShippingRates(supabase, params);
      case 'get_connected_suppliers':
        return await handleGetConnectedSuppliers(supabase, params);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  } catch (error) {
    console.error('[SupplierConnectors] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ============================================
// HANDLERS
// ============================================

function handleListConnectors() {
  const connectors = Object.values(SUPPLIER_CONNECTORS).map(c => ({
    id: c.id,
    name: c.name,
    logo: c.logo,
    type: c.type,
    category: c.category,
    features: c.features,
    rateLimit: c.rateLimit
  }));

  return new Response(
    JSON.stringify({ success: true, connectors }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function handleGetConnector(params: any) {
  const { connectorId } = params;
  const connector = SUPPLIER_CONNECTORS[connectorId];
  
  if (!connector) {
    throw new Error(`Connector not found: ${connectorId}`);
  }

  return new Response(
    JSON.stringify({ success: true, connector }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleTestConnection(params: any) {
  const { connectorId, credentials } = params;
  const connector = SUPPLIER_CONNECTORS[connectorId];
  
  if (!connector) {
    throw new Error(`Connector not found: ${connectorId}`);
  }

  let isValid = false;
  let message = '';

  try {
    switch (connectorId) {
      case 'cj_dropshipping':
        isValid = await testCJConnection(credentials);
        break;
      case 'bigbuy':
        isValid = await testBigBuyConnection(credentials);
        break;
      case 'aliexpress':
        isValid = await testAliExpressConnection(credentials);
        break;
      case 'printful':
        isValid = await testPrintfulConnection(credentials);
        break;
      case 'printify':
        isValid = await testPrintifyConnection(credentials);
        break;
      default:
        // Generic test
        isValid = credentials.apiKey?.length > 10;
    }
    message = isValid ? 'Connection successful' : 'Invalid credentials';
  } catch (error) {
    message = `Connection failed: ${error.message}`;
  }

  return new Response(
    JSON.stringify({ success: true, isValid, message }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleConnect(supabase: any, params: any) {
  const { userId, connectorId, credentials, settings = {} } = params;
  const connector = SUPPLIER_CONNECTORS[connectorId];
  
  if (!connector) {
    throw new Error(`Connector not found: ${connectorId}`);
  }

  // Store connection in database
  const { data, error } = await supabase
    .from('supplier_connections')
    .upsert({
      user_id: userId,
      connector_id: connectorId,
      connector_name: connector.name,
      credentials_encrypted: JSON.stringify(credentials), // Should be encrypted in production
      settings,
      status: 'active',
      connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,connector_id' })
    .select()
    .single();

  if (error) throw error;

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'supplier_connected',
    entity_type: 'supplier_connection',
    entity_id: connectorId,
    description: `Connected to ${connector.name}`,
    details: { connectorId, connectorName: connector.name }
  });

  return new Response(
    JSON.stringify({ 
      success: true, 
      connection: { id: data.id, connectorId, status: 'active' }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleDisconnect(supabase: any, params: any) {
  const { userId, connectorId } = params;

  const { error } = await supabase
    .from('supplier_connections')
    .update({ status: 'disconnected', updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('connector_id', connectorId);

  if (error) throw error;

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGetConnectedSuppliers(supabase: any, params: any) {
  const { userId } = params;

  const { data, error } = await supabase
    .from('supplier_connections')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (error) throw error;

  const connections = (data || []).map((conn: any) => ({
    ...conn,
    connector: SUPPLIER_CONNECTORS[conn.connector_id]
  }));

  return new Response(
    JSON.stringify({ success: true, connections }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGetProducts(supabase: any, params: any) {
  const { userId, connectorId, page = 1, limit = 50, filters = {} } = params;

  // Get connection credentials
  const credentials = await getConnectionCredentials(supabase, userId, connectorId);
  
  let products: any[] = [];

  switch (connectorId) {
    case 'cj_dropshipping':
      products = await getCJProducts(credentials, { page, limit, ...filters });
      break;
    case 'bigbuy':
      products = await getBigBuyProducts(credentials, { page, limit, ...filters });
      break;
    case 'aliexpress':
      products = await getAliExpressProducts(credentials, { page, limit, ...filters });
      break;
    case 'printful':
      products = await getPrintfulProducts(credentials, { page, limit, ...filters });
      break;
    case 'printify':
      products = await getPrintifyProducts(credentials, { page, limit, ...filters });
      break;
    default:
      throw new Error(`Product fetching not implemented for ${connectorId}`);
  }

  return new Response(
    JSON.stringify({ success: true, products, page, limit, total: products.length }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGetProductDetails(supabase: any, params: any) {
  const { userId, connectorId, productId } = params;

  const credentials = await getConnectionCredentials(supabase, userId, connectorId);
  
  let product: any = null;

  switch (connectorId) {
    case 'cj_dropshipping':
      product = await getCJProductDetails(credentials, productId);
      break;
    case 'bigbuy':
      product = await getBigBuyProductDetails(credentials, productId);
      break;
    case 'aliexpress':
      product = await getAliExpressProductDetails(credentials, productId);
      break;
    default:
      throw new Error(`Product details not implemented for ${connectorId}`);
  }

  return new Response(
    JSON.stringify({ success: true, product }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleSearchProducts(supabase: any, params: any) {
  const { userId, connectorId, query, filters = {} } = params;

  const credentials = await getConnectionCredentials(supabase, userId, connectorId);
  
  let results: any[] = [];

  switch (connectorId) {
    case 'cj_dropshipping':
      results = await searchCJProducts(credentials, query, filters);
      break;
    case 'bigbuy':
      results = await searchBigBuyProducts(credentials, query, filters);
      break;
    case 'aliexpress':
      results = await searchAliExpressProducts(credentials, query, filters);
      break;
    default:
      throw new Error(`Product search not implemented for ${connectorId}`);
  }

  return new Response(
    JSON.stringify({ success: true, results, query }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleImportProducts(supabase: any, params: any) {
  const { userId, connectorId, productIds, options = {} } = params;

  const credentials = await getConnectionCredentials(supabase, userId, connectorId);
  const connector = SUPPLIER_CONNECTORS[connectorId];

  const importResults = {
    imported: 0,
    failed: 0,
    products: [] as any[]
  };

  for (const productId of productIds) {
    try {
      let productData: any;
      
      switch (connectorId) {
        case 'cj_dropshipping':
          productData = await getCJProductDetails(credentials, productId);
          break;
        case 'bigbuy':
          productData = await getBigBuyProductDetails(credentials, productId);
          break;
        case 'aliexpress':
          productData = await getAliExpressProductDetails(credentials, productId);
          break;
        default:
          continue;
      }

      // Transform to our product format
      const transformedProduct = transformSupplierProduct(productData, connectorId, options);

      // Insert into products table
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...transformedProduct,
          user_id: userId,
          supplier_id: connectorId,
          supplier_product_id: productId,
          source_type: 'api',
          imported_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!error) {
        importResults.imported++;
        importResults.products.push(data);
      } else {
        importResults.failed++;
      }
    } catch (error) {
      console.error(`Failed to import product ${productId}:`, error);
      importResults.failed++;
    }
  }

  // Log activity
  await supabase.from('activity_logs').insert({
    user_id: userId,
    action: 'products_imported',
    entity_type: 'products',
    description: `Imported ${importResults.imported} products from ${connector.name}`,
    details: { connectorId, imported: importResults.imported, failed: importResults.failed }
  });

  return new Response(
    JSON.stringify({ success: true, ...importResults }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleSyncInventory(supabase: any, params: any) {
  const { userId, connectorId } = params;

  const credentials = await getConnectionCredentials(supabase, userId, connectorId);

  // Get products from this supplier
  const { data: products } = await supabase
    .from('products')
    .select('id, supplier_product_id, price, stock_quantity')
    .eq('user_id', userId)
    .eq('supplier_id', connectorId);

  const syncResults = {
    checked: 0,
    updated: 0,
    outOfStock: 0,
    priceChanges: 0
  };

  for (const product of (products || [])) {
    try {
      let supplierData: any;
      
      switch (connectorId) {
        case 'cj_dropshipping':
          supplierData = await getCJProductDetails(credentials, product.supplier_product_id);
          break;
        case 'bigbuy':
          supplierData = await getBigBuyProductDetails(credentials, product.supplier_product_id);
          break;
        default:
          continue;
      }

      syncResults.checked++;

      const updates: any = { updated_at: new Date().toISOString() };
      let needsUpdate = false;

      // Check stock
      if (supplierData.stock !== undefined && supplierData.stock !== product.stock_quantity) {
        updates.stock_quantity = supplierData.stock;
        needsUpdate = true;
        if (supplierData.stock === 0) syncResults.outOfStock++;
      }

      // Check price
      if (supplierData.cost_price !== undefined && supplierData.cost_price !== product.cost_price) {
        updates.cost_price = supplierData.cost_price;
        needsUpdate = true;
        syncResults.priceChanges++;
      }

      if (needsUpdate) {
        await supabase
          .from('products')
          .update(updates)
          .eq('id', product.id);
        syncResults.updated++;
      }
    } catch (error) {
      console.error(`Failed to sync product ${product.id}:`, error);
    }
  }

  return new Response(
    JSON.stringify({ success: true, ...syncResults }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handlePlaceOrder(supabase: any, params: any) {
  const { userId, connectorId, orderId, items, shippingAddress } = params;

  const credentials = await getConnectionCredentials(supabase, userId, connectorId);
  const connector = SUPPLIER_CONNECTORS[connectorId];

  let supplierOrder: any;

  switch (connectorId) {
    case 'cj_dropshipping':
      supplierOrder = await placeCJOrder(credentials, { items, shippingAddress });
      break;
    case 'bigbuy':
      supplierOrder = await placeBigBuyOrder(credentials, { items, shippingAddress });
      break;
    default:
      throw new Error(`Order placement not implemented for ${connectorId}`);
  }

  // Save supplier order
  await supabase.from('supplier_orders').insert({
    user_id: userId,
    order_id: orderId,
    supplier_id: connectorId,
    supplier_order_id: supplierOrder.orderId,
    status: supplierOrder.status,
    total_cost: supplierOrder.totalCost,
    created_at: new Date().toISOString()
  });

  return new Response(
    JSON.stringify({ success: true, supplierOrder }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGetTracking(supabase: any, params: any) {
  const { userId, connectorId, supplierOrderId } = params;

  const credentials = await getConnectionCredentials(supabase, userId, connectorId);

  let tracking: any;

  switch (connectorId) {
    case 'cj_dropshipping':
      tracking = await getCJTracking(credentials, supplierOrderId);
      break;
    case 'bigbuy':
      tracking = await getBigBuyTracking(credentials, supplierOrderId);
      break;
    default:
      throw new Error(`Tracking not implemented for ${connectorId}`);
  }

  return new Response(
    JSON.stringify({ success: true, tracking }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGetShippingRates(supabase: any, params: any) {
  const { userId, connectorId, productId, destination } = params;

  const credentials = await getConnectionCredentials(supabase, userId, connectorId);

  let rates: any[] = [];

  switch (connectorId) {
    case 'cj_dropshipping':
      rates = await getCJShippingRates(credentials, productId, destination);
      break;
    case 'bigbuy':
      rates = await getBigBuyShippingRates(credentials, productId, destination);
      break;
    default:
      throw new Error(`Shipping rates not implemented for ${connectorId}`);
  }

  return new Response(
    JSON.stringify({ success: true, rates }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getConnectionCredentials(supabase: any, userId: string, connectorId: string) {
  const { data, error } = await supabase
    .from('supplier_connections')
    .select('credentials_encrypted')
    .eq('user_id', userId)
    .eq('connector_id', connectorId)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    throw new Error(`No active connection found for ${connectorId}`);
  }

  return JSON.parse(data.credentials_encrypted);
}

function transformSupplierProduct(data: any, connectorId: string, options: any = {}) {
  const markupPercentage = options.markupPercentage || 30;
  
  return {
    title: data.title || data.name,
    description: data.description,
    sku: `${connectorId.toUpperCase()}-${data.sku || data.id}`,
    supplier_sku: data.sku || data.id,
    cost_price: data.price || data.cost,
    price: (data.price || data.cost) * (1 + markupPercentage / 100),
    stock_quantity: data.stock || data.inventory || 0,
    images: data.images || [],
    category: data.category,
    variants: data.variants || [],
    weight: data.weight,
    dimensions: data.dimensions,
    status: 'draft'
  };
}

// ============================================
// SUPPLIER-SPECIFIC API IMPLEMENTATIONS
// ============================================

// CJ Dropshipping
async function testCJConnection(credentials: any) {
  const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: credentials.email, password: credentials.password })
  });
  return response.ok;
}

async function getCJProducts(credentials: any, params: any) {
  const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/list?pageNum=${params.page}&pageSize=${params.limit}`, {
    headers: { 'CJ-Access-Token': credentials.accessToken }
  });
  const data = await response.json();
  return data.data?.list || [];
}

async function getCJProductDetails(credentials: any, productId: string) {
  const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${productId}`, {
    headers: { 'CJ-Access-Token': credentials.accessToken }
  });
  const data = await response.json();
  return data.data;
}

async function searchCJProducts(credentials: any, query: string, filters: any) {
  const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/list?productNameEn=${encodeURIComponent(query)}`, {
    headers: { 'CJ-Access-Token': credentials.accessToken }
  });
  const data = await response.json();
  return data.data?.list || [];
}

async function placeCJOrder(credentials: any, orderData: any) {
  const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrder', {
    method: 'POST',
    headers: { 
      'CJ-Access-Token': credentials.accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  });
  const data = await response.json();
  return { orderId: data.data?.orderId, status: 'pending', totalCost: orderData.totalCost };
}

async function getCJTracking(credentials: any, orderId: string) {
  const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/logistics/getTrackInfo?orderId=${orderId}`, {
    headers: { 'CJ-Access-Token': credentials.accessToken }
  });
  const data = await response.json();
  return data.data;
}

async function getCJShippingRates(credentials: any, productId: string, destination: any) {
  const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/logistics/freightCalculate', {
    method: 'POST',
    headers: { 
      'CJ-Access-Token': credentials.accessToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ productId, ...destination })
  });
  const data = await response.json();
  return data.data || [];
}

// BigBuy
async function testBigBuyConnection(credentials: any) {
  const response = await fetch('https://api.bigbuy.eu/rest/catalog/categories.json', {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  return response.ok;
}

async function getBigBuyProducts(credentials: any, params: any) {
  const response = await fetch(`https://api.bigbuy.eu/rest/catalog/products.json?page=${params.page}&pageSize=${params.limit}`, {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  return await response.json();
}

async function getBigBuyProductDetails(credentials: any, productId: string) {
  const response = await fetch(`https://api.bigbuy.eu/rest/catalog/product/${productId}.json`, {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  return await response.json();
}

async function searchBigBuyProducts(credentials: any, query: string, filters: any) {
  const response = await fetch(`https://api.bigbuy.eu/rest/catalog/products.json?search=${encodeURIComponent(query)}`, {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  return await response.json();
}

async function placeBigBuyOrder(credentials: any, orderData: any) {
  const response = await fetch('https://api.bigbuy.eu/rest/order/create.json', {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${credentials.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  });
  const data = await response.json();
  return { orderId: data.id, status: 'pending', totalCost: data.total };
}

async function getBigBuyTracking(credentials: any, orderId: string) {
  const response = await fetch(`https://api.bigbuy.eu/rest/order/delivery/${orderId}.json`, {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  return await response.json();
}

async function getBigBuyShippingRates(credentials: any, productId: string, destination: any) {
  const response = await fetch('https://api.bigbuy.eu/rest/shipping/carriers.json', {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  return await response.json();
}

// AliExpress
async function testAliExpressConnection(credentials: any) {
  // AliExpress uses OAuth2
  return credentials.accessToken?.length > 10;
}

async function getAliExpressProducts(credentials: any, params: any) {
  const response = await fetch('https://api-sg.aliexpress.com/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      method: 'aliexpress.affiliate.product.query',
      app_key: credentials.appKey,
      access_token: credentials.accessToken,
      target_currency: 'EUR',
      page_no: String(params.page),
      page_size: String(params.limit)
    })
  });
  const data = await response.json();
  return data.resp_result?.result?.products || [];
}

async function getAliExpressProductDetails(credentials: any, productId: string) {
  const response = await fetch('https://api-sg.aliexpress.com/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      method: 'aliexpress.affiliate.productdetail.get',
      app_key: credentials.appKey,
      access_token: credentials.accessToken,
      product_ids: productId
    })
  });
  const data = await response.json();
  return data.resp_result?.result?.products?.[0];
}

async function searchAliExpressProducts(credentials: any, query: string, filters: any) {
  const response = await fetch('https://api-sg.aliexpress.com/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      method: 'aliexpress.affiliate.product.query',
      app_key: credentials.appKey,
      access_token: credentials.accessToken,
      keywords: query,
      target_currency: 'EUR'
    })
  });
  const data = await response.json();
  return data.resp_result?.result?.products || [];
}

// Printful
async function testPrintfulConnection(credentials: any) {
  const response = await fetch('https://api.printful.com/stores', {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  return response.ok;
}

async function getPrintfulProducts(credentials: any, params: any) {
  const response = await fetch(`https://api.printful.com/products?offset=${(params.page - 1) * params.limit}&limit=${params.limit}`, {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  const data = await response.json();
  return data.result || [];
}

// Printify
async function testPrintifyConnection(credentials: any) {
  const response = await fetch('https://api.printify.com/v1/shops.json', {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  return response.ok;
}

async function getPrintifyProducts(credentials: any, params: any) {
  const response = await fetch(`https://api.printify.com/v1/shops/${credentials.shopId}/products.json?page=${params.page}&limit=${params.limit}`, {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  const data = await response.json();
  return data.data || [];
}
