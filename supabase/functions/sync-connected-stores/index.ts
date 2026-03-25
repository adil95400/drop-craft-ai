/**
 * sync-connected-stores — Fetches products from connected stores (Shopify, etc.)
 * and upserts them into the canonical `products` table.
 * Uses the Shopify Storefront API (public GraphQL, no admin token needed).
 */
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const STOREFRONT_QUERY = `
  query GetProducts($first: Int!, $after: String) {
    products(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges {
        node {
          id
          title
          description
          handle
          productType
          tags
          vendor
          priceRange {
            minVariantPrice { amount currencyCode }
          }
          images(first: 5) {
            edges { node { url altText } }
          }
          variants(first: 10) {
            edges {
              node {
                id title sku
                price { amount currencyCode }
                availableForSale
                selectedOptions { name value }
              }
            }
          }
        }
      }
    }
  }
`;

async function fetchShopifyStorefrontProducts(storeDomain: string): Promise<any[]> {
  // Normalise domain
  let domain = storeDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  if (!domain.includes('.')) domain = `${domain}.myshopify.com`;

  const apiUrl = `https://${domain}/api/2025-01/graphql.json`;
  const allProducts: any[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  console.log(`[sync] Fetching from Storefront API: ${apiUrl}`);

  while (hasNextPage) {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: STOREFRONT_QUERY,
        variables: { first: 50, after: cursor },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Storefront API error ${response.status}: ${text.substring(0, 200)}`);
    }

    const data = await response.json();
    if (data.errors) {
      throw new Error(`GraphQL errors: ${JSON.stringify(data.errors).substring(0, 300)}`);
    }

    const products = data.data?.products;
    if (!products) throw new Error('No products data returned');

    allProducts.push(...products.edges);
    hasNextPage = products.pageInfo.hasNextPage;
    cursor = products.pageInfo.endCursor;

    console.log(`[sync] Fetched ${products.edges.length} products, total: ${allProducts.length}`);
  }

  return allProducts;
}

function mapShopifyToProduct(node: any, userId: string, storeDomain: string) {
  const mainVariant = node.variants?.edges?.[0]?.node;
  const price = parseFloat(mainVariant?.price?.amount || node.priceRange?.minVariantPrice?.amount || '0');
  const currency = mainVariant?.price?.currencyCode || node.priceRange?.minVariantPrice?.currencyCode || 'EUR';
  const imageUrls = (node.images?.edges || []).map((e: any) => e.node.url).filter(Boolean);

  return {
    user_id: userId,
    title: node.title,
    name: node.title,
    description: node.description || '',
    sku: mainVariant?.sku || node.handle || '',
    price,
    currency,
    category: node.productType || null,
    brand: node.vendor || storeDomain.replace('.myshopify.com', ''),
    supplier: storeDomain,
    supplier_name: storeDomain,
    supplier_url: `https://${storeDomain}/products/${node.handle}`,
    supplier_product_id: node.id,
    shopify_product_id: node.id,
    status: 'draft',
    stock_quantity: mainVariant?.availableForSale ? 10 : 0,
    image_url: imageUrls[0] || null,
    primary_image_url: imageUrls[0] || null,
    images: JSON.stringify(imageUrls),
    tags: node.tags || [],
    source_type: 'shopify',
    source_url: `https://${storeDomain}/products/${node.handle}`,
    seo_title: node.title?.substring(0, 60) || null,
    seo_description: node.description?.substring(0, 160) || null,
    vendor: node.vendor || null,
    product_type: node.productType || null,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Auth
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) {
      return new Response(JSON.stringify({ success: false, error: 'Non authentifié' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = userData.user.id;

    // Get connected integrations
    const { data: integrations, error: intError } = await supabase
      .from('integrations')
      .select('id, platform, store_url, store_id, connection_status, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .eq('connection_status', 'connected');

    if (intError) throw new Error(`DB error: ${intError.message}`);
    if (!integrations?.length) {
      return new Response(JSON.stringify({ success: false, error: 'Aucun magasin connecté' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[sync] Found ${integrations.length} connected store(s) for user ${userId.substring(0, 8)}`);

    let totalImported = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    const results: any[] = [];

    for (const integration of integrations) {
      const platform = integration.platform?.toLowerCase();
      const storeDomain = integration.store_url || integration.store_id || '';

      if (!storeDomain) {
        results.push({ platform, error: 'No store URL configured' });
        totalErrors++;
        continue;
      }

      try {
        let products: any[] = [];

        if (platform === 'shopify') {
          const rawProducts = await fetchShopifyStorefrontProducts(storeDomain);
          products = rawProducts.map(({ node }: any) => mapShopifyToProduct(node, userId, storeDomain));
        } else {
          results.push({ platform, error: `Platform ${platform} not yet supported for auto-sync` });
          continue;
        }

        console.log(`[sync] ${platform}: ${products.length} products fetched, upserting...`);

        // Get existing products for this store to avoid duplicates
        const { data: existing } = await supabase
          .from('products')
          .select('id, shopify_product_id, sku')
          .eq('user_id', userId)
          .eq('source_type', 'shopify');

        const existingByExtId = new Map((existing || []).map((p: any) => [p.shopify_product_id, p.id]));
        const existingBySku = new Map((existing || []).map((p: any) => [p.sku, p.id]));

        let imported = 0;
        let skipped = 0;
        let errors = 0;

        for (const product of products) {
          try {
            const existingId = existingByExtId.get(product.shopify_product_id) || 
                               (product.sku ? existingBySku.get(product.sku) : null);

            if (existingId) {
              // Update existing
              const { error: updateError } = await supabase
                .from('products')
                .update({
                  title: product.title,
                  name: product.name,
                  price: product.price,
                  stock_quantity: product.stock_quantity,
                  image_url: product.image_url,
                  primary_image_url: product.primary_image_url,
                  tags: product.tags,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', existingId);

              if (updateError) {
                console.error(`[sync] Update error:`, updateError.message);
                errors++;
              } else {
                skipped++;
              }
            } else {
              // Insert new
              const { error: insertError } = await supabase
                .from('products')
                .insert(product);

              if (insertError) {
                console.error(`[sync] Insert error for "${product.title}":`, insertError.message);
                errors++;
              } else {
                imported++;
              }
            }
          } catch (e) {
            console.error(`[sync] Product error:`, (e as Error).message);
            errors++;
          }
        }

        totalImported += imported;
        totalSkipped += skipped;
        totalErrors += errors;

        results.push({
          platform,
          store: storeDomain,
          fetched: products.length,
          imported,
          updated: skipped,
          errors,
        });

        // Update last_sync_at
        await supabase
          .from('integrations')
          .update({ last_sync_at: new Date().toISOString() })
          .eq('id', integration.id);

      } catch (storeError) {
        console.error(`[sync] Store ${storeDomain} error:`, (storeError as Error).message);
        results.push({ platform, store: storeDomain, error: (storeError as Error).message });
        totalErrors++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total_imported: totalImported,
      total_updated: totalSkipped,
      total_errors: totalErrors,
      stores: results,
      message: `${totalImported} nouveaux produits importés, ${totalSkipped} mis à jour`,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[sync-connected-stores] Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: (error as Error).message,
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
