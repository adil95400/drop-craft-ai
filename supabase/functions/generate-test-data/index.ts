import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Real supplier data from major marketplaces
const REAL_SUPPLIERS_DATA = [
  {
    name: "AliExpress Global",
    supplier_type: "marketplace",
    country: "China",
    sector: "Electronics",
    website: "https://www.aliexpress.com",
    description: "Marketplace mondial avec millions de produits électroniques, mode et maison",
    logo_url: "https://ae01.alicdn.com/kf/H61bf2d1ef61c4b2b8b5a6b5e1e9b8c8e0.jpg",
    api_endpoint: "https://gw.api.alibaba.com/openapi",
    rating: 4.2,
    connection_status: "active",
    tags: ["electronics", "fashion", "dropshipping", "wholesale"],
    contact_email: "api@aliexpress.com",
    contact_phone: "+86-571-8502-2088"
  },
  {
    name: "Amazon Seller Central",
    supplier_type: "marketplace", 
    country: "USA",
    sector: "General",
    website: "https://sellercentral.amazon.com",
    description: "La plus grande marketplace mondiale - millions de produits toutes catégories",
    logo_url: "https://m.media-amazon.com/images/G/01/gc/designs/livepreview/amazon_dkblue_noto_email_v2016_us-main._CB468775337_.png",
    api_endpoint: "https://mws.amazonservices.com",
    rating: 4.6,
    connection_status: "active",
    tags: ["marketplace", "fba", "prime", "global"],
    contact_email: "mws-support@amazon.com",
    contact_phone: "+1-888-280-4331"
  },
  {
    name: "Shopify Plus Partners",
    supplier_type: "platform",
    country: "Canada", 
    sector: "E-commerce",
    website: "https://partners.shopify.com",
    description: "Réseau de fournisseurs et apps pour boutiques Shopify",
    logo_url: "https://cdn.shopify.com/shopifycloud/web/assets/v1/shopify_logo.svg",
    api_endpoint: "https://partners.shopify.com/api",
    rating: 4.8,
    connection_status: "active",
    tags: ["ecommerce", "apps", "themes", "dropshipping"],
    contact_email: "partners@shopify.com", 
    contact_phone: "+1-855-816-3857"
  },
  {
    name: "Oberlo by Shopify",
    supplier_type: "dropshipping",
    country: "Lithuania",
    sector: "Fashion",
    website: "https://www.oberlo.com",
    description: "Plateforme de dropshipping avec produits tendance et expédition rapide",
    logo_url: "https://cdn.oberlo.com/oberlo-logo.svg",
    api_endpoint: "https://api.oberlo.com/v2",
    rating: 4.4,
    connection_status: "active",
    tags: ["dropshipping", "fashion", "trending", "automated"],
    contact_email: "support@oberlo.com",
    contact_phone: "+370-5-214-1314"
  },
  {
    name: "Printful Print-on-Demand",
    supplier_type: "print_on_demand",
    country: "Latvia",
    sector: "Custom Products",
    website: "https://www.printful.com",
    description: "Impression à la demande - t-shirts, mugs, posters personnalisables",
    logo_url: "https://www.printful.com/files/logos/printful-logo.svg",
    api_endpoint: "https://api.printful.com",
    rating: 4.7,
    connection_status: "active", 
    tags: ["print-on-demand", "custom", "apparel", "fulfillment"],
    contact_email: "support@printful.com",
    contact_phone: "+371-2544-0976"
  },
  {
    name: "Spocket EU Suppliers",
    supplier_type: "dropshipping",
    country: "Netherlands",
    sector: "Beauty & Fashion",
    website: "https://www.spocket.co",
    description: "Fournisseurs européens et américains - expédition rapide, produits premium",
    logo_url: "https://spocket-assets.s3.amazonaws.com/spocket-logo.png",
    api_endpoint: "https://api.spocket.co/api/v1",
    rating: 4.5,
    connection_status: "active",
    tags: ["dropshipping", "premium", "fast-shipping", "eu-suppliers"],
    contact_email: "hello@spocket.co",
    contact_phone: "+31-20-244-0440"
  },
  {
    name: "Modalyst Premium",
    supplier_type: "dropshipping",
    country: "USA",
    sector: "Fashion",
    website: "https://modalyst.co", 
    description: "Fournisseurs de mode haut de gamme - marques indépendantes et tendances",
    logo_url: "https://modalyst.co/static/images/modalyst-logo.svg",
    api_endpoint: "https://api.modalyst.co/v1",
    rating: 4.3,
    connection_status: "active",
    tags: ["fashion", "premium", "independent-brands", "trend"],
    contact_email: "support@modalyst.co",
    contact_phone: "+1-646-760-1140"
  },
  {
    name: "DSers by AliExpress",
    supplier_type: "dropshipping",
    country: "China",
    sector: "Electronics",
    website: "https://www.dsers.com",
    description: "Solution officielle AliExpress pour le dropshipping automatisé",
    logo_url: "https://www.dsers.com/images/logo.png",
    api_endpoint: "https://api.dsers.com/v1",
    rating: 4.1,
    connection_status: "active",
    tags: ["aliexpress", "automation", "bulk-import", "official"],
    contact_email: "support@dsers.com", 
    contact_phone: "+86-571-2208-3033"
  },
  {
    name: "Wholesale2B",
    supplier_type: "wholesale",
    country: "USA",
    sector: "General",
    website: "https://www.wholesale2b.com",
    description: "Plateforme wholesale avec 1M+ produits de fournisseurs vérifiés",
    logo_url: "https://www.wholesale2b.com/images/w2b-logo.png", 
    api_endpoint: "https://api.wholesale2b.com",
    rating: 4.0,
    connection_status: "active",
    tags: ["wholesale", "verified", "bulk-pricing", "usa-suppliers"],
    contact_email: "support@wholesale2b.com",
    contact_phone: "+1-718-715-4222"
  },
  {
    name: "Sunrise Wholesale",
    supplier_type: "wholesale",
    country: "USA", 
    sector: "Home & Garden",
    website: "https://www.sunrisewholesale.com",
    description: "Grossiste américain spécialisé maison, jardin et décoration",
    logo_url: "https://www.sunrisewholesale.com/logo.png",
    api_endpoint: "https://api.sunrisewholesale.com/v2",
    rating: 4.2,
    connection_status: "active",
    tags: ["wholesale", "home-decor", "garden", "usa-made"],
    contact_email: "api@sunrisewholesale.com",
    contact_phone: "+1-877-917-4711"
  }
];

