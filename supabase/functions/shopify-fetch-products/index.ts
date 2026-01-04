import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PRODUCTS_QUERY = `
  query GetProducts($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          description
          handle
          priceRange {
            minVariantPrice {
              amount
              currencyCode
            }
          }
          images(first: 5) {
            edges {
              node {
                url
                altText
              }
            }
          }
          variants(first: 10) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
              }
            }
          }
        }
      }
    }
  }
`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { storeDomain, accessToken, limit = 50 } = await req.json();

    // Use provided values or fallback to environment variables
    const shopDomain = storeDomain || Deno.env.get("SHOPIFY_STORE_DOMAIN") || "drop-craft-ai-9874g.myshopify.com";
    const storefrontToken = accessToken || Deno.env.get("SHOPIFY_STOREFRONT_TOKEN") || "9e33316887e1b93d1bdcca1d8344d104";
    
    const apiVersion = "2024-10"; // Use stable version
    const storefrontUrl = `https://${shopDomain}/api/${apiVersion}/graphql.json`;

    console.log(`Fetching products from ${shopDomain}`);

    const response = await fetch(storefrontUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontToken,
      },
      body: JSON.stringify({
        query: PRODUCTS_QUERY,
        variables: { first: Math.min(limit, 250) },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Shopify API error: ${response.status}`, errorText);
      
      if (response.status === 401 || response.status === 403) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Token d'accès Shopify invalide ou expiré",
            code: "INVALID_TOKEN",
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({
          success: false,
          error: `Erreur API Shopify: ${response.status}`,
          details: errorText,
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();

    if (data.errors) {
      console.error("GraphQL errors:", data.errors);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Erreur GraphQL Shopify",
          details: data.errors,
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const products = data.data?.products?.edges?.map((edge: any) => edge.node) || [];

    return new Response(
      JSON.stringify({
        success: true,
        products,
        count: products.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching Shopify products:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Erreur inconnue",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
