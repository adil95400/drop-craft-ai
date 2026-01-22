import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[MARKETING-STORE-SYNC] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Authorization required");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !user) {
      throw new Error("Invalid token");
    }

    const { action, ...data } = await req.json();
    logStep(`Action: ${action}`, { user_id: user.id });

    switch (action) {
      case 'sync_coupons_to_stores':
        return await syncCouponsToStores(supabaseClient, user.id, data);
      
      case 'import_customers_from_stores':
        return await importCustomersFromStores(supabaseClient, user.id, data);
      
      case 'get_sync_stats':
        return await getSyncStats(supabaseClient, user.id);
      
      case 'get_automation_rules':
        return await getAutomationRules(supabaseClient, user.id);
      
      case 'toggle_automation_rule':
        return await toggleAutomationRule(supabaseClient, user.id, data);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// Sync coupons from ShopOpti to connected stores (Shopify, WooCommerce, PrestaShop)
async function syncCouponsToStores(supabase: any, userId: string, data: any) {
  logStep("Syncing coupons to stores", { userId });

  // Get user's active integrations
  const { data: integrations, error: intError } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (intError) throw intError;

  // Get coupons to sync
  const { data: coupons, error: couponsError } = await supabase
    .from('promotional_coupons')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (couponsError) throw couponsError;

  const results: any[] = [];
  const syncedCoupons: string[] = [];

  for (const integration of integrations || []) {
    const platform = integration.platform?.toLowerCase();
    
    for (const coupon of coupons || []) {
      try {
        let result;
        
        switch (platform) {
          case 'shopify':
            result = await syncCouponToShopify(integration, coupon);
            break;
          case 'woocommerce':
            result = await syncCouponToWooCommerce(integration, coupon);
            break;
          case 'prestashop':
            result = await syncCouponToPrestaShop(integration, coupon);
            break;
          default:
            logStep(`Platform ${platform} not supported for coupon sync`);
            continue;
        }

        if (result.success) {
          syncedCoupons.push(coupon.id);
          results.push({
            coupon_code: coupon.code,
            platform,
            status: 'synced',
            external_id: result.external_id
          });

          // Log the sync
          await supabase.from('sync_logs').insert({
            user_id: userId,
            integration_id: integration.id,
            sync_type: 'coupon_push',
            status: 'success',
            details: { coupon_code: coupon.code, external_id: result.external_id }
          });
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        results.push({
          coupon_code: coupon.code,
          platform,
          status: 'error',
          error: errMsg
        });
        logStep(`Error syncing coupon ${coupon.code} to ${platform}`, { error: errMsg });
      }
    }
  }

  logStep("Coupon sync completed", { synced: syncedCoupons.length, total: coupons?.length || 0 });

  return new Response(JSON.stringify({
    success: true,
    synced_count: syncedCoupons.length,
    total_coupons: coupons?.length || 0,
    platforms_count: integrations?.length || 0,
    results
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

// Sync coupon to Shopify
async function syncCouponToShopify(integration: any, coupon: any): Promise<{ success: boolean; external_id?: string }> {
  const credentials = integration.config?.credentials;
  if (!credentials?.access_token || !integration.store_url) {
    logStep("Missing Shopify credentials", { integration_id: integration.id });
    return { success: false };
  }

  const shopDomain = integration.store_url.replace('https://', '').replace('http://', '');
  
  // First create a price rule
  const priceRulePayload = {
    price_rule: {
      title: coupon.code,
      target_type: "line_item",
      target_selection: "all",
      allocation_method: "across",
      value_type: coupon.discount_type === 'percentage' ? 'percentage' : 'fixed_amount',
      value: coupon.discount_type === 'percentage' ? `-${coupon.discount_value}` : `-${coupon.discount_value}`,
      customer_selection: "all",
      starts_at: coupon.starts_at || new Date().toISOString(),
      ends_at: coupon.expires_at,
      usage_limit: coupon.max_uses,
      prerequisite_subtotal_range: coupon.min_purchase_amount ? {
        greater_than_or_equal_to: coupon.min_purchase_amount.toString()
      } : undefined
    }
  };

  try {
    const priceRuleRes = await fetch(`https://${shopDomain}/admin/api/2024-01/price_rules.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': credentials.access_token
      },
      body: JSON.stringify(priceRulePayload)
    });

    if (!priceRuleRes.ok) {
      const errorText = await priceRuleRes.text();
      logStep("Shopify price rule creation failed", { status: priceRuleRes.status, error: errorText });
      return { success: false };
    }

    const priceRuleData = await priceRuleRes.json();
    const priceRuleId = priceRuleData.price_rule?.id;

    // Now create the discount code
    const discountCodeRes = await fetch(`https://${shopDomain}/admin/api/2024-01/price_rules/${priceRuleId}/discount_codes.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': credentials.access_token
      },
      body: JSON.stringify({
        discount_code: { code: coupon.code }
      })
    });

    if (!discountCodeRes.ok) {
      logStep("Shopify discount code creation failed");
      return { success: false };
    }

    const discountData = await discountCodeRes.json();
    return { 
      success: true, 
      external_id: discountData.discount_code?.id?.toString() 
    };
  } catch (err) {
    logStep("Shopify API error", { error: err instanceof Error ? err.message : String(err) });
    return { success: false };
  }
}

// Sync coupon to WooCommerce
async function syncCouponToWooCommerce(integration: any, coupon: any): Promise<{ success: boolean; external_id?: string }> {
  const credentials = integration.config?.credentials;
  if (!credentials?.consumer_key || !credentials?.consumer_secret || !integration.store_url) {
    return { success: false };
  }

  const wooPayload = {
    code: coupon.code,
    discount_type: coupon.discount_type === 'percentage' ? 'percent' : 'fixed_cart',
    amount: coupon.discount_value.toString(),
    individual_use: true,
    usage_limit: coupon.max_uses,
    date_expires: coupon.expires_at,
    minimum_amount: coupon.min_purchase_amount?.toString()
  };

  try {
    const auth = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`);
    const res = await fetch(`${integration.store_url}/wp-json/wc/v3/coupons`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`
      },
      body: JSON.stringify(wooPayload)
    });

    if (!res.ok) {
      return { success: false };
    }

    const data = await res.json();
    return { success: true, external_id: data.id?.toString() };
  } catch (err) {
    return { success: false };
  }
}

// Sync coupon to PrestaShop
async function syncCouponToPrestaShop(integration: any, coupon: any): Promise<{ success: boolean; external_id?: string }> {
  const credentials = integration.config?.credentials;
  if (!credentials?.api_key || !integration.store_url) {
    return { success: false };
  }

  // PrestaShop uses cart rules for coupons
  const cartRuleXml = `<?xml version="1.0" encoding="UTF-8"?>
<prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
  <cart_rule>
    <name><language id="1">${coupon.code}</language></name>
    <code>${coupon.code}</code>
    <reduction_percent>${coupon.discount_type === 'percentage' ? coupon.discount_value : 0}</reduction_percent>
    <reduction_amount>${coupon.discount_type === 'fixed' ? coupon.discount_value : 0}</reduction_amount>
    <active>1</active>
    <quantity>${coupon.max_uses || 1000}</quantity>
    <date_from>${coupon.starts_at || new Date().toISOString().split('T')[0]}</date_from>
    <date_to>${coupon.expires_at || '2099-12-31'}</date_to>
    <minimum_amount>${coupon.min_purchase_amount || 0}</minimum_amount>
  </cart_rule>
</prestashop>`;

  try {
    const auth = btoa(`${credentials.api_key}:`);
    const res = await fetch(`${integration.store_url}/api/cart_rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
        'Authorization': `Basic ${auth}`
      },
      body: cartRuleXml
    });

    if (!res.ok) {
      return { success: false };
    }

    const text = await res.text();
    const idMatch = text.match(/<id>(\d+)<\/id>/);
    return { success: true, external_id: idMatch?.[1] };
  } catch (err) {
    return { success: false };
  }
}

// Import customers from connected stores for segmentation
async function importCustomersFromStores(supabase: any, userId: string, data: any) {
  logStep("Importing customers from stores", { userId });

  const { data: integrations, error: intError } = await supabase
    .from('integrations')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true);

  if (intError) throw intError;

  let totalImported = 0;
  const results: any[] = [];

  for (const integration of integrations || []) {
    const platform = integration.platform?.toLowerCase();
    
    try {
      let customers: any[] = [];
      
      switch (platform) {
        case 'shopify':
          customers = await fetchShopifyCustomers(integration);
          break;
        case 'woocommerce':
          customers = await fetchWooCommerceCustomers(integration);
          break;
        case 'prestashop':
          customers = await fetchPrestaShopCustomers(integration);
          break;
        default:
          continue;
      }

      // Upsert customers to database
      for (const customer of customers) {
        const { error: upsertError } = await supabase
          .from('customers')
          .upsert({
            user_id: userId,
            email: customer.email,
            name: customer.name,
            phone: customer.phone,
            source: platform,
            external_id: customer.external_id,
            total_spent: customer.total_spent || 0,
            orders_count: customer.orders_count || 0,
            tags: customer.tags || [],
            metadata: customer.metadata || {},
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,email'
          });

        if (!upsertError) {
          totalImported++;
        }
      }

      results.push({
        platform,
        imported: customers.length,
        status: 'success'
      });

      // Log sync
      await supabase.from('sync_logs').insert({
        user_id: userId,
        integration_id: integration.id,
        sync_type: 'customer_import',
        status: 'success',
        details: { imported: customers.length }
      });

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      results.push({
        platform,
        imported: 0,
        status: 'error',
        error: errMsg
      });
    }
  }

  logStep("Customer import completed", { totalImported });

  return new Response(JSON.stringify({
    success: true,
    total_imported: totalImported,
    platforms_count: integrations?.length || 0,
    results
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

async function fetchShopifyCustomers(integration: any): Promise<any[]> {
  const credentials = integration.config?.credentials;
  if (!credentials?.access_token || !integration.store_url) {
    return [];
  }

  const shopDomain = integration.store_url.replace('https://', '').replace('http://', '');
  
  try {
    const res = await fetch(`https://${shopDomain}/admin/api/2024-01/customers.json?limit=250`, {
      headers: {
        'X-Shopify-Access-Token': credentials.access_token
      }
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.customers || []).map((c: any) => ({
      email: c.email,
      name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
      phone: c.phone,
      external_id: c.id.toString(),
      total_spent: parseFloat(c.total_spent || 0),
      orders_count: c.orders_count || 0,
      tags: c.tags?.split(',').map((t: string) => t.trim()) || [],
      metadata: {
        accepts_marketing: c.accepts_marketing,
        verified_email: c.verified_email,
        created_at: c.created_at
      }
    }));
  } catch (err) {
    return [];
  }
}

async function fetchWooCommerceCustomers(integration: any): Promise<any[]> {
  const credentials = integration.config?.credentials;
  if (!credentials?.consumer_key || !credentials?.consumer_secret || !integration.store_url) {
    return [];
  }

  try {
    const auth = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`);
    const res = await fetch(`${integration.store_url}/wp-json/wc/v3/customers?per_page=100`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    if (!res.ok) return [];

    const data = await res.json();
    return data.map((c: any) => ({
      email: c.email,
      name: `${c.first_name || ''} ${c.last_name || ''}`.trim(),
      phone: c.billing?.phone,
      external_id: c.id.toString(),
      total_spent: parseFloat(c.total_spent || 0),
      orders_count: c.orders_count || 0,
      tags: [],
      metadata: { role: c.role, avatar_url: c.avatar_url }
    }));
  } catch (err) {
    return [];
  }
}

async function fetchPrestaShopCustomers(integration: any): Promise<any[]> {
  const credentials = integration.config?.credentials;
  if (!credentials?.api_key || !integration.store_url) {
    return [];
  }

  try {
    const auth = btoa(`${credentials.api_key}:`);
    const res = await fetch(`${integration.store_url}/api/customers?output_format=JSON&display=full`, {
      headers: { 'Authorization': `Basic ${auth}` }
    });

    if (!res.ok) return [];

    const data = await res.json();
    return (data.customers || []).map((c: any) => ({
      email: c.email,
      name: `${c.firstname || ''} ${c.lastname || ''}`.trim(),
      phone: '',
      external_id: c.id.toString(),
      total_spent: 0,
      orders_count: 0,
      tags: [],
      metadata: { newsletter: c.newsletter, optin: c.optin }
    }));
  } catch (err) {
    return [];
  }
}

// Get sync statistics
async function getSyncStats(supabase: any, userId: string) {
  // Get automation rules
  const { data: rules } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('user_id', userId);

  // Get recent sync logs
  const { data: logs } = await supabase
    .from('sync_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  // Get integrations count
  const { data: integrations } = await supabase
    .from('integrations')
    .select('id, platform, is_active')
    .eq('user_id', userId);

  // Calculate stats
  const activeRules = rules?.filter((r: any) => r.is_active)?.length || 0;
  const totalExecutions = rules?.reduce((sum: number, r: any) => sum + (r.trigger_count || 0), 0) || 0;
  const successLogs = logs?.filter((l: any) => l.status === 'success')?.length || 0;
  const successRate = logs?.length ? (successLogs / logs.length) * 100 : 0;

  // Calculate savings (estimated based on automation)
  const estimatedSavings = totalExecutions * 2.5; // €2.50 per automated action

  return new Response(JSON.stringify({
    success: true,
    stats: {
      active_rules: activeRules,
      total_rules: rules?.length || 0,
      total_executions: totalExecutions,
      success_rate: Math.round(successRate * 10) / 10,
      estimated_savings: Math.round(estimatedSavings),
      connected_platforms: integrations?.filter((i: any) => i.is_active)?.length || 0,
      recent_syncs: logs?.slice(0, 10) || []
    }
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

// Get automation rules
async function getAutomationRules(supabase: any, userId: string) {
  const { data: rules, error } = await supabase
    .from('automation_rules')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return new Response(JSON.stringify({
    success: true,
    rules: rules || []
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}

// Toggle automation rule
async function toggleAutomationRule(supabase: any, userId: string, data: any) {
  const { rule_id, is_active } = data;

  const { error } = await supabase
    .from('automation_rules')
    .update({ is_active, updated_at: new Date().toISOString() })
    .eq('id', rule_id)
    .eq('user_id', userId);

  if (error) throw error;

  return new Response(JSON.stringify({
    success: true,
    message: is_active ? 'Règle activée' : 'Règle désactivée'
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}
