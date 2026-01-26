import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface CustomerSyncRequest {
  user_id: string
  integration_id?: string
  platform?: string
  direction?: 'import' | 'export' | 'bidirectional'
  customer_ids?: string[]
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    
    // Support both body params and auth header for user_id
    const body = await req.json() as CustomerSyncRequest
    let userId = body.user_id

    // If no user_id in body, try to get from auth header
    if (!userId) {
      const authHeader = req.headers.get('Authorization')
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '')
        const userClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
          global: { headers: { Authorization: `Bearer ${token}` } }
        })
        const { data: { user } } = await userClient.auth.getUser()
        if (user) userId = user.id
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const { integration_id, platform, direction = 'import', customer_ids } = body

    console.log(`👥 Customer sync starting for user ${userId}, direction: ${direction}`)

    const results: any = {
      imported: 0,
      exported: 0,
      errors: []
    }

    // Get integrations
    let intQuery = supabase
      .from('integrations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)

    if (integration_id) {
      intQuery = intQuery.eq('id', integration_id)
    }
    if (platform) {
      intQuery = intQuery.eq('platform', platform)
    }

    const { data: integrations, error: intError } = await intQuery
    if (intError) throw intError

    for (const integration of integrations || []) {
      const platformName = integration.platform

      // IMPORT: Get customers from store
      if (direction === 'import' || direction === 'bidirectional') {
        try {
          const importResult = await importCustomersFromChannel(supabase, integration, user_id)
          results.imported += importResult.count
          if (importResult.errors.length > 0) {
            results.errors.push(...importResult.errors)
          }
        } catch (e) {
          results.errors.push({ platform: platformName, type: 'import', error: e.message })
        }
      }

      // EXPORT: Push customers to store
      if (direction === 'export' || direction === 'bidirectional') {
        try {
          const exportResult = await exportCustomersToChannel(supabase, integration, user_id, customer_ids)
          results.exported += exportResult.count
          if (exportResult.errors.length > 0) {
            results.errors.push(...exportResult.errors)
          }
        } catch (e) {
          results.errors.push({ platform: platformName, type: 'export', error: e.message })
        }
      }
    }

    // Log sync
    await supabase.from('unified_sync_logs').insert({
      user_id,
      sync_type: 'customers',
      platform: platform || 'multiple',
      entity_type: 'customers',
      action: direction,
      status: results.errors.length === 0 ? 'success' : 'partial',
      items_processed: results.imported + results.exported,
      items_succeeded: results.imported + results.exported - results.errors.length,
      items_failed: results.errors.length,
      metadata: results
    })

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Customer sync error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function importCustomersFromChannel(supabase: any, integration: any, userId: string) {
  const platform = integration.platform
  const result = { count: 0, errors: [] as any[] }

  console.log(`Importing customers from ${platform}`)

  try {
    let customers: any[] = []

    switch (platform.toLowerCase()) {
      case 'shopify':
        customers = await fetchShopifyCustomers(integration)
        break
      case 'woocommerce':
        customers = await fetchWooCommerceCustomers(integration)
        break
      case 'prestashop':
        customers = await fetchPrestaShopCustomers(integration)
        break
      default:
        console.log(`Customer import not implemented for ${platform}`)
        return result
    }

    // Upsert customers
    for (const customer of customers) {
      const email = customer.email
      if (!email) continue

      const { error } = await supabase
        .from('customers')
        .upsert({
          user_id: userId,
          email: email,
          first_name: customer.first_name || customer.billing?.first_name || '',
          last_name: customer.last_name || customer.billing?.last_name || '',
          phone: customer.phone || customer.billing?.phone,
          address_line1: customer.default_address?.address1 || customer.billing?.address_1,
          city: customer.default_address?.city || customer.billing?.city,
          postal_code: customer.default_address?.zip || customer.billing?.postcode,
          country: customer.default_address?.country || customer.billing?.country,
          source: platform,
          external_id: customer.id?.toString(),
          total_orders: customer.orders_count || 0,
          total_spent: parseFloat(customer.total_spent || 0),
          tags: customer.tags ? customer.tags.split(',').map((t: string) => t.trim()) : [],
          notes: `Imported from ${platform}`,
          metadata: { platform_data: customer }
        }, {
          onConflict: 'user_id,email'
        })

      if (error) {
        result.errors.push({ customer_id: customer.id, error: error.message })
      } else {
        result.count++
      }
    }

  } catch (e) {
    result.errors.push({ error: e.message })
  }

  return result
}

async function exportCustomersToChannel(supabase: any, integration: any, userId: string, customerIds?: string[]) {
  const platform = integration.platform
  const result = { count: 0, errors: [] as any[] }

  // Get customers to export
  let query = supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .is('external_id', null) // Only export customers not yet in store

  if (customerIds) {
    query = query.in('id', customerIds)
  }

  const { data: customers, error } = await query.limit(100)
  if (error) throw error

  for (const customer of customers || []) {
    try {
      let externalId: string | null = null

      switch (platform.toLowerCase()) {
        case 'shopify':
          externalId = await createShopifyCustomer(integration, customer)
          break
        case 'woocommerce':
          externalId = await createWooCommerceCustomer(integration, customer)
          break
      }

      if (externalId) {
        // Update local customer with external ID
        await supabase
          .from('customers')
          .update({ external_id: externalId, source: platform })
          .eq('id', customer.id)

        result.count++
      } else {
        result.errors.push({ customer_id: customer.id, error: 'Creation failed' })
      }

    } catch (e) {
      result.errors.push({ customer_id: customer.id, error: e.message })
    }
  }

  return result
}

// Shopify
async function fetchShopifyCustomers(integration: any): Promise<any[]> {
  const shopDomain = integration.store_url
  const accessToken = integration.credentials_encrypted?.access_token || Deno.env.get('SHOPIFY_ACCESS_TOKEN')

  if (!accessToken || !shopDomain) return []

  const response = await fetch(
    `https://${shopDomain}/admin/api/2024-01/customers.json?limit=250`,
    {
      headers: { 'X-Shopify-Access-Token': accessToken }
    }
  )

  if (!response.ok) return []
  const data = await response.json()
  return data.customers || []
}

async function createShopifyCustomer(integration: any, customer: any): Promise<string | null> {
  const shopDomain = integration.store_url
  const accessToken = integration.credentials_encrypted?.access_token || Deno.env.get('SHOPIFY_ACCESS_TOKEN')

  if (!accessToken || !shopDomain) return null

  const response = await fetch(
    `https://${shopDomain}/admin/api/2024-01/customers.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        customer: {
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
          phone: customer.phone,
          addresses: customer.address_line1 ? [{
            address1: customer.address_line1,
            city: customer.city,
            zip: customer.postal_code,
            country: customer.country
          }] : []
        }
      })
    }
  )

  if (!response.ok) return null
  const data = await response.json()
  return data.customer?.id?.toString() || null
}

// WooCommerce
async function fetchWooCommerceCustomers(integration: any): Promise<any[]> {
  const storeUrl = integration.store_url
  const credentials = integration.credentials_encrypted

  if (!credentials?.consumer_key || !credentials?.consumer_secret) return []

  const auth = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`)
  const response = await fetch(
    `${storeUrl}/wp-json/wc/v3/customers?per_page=100`,
    {
      headers: { 'Authorization': `Basic ${auth}` }
    }
  )

  if (!response.ok) return []
  return await response.json()
}

async function createWooCommerceCustomer(integration: any, customer: any): Promise<string | null> {
  const storeUrl = integration.store_url
  const credentials = integration.credentials_encrypted

  if (!credentials?.consumer_key || !credentials?.consumer_secret) return null

  const auth = btoa(`${credentials.consumer_key}:${credentials.consumer_secret}`)
  const response = await fetch(
    `${storeUrl}/wp-json/wc/v3/customers`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
        billing: {
          first_name: customer.first_name,
          last_name: customer.last_name,
          address_1: customer.address_line1,
          city: customer.city,
          postcode: customer.postal_code,
          country: customer.country,
          phone: customer.phone
        }
      })
    }
  )

  if (!response.ok) return null
  const data = await response.json()
  return data.id?.toString() || null
}

// PrestaShop
async function fetchPrestaShopCustomers(integration: any): Promise<any[]> {
  const storeUrl = integration.store_url
  const credentials = integration.credentials_encrypted

  if (!credentials?.api_key) return []

  const response = await fetch(
    `${storeUrl}/api/customers?output_format=JSON&display=full&limit=100`,
    {
      headers: { 'Authorization': `Basic ${btoa(credentials.api_key + ':')}` }
    }
  )

  if (!response.ok) return []
  const data = await response.json()
  return data.customers || []
}
