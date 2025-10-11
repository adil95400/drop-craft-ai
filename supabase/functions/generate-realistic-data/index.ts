import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Realistic supplier names by category
const suppliersByCategory: Record<string, string[]> = {
  electronics: ["TechSupply Co", "ElectroWholesale", "Digital Components Ltd", "Smart Devices Inc"],
  fashion: ["Fashion Forward", "Style Warehouse", "Trend Suppliers", "Apparel Hub"],
  home: ["Home Essentials", "Living Spaces Co", "Comfort Home Suppliers", "Modern Living Ltd"],
  sports: ["Athletic Pro Supply", "Sports Gear Wholesale", "Fitness Equipment Co", "Active Lifestyle Ltd"],
};

// Realistic product names by category
const productsByCategory: Record<string, string[]> = {
  electronics: [
    "Wireless Bluetooth Headphones",
    "Smart Watch Series 5",
    "4K Ultra HD Smart TV 55\"",
    "Laptop Stand Aluminum",
    "USB-C Hub 7-in-1",
    "Mechanical Gaming Keyboard",
    "Wireless Gaming Mouse",
    "Portable SSD 1TB",
    "Phone Case Premium Leather",
    "Screen Protector Tempered Glass"
  ],
  fashion: [
    "Premium Cotton T-Shirt",
    "Slim Fit Jeans",
    "Leather Jacket",
    "Running Shoes Athletic",
    "Winter Coat Hooded",
    "Designer Sunglasses",
    "Leather Wallet",
    "Canvas Backpack",
    "Silk Scarf",
    "Dress Shoes Oxford"
  ],
  home: [
    "Memory Foam Pillow",
    "Non-Stick Cookware Set",
    "LED Desk Lamp",
    "Vacuum Cleaner Robot",
    "Coffee Maker Automatic",
    "Air Purifier HEPA",
    "Kitchen Knife Set Professional",
    "Bath Towel Set Egyptian Cotton",
    "Wall Art Canvas Print",
    "Throw Blanket Soft"
  ],
  sports: [
    "Yoga Mat Premium",
    "Dumbbell Set Adjustable",
    "Protein Shaker Bottle",
    "Resistance Bands Set",
    "Fitness Tracker Watch",
    "Tennis Racket Professional",
    "Basketball Official Size",
    "Swimming Goggles Anti-Fog",
    "Bicycle Helmet Safety",
    "Running Belt Waist Pack"
  ],
};

const categories = ["electronics", "fashion", "home", "sports"];

// Generate realistic suppliers
function generateSuppliers(userId: string, count: number = 10) {
  const suppliers = [];
  
  for (let i = 0; i < count; i++) {
    const category = categories[i % categories.length];
    const supplierNames = suppliersByCategory[category];
    const name = supplierNames[i % supplierNames.length];
    
    suppliers.push({
      user_id: userId,
      name: `${name} ${i + 1}`,
      supplier_type: "marketplace",
      country: ["France", "Germany", "UK", "USA", "China"][i % 5],
      sector: category,
      description: `Professional ${category} supplier with quality products`,
      connection_status: i < 7 ? "connected" : "pending",
      product_count: Math.floor(Math.random() * 50) + 10,
      rating: (4 + Math.random()).toFixed(1),
      logo_url: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
      tags: [category, "verified", "reliable"],
    });
  }
  
  return suppliers;
}

// Generate realistic customers
function generateCustomers(userId: string, count: number = 15) {
  const firstNames = ["Jean", "Marie", "Pierre", "Sophie", "Thomas", "Julie", "Lucas", "Emma", "Nicolas", "Léa", "Alexandre", "Camille", "Antoine", "Chloé", "Maxime"];
  const lastNames = ["Martin", "Bernard", "Dubois", "Thomas", "Robert", "Richard", "Petit", "Durand", "Leroy", "Moreau", "Simon", "Laurent", "Lefebvre", "Michel", "Garcia"];
  
  const customers = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const name = `${firstName} ${lastName}`;
    
    customers.push({
      user_id: userId,
      name,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
      phone: `+33 ${Math.floor(Math.random() * 9 + 1)} ${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      status: i < 12 ? "active" : "inactive",
      total_spent: Math.floor(Math.random() * 5000) + 500,
      total_orders: Math.floor(Math.random() * 10) + 1,
      address: {
        street: `${Math.floor(Math.random() * 500) + 1} Rue ${['de Paris', 'de Lyon', 'des Champs', 'Victor Hugo', 'Jean Jaurès'][i % 5]}`,
        city: ["Paris", "Lyon", "Marseille", "Toulouse", "Nice"][i % 5],
        postal_code: `${75000 + Math.floor(Math.random() * 20000)}`,
        country: "France"
      }
    });
  }
  
  return customers;
}

// Generate realistic orders
function generateOrders(userId: string, customers: any[], count: number = 25) {
  const orders = [];
  const statuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  
  for (let i = 0; i < count; i++) {
    const customer = customers[i % customers.length];
    const orderDate = new Date();
    orderDate.setDate(orderDate.getDate() - Math.floor(Math.random() * 90));
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const totalAmount = Math.floor(Math.random() * 500) + 50;
    
    orders.push({
      user_id: userId,
      customer_id: customer.id,
      order_number: `ORD-${new Date().getFullYear()}-${String(i + 1).padStart(5, '0')}`,
      status,
      total_amount: totalAmount,
      currency: "EUR",
      order_date: orderDate.toISOString(),
      delivery_date: status === "delivered" ? new Date(orderDate.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString() : null,
      shipping_address: customer.address,
      billing_address: customer.address,
      items: [
        {
          product_name: productsByCategory[categories[i % categories.length]][i % 10],
          quantity: Math.floor(Math.random() * 3) + 1,
          price: totalAmount
        }
      ]
    });
  }
  
  return orders;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      throw new Error("User not authenticated");
    }

    console.log(`Generating realistic data for user ${user.id}`);

    // Generate suppliers
    const suppliers = generateSuppliers(user.id, 10);
    const { data: insertedSuppliers, error: suppliersError } = await supabaseClient
      .from("suppliers")
      .insert(suppliers)
      .select();

    if (suppliersError) throw suppliersError;

    // Generate customers
    const customers = generateCustomers(user.id, 15);
    const { data: insertedCustomers, error: customersError } = await supabaseClient
      .from("customers")
      .insert(customers)
      .select();

    if (customersError) throw customersError;

    // Generate orders
    const orders = generateOrders(user.id, insertedCustomers || [], 25);
    const { data: insertedOrders, error: ordersError } = await supabaseClient
      .from("orders")
      .insert(orders)
      .select();

    if (ordersError) throw ordersError;

    console.log(`Successfully generated data: ${suppliers.length} suppliers, ${customers.length} customers, ${orders.length} orders`);

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          suppliers: suppliers.length,
          customers: customers.length,
          orders: orders.length,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error generating data:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});