// Real product data with realistic French market products
const REAL_PRODUCTS_DATA = [
  {
    name: "iPhone 15 Pro Max 256GB Titane Naturel",
    description: "Le nouvel iPhone 15 Pro Max avec puce A17 Pro, appareil photo 48MP et écran Super Retina XDR de 6,7 pouces. Design en titane ultra-résistant.",
    price: 1479,
    cost_price: 1100,
    category: "Smartphones",
    subcategory: "iPhone",
    brand: "Apple",
    sku: "IPH15PM-256-TN",
    image_urls: ["https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-max-naturaltitanium-select?wid=470&hei=556&fmt=png-alpha&.v=1692845702215"],
    tags: ["premium", "5g", "ios17", "titanium"],
    rating: 4.8,
    reviews_count: 2847,
    stock_quantity: 25,
    availability_status: "in_stock",
    delivery_time: "24-48h",
    is_trending: true,
    is_bestseller: true
  },
  {
    name: "Samsung Galaxy S24 Ultra 512GB Noir",
    description: "Galaxy S24 Ultra avec S Pen intégré, écran Dynamic AMOLED 6,8', processeur Snapdragon 8 Gen 3 et caméras IA révolutionnaires.",
    price: 1419,
    cost_price: 1050,
    category: "Smartphones", 
    subcategory: "Samsung Galaxy",
    brand: "Samsung",
    sku: "SGS24U-512-BK",
    image_urls: ["https://images.samsung.com/fr/smartphones/galaxy-s24/images/galaxy-s24-ultra-highlights-color-titanium-black-mo.jpg"],
    tags: ["android", "s-pen", "ai-camera", "5g"],
    rating: 4.7,
    reviews_count: 1923,
    stock_quantity: 18,
    availability_status: "in_stock", 
    delivery_time: "24-48h",
    is_trending: true,
    is_bestseller: false
  },
  {
    name: "MacBook Air M3 15 pouces 512GB Argent",
    description: "MacBook Air avec puce M3, écran Liquid Retina 15,3', jusqu'à 18h d'autonomie. Le portable le plus fin et léger d'Apple.",
    price: 1899,
    cost_price: 1400,
    category: "Ordinateurs",
    subcategory: "MacBook",
    brand: "Apple", 
    sku: "MBA15-M3-512-SLV",
    image_urls: ["https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/macbook-air-15-select-202306-silver?wid=904&hei=840&fmt=jpeg&qlt=90&.v=1684340057088"],
    tags: ["laptop", "m3-chip", "macos", "portable"],
    rating: 4.9,
    reviews_count: 892,
    stock_quantity: 12,
    availability_status: "in_stock",
    delivery_time: "3-5 jours",
    is_trending: false,
    is_bestseller: true
  },
  {
    name: "PlayStation 5 Standard + Spider-Man 2",
    description: "Console PlayStation 5 avec lecteur de disque + jeu Spider-Man 2. Ray tracing, SSD ultra-rapide, manette DualSense haptic.",
    price: 649,
    cost_price: 480,
    category: "Gaming",
    subcategory: "Consoles",
    brand: "Sony",
    sku: "PS5-STD-SM2", 
    image_urls: ["https://gmedia.playstation.com/is/image/SIEPDC/ps5-product-thumbnail-01-en-14sep21"],
    tags: ["console", "gaming", "4k", "ray-tracing"],
    rating: 4.8,
    reviews_count: 3421,
    stock_quantity: 8,
    availability_status: "low_stock",
    delivery_time: "1-2 jours",
    is_trending: true,
    is_bestseller: true
  },
  {
    name: "AirPods Pro 3ème génération USB-C",
    description: "AirPods Pro avec réduction de bruit adaptative, son spatial personnalisé et boîtier de charge MagSafe USB-C.",
    price: 279,
    cost_price: 190,
    category: "Audio",
    subcategory: "Écouteurs", 
    brand: "Apple",
    sku: "APP3-USBC",
    image_urls: ["https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/airpods-pro-3rd-gen-select?wid=470&hei=556&fmt=png-alpha"],
    tags: ["wireless", "noise-cancelling", "spatial-audio", "usb-c"],
    rating: 4.6,
    reviews_count: 1567,
    stock_quantity: 45,
    availability_status: "in_stock",
    delivery_time: "24h",
    is_trending: false,
    is_bestseller: true
  },
  {
    name: "Tesla Model Y Jantes 19 pouces Gemini",
    description: "Jantes alliage Tesla Model Y 19' Gemini noires. Design aérodynamique optimisé pour l'efficience énergétique.",
    price: 2400,
    cost_price: 1800,
    category: "Automobile",
    subcategory: "Jantes",
    brand: "Tesla",
    sku: "TMY-RIM19-GMN-BK",
    image_urls: ["https://digitalassets.tesla.com/tesla-contents/image/upload/f_auto,q_auto/Model-Y-Gemini-Wheel-19.png"],
    tags: ["tesla", "wheels", "19-inch", "aerodynamic"],
    rating: 4.4,
    reviews_count: 234,
    stock_quantity: 6,
    availability_status: "in_stock",
    delivery_time: "7-10 jours",
    is_trending: false,
    is_bestseller: false
  },
  {
    name: "Nintendo Switch OLED Néon",
    description: "Console Nintendo Switch modèle OLED avec écran 7 pouces, couleurs vives, audio amélioré et station d'accueil avec port Ethernet.",
    price: 349,
    cost_price: 250,
    category: "Gaming",
    subcategory: "Consoles Portables",
    brand: "Nintendo",
    sku: "NSW-OLED-NEON",
    image_urls: ["https://assets.nintendo.com/image/upload/c_fill,w_1200/q_auto:best/f_auto/dpr_2.0/ncom/software/switch/70010000000025/7137262b5a64d921e193653f8aa0b722925abc5680380ca0e18a5cfd91697f58"],
    tags: ["portable", "oled", "gaming", "family"],
    rating: 4.7,
    reviews_count: 2103,
    stock_quantity: 22,
    availability_status: "in_stock",
    delivery_time: "24-48h", 
    is_trending: true,
    is_bestseller: false
  },
  {
    name: "Dyson V15 Detect Absolute",
    description: "Aspirateur sans fil Dyson V15 avec technologie de détection laser, capteur de poussière et jusqu'à 60min d'autonomie.",
    price: 749,
    cost_price: 520,
    category: "Électroménager",
    subcategory: "Aspirateurs",
    brand: "Dyson",
    sku: "DV15-DET-ABS",
    image_urls: ["https://dyson-h.assetsadobe2.com/is/image/content/dam/dyson/products/vacuum-cleaners/stick-vacuums/dyson-v15-detect/dyson-v15-detect-absolute-gold-nickel-hero.png"],
    tags: ["cordless", "laser-detection", "hepa-filter", "premium"],
    rating: 4.5,
    reviews_count: 987,
    stock_quantity: 15,
    availability_status: "in_stock",
    delivery_time: "2-3 jours",
    is_trending: false,
    is_bestseller: true
  },
  {
    name: "L'Oréal Paris Revitalift Anti-Âge",
    description: "Crème anti-âge avec Pro-Retinol et Vitamine C. Réduit les rides, raffermit et illumine la peau pour un teint éclatant.",
    price: 24.90,
    cost_price: 12.50,
    category: "Beauté",
    subcategory: "Soins du Visage",
    brand: "L'Oréal Paris",
    sku: "LOR-REV-AA-50ML",
    image_urls: ["https://www.loreal-paris.fr/-/media/project/loreal/brand-sites/oap/emea/fr/categories/skincare/revitalift/revitalift-laser-x3-anti-age-serum-30ml-packshot.jpg"],
    tags: ["anti-aging", "retinol", "vitamin-c", "skincare"],
    rating: 4.3,
    reviews_count: 1834,
    stock_quantity: 78,
    availability_status: "in_stock",
    delivery_time: "24h",
    is_trending: true,
    is_bestseller: false
  },
  {
    name: "Adidas Ultraboost 23 Noires",
    description: "Chaussures running Adidas Ultraboost 23 avec technologie BOOST, tige Primeknit+ et semelle Continental. Confort et performance.",
    price: 189,
    cost_price: 95,
    category: "Sport",
    subcategory: "Chaussures Running",
    brand: "Adidas",
    sku: "ADI-UB23-BK-42",
    image_urls: ["https://assets.adidas.com/images/h_840,f_auto,q_auto,fl_lossy,c_fill,g_auto/fbaf991a8b9d4486a545ae2200166c4c_9366/Ultraboost_23_Shoes_Black_ID2433_01_standard.jpg"],
    tags: ["running", "boost", "primeknit", "performance"],
    rating: 4.6,
    reviews_count: 743,
    stock_quantity: 34,
    availability_status: "in_stock",
    delivery_time: "1-2 jours",
    is_trending: false,
    is_bestseller: true
  }
];

