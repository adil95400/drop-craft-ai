import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id } = await req.json()
    
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'user_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Starting realistic data generation for user:', user_id)

    // Generate realistic suppliers
    const suppliers = [
      {
        user_id,
        name: 'AliExpress Global',
        website: 'https://aliexpress.com',
        country: 'China',
        status: 'active',
        rating: 4.2,
        contact_email: 'business@aliexpress.com',
        contact_phone: '+86-571-85022088',
        product_count: 1250,
        supplier_type: 'api', // Using valid constraint value
        sector: 'electronics',
        logo_url: 'https://ae01.alicdn.com/kf/S0ab15b1c9b0b4e6b8f6f7b8c5d4a3f2e.jpg',
        description: 'Leading global marketplace for electronics and consumer goods',
        connection_status: 'connected',
        tags: ['global', 'electronics', 'wholesale']
      },
      {
        user_id,
        name: 'Amazon Business',
        website: 'https://business.amazon.com',
        country: 'USA',
        status: 'active',
        rating: 4.5,
        contact_email: 'partner@amazon.com',
        contact_phone: '+1-206-266-1000',
        product_count: 890,
        supplier_type: 'api',
        sector: 'general',
        description: 'B2B marketplace with millions of products',
        connection_status: 'connected',
        tags: ['amazon', 'b2b', 'logistics']
      },
      {
        user_id,
        name: 'Fnac Marketplace',
        website: 'https://marketplace.fnac.com',
        country: 'France',
        status: 'active',
        rating: 4.1,
        contact_email: 'partenaires@fnac.com',
        contact_phone: '+33-1-55-21-55-55',
        product_count: 425,
        supplier_type: 'manual',
        sector: 'media',
        description: 'French cultural and tech products marketplace',
        connection_status: 'connected',
        tags: ['france', 'culture', 'tech']
      }
    ]

    // Insert suppliers
    const { data: suppliersData, error: suppliersError } = await supabase
      .from('suppliers')
      .insert(suppliers)
      .select()

    if (suppliersError) {
      console.error('Suppliers insert error:', suppliersError)
      return new Response(
        JSON.stringify({ error: 'Failed to insert suppliers', details: suppliersError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate realistic customers
    const customers = [
      {
        user_id,
        name: 'Marie Dubois',
        email: 'marie.dubois@email.fr',
        phone: '+33-6-12-34-56-78',
        status: 'active',
        total_spent: 2580.50,
        total_orders: 12,
        address: {
          street: '123 Rue de la Paix',
          city: 'Paris',
          postal_code: '75001',
          country: 'France'
        },
        country: 'France'
      },
      {
        user_id,
        name: 'Jean Martin',
        email: 'jean.martin@gmail.com',
        phone: '+33-6-87-65-43-21',
        status: 'active',
        total_spent: 1950.00,
        total_orders: 8,
        address: {
          street: '456 Avenue des Champs',
          city: 'Lyon',
          postal_code: '69002',
          country: 'France'
        },
        country: 'France'
      },
      {
        user_id,
        name: 'Sophie Bernard',
        email: 'sophie.bernard@outlook.fr',
        phone: '+33-6-11-22-33-44',
        status: 'active',
        total_spent: 3420.75,
        total_orders: 15,
        address: {
          street: '789 Boulevard Saint-Germain',
          city: 'Marseille',
          postal_code: '13001',
          country: 'France'
        },
        country: 'France'
      }
    ]

    // Insert customers
    const { data: customersData, error: customersError } = await supabase
      .from('customers')
      .insert(customers)
      .select()

    if (customersError) {
      console.error('Customers insert error:', customersError)
      return new Response(
        JSON.stringify({ error: 'Failed to insert customers', details: customersError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate realistic orders
    const orders = [
      {
        user_id,
        customer_id: customersData[0].id,
        order_number: 'ORD-2024-001',
        status: 'delivered',
        total_amount: 285.50,
        currency: 'EUR',
        order_date: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        delivery_date: new Date(Date.now() - 37 * 24 * 60 * 60 * 1000).toISOString(),
        shipping_address: {
          street: '123 Rue de la Paix',
          city: 'Paris',
          postal_code: '75001',
          country: 'France'
        },
        billing_address: {
          street: '123 Rue de la Paix',
          city: 'Paris',
          postal_code: '75001',
          country: 'France'
        },
        items: [
          { product_name: 'iPhone 15 Case', quantity: 2, price: 45.50 },
          { product_name: 'Wireless Charger', quantity: 1, price: 194.50 }
        ]
      },
      {
        user_id,
        customer_id: customersData[1].id,
        order_number: 'ORD-2024-002',
        status: 'shipped',
        total_amount: 180.75,
        currency: 'EUR',
        order_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        shipping_address: {
          street: '456 Avenue des Champs',
          city: 'Lyon',
          postal_code: '69002',
          country: 'France'
        },
        billing_address: {
          street: '456 Avenue des Champs',
          city: 'Lyon',
          postal_code: '69002',
          country: 'France'
        },
        items: [
          { product_name: 'Smart Watch Band', quantity: 3, price: 60.25 }
        ]
      }
    ]

    // Insert orders
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .insert(orders)
      .select()

    if (ordersError) {
      console.error('Orders insert error:', ordersError)
      return new Response(
        JSON.stringify({ error: 'Failed to insert orders', details: ordersError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate automation triggers and actions
    const triggers = [
      {
        user_id,
        name: 'Stock Critique',
        description: 'Déclenché quand le stock d\'un produit descend sous le seuil',
        trigger_type: 'inventory_low',
        conditions: { threshold: 5 },
        is_active: true
      },
      {
        user_id,
        name: 'Nouvelle Commande',
        description: 'Déclenché à chaque nouvelle commande',
        trigger_type: 'order_created',
        conditions: {},
        is_active: true
      }
    ]

    // Insert triggers
    const { data: triggersData, error: triggersError } = await supabase
      .from('automation_triggers')
      .insert(triggers)
      .select()

    if (triggersError) {
      console.error('Triggers insert error:', triggersError)
    }

    // Add some activity logs
    const activityLogs = [
      {
        user_id,
        action: 'order_created',
        description: 'Nouvelle commande créée',
        entity_type: 'order',
        entity_id: 'ORD-2024-002',
        metadata: { amount: 180.75, customer: 'Jean Martin' },
        severity: 'info',
        source: 'web'
      },
      {
        user_id,
        action: 'supplier_sync',
        description: 'Synchronisation fournisseur complétée',
        entity_type: 'supplier',
        entity_id: 'sup_ali',
        metadata: { products_updated: 125, errors: 0 },
        severity: 'info',
        source: 'automation'
      }
    ]

    // Insert activity logs
    const { error: logsError } = await supabase
      .from('activity_logs')
      .insert(activityLogs)

    if (logsError) {
      console.error('Activity logs insert error:', logsError)
    }

    console.log('Realistic data generation completed successfully')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Realistic data generated successfully',
        data: {
          suppliers: suppliersData?.length || 0,
          customers: customersData?.length || 0,
          orders: ordersData?.length || 0,
          triggers: triggersData?.length || 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating realistic data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})