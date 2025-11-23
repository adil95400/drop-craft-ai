import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShopifyStoreImportRequest {
  storeUrl: string;
  importVariants: boolean;
  importCategories: boolean;
}

const STOREFRONT_QUERY = `
  query GetProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          description
          handle
          productType
          tags
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
          variants(first: 100) {
            edges {
              node {
                id
                title
                price {
                  amount
                  currencyCode
                }
                availableForSale
                selectedOptions {
                  name
                  value
                }
                sku
              }
            }
          }
        }
      }
    }
  }
`;

async function fetchShopifyProducts(storeUrl: string): Promise<any[]> {
  // Extract domain from URL
  const domain = new URL(storeUrl).hostname;
  const apiUrl = `https://${domain}/api/2025-07/graphql.json`;

  const allProducts: any[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  console.log(`Fetching products from: ${apiUrl}`);

  while (hasNextPage) {
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          query: STOREFRONT_QUERY,
          variables: {
            first: 50,
            after: cursor,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.errors) {
        throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
      }

      const products = data.data?.products;
      if (!products) {
        throw new Error('No products data returned');
      }

      allProducts.push(...products.edges);

      hasNextPage = products.pageInfo.hasNextPage;
      cursor = products.pageInfo.endCursor;

      console.log(`Fetched ${products.edges.length} products. Total: ${allProducts.length}. Has more: ${hasNextPage}`);
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  return allProducts;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: userData } = await supabase.auth.getUser(token);

    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    const { storeUrl, importVariants = true, importCategories = true }: ShopifyStoreImportRequest = await req.json();

    if (!storeUrl) {
      throw new Error('Store URL is required');
    }

    console.log(`Starting import from Shopify store: ${storeUrl}`);

    // Fetch products from Shopify store
    const shopifyProducts = await fetchShopifyProducts(storeUrl);

    const importedProducts = [];
    const importedVariants = [];
    let errors = 0;

    for (const { node: product } of shopifyProducts) {
      try {
        // Prepare main product data
        const mainVariant = product.variants.edges[0]?.node;
        
        const productData = {
          external_id: product.id,
          name: product.title,
          description: product.description || '',
          price: parseFloat(mainVariant?.price.amount || product.priceRange.minVariantPrice.amount),
          currency: mainVariant?.price.currencyCode || product.priceRange.minVariantPrice.currencyCode,
          category: importCategories ? product.productType || 'Non catégorisé' : 'Non catégorisé',
          brand: new URL(storeUrl).hostname.replace('.myshopify.com', '').replace(/\./g, ' '),
          sku: mainVariant?.sku || product.handle,
          image_url: product.images.edges[0]?.node.url || null,
          image_urls: product.images.edges.map((edge: any) => edge.node.url),
          tags: product.tags,
          supplier_name: new URL(storeUrl).hostname,
          supplier_url: storeUrl,
          availability_status: mainVariant?.availableForSale ? 'in_stock' : 'out_of_stock',
          stock_quantity: mainVariant?.availableForSale ? 10 : 0,
          user_id: userData.user.id,
          seo_data: {
            title: product.title,
            description: product.description?.substring(0, 160) || '',
            keywords: product.tags || []
          }
        };

        // Insert main product
        const { data: insertedProduct, error: insertError } = await supabase
          .from('catalog_products')
          .insert(productData)
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting product:', insertError);
          errors++;
          continue;
        }

        importedProducts.push(insertedProduct);

        // Import variants if requested and available
        if (importVariants && product.variants.edges.length > 1) {
          for (const { node: variant } of product.variants.edges) {
            try {
              const variantData = {
                external_id: variant.id,
                name: `${product.title} - ${variant.title}`,
                description: product.description || '',
                price: parseFloat(variant.price.amount),
                currency: variant.price.currencyCode,
                category: productData.category,
                brand: productData.brand,
                sku: variant.sku || `${product.handle}-${variant.title.toLowerCase().replace(/\s+/g, '-')}`,
                image_url: productData.image_url,
                image_urls: productData.image_urls,
                tags: [...(product.tags || []), `variant:${variant.title}`],
                supplier_name: productData.supplier_name,
                supplier_url: productData.supplier_url,
                availability_status: variant.availableForSale ? 'in_stock' : 'out_of_stock',
                stock_quantity: variant.availableForSale ? 10 : 0,
                user_id: userData.user.id,
                variant_options: variant.selectedOptions.reduce((acc: any, opt: any) => {
                  acc[opt.name] = opt.value;
                  return acc;
                }, {}),
                parent_product_id: insertedProduct.id,
                seo_data: {
                  title: `${product.title} - ${variant.title}`,
                  description: product.description?.substring(0, 160) || '',
                  keywords: product.tags || []
                }
              };

              const { data: insertedVariant, error: variantError } = await supabase
                .from('catalog_products')
                .insert(variantData)
                .select()
                .single();

              if (!variantError) {
                importedVariants.push(insertedVariant);
              }
            } catch (variantError) {
              console.error('Error importing variant:', variantError);
            }
          }
        }

        // Log activity
        await supabase
          .from('activity_logs')
          .insert({
            user_id: userData.user.id,
            action: 'shopify_store_import',
            entity_type: 'product',
            entity_id: insertedProduct.id,
            description: `Imported product "${product.title}" from Shopify store`,
            metadata: {
              store_url: storeUrl,
              external_id: product.id,
              has_variants: product.variants.edges.length > 1,
              variant_count: product.variants.edges.length
            }
          });

      } catch (error) {
        console.error('Error processing product:', error);
        errors++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported: {
          products: importedProducts.length,
          variants: importedVariants.length,
          total: importedProducts.length + importedVariants.length
        },
        errors,
        message: `Successfully imported ${importedProducts.length} products and ${importedVariants.length} variants from Shopify store`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Shopify store import error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
