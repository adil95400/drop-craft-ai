import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Clear existing data
    console.log('Clearing existing seed data...');
    await supabase.from('reviews').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('shipments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('suppliers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Seed Suppliers
    console.log('Seeding suppliers...');
    const suppliers = [
      { name: 'BigBuy', slug: 'bigbuy', api_key: Deno.env.get('BIGBUY_API_KEY') || 'test_key' },
      { name: 'AliExpress', slug: 'aliexpress', api_key: Deno.env.get('ALIEXPRESS_API_KEY') || 'test_key' },
      { name: 'DHgate', slug: 'dhgate' },
      { name: 'Local Supplier', slug: 'local-supplier' }
    ];

    const { data: suppliersData } = await supabase.from('suppliers').insert(suppliers).select();
    console.log(`Created ${suppliersData?.length} suppliers`);

    // Seed Products (50 realistic products)
    console.log('Seeding products...');
    const products = Array.from({ length: 50 }, (_, i) => ({
      supplier_id: suppliersData?.[i % suppliersData.length]?.id,
      sku: `SKU-${1000 + i}`,
      title: [
        'Wireless Bluetooth Headphones',
        'Smart Phone Case with Stand',
        'USB-C Charging Cable 3m',
        'Portable Power Bank 20000mAh',
        'Bluetooth Speaker Waterproof',
        'LED Desk Lamp with USB Port',
        'Wireless Mouse Ergonomic',
        'Phone Screen Protector Glass',
        'Car Phone Mount Magnetic',
        'Laptop Stand Adjustable',
        'Smartwatch Sports Band',
        'Gaming Mouse Pad RGB',
        'Phone Ring Holder Metal',
        'Wireless Charger Fast Charging',
        'Bluetooth Earbuds True Wireless',
        'USB Hub 7-Port with Power',
        'Phone Camera Lens Kit',
        'Tablet Stand Aluminum',
        'Gaming Keyboard Mechanical',
        'Phone Tripod Flexible'
      ][i % 20] + ` Model ${Math.floor(i/20) + 1}`,
      description: `High-quality product with excellent features. Product number ${i + 1} in our catalog.`,
      price: Math.round((Math.random() * 200 + 10) * 100) / 100,
      currency: 'EUR',
      images: JSON.stringify([
        `https://picsum.photos/400/400?random=${i}`,
        `https://picsum.photos/400/400?random=${i + 100}`
      ]),
      vendor: ['Apple', 'Samsung', 'Xiaomi', 'Anker', 'Baseus'][i % 5],
      tags: [
        ['electronics', 'audio'],
        ['phone', 'accessories'],
        ['charging', 'cables'],
        ['power', 'portable'],
        ['audio', 'waterproof']
      ][i % 5]
    }));

    const { data: productsData } = await supabase.from('products').insert(products).select();
    console.log(`Created ${productsData?.length} products`);

    // Seed Inventory
    console.log('Seeding inventory...');
    const inventory = productsData?.map(product => ({
      product_id: product.id,
      stock: Math.floor(Math.random() * 100) + 10,
      warehouse: ['Main Warehouse', 'EU Warehouse', 'US Warehouse'][Math.floor(Math.random() * 3)]
    })) || [];

    await supabase.from('inventory').insert(inventory);
    console.log(`Created ${inventory.length} inventory records`);

    // Seed Customers (20 realistic customers)
    console.log('Seeding customers...');
    const countries = ['France', 'Germany', 'Spain', 'Italy', 'UK', 'Netherlands', 'Belgium', 'Portugal'];
    const firstNames = ['Jean', 'Marie', 'Pierre', 'Sophie', 'Antoine', 'Camille', 'Julien', 'Emma', 'Louis', 'Clara'];
    const lastNames = ['Dupont', 'Martin', 'Bernard', 'Thomas', 'Robert', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon'];

    const customers = Array.from({ length: 20 }, (_, i) => ({
      email: `customer${i + 1}@example.com`,
      name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
      country: countries[i % countries.length]
    }));

    const { data: customersData } = await supabase.from('customers').insert(customers).select();
    console.log(`Created ${customersData?.length} customers`);

    // Seed Orders (30 orders)
    console.log('Seeding orders...');
    const orderStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    const orders = Array.from({ length: 30 }, (_, i) => ({
      shopify_order_id: `SHOP-${10000 + i}`,
      customer_id: customersData?.[i % customersData.length]?.id,
      total: Math.round((Math.random() * 500 + 50) * 100) / 100,
      currency: 'EUR',
      status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    }));

    const { data: ordersData } = await supabase.from('orders').insert(orders).select();
    console.log(`Created ${ordersData?.length} orders`);

    // Seed Order Items
    console.log('Seeding order items...');
    const orderItems = [];
    for (const order of ordersData || []) {
      const itemCount = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < itemCount; j++) {
        const product = productsData?.[Math.floor(Math.random() * productsData.length)];
        if (product) {
          orderItems.push({
            order_id: order.id,
            product_id: product.id,
            qty: Math.floor(Math.random() * 3) + 1,
            unit_price: product.price
          });
        }
      }
    }

    await supabase.from('order_items').insert(orderItems);
    console.log(`Created ${orderItems.length} order items`);

    // Seed Shipments (30 shipments with real tracking numbers)
    console.log('Seeding shipments...');
    const carriers = ['DHL', 'UPS', 'FedEx', 'DPD', 'Colissimo'];
    const shipmentStatuses = ['pending', 'in_transit', 'delivered', 'exception'];
    const realTrackingNumbers = [
      '1Z999AA1234567890', // UPS format
      'DHL1234567890', // DHL format
      '123456789012', // FedEx format
      '9405511206213467891234', // USPS format
      'RR123456789FR' // La Poste format
    ];

    const shipments = ordersData?.slice(0, 30).map((order, i) => ({
      order_id: order.id,
      tracking_number: i < 5 ? realTrackingNumbers[i] : `TRK${100000 + i}${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      carrier: carriers[i % carriers.length],
      status: shipmentStatuses[Math.floor(Math.random() * shipmentStatuses.length)],
      last_sync_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
    })) || [];

    await supabase.from('shipments').insert(shipments);
    console.log(`Created ${shipments.length} shipments`);

    // Seed Reviews (15 reviews)
    console.log('Seeding reviews...');
    const reviewComments = [
      'Excellent product, very satisfied with my purchase!',
      'Good quality for the price, fast delivery.',
      'Works as expected, would recommend.',
      'Great value for money, will buy again.',
      'Perfect, exactly what I was looking for.',
      'Good product but delivery was slow.',
      'Very happy with this purchase!',
      'Quality product, well packaged.',
      'Meets expectations, good service.',
      'Recommend this product to everyone!'
    ];

    const reviews = Array.from({ length: 15 }, (_, i) => ({
      product_id: productsData?.[i % Math.min(10, productsData?.length || 0)]?.id,
      customer_id: customersData?.[i % customersData.length]?.id,
      rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars
      comment: reviewComments[i % reviewComments.length],
      created_at: new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000).toISOString()
    }));

    await supabase.from('reviews').insert(reviews);
    console.log(`Created ${reviews.length} reviews`);

    // Log seeding completion
    await supabase.from('events_logs').insert({
      topic: 'seed_completed',
      payload: {
        suppliers: suppliersData?.length,
        products: productsData?.length,
        customers: customersData?.length,
        orders: ordersData?.length,
        orderItems: orderItems.length,
        shipments: shipments.length,
        reviews: reviews.length,
        timestamp: new Date().toISOString()
      }
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Database seeded successfully',
      data: {
        suppliers: suppliersData?.length,
        products: productsData?.length,
        customers: customersData?.length,
        orders: ordersData?.length,
        orderItems: orderItems.length,
        shipments: shipments.length,
        reviews: reviews.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Seeding error:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});