// Real order data
const REAL_ORDERS_DATA = [
  {
    order_number: "FR240125001",
    customer_email: "marie.dubois@gmail.com",
    total_amount: 1758.90,
    currency: "EUR",
    status: "completed",
    payment_method: "carte_bancaire",
    shipping_address: {
      name: "Marie Dubois",
      address: "15 rue de Rivoli",
      city: "Paris",
      postal_code: "75001",
      country: "France"
    },
    items: [
      { product_name: "iPhone 15 Pro Max 256GB", quantity: 1, unit_price: 1479, total: 1479 },
      { product_name: "AirPods Pro 3ème génération", quantity: 1, unit_price: 279, total: 279 }
    ]
  },
  {
    order_number: "FR240125002", 
    customer_email: "julien.martin@yahoo.fr",
    total_amount: 649,
    currency: "EUR",
    status: "shipped",
    payment_method: "paypal",
    shipping_address: {
      name: "Julien Martin",
      address: "8 avenue des Champs",
      city: "Lyon", 
      postal_code: "69002",
      country: "France"
    },
    items: [
      { product_name: "PlayStation 5 Standard + Spider-Man 2", quantity: 1, unit_price: 649, total: 649 }
    ]
  },
  {
    order_number: "FR240124001",
    customer_email: "sophie.bernard@outlook.com", 
    total_amount: 2248,
    currency: "EUR",
    status: "processing",
    payment_method: "carte_bancaire",
    shipping_address: {
      name: "Sophie Bernard",
      address: "22 cours Mirabeau",
      city: "Aix-en-Provence",
      postal_code: "13100", 
      country: "France"
    },
    items: [
      { product_name: "MacBook Air M3 15 pouces 512GB", quantity: 1, unit_price: 1899, total: 1899 },
      { product_name: "Nintendo Switch OLED Néon", quantity: 1, unit_price: 349, total: 349 }
    ]
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { action, count = 10 } = await req.json()

    let result: any = {}

    switch (action) {
      case 'generate_suppliers':
        result = await generateSuppliers(supabaseClient, count)
        break
      
      case 'generate_products':
        result = await generateProducts(supabaseClient, count)
        break
      
      case 'generate_orders':
        result = await generateOrders(supabaseClient, count)
        break
      
      case 'generate_customers':
        result = await generateCustomers(supabaseClient, count)
        break

      case 'generate_all':
        const suppliers = await generateSuppliers(supabaseClient, 5)
        const products = await generateProducts(supabaseClient, 15)
        const customers = await generateCustomers(supabaseClient, 8)
        const orders = await generateOrders(supabaseClient, 5)
        
        result = {
          suppliers: suppliers.created,
          products: products.created,
          customers: customers.created,
          orders: orders.created,
          total: suppliers.created + products.created + customers.created + orders.created
        }
        break
      
      default:
        throw new Error('Unknown action')
    }

    console.log(`Test data generation completed:`, result)

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Test data generation error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function generateSuppliers(supabaseClient: any, count: number) {
  const { data: { user } } = await supabaseClient.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const suppliersToInsert = REAL_SUPPLIERS_DATA.slice(0, count).map(supplier => ({
    ...supplier,
    user_id: user.id,
    product_count: Math.floor(Math.random() * 5000) + 100,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  const { data, error } = await supabaseClient
    .from('suppliers')
    .insert(suppliersToInsert)
    .select()

  if (error) throw error

  return {
    created: data?.length || 0,
    suppliers: data
  }
}

async function generateProducts(supabaseClient: any, count: number) {
  const { data: { user } } = await supabaseClient.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Get existing suppliers for random assignment
  const { data: suppliers } = await supabaseClient
    .from('suppliers')
    .select('id, name')
    .eq('user_id', user.id)
    .limit(5)

  const productsToInsert = []
  
  // Use real products data and extend with variations
  for (let i = 0; i < count; i++) {
    const baseProduct = REAL_PRODUCTS_DATA[i % REAL_PRODUCTS_DATA.length]
    const randomSupplier = suppliers?.[Math.floor(Math.random() * suppliers.length)]
    
    const product = {
      external_id: `REAL_${Date.now()}_${i}`,
      user_id: user.id,
      name: baseProduct.name + (i >= REAL_PRODUCTS_DATA.length ? ` - Variant ${Math.floor(i / REAL_PRODUCTS_DATA.length) + 1}` : ''),
      description: baseProduct.description,
      price: baseProduct.price + (Math.random() * 100 - 50), // Add price variation
      cost_price: baseProduct.cost_price,
      compare_at_price: baseProduct.price * 1.2,
      sku: baseProduct.sku + (i >= REAL_PRODUCTS_DATA.length ? `-V${i}` : ''),
      category: baseProduct.category,
      subcategory: baseProduct.subcategory,
      brand: baseProduct.brand,
      stock_quantity: baseProduct.stock_quantity + Math.floor(Math.random() * 50),
      image_url: baseProduct.image_urls[0],
      image_urls: baseProduct.image_urls,
      tags: baseProduct.tags,
      rating: baseProduct.rating + (Math.random() * 0.4 - 0.2),
      reviews_count: baseProduct.reviews_count + Math.floor(Math.random() * 500),
      availability_status: baseProduct.availability_status,
      delivery_time: baseProduct.delivery_time,
      is_trending: Math.random() > 0.7,
      is_bestseller: Math.random() > 0.8,
      supplier_name: randomSupplier?.name || "Fournisseur Direct",
      supplier_url: `https://supplier-${i}.example.com`,
      profit_margin: ((baseProduct.price - baseProduct.cost_price) / baseProduct.cost_price * 100),
      competition_score: Math.random() * 100,
      trend_score: Math.random() * 100,
      sales_count: Math.floor(Math.random() * 1000),
      source: 'marketplace',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    productsToInsert.push(product)
  }

  const { data, error } = await supabaseClient
    .from('catalog_products') 
    .insert(productsToInsert)
    .select()

  if (error) throw error

  return {
    created: data?.length || 0,
    products: data
  }
}

async function generateCustomers(supabaseClient: any, count: number) {
  const { data: { user } } = await supabaseClient.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  const frenchNames = [
    { first: "Marie", last: "Dubois", email: "marie.dubois@gmail.com" },
    { first: "Julien", last: "Martin", email: "julien.martin@yahoo.fr" },
    { first: "Sophie", last: "Bernard", email: "sophie.bernard@outlook.com" },
    { first: "Pierre", last: "Durand", email: "pierre.durand@gmail.com" },
    { first: "Emma", last: "Petit", email: "emma.petit@hotmail.fr" },
    { first: "Nicolas", last: "Robert", email: "nicolas.robert@laposte.net" },
    { first: "Camille", last: "Moreau", email: "camille.moreau@gmail.com" },
    { first: "Thomas", last: "Simon", email: "thomas.simon@free.fr" },
    { first: "Léa", last: "Michel", email: "lea.michel@orange.fr" },
    { first: "Alexandre", last: "Leroy", email: "alexandre.leroy@sfr.fr" }
  ]

  const frenchCities = [
    { city: "Paris", postal_code: "75001" },
    { city: "Lyon", postal_code: "69002" },
    { city: "Marseille", postal_code: "13001" },
    { city: "Toulouse", postal_code: "31000" },
    { city: "Nice", postal_code: "06000" },
    { city: "Nantes", postal_code: "44000" },
    { city: "Strasbourg", postal_code: "67000" },
    { city: "Montpellier", postal_code: "34000" },
    { city: "Bordeaux", postal_code: "33000" },
    { city: "Lille", postal_code: "59000" }
  ]

  const customersToInsert = []
  
  for (let i = 0; i < count; i++) {
    const nameData = frenchNames[i % frenchNames.length]
    const locationData = frenchCities[Math.floor(Math.random() * frenchCities.length)]
    
    const customer = {
      user_id: user.id,
      name: `${nameData.first} ${nameData.last}`,
      email: nameData.email,
      phone: `+33 ${Math.floor(Math.random() * 9) + 1} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10} ${Math.floor(Math.random() * 90) + 10}`,
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      total_spent: Math.floor(Math.random() * 5000) + 100,
      total_orders: Math.floor(Math.random() * 20) + 1,
      country: "France",
      address: {
        street: `${Math.floor(Math.random() * 200) + 1} ${["rue", "avenue", "boulevard", "place"][Math.floor(Math.random() * 4)]} ${["de la Paix", "Victor Hugo", "des Fleurs", "du Commerce", "Gambetta"][Math.floor(Math.random() * 5)]}`,
        city: locationData.city,
        postal_code: locationData.postal_code,
        country: "France"
      },
      created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }
    
    customersToInsert.push(customer)
  }

  const { data, error } = await supabaseClient
    .from('customers')
    .insert(customersToInsert)
    .select()

  if (error) throw error

  return {
    created: data?.length || 0,
    customers: data
  }
}

async function generateOrders(supabaseClient: any, count: number) {
  const { data: { user } } = await supabaseClient.auth.getUser()
  if (!user) throw new Error('User not authenticated')

  // Get existing customers and products
  const { data: customers } = await supabaseClient
    .from('customers')
    .select('id, name, email')
    .eq('user_id', user.id)
    .limit(10)

  const { data: products } = await supabaseClient
    .from('catalog_products')
    .select('id, name, price')
    .limit(20)

  if (!customers?.length || !products?.length) {
    throw new Error('Need customers and products to generate orders')
  }

  const ordersToInsert = []
  
  for (let i = 0; i < count; i++) {
    const customer = customers[Math.floor(Math.random() * customers.length)]
    const orderProducts = []
    const numItems = Math.floor(Math.random() * 3) + 1
    let totalAmount = 0
    
    for (let j = 0; j < numItems; j++) {
      const product = products[Math.floor(Math.random() * products.length)]
      const quantity = Math.floor(Math.random() * 3) + 1
      const unitPrice = product.price
      const lineTotal = unitPrice * quantity
      
      orderProducts.push({
        product_id: product.id,
        product_name: product.name,
        quantity,
        unit_price: unitPrice,
        total: lineTotal
      })
      
      totalAmount += lineTotal
    }

    const statuses = ['pending', 'processing', 'shipped', 'delivered', 'completed']
    const paymentMethods = ['carte_bancaire', 'paypal', 'virement', 'cheque']
    
    const order = {
      user_id: user.id,
      customer_id: customer.id,
      order_number: `FR24${String(Date.now()).slice(-6)}${String(i).padStart(3, '0')}`,
      customer_email: customer.email,
      total_amount: totalAmount,
      currency: 'EUR',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      shipping_address: {
        name: customer.name,
        address: `${Math.floor(Math.random() * 200) + 1} rue ${["Voltaire", "de la République", "Jean Jaurès"][Math.floor(Math.random() * 3)]}`,
        city: ["Paris", "Lyon", "Marseille", "Toulouse"][Math.floor(Math.random() * 4)],
        postal_code: ["75001", "69002", "13001", "31000"][Math.floor(Math.random() * 4)],
        country: "France"
      },
      billing_address: {
        name: customer.name,
        address: `${Math.floor(Math.random() * 200) + 1} rue ${["Voltaire", "de la République", "Jean Jaurès"][Math.floor(Math.random() * 3)]}`,
        city: ["Paris", "Lyon", "Marseille", "Toulouse"][Math.floor(Math.random() * 4)],
        postal_code: ["75001", "69002", "13001", "31000"][Math.floor(Math.random() * 4)],
        country: "France"
      },
      line_items: orderProducts,
      notes: `Commande générée automatiquement - ${new Date().toLocaleDateString('fr-FR')}`,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }
    
    ordersToInsert.push(order)
  }

  const { data, error } = await supabaseClient
    .from('orders')
    .insert(ordersToInsert)
    .select()

  if (error) throw error

  return {
    created: data?.length || 0,
    orders: data
  }
}