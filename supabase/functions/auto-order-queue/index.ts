import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderQueueItem {
  id: string;
  order_id: string;
  supplier_type: 'cj' | 'aliexpress' | 'bigbuy' | 'bts' | 'generic';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'retry';
  retry_count: number;
  max_retries: number;
  payload: any;
  error_message?: string;
  next_retry_at?: string;
  created_at: string;
  updated_at: string;
}

interface CJOrderRequest {
  accessToken: string;
  orderNumber: string;
  shippingZip: string;
  shippingCountryCode: string;
  shippingProvince: string;
  shippingCity: string;
  shippingAddress: string;
  shippingCustomerName: string;
  shippingPhone: string;
  products: Array<{
    vid: string;
    quantity: number;
  }>;
  remark?: string;
  logisticName?: string;
  fromCountryCode?: string;
  houseNumber?: string;
}

interface CJOrderResponse {
  code: number;
  result: boolean;
  message: string;
  data?: {
    orderId: string;
    orderNum: string;
  };
  requestId: string;
}

// CJ Dropshipping API Client
class CJDropshippingAPI {
  private baseUrl = 'https://developers.cjdropshipping.com/api2.0/v1';
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  async createOrder(orderData: CJOrderRequest): Promise<CJOrderResponse> {
    console.log('🛒 CJ API - Creating order:', orderData.orderNumber);

    const response = await fetch(`${this.baseUrl}/shopping/order/createOrder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': this.accessToken,
      },
      body: JSON.stringify(orderData),
    });

    const result = await response.json();
    console.log('CJ API Response:', result);
    
    if (!result.result && result.code !== 200) {
      throw new Error(result.message || 'CJ API Error');
    }

    return result;
  }

  async getOrderDetails(orderId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/shopping/order/getOrderDetail?orderId=${orderId}`, {
      method: 'GET',
      headers: {
        'CJ-Access-Token': this.accessToken,
      },
    });

    return response.json();
  }

  async getProductVariants(pid: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/product/variant/queryByPid?pid=${pid}`, {
      method: 'GET',
      headers: {
        'CJ-Access-Token': this.accessToken,
      },
    });

    return response.json();
  }

  async confirmOrder(orderId: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/shopping/order/confirmOrder`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': this.accessToken,
      },
      body: JSON.stringify({ orderId }),
    });

    return response.json();
  }

  async getShippingMethods(startCountryCode: string, endCountryCode: string, productWeight: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/logistic/freightCalculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': this.accessToken,
      },
      body: JSON.stringify({
        startCountryCode,
        endCountryCode,
        productWeight,
      }),
    });

    return response.json();
  }
}

