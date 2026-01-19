import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReturnRequest {
  action: 'process_return' | 'create_label' | 'create_supplier_return' | 'auto_process' | 'check_rules';
  returnId?: string;
  userId?: string;
  carrierCode?: string;
  shipmentDetails?: {
    weight_kg: number;
    dimensions?: { length: number; width: number; height: number };
  };
}

interface AutomationRule {
  id: string;
  trigger_conditions: {
    reason_category?: string[];
    amount_max?: number;
    amount_min?: number;
    customer_order_count?: number;
  };
  auto_actions: {
    auto_approve?: boolean;
    generate_label?: boolean;
    send_notification?: boolean;
    create_supplier_return?: boolean;
    auto_refund?: boolean;
  };
  refund_config?: {
    method?: string;
    percentage?: number;
    deduct_shipping?: boolean;
  };
  priority: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get authorization
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body: ReturnRequest = await req.json();
    const { action, returnId, carrierCode, shipmentDetails } = body;

    console.log(`[Returns Workflow] Action: ${action}, Return ID: ${returnId}, User: ${user.id}`);

    let result: any;

    switch (action) {
      case 'check_rules':
        result = await checkAutomationRules(supabase, user.id);
        break;

      case 'auto_process':
        if (!returnId) throw new Error('Return ID required');
        result = await autoProcessReturn(supabase, user.id, returnId);
        break;

      case 'create_label':
        if (!returnId) throw new Error('Return ID required');
        result = await createReturnLabel(supabase, user.id, returnId, carrierCode || 'colissimo', shipmentDetails);
        break;

      case 'create_supplier_return':
        if (!returnId) throw new Error('Return ID required');
        result = await createSupplierReturn(supabase, user.id, returnId);
        break;

      case 'process_return':
        if (!returnId) throw new Error('Return ID required');
        result = await processReturn(supabase, user.id, returnId);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Returns Workflow] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Check automation rules for a user
async function checkAutomationRules(supabase: any, userId: string) {
  const { data: rules, error } = await supabase
    .from('return_automation_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (error) throw error;

  return {
    rules: rules || [],
    count: rules?.length || 0
  };
}

// Auto-process a return based on automation rules
async function autoProcessReturn(supabase: any, userId: string, returnId: string) {
  // Get return details
  const { data: returnData, error: returnError } = await supabase
    .from('returns')
    .select('*, customers(*)')
    .eq('id', returnId)
    .eq('user_id', userId)
    .single();

  if (returnError) throw returnError;
  if (!returnData) throw new Error('Return not found');

  // Get active automation rules
  const { data: rules, error: rulesError } = await supabase
    .from('return_automation_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (rulesError) throw rulesError;

  // Find matching rule
  const matchingRule = findMatchingRule(rules || [], returnData);

  if (!matchingRule) {
    console.log('[Auto Process] No matching rule found');
    return { processed: false, reason: 'No matching automation rule' };
  }

  console.log(`[Auto Process] Matching rule: ${matchingRule.name}`);

  const actions: string[] = [];
  const autoActions = matchingRule.auto_actions;

  // Execute auto actions
  if (autoActions.auto_approve && returnData.status === 'pending') {
    await supabase
      .from('returns')
      .update({ 
        status: 'approved', 
        automation_rule_id: matchingRule.id,
        notes: `Auto-approuvé par règle: ${matchingRule.name}`
      })
      .eq('id', returnId);
    actions.push('approved');
  }

  if (autoActions.generate_label) {
    try {
      await createReturnLabel(supabase, userId, returnId, 'colissimo');
      actions.push('label_generated');
    } catch (e) {
      console.error('Failed to generate label:', e);
    }
  }

  if (autoActions.create_supplier_return) {
    try {
      await createSupplierReturn(supabase, userId, returnId);
      actions.push('supplier_return_created');
    } catch (e) {
      console.error('Failed to create supplier return:', e);
    }
  }

  if (autoActions.send_notification) {
    await sendReturnNotification(supabase, userId, returnData, 'approved');
    actions.push('notification_sent');
  }

  // Update rule execution count
  await supabase
    .from('return_automation_rules')
    .update({
      execution_count: (matchingRule.execution_count || 0) + 1,
      last_executed_at: new Date().toISOString()
    })
    .eq('id', matchingRule.id);

  // Log execution
  await supabase
    .from('automation_execution_logs')
    .insert({
      user_id: userId,
      trigger_id: matchingRule.id,
      status: 'completed',
      input_data: { return_id: returnId, return_status: returnData.status },
      output_data: { actions_executed: actions }
    });

  return {
    processed: true,
    rule: matchingRule.name,
    actions
  };
}

// Find matching automation rule
function findMatchingRule(rules: AutomationRule[], returnData: any): AutomationRule | null {
  for (const rule of rules) {
    const conditions = rule.trigger_conditions;
    let matches = true;

    // Check reason category
    if (conditions.reason_category && conditions.reason_category.length > 0) {
      if (!conditions.reason_category.includes(returnData.reason_category)) {
        matches = false;
      }
    }

    // Check amount
    if (conditions.amount_max !== undefined && returnData.refund_amount > conditions.amount_max) {
      matches = false;
    }
    if (conditions.amount_min !== undefined && returnData.refund_amount < conditions.amount_min) {
      matches = false;
    }

    if (matches) return rule;
  }

  return null;
}

// Create return shipping label
async function createReturnLabel(
  supabase: any, 
  userId: string, 
  returnId: string,
  carrierCode: string = 'colissimo',
  shipmentDetails?: any
) {
  // Get return and user settings
  const { data: returnData, error: returnError } = await supabase
    .from('returns')
    .select('*, orders(*)')
    .eq('id', returnId)
    .eq('user_id', userId)
    .single();

  if (returnError) throw returnError;

  // Get user's return address from settings
  const { data: settings } = await supabase
    .from('user_settings')
    .select('setting_value')
    .eq('user_id', userId)
    .eq('setting_key', 'return_address')
    .single();

  const returnAddress = settings?.setting_value || {
    name: 'Service Retours',
    street: '123 Rue des Retours',
    city: 'Paris',
    postal_code: '75001',
    country: 'FR'
  };

  // Customer address from order
  const customerAddress = returnData.orders?.shipping_address || {
    name: 'Client',
    street: 'Adresse client',
    city: 'Paris',
    postal_code: '75001',
    country: 'FR'
  };

  // Generate tracking number (in production, call carrier API)
  const trackingNumber = generateTrackingNumber(carrierCode);

  // Estimate shipping cost based on carrier
  const shippingCost = estimateShippingCost(carrierCode, shipmentDetails?.weight_kg || 1);

  // Create label URL (in production, would be actual label PDF URL from carrier)
  const labelUrl = `https://api.example.com/labels/${trackingNumber}.pdf`;

  // Save label to database
  const { data: label, error: labelError } = await supabase
    .from('return_labels')
    .insert({
      user_id: userId,
      return_id: returnId,
      carrier_code: carrierCode,
      carrier_name: getCarrierName(carrierCode),
      tracking_number: trackingNumber,
      label_url: labelUrl,
      label_format: 'pdf',
      from_address: customerAddress,
      to_address: returnAddress,
      weight_kg: shipmentDetails?.weight_kg || 1,
      dimensions: shipmentDetails?.dimensions,
      shipping_cost: shippingCost,
      status: 'created',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
    })
    .select()
    .single();

  if (labelError) throw labelError;

  // Update return with label info
  await supabase
    .from('returns')
    .update({
      label_id: label.id,
      tracking_number: trackingNumber,
      carrier: carrierCode
    })
    .eq('id', returnId);

  console.log(`[Create Label] Label created: ${trackingNumber} for return ${returnId}`);

  return {
    label,
    tracking_number: trackingNumber,
    label_url: labelUrl,
    carrier: carrierCode
  };
}

// Create return request with supplier
async function createSupplierReturn(supabase: any, userId: string, returnId: string) {
  // Get return details with order and products
  const { data: returnData, error: returnError } = await supabase
    .from('returns')
    .select(`
      *,
      orders (
        id, order_number, supplier_order_id, 
        order_items (
          product_id, supplier_id, supplier_sku
        )
      )
    `)
    .eq('id', returnId)
    .eq('user_id', userId)
    .single();

  if (returnError) throw returnError;

  // Get supplier info from order items
  const orderItems = returnData.orders?.order_items || [];
  const supplierIds = [...new Set(orderItems.map((item: any) => item.supplier_id).filter(Boolean))];

  if (supplierIds.length === 0) {
    console.log('[Supplier Return] No supplier found for return items');
    return { created: false, reason: 'No supplier associated with order items' };
  }

  // Get supplier details
  const { data: suppliers, error: suppliersError } = await supabase
    .from('suppliers')
    .select('*')
    .in('id', supplierIds);

  if (suppliersError) throw suppliersError;

  const results: any[] = [];

  for (const supplier of suppliers || []) {
    // In production, call supplier's return API based on type
    const supplierReturnId = await createSupplierReturnRequest(supplier, returnData);
    
    results.push({
      supplier_id: supplier.id,
      supplier_name: supplier.name,
      return_id: supplierReturnId,
      status: 'created'
    });
  }

  // Update return with supplier info
  await supabase
    .from('returns')
    .update({
      supplier_return_id: results.map(r => r.return_id).join(','),
      supplier_return_status: 'pending'
    })
    .eq('id', returnId);

  console.log(`[Supplier Return] Created ${results.length} supplier return(s) for return ${returnId}`);

  return {
    created: true,
    supplier_returns: results
  };
}

// Create supplier return request (mock - in production would call actual API)
async function createSupplierReturnRequest(supplier: any, returnData: any): Promise<string> {
  const supplierType = supplier.supplier_type || supplier.type || 'generic';
  
  console.log(`[Supplier Return] Creating return with ${supplierType} supplier: ${supplier.name}`);

  // Generate mock supplier return ID
  // In production, this would call the actual supplier API
  const supplierReturnId = `SR-${supplier.id.slice(0, 8)}-${Date.now()}`;

  // Different handling based on supplier type
  switch (supplierType) {
    case 'bigbuy':
      // Would call BigBuy API
      console.log('[Supplier Return] BigBuy return created');
      break;
    case 'cjdropshipping':
      // Would call CJ API
      console.log('[Supplier Return] CJ Dropshipping return created');
      break;
    case 'aliexpress':
      // Would call AliExpress API
      console.log('[Supplier Return] AliExpress return created');
      break;
    default:
      console.log('[Supplier Return] Generic supplier return created');
  }

  return supplierReturnId;
}

// Process return (manual processing)
async function processReturn(supabase: any, userId: string, returnId: string) {
  const { data: returnData, error } = await supabase
    .from('returns')
    .select('*')
    .eq('id', returnId)
    .eq('user_id', userId)
    .single();

  if (error) throw error;

  // Update status to processing
  await supabase
    .from('returns')
    .update({ status: 'inspecting', inspected_at: new Date().toISOString() })
    .eq('id', returnId);

  return { processed: true, return: returnData };
}

// Send notification about return status
async function sendReturnNotification(supabase: any, userId: string, returnData: any, status: string) {
  // Create notification in database
  await supabase
    .from('notifications')
    .insert({
      user_id: userId,
      title: `Retour ${returnData.rma_number} - ${status}`,
      message: `Le retour ${returnData.rma_number} a été ${status === 'approved' ? 'approuvé' : 'mis à jour'}.`,
      type: 'return_update',
      priority: 'medium',
      related_entity_id: returnData.id,
      related_entity_type: 'return'
    });

  // Queue email notification (would be handled by separate email service)
  await supabase
    .from('email_queue')
    .insert({
      user_id: userId,
      template: 'return_status_update',
      recipient_email: returnData.customer_email || 'customer@example.com',
      data: {
        rma_number: returnData.rma_number,
        status,
        tracking_number: returnData.tracking_number
      },
      status: 'pending'
    });

  console.log(`[Notification] Sent return notification for ${returnData.rma_number}`);
}

// Helper functions
function generateTrackingNumber(carrierCode: string): string {
  const prefix = carrierCode === 'colissimo' ? '6J' : 
                 carrierCode === 'chronopost' ? 'XH' :
                 carrierCode === 'dhl' ? 'JD' :
                 carrierCode === 'ups' ? '1Z' : 'TRK';
  const random = Math.random().toString(36).substring(2, 14).toUpperCase();
  return `${prefix}${random}`;
}

function estimateShippingCost(carrierCode: string, weightKg: number): number {
  const baseCosts: Record<string, number> = {
    colissimo: 6.99,
    chronopost: 12.99,
    mondialrelay: 4.99,
    dhl: 15.99,
    ups: 18.99,
    fedex: 19.99
  };
  const base = baseCosts[carrierCode] || 8.99;
  // Add weight surcharge
  const weightSurcharge = Math.max(0, (weightKg - 1)) * 2;
  return Math.round((base + weightSurcharge) * 100) / 100;
}

function getCarrierName(carrierCode: string): string {
  const names: Record<string, string> = {
    colissimo: 'Colissimo',
    chronopost: 'Chronopost',
    mondialrelay: 'Mondial Relay',
    dhl: 'DHL Express',
    ups: 'UPS',
    fedex: 'FedEx'
  };
  return names[carrierCode] || carrierCode;
}
