import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    console.log('Fetching data from URL:', url);

    // Simple URL validation
    if (!url || !url.startsWith('http')) {
      throw new Error('URL invalide');
    }

    // Simulate fetching products from various sources
    let products = [];

    if (url.includes('aliexpress')) {
      products = generateAliExpressProducts();
    } else if (url.includes('amazon')) {
      products = generateAmazonProducts();
    } else if (url.includes('shopify')) {
      products = generateShopifyProducts();
    } else {
      // Generic scraping simulation
      products = generateGenericProducts();
    }

    console.log(`Found ${products.length} products from ${url}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        products,
        source: url,
        count: products.length
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error fetching URL data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function generateAliExpressProducts() {
  return [
    {
      name: "Montre connectée smartwatch",
      description: "Montre intelligente avec suivi de santé",
      price: 29.99,
      cost_price: 15.50,
      category: "Électronique",
      image_url: "https://example.com/watch.jpg",
      sku: "AE-WATCH-001"
    },
    {
      name: "Écouteurs Bluetooth sans fil",
      description: "Écouteurs haute qualité avec réduction de bruit",
      price: 19.99,
      cost_price: 8.99,
      category: "Audio",
      image_url: "https://example.com/earbuds.jpg",
      sku: "AE-EARBUDS-001"
    },
    {
      name: "Coque téléphone iPhone",
      description: "Coque de protection transparente",
      price: 9.99,
      cost_price: 2.50,
      category: "Accessoires",
      image_url: "https://example.com/case.jpg",
      sku: "AE-CASE-001"
    }
  ];
}

function generateAmazonProducts() {
  return [
    {
      name: "Livre développement web",
      description: "Guide complet pour apprendre le développement web",
      price: 35.99,
      cost_price: 20.00,
      category: "Livres",
      image_url: "https://example.com/book.jpg",
      sku: "AMZ-BOOK-001"
    },
    {
      name: "Souris ergonomique",
      description: "Souris sans fil ergonomique pour bureau",
      price: 24.99,
      cost_price: 12.99,
      category: "Informatique",
      image_url: "https://example.com/mouse.jpg",
      sku: "AMZ-MOUSE-001"
    }
  ];
}

function generateShopifyProducts() {
  return [
    {
      name: "T-shirt bio",
      description: "T-shirt en coton biologique",
      price: 25.00,
      cost_price: 8.00,
      category: "Vêtements",
      image_url: "https://example.com/tshirt.jpg",
      sku: "SHOP-TSHIRT-001"
    },
    {
      name: "Mug personnalisé",
      description: "Mug avec impression personnalisée",
      price: 12.99,
      cost_price: 4.50,
      category: "Maison",
      image_url: "https://example.com/mug.jpg",
      sku: "SHOP-MUG-001"
    }
  ];
}

function generateGenericProducts() {
  return [
    {
      name: "Produit générique 1",
      description: "Description du produit générique",
      price: 19.99,
      cost_price: 10.00,
      category: "Divers",
      image_url: "https://example.com/generic1.jpg",
      sku: "GEN-001"
    },
    {
      name: "Produit générique 2",
      description: "Autre produit d'exemple",
      price: 15.50,
      cost_price: 7.25,
      category: "Divers",
      image_url: "https://example.com/generic2.jpg",
      sku: "GEN-002"
    }
  ];
}