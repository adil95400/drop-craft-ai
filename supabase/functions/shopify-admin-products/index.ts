 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { shopDomain, accessToken, limit = 50 } = await req.json();
 
     if (!shopDomain || !accessToken) {
       throw new Error("shopDomain and accessToken are required");
     }
 
     console.log(`Fetching products from ${shopDomain} using Admin API`);
 
     const apiVersion = "2024-10";
     const adminUrl = `https://${shopDomain}/admin/api/${apiVersion}/products.json?limit=${Math.min(limit, 250)}`;
 
     const response = await fetch(adminUrl, {
       method: "GET",
       headers: {
         "X-Shopify-Access-Token": accessToken,
         "Content-Type": "application/json",
       },
     });
 
     if (!response.ok) {
       const errorText = await response.text();
       console.error(`Shopify Admin API error: ${response.status}`, errorText);
       
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
     const products = data.products || [];
 
     // Transform Admin API format to match Storefront API format
     const transformedProducts = products.map((p: any) => ({
       id: p.id.toString(),
       title: p.title,
       description: p.body_html,
       handle: p.handle,
       priceRange: {
         minVariantPrice: {
           amount: p.variants?.[0]?.price || "0",
           currencyCode: "EUR",
         },
       },
       images: {
         edges: (p.images || []).map((img: any) => ({
           node: {
             url: img.src,
             altText: img.alt || p.title,
           },
         })),
       },
       variants: {
         edges: (p.variants || []).map((v: any) => ({
           node: {
             id: v.id.toString(),
             title: v.title,
             price: {
               amount: v.price,
               currencyCode: "EUR",
             },
             availableForSale: v.inventory_quantity > 0,
           },
         })),
       },
     }));
 
     return new Response(
       JSON.stringify({
         success: true,
         products: transformedProducts,
         count: transformedProducts.length,
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