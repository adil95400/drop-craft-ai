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

    console.log('Starting MASSIVE realistic data generation for user:', user_id)

    // === PHASE 1: GENERATE MASSIVE REALISTIC DATA ===

    // Generate 50 realistic suppliers (global scale)
    const suppliers = []
    const supplierTemplates = [
      { name: 'AliExpress Global', country: 'China', sector: 'electronics', rating: 4.2, product_count: 1250 },
      { name: 'Amazon Business', country: 'USA', sector: 'general', rating: 4.5, product_count: 890 },
      { name: 'Alibaba Wholesale', country: 'China', sector: 'manufacturing', rating: 4.3, product_count: 2100 },
      { name: 'DHgate Suppliers', country: 'China', sector: 'consumer_goods', rating: 4.0, product_count: 750 },
      { name: 'Made-in-China', country: 'China', sector: 'industrial', rating: 4.1, product_count: 950 },
      { name: 'Global Sources', country: 'Hong Kong', sector: 'electronics', rating: 4.4, product_count: 1150 },
      { name: 'IndiaMART', country: 'India', sector: 'textiles', rating: 3.9, product_count: 650 },
      { name: 'TradeIndia', country: 'India', sector: 'chemicals', rating: 4.2, product_count: 580 },
      { name: 'EC21 Korea', country: 'South Korea', sector: 'beauty', rating: 4.3, product_count: 420 },
      { name: 'TradeTang', country: 'China', sector: 'fashion', rating: 4.1, product_count: 850 },
    ]

    for (let i = 0; i < 50; i++) {
      const template = supplierTemplates[i % supplierTemplates.length]
      suppliers.push({
        user_id,
        name: `${template.name} ${i > 9 ? i + 1 : ''}`.trim(),
        website: `https://${template.name.toLowerCase().replace(/\s+/g, '')}.com`,
        country: template.country,
        status: Math.random() > 0.1 ? 'active' : 'pending',
        rating: template.rating + (Math.random() - 0.5) * 0.6,
        contact_email: `business${i}@${template.name.toLowerCase().replace(/\s+/g, '')}.com`,
        contact_phone: `+${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        product_count: template.product_count + Math.floor(Math.random() * 500),
        supplier_type: Math.random() > 0.3 ? 'api' : 'manual',
        sector: template.sector,
        logo_url: `https://via.placeholder.com/150?text=${template.name.replace(/\s+/g, '')}`,
        description: `Leading supplier of ${template.sector} products from ${template.country}`,
        connection_status: Math.random() > 0.2 ? 'connected' : 'pending',
        tags: [template.sector, template.country.toLowerCase(), Math.random() > 0.5 ? 'verified' : 'wholesale']
      })
    }

    // Insert suppliers in batches
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

    console.log(`Successfully inserted ${suppliersData.length} suppliers`)

    // Generate 1000+ realistic customers
    const customers = []
    const firstNames = ['Marie', 'Jean', 'Sophie', 'Pierre', 'Nathalie', 'Laurent', 'Catherine', 'Michel', 'Sylvie', 'Patrick', 'Isabelle', 'Philippe', 'Françoise', 'Alain', 'Martine', 'Bernard', 'Christine', 'Daniel', 'Monique', 'Claude']
    const lastNames = ['Martin', 'Bernard', 'Thomas', 'Petit', 'Robert', 'Richard', 'Durand', 'Dubois', 'Moreau', 'Laurent', 'Simon', 'Michel', 'Lefebvre', 'Leroy', 'Roux', 'David', 'Bertrand', 'Morel', 'Fournier', 'Girard']
    const cities = ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes', 'Reims', 'Le Havre', 'Saint-Étienne', 'Toulon', 'Grenoble', 'Dijon', 'Angers', 'Nîmes', 'Villeurbanne']
    const countries = ['France', 'Belgium', 'Switzerland', 'Canada', 'Luxembourg']

    for (let i = 0; i < 1200; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)]
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)]
      const city = cities[Math.floor(Math.random() * cities.length)]
      const country = countries[Math.floor(Math.random() * countries.length)]
      const totalSpent = Math.random() * 10000 + 100
      const totalOrders = Math.floor(Math.random() * 25) + 1
      
      customers.push({
        user_id,
        name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@email.fr`,
        phone: `+33-6-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 90) + 10}-${Math.floor(Math.random() * 90) + 10}`,
        status: Math.random() > 0.15 ? 'active' : 'inactive',
        total_spent: Math.round(totalSpent * 100) / 100,
        total_orders: totalOrders,
        address: {
          street: `${Math.floor(Math.random() * 999) + 1} ${['Rue', 'Avenue', 'Boulevard', 'Place'][Math.floor(Math.random() * 4)]} de ${['la Paix', 'la République', 'la Liberté', 'Victor Hugo', 'Jean Jaurès'][Math.floor(Math.random() * 5)]}`,
          city: city,
          postal_code: `${Math.floor(Math.random() * 90000) + 10000}`,
          country: country
        },
        country: country
      })
    }

    // Insert customers in batches
    const batchSize = 100
    const customersBatches = []
    for (let i = 0; i < customers.length; i += batchSize) {
      customersBatches.push(customers.slice(i, i + batchSize))
    }

    let customersData = []
    for (const batch of customersBatches) {
      const { data, error } = await supabase
        .from('customers')
        .insert(batch)
        .select()
      
      if (error) {
        console.error('Customer batch insert error:', error)
        // Continue with other batches
      } else {
        customersData = [...customersData, ...data]
      }
    }

    console.log(`Successfully inserted ${customersData.length} customers`)

    // Generate 2000+ realistic orders
    const orders = []
    const productNames = [
      'iPhone 15 Pro Case', 'Wireless Bluetooth Headphones', 'Smart Watch Band', 'USB-C Cable', 'Portable Charger',
      'Laptop Stand', 'Wireless Mouse', 'Keyboard Protector', 'Phone Screen Protector', 'Tablet Case',
      'Gaming Controller', 'Webcam HD', 'Microphone USB', 'Speaker Bluetooth', 'Car Phone Mount',
      'Fitness Tracker', 'Smart Home Device', 'LED Strip Lights', 'Power Bank 20000mAh', 'Drone Camera'
    ]
    const statuses = ['delivered', 'shipped', 'processing', 'pending']
    const currencies = ['EUR', 'USD', 'CAD', 'CHF']

    for (let i = 0; i < 2500; i++) {
      const customer = customersData[Math.floor(Math.random() * customersData.length)]
      if (!customer) continue
      
      const orderDate = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000)
      const status = statuses[Math.floor(Math.random() * statuses.length)]
      const deliveryDate = status === 'delivered' ? new Date(orderDate.getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000) : null
      const itemCount = Math.floor(Math.random() * 5) + 1
      const items = []
      let totalAmount = 0

      for (let j = 0; j < itemCount; j++) {
        const productName = productNames[Math.floor(Math.random() * productNames.length)]
        const quantity = Math.floor(Math.random() * 3) + 1
        const price = Math.round((Math.random() * 200 + 10) * 100) / 100
        items.push({ product_name: productName, quantity, price })
        totalAmount += price * quantity
      }

      orders.push({
        user_id,
        customer_id: customer.id,
        order_number: `ORD-${new Date().getFullYear()}-${String(i + 1).padStart(6, '0')}`,
        status,
        total_amount: Math.round(totalAmount * 100) / 100,
        currency: currencies[Math.floor(Math.random() * currencies.length)],
        order_date: orderDate.toISOString(),
        delivery_date: deliveryDate?.toISOString() || null,
        shipping_address: customer.address,
        billing_address: customer.address,
        items
      })
    }

    // Insert orders in batches
    const ordersBatches = []
    for (let i = 0; i < orders.length; i += batchSize) {
      ordersBatches.push(orders.slice(i, i + batchSize))
    }

    let ordersData = []
    for (const batch of ordersBatches) {
      const { data, error } = await supabase
        .from('orders')
        .insert(batch)
        .select()
      
      if (error) {
        console.error('Orders batch insert error:', error)
        // Continue with other batches
      } else {
        ordersData = [...ordersData, ...data]
      }
    }

    console.log(`Successfully inserted ${ordersData.length} orders`)

    // Generate realistic products from catalog
    const catalogProducts = []
    const categories = ['Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Beauty', 'Automotive', 'Books', 'Toys']
    const brands = ['Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'L\'Oréal', 'Bosch', 'IKEA']

    for (let i = 0; i < 5000; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)]
      const brand = brands[Math.floor(Math.random() * brands.length)]
      const price = Math.round((Math.random() * 500 + 5) * 100) / 100
      const costPrice = Math.round(price * (0.4 + Math.random() * 0.3) * 100) / 100
      
      catalogProducts.push({
        external_id: `prod_${i + 1}`,
        name: `${brand} ${productNames[Math.floor(Math.random() * productNames.length)]} ${i + 1}`,
        description: `High-quality ${category.toLowerCase()} product from ${brand}`,
        price,
        cost_price: costPrice,
        profit_margin: Math.round(((price - costPrice) / costPrice * 100) * 100) / 100,
        currency: 'EUR',
        category: category.toLowerCase(),
        subcategory: `${category.toLowerCase()}_sub`,
        brand,
        sku: `SKU-${String(i + 1).padStart(6, '0')}`,
        image_url: `https://via.placeholder.com/300?text=${brand}+Product`,
        image_urls: [`https://via.placeholder.com/300?text=${brand}+Product+${i + 1}`],
        rating: Math.round((3 + Math.random() * 2) * 10) / 10,
        reviews_count: Math.floor(Math.random() * 1000),
        availability_status: Math.random() > 0.1 ? 'in_stock' : 'out_of_stock',
        delivery_time: `${Math.floor(Math.random() * 7) + 1}-${Math.floor(Math.random() * 7) + 8} days`,
        tags: [category.toLowerCase(), brand.toLowerCase(), Math.random() > 0.5 ? 'bestseller' : 'new'],
        is_trending: Math.random() > 0.8,
        is_bestseller: Math.random() > 0.9,
        supplier_name: suppliers[Math.floor(Math.random() * suppliers.length)].name,
        supplier_id: `sup_${Math.floor(Math.random() * 1000)}`,
        supplier_url: `https://supplier${Math.floor(Math.random() * 100)}.com`,
        competition_score: Math.round(Math.random() * 100),
        sales_count: Math.floor(Math.random() * 500),
        stock_quantity: Math.floor(Math.random() * 1000),
        shipping_cost: Math.round(Math.random() * 20 * 100) / 100
      })
    }

    // Insert catalog products in batches
    const catalogBatches = []
    for (let i = 0; i < catalogProducts.length; i += batchSize) {
      catalogBatches.push(catalogProducts.slice(i, i + batchSize))
    }

    let catalogData = []
    for (const batch of catalogBatches) {
      const { data, error } = await supabase
        .from('catalog_products')
        .insert(batch)
        .select()
      
      if (error) {
        console.error('Catalog batch insert error:', error)
        // Continue with other batches
      } else {
        catalogData = [...catalogData, ...data]
      }
    }

    console.log(`Successfully inserted ${catalogData.length} catalog products`)

    // Generate AI analytics data
    const analyticsData = []
    for (let i = 0; i < 500; i++) {
      analyticsData.push({
        user_id,
        behavior_type: ['purchase_pattern', 'browsing_behavior', 'seasonal_trend', 'price_sensitivity'][Math.floor(Math.random() * 4)],
        customer_id: customersData[Math.floor(Math.random() * Math.min(100, customersData.length))]?.id,
        behavioral_score: Math.round(Math.random() * 100),
        churn_probability: Math.round(Math.random() * 100) / 100,
        lifetime_value: Math.round(Math.random() * 5000 * 100) / 100,
        analysis_data: {
          segments: ['high_value', 'frequent_buyer', 'price_conscious'][Math.floor(Math.random() * 3)],
          preferences: categories.slice(0, Math.floor(Math.random() * 3) + 1),
          avg_order_value: Math.round(Math.random() * 300 * 100) / 100
        },
        recommendations: [
          { action: 'send_personalized_offer', confidence: Math.random() },
          { action: 'recommend_products', confidence: Math.random() }
        ]
      })
    }

    const { error: analyticsError } = await supabase
      .from('customer_behavior_analytics')
      .insert(analyticsData)

    if (analyticsError) {
      console.error('Analytics insert error:', analyticsError)
    }

    // Generate automation data
    const automationTriggers = []
    const automationActions = []
    
    for (let i = 0; i < 50; i++) {
      const triggerId = crypto.randomUUID()
      
      automationTriggers.push({
        id: triggerId,
        user_id,
        name: `Auto Trigger ${i + 1}`,
        description: `Automated trigger for ${['low_stock', 'new_order', 'customer_inquiry', 'price_alert'][Math.floor(Math.random() * 4)]}`,
        trigger_type: ['inventory_low', 'order_created', 'customer_behavior', 'price_change'][Math.floor(Math.random() * 4)],
        conditions: { threshold: Math.floor(Math.random() * 100) },
        is_active: Math.random() > 0.3
      })
      
      automationActions.push({
        user_id,
        trigger_id: triggerId,
        action_type: ['send_email', 'create_task', 'update_inventory', 'send_notification'][Math.floor(Math.random() * 4)],
        action_config: { template: 'default', priority: Math.floor(Math.random() * 5) + 1 },
        execution_order: 1,
        is_active: true
      })
    }

    const { error: triggersError } = await supabase
      .from('automation_triggers')
      .insert(automationTriggers)

    const { error: actionsError } = await supabase
      .from('automation_actions')
      .insert(automationActions)

    if (triggersError) console.error('Triggers insert error:', triggersError)
    if (actionsError) console.error('Actions insert error:', actionsError)

    // Generate activity logs
    const activityLogs = []
    const actions = ['order_created', 'product_updated', 'customer_registered', 'supplier_sync', 'inventory_updated', 'price_changed', 'promotion_applied']
    
    for (let i = 0; i < 1000; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)]
      const logDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
      
      activityLogs.push({
        user_id,
        action,
        description: `${action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} executed successfully`,
        entity_type: action.split('_')[0],
        entity_id: `${action.split('_')[0]}_${Math.floor(Math.random() * 1000)}`,
        metadata: {
          timestamp: logDate.toISOString(),
          source: Math.random() > 0.5 ? 'web' : 'automation',
          success: Math.random() > 0.1
        },
        severity: Math.random() > 0.8 ? 'warning' : 'info',
        source: Math.random() > 0.5 ? 'web' : 'automation',
        created_at: logDate.toISOString()
      })
    }

    const { error: logsError } = await supabase
      .from('activity_logs')
      .insert(activityLogs)

    if (logsError) console.error('Activity logs insert error:', logsError)

    console.log('MASSIVE realistic data generation completed successfully!')

    return new Response(
      JSON.stringify({
        success: true,
        message: 'MASSIVE realistic data generated successfully!',
        data: {
          suppliers: suppliersData?.length || 0,
          customers: customersData?.length || 0,
          orders: ordersData?.length || 0,
          catalog_products: catalogData?.length || 0,
          analytics_records: analyticsData.length,
          automation_triggers: automationTriggers.length,
          activity_logs: activityLogs.length,
          total_records: (suppliersData?.length || 0) + (customersData?.length || 0) + (ordersData?.length || 0) + (catalogData?.length || 0) + analyticsData.length + automationTriggers.length + activityLogs.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error generating massive realistic data:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})