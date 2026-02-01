/**
 * SUPPLIER CONNECTORS - Enterprise-Safe Version
 * P0 Security Patch: CORS allowlist, mandatory auth, rate limiting, input validation
 * 
 * SECURITY RULES:
 * 1. No CORS '*' - only allowed origins
 * 2. Mandatory JWT authentication - userId from token only
 * 3. Rate limiting per user/action
 * 4. All DB queries scoped by authenticated user_id
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts"

import { authenticateUser } from "../_shared/secure-auth.ts"
import { checkRateLimit, createRateLimitResponse, RATE_LIMITS } from "../_shared/rate-limit.ts"
import { getSecureCorsHeaders, handleCorsPreflightSecure, isAllowedOrigin } from "../_shared/secure-cors.ts"

// ============================================
// INPUT VALIDATION SCHEMAS
// ============================================

const ConnectorIdSchema = z.string().min(2).max(50).regex(/^[a-z0-9_]+$/);
const ProductIdSchema = z.string().min(1).max(200);
const ProductIdsSchema = z.array(ProductIdSchema).min(1).max(100);

const CredentialsSchema = z.object({
  apiKey: z.string().max(500).optional(),
  accessToken: z.string().max(2000).optional(),
  email: z.string().email().max(255).optional(),
  password: z.string().max(500).optional(),
  appKey: z.string().max(200).optional(),
  shopId: z.string().max(100).optional(),
}).passthrough();

const PaginationSchema = z.object({
  page: z.number().int().min(1).max(1000).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});

const AddressSchema = z.object({
  country: z.string().min(2).max(100),
  city: z.string().max(200).optional(),
  postalCode: z.string().max(20).optional(),
  address: z.string().max(500).optional(),
});

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
};

// ============================================
// RESPONSE HELPERS
// ============================================

function jsonResponse(body: unknown, req: Request, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...getSecureCorsHeaders(req), 'Content-Type': 'application/json' },
  });
}

function errorResponse(message: string, req: Request, status = 400): Response {
  return jsonResponse({ success: false, error: message }, req, status);
}

// ============================================
// SUPABASE CLIENT
// ============================================

function createServiceClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

// ============================================
// MAIN HANDLER
// ============================================

serve(async (req) => {
  // CORS preflight - secure handling
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightSecure(req);
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', req, 405);
  }

  // Check origin is allowed
  const origin = req.headers.get('Origin');
  if (origin && !isAllowedOrigin(origin)) {
    console.warn(`[SupplierConnectors] Blocked request from unauthorized origin: ${origin}`);
    return new Response('Forbidden', { status: 403 });
  }

  const supabase = createServiceClient();

  try {
    // 1) MANDATORY AUTH - userId from JWT only, NEVER from body
    const { user } = await authenticateUser(req, supabase);
    const userId = user.id;

    // 2) Parse and validate JSON body
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return errorResponse('Invalid JSON body', req, 400);
    }

    const { action, ...params } = rawBody as Record<string, unknown>;
    
    if (typeof action !== 'string' || action.length < 2) {
      return errorResponse('Missing or invalid action', req, 400);
    }

    console.log(`[SupplierConnectors] Action: ${action}, User: ${userId}`);

    // 3) Rate limiting per action
    const isHeavyAction = ['import_products', 'sync_inventory', 'place_order'].includes(action);
    const rateConfig = isHeavyAction ? RATE_LIMITS.IMPORT : RATE_LIMITS.API_GENERAL;
    
    const rateCheck = await checkRateLimit(supabase, userId, `supplier_connectors:${action}`, rateConfig);
    if (!rateCheck.allowed) {
      return createRateLimitResponse(rateCheck, getSecureCorsHeaders(req));
    }

    // 4) Route to handlers - userId passed explicitly, NEVER from params
    switch (action) {
      case 'list_connectors':
        return handleListConnectors(req);
      
      case 'get_connector':
        return handleGetConnector(req, params);
      
      case 'test_connection':
        return await handleTestConnection(req, params);
      
      case 'connect':
        return await handleConnectSecure(supabase, req, userId, params);
      
      case 'disconnect':
        return await handleDisconnectSecure(supabase, req, userId, params);
      
      case 'get_connected_suppliers':
        return await handleGetConnectedSuppliersSecure(supabase, req, userId);
      
      case 'get_products':
        return await handleGetProductsSecure(supabase, req, userId, params);
      
      case 'get_product_details':
        return await handleGetProductDetailsSecure(supabase, req, userId, params);
      
      case 'search_products':
        return await handleSearchProductsSecure(supabase, req, userId, params);
      
      case 'import_products':
        return await handleImportProductsSecure(supabase, req, userId, params);
      
      case 'sync_inventory':
        return await handleSyncInventorySecure(supabase, req, userId, params);
      
      case 'place_order':
        return await handlePlaceOrderSecure(supabase, req, userId, params);
      
      case 'get_tracking':
        return await handleGetTrackingSecure(supabase, req, userId, params);
      
      case 'get_shipping_rates':
        return await handleGetShippingRatesSecure(supabase, req, userId, params);
      
      default:
        return errorResponse(`Unknown action: ${action}`, req, 400);
    }
  } catch (error) {
    console.error('[SupplierConnectors] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Don't expose internal errors
    const safeMessage = message.includes('Authorization') || message.includes('token') 
      ? message 
      : 'Internal server error';
    
    return errorResponse(safeMessage, req, message.includes('Authorization') ? 401 : 500);
  }
});

// ============================================
// SECURE HANDLERS - All scoped by authenticated userId
// ============================================

function handleListConnectors(req: Request): Response {
  const connectors = Object.values(SUPPLIER_CONNECTORS).map(c => ({
    id: c.id,
    name: c.name,
    logo: c.logo,
    type: c.type,
    category: c.category,
    features: c.features,
    rateLimit: c.rateLimit
  }));

  return jsonResponse({ success: true, connectors }, req);
}

function handleGetConnector(req: Request, params: Record<string, unknown>): Response {
  const result = ConnectorIdSchema.safeParse(params.connectorId);
  if (!result.success) {
    return errorResponse('Invalid connectorId', req, 400);
  }
  
  const connector = SUPPLIER_CONNECTORS[result.data];
  if (!connector) {
    return errorResponse(`Connector not found: ${result.data}`, req, 404);
  }

  return jsonResponse({ success: true, connector }, req);
}

async function handleTestConnection(req: Request, params: Record<string, unknown>): Promise<Response> {
  const connectorResult = ConnectorIdSchema.safeParse(params.connectorId);
  const credsResult = CredentialsSchema.safeParse(params.credentials);
  
  if (!connectorResult.success || !credsResult.success) {
    return errorResponse('Invalid parameters', req, 400);
  }
  
  const connectorId = connectorResult.data;
  const credentials = credsResult.data;
  const connector = SUPPLIER_CONNECTORS[connectorId];
  
  if (!connector) {
    return errorResponse(`Connector not found: ${connectorId}`, req, 404);
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
        isValid = (credentials.apiKey?.length ?? 0) > 10;
    }
    message = isValid ? 'Connection successful' : 'Invalid credentials';
  } catch (error) {
    message = `Connection failed: ${(error as Error).message}`;
  }

  return jsonResponse({ success: true, isValid, message }, req);
}

async function handleConnectSecure(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  userId: string,
  params: Record<string, unknown>
): Promise<Response> {
  const connectorResult = ConnectorIdSchema.safeParse(params.connectorId);
  const credsResult = CredentialsSchema.safeParse(params.credentials);
  
  if (!connectorResult.success || !credsResult.success) {
    return errorResponse('Invalid parameters', req, 400);
  }
  
  const connectorId = connectorResult.data;
  const credentials = credsResult.data;
  const connector = SUPPLIER_CONNECTORS[connectorId];
  
  if (!connector) {
    return errorResponse(`Connector not found: ${connectorId}`, req, 404);
  }

  // Store connection - userId from auth, NEVER from params
  const { data, error } = await supabase
    .from('supplier_connections')
    .upsert({
      user_id: userId,  // FROM AUTH TOKEN
      connector_id: connectorId,
      connector_name: connector.name,
      credentials_encrypted: JSON.stringify(credentials),
      settings: params.settings || {},
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

  return jsonResponse({ 
    success: true, 
    connection: { id: data.id, connectorId, status: 'active' }
  }, req);
}

async function handleDisconnectSecure(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  userId: string,
  params: Record<string, unknown>
): Promise<Response> {
  const connectorResult = ConnectorIdSchema.safeParse(params.connectorId);
  if (!connectorResult.success) {
    return errorResponse('Invalid connectorId', req, 400);
  }

  const { error } = await supabase
    .from('supplier_connections')
    .update({ status: 'disconnected', updated_at: new Date().toISOString() })
    .eq('user_id', userId)  // SCOPED BY AUTH USER
    .eq('connector_id', connectorResult.data);

  if (error) throw error;

  return jsonResponse({ success: true }, req);
}

async function handleGetConnectedSuppliersSecure(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  userId: string
): Promise<Response> {
  // ALL queries scoped by authenticated userId
  const { data, error } = await supabase
    .from('supplier_connections')
    .select('*')
    .eq('user_id', userId)  // SCOPED BY AUTH USER
    .eq('status', 'active');

  if (error) throw error;

  const connections = (data || []).map((conn: Record<string, unknown>) => ({
    ...conn,
    connector: SUPPLIER_CONNECTORS[conn.connector_id as string]
  }));

  return jsonResponse({ success: true, connections }, req);
}

async function handleGetProductsSecure(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  userId: string,
  params: Record<string, unknown>
): Promise<Response> {
  const connectorResult = ConnectorIdSchema.safeParse(params.connectorId);
  const paginationResult = PaginationSchema.safeParse({
    page: params.page,
    limit: params.limit
  });
  
  if (!connectorResult.success) {
    return errorResponse('Invalid connectorId', req, 400);
  }

  const connectorId = connectorResult.data;
  const { page, limit } = paginationResult.success ? paginationResult.data : { page: 1, limit: 50 };

  // Verify ownership of connection
  const credentials = await getConnectionCredentialsSecure(supabase, userId, connectorId);
  
  let products: unknown[] = [];

  switch (connectorId) {
    case 'cj_dropshipping':
      products = await getCJProducts(credentials, { page, limit });
      break;
    case 'bigbuy':
      products = await getBigBuyProducts(credentials, { page, limit });
      break;
    case 'aliexpress':
      products = await getAliExpressProducts(credentials, { page, limit });
      break;
    case 'printful':
      products = await getPrintfulProducts(credentials, { page, limit });
      break;
    case 'printify':
      products = await getPrintifyProducts(credentials, { page, limit });
      break;
    default:
      return errorResponse(`Product fetching not implemented for ${connectorId}`, req, 400);
  }

  return jsonResponse({ success: true, products, page, limit, total: products.length }, req);
}

async function handleGetProductDetailsSecure(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  userId: string,
  params: Record<string, unknown>
): Promise<Response> {
  const connectorResult = ConnectorIdSchema.safeParse(params.connectorId);
  const productResult = ProductIdSchema.safeParse(params.productId);
  
  if (!connectorResult.success || !productResult.success) {
    return errorResponse('Invalid parameters', req, 400);
  }

  const connectorId = connectorResult.data;
  const productId = productResult.data;

  const credentials = await getConnectionCredentialsSecure(supabase, userId, connectorId);
  
  let product: unknown = null;

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
      return errorResponse(`Product details not implemented for ${connectorId}`, req, 400);
  }

  return jsonResponse({ success: true, product }, req);
}

async function handleSearchProductsSecure(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  userId: string,
  params: Record<string, unknown>
): Promise<Response> {
  const connectorResult = ConnectorIdSchema.safeParse(params.connectorId);
  const querySchema = z.string().min(1).max(200);
  const queryResult = querySchema.safeParse(params.query);
  
  if (!connectorResult.success || !queryResult.success) {
    return errorResponse('Invalid parameters', req, 400);
  }

  const connectorId = connectorResult.data;
  const query = queryResult.data;

  const credentials = await getConnectionCredentialsSecure(supabase, userId, connectorId);
  
  let results: unknown[] = [];

  switch (connectorId) {
    case 'cj_dropshipping':
      results = await searchCJProducts(credentials, query, params.filters || {});
      break;
    case 'bigbuy':
      results = await searchBigBuyProducts(credentials, query, params.filters || {});
      break;
    case 'aliexpress':
      results = await searchAliExpressProducts(credentials, query, params.filters || {});
      break;
    default:
      return errorResponse(`Product search not implemented for ${connectorId}`, req, 400);
  }

  return jsonResponse({ success: true, results, query }, req);
}

async function handleImportProductsSecure(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  userId: string,
  params: Record<string, unknown>
): Promise<Response> {
  const connectorResult = ConnectorIdSchema.safeParse(params.connectorId);
  const productIdsResult = ProductIdsSchema.safeParse(params.productIds);
  
  if (!connectorResult.success || !productIdsResult.success) {
    return errorResponse('Invalid parameters', req, 400);
  }

  const connectorId = connectorResult.data;
  const productIds = productIdsResult.data;

  const credentials = await getConnectionCredentialsSecure(supabase, userId, connectorId);
  const connector = SUPPLIER_CONNECTORS[connectorId];

  const importResults = {
    imported: 0,
    failed: 0,
    products: [] as unknown[]
  };

  for (const productId of productIds) {
    try {
      let productData: unknown;
      
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

      const transformedProduct = transformSupplierProduct(productData, connectorId, params.options || {});

      // Insert with authenticated userId - NEVER from params
      const { data, error } = await supabase
        .from('products')
        .insert({
          ...transformedProduct,
          user_id: userId,  // FROM AUTH TOKEN
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

  return jsonResponse({ success: true, ...importResults }, req);
}

async function handleSyncInventorySecure(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  userId: string,
  params: Record<string, unknown>
): Promise<Response> {
  const connectorResult = ConnectorIdSchema.safeParse(params.connectorId);
  if (!connectorResult.success) {
    return errorResponse('Invalid connectorId', req, 400);
  }

  const connectorId = connectorResult.data;
  const credentials = await getConnectionCredentialsSecure(supabase, userId, connectorId);

  // Get products - SCOPED BY AUTH USER
  const { data: products } = await supabase
    .from('products')
    .select('id, supplier_product_id, price, stock_quantity, cost_price')
    .eq('user_id', userId)  // SCOPED BY AUTH USER
    .eq('supplier_id', connectorId);

  const syncResults = {
    checked: 0,
    updated: 0,
    outOfStock: 0,
    priceChanges: 0
  };

  for (const product of (products || [])) {
    try {
      let supplierData: Record<string, unknown> | null = null;
      
      switch (connectorId) {
        case 'cj_dropshipping':
          supplierData = await getCJProductDetails(credentials, product.supplier_product_id) as Record<string, unknown>;
          break;
        case 'bigbuy':
          supplierData = await getBigBuyProductDetails(credentials, product.supplier_product_id) as Record<string, unknown>;
          break;
        default:
          continue;
      }

      if (!supplierData) continue;

      syncResults.checked++;

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      let needsUpdate = false;

      if (supplierData.stock !== undefined && supplierData.stock !== product.stock_quantity) {
        updates.stock_quantity = supplierData.stock;
        needsUpdate = true;
        if (supplierData.stock === 0) syncResults.outOfStock++;
      }

      if (supplierData.cost_price !== undefined && supplierData.cost_price !== product.cost_price) {
        updates.cost_price = supplierData.cost_price;
        needsUpdate = true;
        syncResults.priceChanges++;
      }

      if (needsUpdate) {
        await supabase
          .from('products')
          .update(updates)
          .eq('id', product.id)
          .eq('user_id', userId);  // Double-check ownership
        syncResults.updated++;
      }
    } catch (error) {
      console.error(`Failed to sync product ${product.id}:`, error);
    }
  }

  return jsonResponse({ success: true, ...syncResults }, req);
}

async function handlePlaceOrderSecure(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  userId: string,
  params: Record<string, unknown>
): Promise<Response> {
  const connectorResult = ConnectorIdSchema.safeParse(params.connectorId);
  const orderIdSchema = z.string().uuid();
  const orderIdResult = orderIdSchema.safeParse(params.orderId);
  
  if (!connectorResult.success || !orderIdResult.success) {
    return errorResponse('Invalid parameters', req, 400);
  }

  const connectorId = connectorResult.data;
  const orderId = orderIdResult.data;

  // Verify connection ownership
  const credentials = await getConnectionCredentialsSecure(supabase, userId, connectorId);
  const connector = SUPPLIER_CONNECTORS[connectorId];

  let supplierOrder: Record<string, unknown>;

  switch (connectorId) {
    case 'cj_dropshipping':
      supplierOrder = await placeCJOrder(credentials, { items: params.items, shippingAddress: params.shippingAddress });
      break;
    case 'bigbuy':
      supplierOrder = await placeBigBuyOrder(credentials, { items: params.items, shippingAddress: params.shippingAddress });
      break;
    default:
      return errorResponse(`Order placement not implemented for ${connectorId}`, req, 400);
  }

  // Save supplier order - SCOPED BY AUTH USER
  await supabase.from('supplier_orders').insert({
    user_id: userId,  // FROM AUTH TOKEN
    order_id: orderId,
    supplier_id: connectorId,
    supplier_order_id: supplierOrder.orderId,
    status: supplierOrder.status,
    total_cost: supplierOrder.totalCost,
    created_at: new Date().toISOString()
  });

  return jsonResponse({ success: true, supplierOrder }, req);
}

async function handleGetTrackingSecure(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  userId: string,
  params: Record<string, unknown>
): Promise<Response> {
  const connectorResult = ConnectorIdSchema.safeParse(params.connectorId);
  const orderIdSchema = z.string().min(1).max(200);
  const orderIdResult = orderIdSchema.safeParse(params.supplierOrderId);
  
  if (!connectorResult.success || !orderIdResult.success) {
    return errorResponse('Invalid parameters', req, 400);
  }

  const connectorId = connectorResult.data;
  const supplierOrderId = orderIdResult.data;

  const credentials = await getConnectionCredentialsSecure(supabase, userId, connectorId);

  let tracking: unknown;

  switch (connectorId) {
    case 'cj_dropshipping':
      tracking = await getCJTracking(credentials, supplierOrderId);
      break;
    case 'bigbuy':
      tracking = await getBigBuyTracking(credentials, supplierOrderId);
      break;
    default:
      return errorResponse(`Tracking not implemented for ${connectorId}`, req, 400);
  }

  return jsonResponse({ success: true, tracking }, req);
}

async function handleGetShippingRatesSecure(
  supabase: ReturnType<typeof createClient>,
  req: Request,
  userId: string,
  params: Record<string, unknown>
): Promise<Response> {
  const connectorResult = ConnectorIdSchema.safeParse(params.connectorId);
  const productResult = ProductIdSchema.safeParse(params.productId);
  const addressResult = AddressSchema.safeParse(params.destination);
  
  if (!connectorResult.success || !productResult.success) {
    return errorResponse('Invalid parameters', req, 400);
  }

  const connectorId = connectorResult.data;
  const productId = productResult.data;
  const destination = addressResult.success ? addressResult.data : {};

  const credentials = await getConnectionCredentialsSecure(supabase, userId, connectorId);

  let rates: unknown[] = [];

  switch (connectorId) {
    case 'cj_dropshipping':
      rates = await getCJShippingRates(credentials, productId, destination);
      break;
    case 'bigbuy':
      rates = await getBigBuyShippingRates(credentials, productId, destination);
      break;
    default:
      return errorResponse(`Shipping rates not implemented for ${connectorId}`, req, 400);
  }

  return jsonResponse({ success: true, rates }, req);
}

// ============================================
// SECURE HELPER FUNCTIONS
// ============================================

async function getConnectionCredentialsSecure(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  connectorId: string
): Promise<Record<string, unknown>> {
  // CRITICAL: Always filter by authenticated userId
  const { data, error } = await supabase
    .from('supplier_connections')
    .select('credentials_encrypted')
    .eq('user_id', userId)  // SCOPED BY AUTH USER
    .eq('connector_id', connectorId)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    throw new Error(`No active connection found for ${connectorId}`);
  }

  return JSON.parse(data.credentials_encrypted);
}

function transformSupplierProduct(data: Record<string, unknown>, connectorId: string, options: Record<string, unknown> = {}): Record<string, unknown> {
  const markupPercentage = (options.markupPercentage as number) || 30;
  const price = (data.price as number) || (data.cost as number) || 0;
  
  return {
    title: data.title || data.name,
    description: data.description,
    sku: `${connectorId.toUpperCase()}-${data.sku || data.id}`,
    supplier_sku: data.sku || data.id,
    cost_price: price,
    price: price * (1 + markupPercentage / 100),
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
// SUPPLIER API IMPLEMENTATIONS
// ============================================

async function testCJConnection(credentials: Record<string, unknown>): Promise<boolean> {
  const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: credentials.email, password: credentials.password })
  });
  return response.ok;
}

async function getCJProducts(credentials: Record<string, unknown>, params: { page: number; limit: number }): Promise<unknown[]> {
  const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/list?pageNum=${params.page}&pageSize=${params.limit}`, {
    headers: { 'CJ-Access-Token': credentials.accessToken as string }
  });
  const data = await response.json();
  return data.data?.list || [];
}

async function getCJProductDetails(credentials: Record<string, unknown>, productId: string): Promise<unknown> {
  const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/query?pid=${productId}`, {
    headers: { 'CJ-Access-Token': credentials.accessToken as string }
  });
  const data = await response.json();
  return data.data;
}

async function searchCJProducts(credentials: Record<string, unknown>, query: string, _filters: unknown): Promise<unknown[]> {
  const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/product/list?productNameEn=${encodeURIComponent(query)}`, {
    headers: { 'CJ-Access-Token': credentials.accessToken as string }
  });
  const data = await response.json();
  return data.data?.list || [];
}

async function placeCJOrder(credentials: Record<string, unknown>, orderData: unknown): Promise<Record<string, unknown>> {
  const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/shopping/order/createOrder', {
    method: 'POST',
    headers: { 
      'CJ-Access-Token': credentials.accessToken as string,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  });
  const data = await response.json();
  return { orderId: data.data?.orderId, status: 'pending', totalCost: (orderData as Record<string, unknown>).totalCost };
}

async function getCJTracking(credentials: Record<string, unknown>, orderId: string): Promise<unknown> {
  const response = await fetch(`https://developers.cjdropshipping.com/api2.0/v1/logistics/getTrackInfo?orderId=${orderId}`, {
    headers: { 'CJ-Access-Token': credentials.accessToken as string }
  });
  const data = await response.json();
  return data.data;
}

async function getCJShippingRates(credentials: Record<string, unknown>, productId: string, destination: unknown): Promise<unknown[]> {
  const response = await fetch('https://developers.cjdropshipping.com/api2.0/v1/logistics/freightCalculate', {
    method: 'POST',
    headers: { 
      'CJ-Access-Token': credentials.accessToken as string,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ productId, ...(destination as Record<string, unknown>) })
  });
  const data = await response.json();
  return data.data || [];
}

async function testBigBuyConnection(credentials: Record<string, unknown>): Promise<boolean> {
  const response = await fetch('https://api.bigbuy.eu/rest/catalog/categories.json', {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  return response.ok;
}

async function getBigBuyProducts(credentials: Record<string, unknown>, params: { page: number; limit: number }): Promise<unknown[]> {
  const response = await fetch(`https://api.bigbuy.eu/rest/catalog/products.json?page=${params.page}&pageSize=${params.limit}`, {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  return await response.json();
}

async function getBigBuyProductDetails(credentials: Record<string, unknown>, productId: string): Promise<unknown> {
  const response = await fetch(`https://api.bigbuy.eu/rest/catalog/product/${productId}.json`, {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  return await response.json();
}

async function searchBigBuyProducts(credentials: Record<string, unknown>, query: string, _filters: unknown): Promise<unknown[]> {
  const response = await fetch(`https://api.bigbuy.eu/rest/catalog/products.json?search=${encodeURIComponent(query)}`, {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  return await response.json();
}

async function placeBigBuyOrder(credentials: Record<string, unknown>, orderData: unknown): Promise<Record<string, unknown>> {
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

async function getBigBuyTracking(credentials: Record<string, unknown>, orderId: string): Promise<unknown> {
  const response = await fetch(`https://api.bigbuy.eu/rest/order/delivery/${orderId}.json`, {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  return await response.json();
}

async function getBigBuyShippingRates(credentials: Record<string, unknown>, _productId: string, _destination: unknown): Promise<unknown[]> {
  const response = await fetch('https://api.bigbuy.eu/rest/shipping/carriers.json', {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  return await response.json();
}

async function testAliExpressConnection(credentials: Record<string, unknown>): Promise<boolean> {
  return (credentials.accessToken as string)?.length > 10;
}

async function getAliExpressProducts(credentials: Record<string, unknown>, params: { page: number; limit: number }): Promise<unknown[]> {
  const response = await fetch('https://api-sg.aliexpress.com/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      method: 'aliexpress.affiliate.product.query',
      app_key: credentials.appKey as string,
      access_token: credentials.accessToken as string,
      target_currency: 'EUR',
      page_no: String(params.page),
      page_size: String(params.limit)
    })
  });
  const data = await response.json();
  return data.resp_result?.result?.products || [];
}

async function getAliExpressProductDetails(credentials: Record<string, unknown>, productId: string): Promise<unknown> {
  const response = await fetch('https://api-sg.aliexpress.com/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      method: 'aliexpress.affiliate.productdetail.get',
      app_key: credentials.appKey as string,
      access_token: credentials.accessToken as string,
      product_ids: productId
    })
  });
  const data = await response.json();
  return data.resp_result?.result?.products?.[0];
}

async function searchAliExpressProducts(credentials: Record<string, unknown>, query: string, _filters: unknown): Promise<unknown[]> {
  const response = await fetch('https://api-sg.aliexpress.com/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      method: 'aliexpress.affiliate.product.query',
      app_key: credentials.appKey as string,
      access_token: credentials.accessToken as string,
      keywords: query,
      target_currency: 'EUR'
    })
  });
  const data = await response.json();
  return data.resp_result?.result?.products || [];
}

async function testPrintfulConnection(credentials: Record<string, unknown>): Promise<boolean> {
  const response = await fetch('https://api.printful.com/stores', {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  return response.ok;
}

async function getPrintfulProducts(credentials: Record<string, unknown>, params: { page: number; limit: number }): Promise<unknown[]> {
  const response = await fetch(`https://api.printful.com/products?offset=${(params.page - 1) * params.limit}&limit=${params.limit}`, {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  const data = await response.json();
  return data.result || [];
}

async function testPrintifyConnection(credentials: Record<string, unknown>): Promise<boolean> {
  const response = await fetch('https://api.printify.com/v1/shops.json', {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  return response.ok;
}

async function getPrintifyProducts(credentials: Record<string, unknown>, params: { page: number; limit: number }): Promise<unknown[]> {
  const response = await fetch(`https://api.printify.com/v1/shops/${credentials.shopId}/products.json?page=${params.page}&limit=${params.limit}`, {
    headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
  });
  const data = await response.json();
  return data.data || [];
}

// ============================================
// SECURITY LOGGING HELPER
// ============================================

async function logSecurityEvent(
  supabase: ReturnType<typeof createClient>,
  userId: string | null,
  eventType: string,
  severity: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('security_events').insert({
      user_id: userId,
      event_type: eventType,
      severity,
      description: `supplier-connectors: ${eventType}`,
      metadata
    });
  } catch (e) {
    console.error('Failed to log security event:', e);
  }
}