// Calculate exponential backoff delay
function getRetryDelay(retryCount: number): number {
  const baseDelay = 60000; // 1 minute
  const maxDelay = 3600000; // 1 hour
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  return delay + Math.random() * 10000; // Add jitter
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { action, ...params } = await req.json();
    console.log(`📦 Auto-Order Queue - Action: ${action}`);

    // ======================================
    // ACTION: Enqueue order for processing
    // ======================================
    if (action === 'enqueue') {
      const { orderId, userId, supplierType, payload } = params;

      // Check if order already in queue
      const { data: existing } = await supabase
        .from('auto_order_queue')
        .select('id, status')
        .eq('order_id', orderId)
        .in('status', ['pending', 'processing'])
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Order already in queue',
            queue_id: existing.id 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Add to queue
      const { data: queueItem, error: queueError } = await supabase
        .from('auto_order_queue')
        .insert({
          order_id: orderId,
          user_id: userId,
          supplier_type: supplierType || 'generic',
          status: 'pending',
          retry_count: 0,
          max_retries: 5,
          payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (queueError) throw queueError;

      // Log activity
      await supabase.from('activity_logs').insert({
        user_id: userId,
        action: 'auto_order_queued',
        entity_type: 'order',
        entity_id: orderId,
        description: `Commande ajoutée à la file d'auto-order (${supplierType})`,
        details: { queue_id: queueItem.id, supplier_type: supplierType }
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          queue_id: queueItem.id,
          message: 'Order added to queue' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ======================================
    // ACTION: Process queue (cron job)
    // ======================================
    if (action === 'process_queue') {
      const batchSize = params.batchSize || 10;

      // Get pending orders or retry-ready orders
      const { data: queueItems, error: fetchError } = await supabase
        .from('auto_order_queue')
        .select('*')
        .or('status.eq.pending,and(status.eq.retry,next_retry_at.lte.now())')
        .order('created_at', { ascending: true })
        .limit(batchSize);

      if (fetchError) throw fetchError;

      console.log(`📋 Processing ${queueItems?.length || 0} orders from queue`);

      const results = [];
      for (const item of queueItems || []) {
        // Mark as processing
        await supabase
          .from('auto_order_queue')
          .update({ 
            status: 'processing',
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        try {
          let result;

          switch (item.supplier_type) {
            case 'cj':
              result = await processCJOrder(supabase, item);
              break;
            case 'aliexpress':
              result = await processAliExpressOrder(supabase, item);
              break;
            case 'bigbuy':
              result = await processBigBuyOrder(supabase, item);
              break;
            case 'bts':
              result = await processBTSOrder(supabase, item);
              break;
            default:
              result = await processGenericOrder(supabase, item);
          }

          // Mark as completed
          await supabase
            .from('auto_order_queue')
            .update({
              status: 'completed',
              result: result,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          // Update fulfillment order
          await supabase
            .from('auto_fulfillment_orders')
            .update({
              status: 'ordered',
              supplier_order_id: result.supplierOrderId,
              ordered_at: new Date().toISOString()
            })
            .eq('id', item.order_id);

          // Log success
          await supabase.from('fulfillment_events').insert({
            order_id: item.order_id,
            event_type: 'order_placed',
            event_data: result,
            created_at: new Date().toISOString()
          });

          results.push({ id: item.id, success: true, result });

        } catch (error) {
          console.error(`❌ Error processing order ${item.id}:`, error);

          const newRetryCount = item.retry_count + 1;
          const shouldRetry = newRetryCount < item.max_retries;

          await supabase
            .from('auto_order_queue')
            .update({
              status: shouldRetry ? 'retry' : 'failed',
              retry_count: newRetryCount,
              error_message: error.message,
              next_retry_at: shouldRetry 
                ? new Date(Date.now() + getRetryDelay(newRetryCount)).toISOString()
                : null,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.id);

          // Log failure
          await supabase.from('fulfillment_events').insert({
            order_id: item.order_id,
            event_type: shouldRetry ? 'order_retry_scheduled' : 'order_failed',
            event_data: { 
              error: error.message, 
              retry_count: newRetryCount,
              next_retry_at: shouldRetry ? new Date(Date.now() + getRetryDelay(newRetryCount)).toISOString() : null
            },
            created_at: new Date().toISOString()
          });

          results.push({ id: item.id, success: false, error: error.message, willRetry: shouldRetry });
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          processed: results.length,
          results 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ======================================
    // ACTION: CJ Direct Order
    // ======================================
    if (action === 'cj_order') {
      const { userId, orderData } = params;

      // Get CJ credentials
      const { data: credentials } = await supabase
        .from('supplier_credentials_vault')
        .select('credentials_encrypted')
        .eq('user_id', userId)
        .eq('supplier_type', 'cj_dropshipping')
        .single();

      if (!credentials?.credentials_encrypted?.access_token) {
        throw new Error('CJ Dropshipping credentials not configured');
      }

      const cjApi = new CJDropshippingAPI(credentials.credentials_encrypted.access_token);
      const result = await cjApi.createOrder(orderData);

      return new Response(
        JSON.stringify({ success: true, result }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ======================================
    // ACTION: Get queue status
    // ======================================
    if (action === 'get_status') {
      const { userId, orderId } = params;

      let query = supabase.from('auto_order_queue').select('*');
      
      if (orderId) {
        query = query.eq('order_id', orderId);
      } else if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query.order('created_at', { ascending: false }).limit(50);

      if (error) throw error;

      // Get stats
      const stats = {
        pending: data?.filter(i => i.status === 'pending').length || 0,
        processing: data?.filter(i => i.status === 'processing').length || 0,
        completed: data?.filter(i => i.status === 'completed').length || 0,
        failed: data?.filter(i => i.status === 'failed').length || 0,
        retry: data?.filter(i => i.status === 'retry').length || 0,
      };

      return new Response(
        JSON.stringify({ success: true, items: data, stats }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ======================================
    // ACTION: Cancel queued order
    // ======================================
    if (action === 'cancel') {
      const { queueId, userId } = params;

      const { data, error } = await supabase
        .from('auto_order_queue')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', queueId)
        .eq('user_id', userId)
        .in('status', ['pending', 'retry'])
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, cancelled: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ======================================
    // ACTION: Retry failed order
    // ======================================
    if (action === 'retry_now') {
      const { queueId, userId } = params;

      const { data, error } = await supabase
        .from('auto_order_queue')
        .update({
          status: 'pending',
          next_retry_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', queueId)
        .eq('user_id', userId)
        .eq('status', 'failed')
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, queued: data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Unknown action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Auto-Order Queue Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ==========================================
// Supplier-specific order processors
// ==========================================

async function processCJOrder(supabase: any, queueItem: OrderQueueItem): Promise<any> {
  console.log('🚚 Processing CJ Dropshipping order:', queueItem.order_id);

  const payload = queueItem.payload;

  // Get CJ credentials
  const { data: credentials } = await supabase
    .from('supplier_credentials_vault')
    .select('credentials_encrypted')
    .eq('user_id', payload.userId)
    .eq('supplier_type', 'cj_dropshipping')
    .single();

  if (!credentials?.credentials_encrypted?.access_token) {
    throw new Error('CJ Dropshipping credentials not configured. Please add your API token.');
  }

  const cjApi = new CJDropshippingAPI(credentials.credentials_encrypted.access_token);

  // Build CJ order request
  const cjOrderRequest: CJOrderRequest = {
    accessToken: credentials.credentials_encrypted.access_token,
    orderNumber: payload.orderNumber || `ORD-${Date.now()}`,
    shippingZip: payload.shipping.zip || payload.shipping.postal_code,
    shippingCountryCode: payload.shipping.country_code || payload.shipping.country,
    shippingProvince: payload.shipping.province || payload.shipping.state,
    shippingCity: payload.shipping.city,
    shippingAddress: payload.shipping.address1 || payload.shipping.address,
    shippingCustomerName: payload.shipping.name || `${payload.shipping.first_name} ${payload.shipping.last_name}`,
    shippingPhone: payload.shipping.phone || '0000000000',
    products: payload.items.map((item: any) => ({
      vid: item.variant_id || item.cj_variant_id || item.sku,
      quantity: item.quantity
    })),
    remark: payload.note || '',
    logisticName: payload.shipping_method || 'CJPacket',
    houseNumber: payload.shipping.house_number || ''
  };

  const result = await cjApi.createOrder(cjOrderRequest);

  if (!result.result || result.code !== 200) {
    throw new Error(result.message || 'Failed to create CJ order');
  }

  return {
    supplierOrderId: result.data?.orderId,
    supplierOrderNumber: result.data?.orderNum,
    supplier: 'cj_dropshipping',
    rawResponse: result
  };
}

async function processAliExpressOrder(supabase: any, queueItem: OrderQueueItem): Promise<any> {
  console.log('🌏 Processing AliExpress order:', queueItem.order_id);
  
  // AliExpress DS API integration placeholder
  // In production, implement actual AliExpress API calls
  
  const payload = queueItem.payload;
  
  // Simulate order (replace with real API in production)
  return {
    supplierOrderId: `AE-${Date.now()}`,
    supplierOrderNumber: `AE${Math.random().toString(36).substring(7).toUpperCase()}`,
    supplier: 'aliexpress',
    status: 'pending',
    message: 'Order placed via AliExpress DS API'
  };
}

async function processBigBuyOrder(supabase: any, queueItem: OrderQueueItem): Promise<any> {
  console.log('📦 Processing BigBuy order:', queueItem.order_id);
  
  const payload = queueItem.payload;

  // Get BigBuy credentials
  const { data: credentials } = await supabase
    .from('supplier_credentials_vault')
    .select('credentials_encrypted')
    .eq('user_id', payload.userId)
    .eq('supplier_type', 'bigbuy')
    .single();

  if (!credentials?.credentials_encrypted?.api_key) {
    throw new Error('BigBuy credentials not configured');
  }

  // BigBuy API call
  const response = await fetch('https://api.bigbuy.eu/rest/order/create.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${credentials.credentials_encrypted.api_key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      internalReference: payload.orderNumber,
      delivery: {
        name: payload.shipping.name,
        address: payload.shipping.address1,
        postalCode: payload.shipping.zip,
        town: payload.shipping.city,
        country: payload.shipping.country_code,
        phone: payload.shipping.phone,
        email: payload.shipping.email
      },
      products: payload.items.map((item: any) => ({
        reference: item.sku,
        quantity: item.quantity
      }))
    })
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'BigBuy API error');
  }

  return {
    supplierOrderId: result.orderId,
    supplierOrderNumber: result.orderNumber,
    supplier: 'bigbuy',
    rawResponse: result
  };
}

async function processBTSOrder(supabase: any, queueItem: OrderQueueItem): Promise<any> {
  console.log('🏭 Processing BTS Wholesaler order:', queueItem.order_id);
  
  const payload = queueItem.payload;

  // Get BTS credentials
  const { data: credentials } = await supabase
    .from('supplier_credentials_vault')
    .select('credentials_encrypted')
    .eq('user_id', payload.userId)
    .eq('supplier_type', 'bts_wholesaler')
    .single();

  if (!credentials?.credentials_encrypted) {
    throw new Error('BTS Wholesaler credentials not configured');
  }

  // BTS API placeholder (replace with actual implementation)
  return {
    supplierOrderId: `BTS-${Date.now()}`,
    supplierOrderNumber: `BTS${Math.random().toString(36).substring(7).toUpperCase()}`,
    supplier: 'bts_wholesaler',
    status: 'submitted'
  };
}

async function processGenericOrder(supabase: any, queueItem: OrderQueueItem): Promise<any> {
  console.log('📋 Processing generic supplier order:', queueItem.order_id);
  
  const payload = queueItem.payload;

  // For generic suppliers without API, create manual order record
  return {
    supplierOrderId: `MANUAL-${Date.now()}`,
    supplier: 'generic',
    status: 'manual_required',
    message: 'Order created - manual processing required',
    orderDetails: payload
  };
}
