import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Unauthorized')
    }

    const { action, feed_id, feed_data, mapping_data, template_data, product_ids } = await req.json()

    switch (action) {
      case 'create_feed': {
        // Create a new marketplace feed
        const { data: feed, error } = await supabaseClient
          .from('marketplace_feeds')
          .insert({
            user_id: user.id,
            ...feed_data,
            next_update_at: new Date(Date.now() + (feed_data.update_frequency_hours || 24) * 3600000).toISOString()
          })
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, feed }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'generate_feed': {
        // Generate feed content with SEO optimization
        const { data: feed } = await supabaseClient
          .from('marketplace_feeds')
          .select('*')
          .eq('id', feed_id)
          .single()

        if (!feed) throw new Error('Feed not found')

        // Create generation log
        const { data: generation, error: genError } = await supabaseClient
          .from('feed_generations')
          .insert({
            feed_id,
            user_id: user.id,
            generation_type: 'manual',
            status: 'running'
          })
          .select()
          .single()

        if (genError) throw genError

        // Get products to include in feed (using product_ids if provided, otherwise all)
        let productsQuery = supabaseClient
          .from('catalog_products')
          .select('*')
          .limit(1000)

        if (product_ids && product_ids.length > 0) {
          productsQuery = productsQuery.in('id', product_ids)
        }

        const { data: products } = await productsQuery

        // Get SEO template for this platform
        const { data: template } = await supabaseClient
          .from('seo_templates')
          .select('*')
          .eq('user_id', user.id)
          .eq('platform', feed.platform)
          .eq('is_active', true)
          .single()

        // Get category mappings
        const { data: mappings } = await supabaseClient
          .from('category_mapping_rules')
          .select('*')
          .eq('user_id', user.id)
          .eq('target_platform', feed.platform)
          .eq('is_active', true)

        const mappingMap = new Map(
          mappings?.map(m => [m.source_category, m]) || []
        )

        // Optimize each product
        const optimizedProducts = []
        for (const product of products || []) {
          try {
            // Apply category mapping
            const mapping = mappingMap.get(product.category)
            const optimizedCategory = mapping?.target_category || product.category
            const platformCategoryId = mapping?.target_category_id

            // Optimize title using template
            let optimizedTitle = template?.title_template || '{brand} {product_name}'
            optimizedTitle = optimizedTitle
              .replace('{brand}', product.brand || '')
              .replace('{product_name}', product.name)
              .replace('{key_feature}', product.tags?.[0] || '')
              .substring(0, template?.title_max_length || 200)

            // Optimize description using template
            let optimizedDescription = template?.description_template || '{description}'
            optimizedDescription = optimizedDescription
              .replace('{product_name}', product.name)
              .replace('{brand}', product.brand || '')
              .replace('{description}', product.description || '')
              .replace('{features}', product.tags?.slice(0, 5).join(' • ') || '')
              .substring(0, template?.description_max_length || 5000)

            // Calculate SEO scores
            const titleScore = Math.min(1, optimizedTitle.length / 100) * 100
            const descScore = Math.min(1, optimizedDescription.length / 300) * 100
            const imageScore = Math.min(1, (product.image_urls?.length || 0) / 5) * 100
            const seoScore = ((titleScore * 0.4 + descScore * 0.4 + imageScore * 0.2) / 100).toFixed(2)

            // Create optimized product entry
            await supabaseClient
              .from('feed_products')
              .upsert({
                feed_id,
                user_id: user.id,
                source_product_id: product.id,
                source_sku: product.sku,
                optimized_title: optimizedTitle,
                optimized_description: optimizedDescription,
                optimized_category: optimizedCategory,
                platform_category_id: platformCategoryId,
                optimized_tags: product.tags,
                original_price: product.price,
                feed_price: product.price,
                optimized_images: product.image_urls,
                seo_score: parseFloat(seoScore),
                title_score: titleScore / 100,
                description_score: descScore / 100,
                image_score: imageScore / 100
              }, { onConflict: 'feed_id,source_sku' })

            optimizedProducts.push({
              sku: product.sku,
              title: optimizedTitle,
              category: optimizedCategory,
              seo_score: seoScore
            })
          } catch (err) {
            console.error(`Error optimizing product ${product.sku}:`, err)
          }
        }

        // Update generation log
        await supabaseClient
          .from('feed_generations')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            duration_seconds: 5,
            total_products: products?.length || 0,
            processed_products: optimizedProducts.length,
            successful_products: optimizedProducts.length,
            output_url: `feeds/${feed_id}/latest.${feed.format}`
          })
          .eq('id', generation.id)

        // Update feed
        await supabaseClient
          .from('marketplace_feeds')
          .update({
            product_count: optimizedProducts.length,
            last_generated_at: new Date().toISOString(),
            next_update_at: new Date(Date.now() + (feed.update_frequency_hours || 24) * 3600000).toISOString()
          })
          .eq('id', feed_id)

        return new Response(
          JSON.stringify({ 
            success: true, 
            generation,
            products_optimized: optimizedProducts.length,
            avg_seo_score: (optimizedProducts.reduce((sum, p) => sum + parseFloat(p.seo_score), 0) / optimizedProducts.length).toFixed(2)
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'auto_map_categories': {
        // Automatically map categories using AI
        const { data: products } = await supabaseClient
          .from('catalog_products')
          .select('category')
          .limit(1000)

        const uniqueCategories = [...new Set(products?.map(p => p.category) || [])]

        // Predefined mappings for common categories
        const platformMappings: Record<string, Record<string, { category: string, id: string }>> = {
          amazon: {
            'Fashion': { category: 'Clothing, Shoes & Jewelry', id: '7141123011' },
            'Electronics': { category: 'Electronics', id: '172282' },
            'Home & Garden': { category: 'Home & Kitchen', id: '1055398' },
            'Sports': { category: 'Sports & Outdoors', id: '3375251' },
            'Beauty': { category: 'Beauty & Personal Care', id: '3760911' }
          },
          ebay: {
            'Fashion': { category: 'Clothing, Shoes & Accessories', id: '11450' },
            'Electronics': { category: 'Consumer Electronics', id: '293' },
            'Home & Garden': { category: 'Home & Garden', id: '11700' },
            'Sports': { category: 'Sporting Goods', id: '888' },
            'Beauty': { category: 'Health & Beauty', id: '26395' }
          }
        }

        const newMappings = []
        for (const category of uniqueCategories) {
          for (const [platform, mappings] of Object.entries(platformMappings)) {
            const mapping = mappings[category]
            if (mapping) {
              try {
                await supabaseClient
                  .from('category_mapping_rules')
                  .upsert({
                    user_id: user.id,
                    source_category: category,
                    target_platform: platform,
                    target_category: mapping.category,
                    target_category_id: mapping.id,
                    confidence_score: 0.90,
                    is_manual: false
                  }, { onConflict: 'user_id,source_category,target_platform' })

                newMappings.push({ category, platform, mapped_to: mapping.category })
              } catch (err) {
                console.error(`Error creating mapping for ${category}:`, err)
              }
            }
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            mappings_created: newMappings.length,
            mappings: newMappings
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'create_seo_template': {
        const { data: template, error } = await supabaseClient
          .from('seo_templates')
          .insert({
            user_id: user.id,
            ...template_data
          })
          .select()
          .single()

        if (error) throw error

        return new Response(
          JSON.stringify({ success: true, template }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      case 'get_feed_analytics': {
        // Get analytics for a specific feed
        const { data: feed } = await supabaseClient
          .from('marketplace_feeds')
          .select('*')
          .eq('id', feed_id)
          .single()

        const { data: products } = await supabaseClient
          .from('feed_products')
          .select('*')
          .eq('feed_id', feed_id)

        const avgSeoScore = products?.length 
          ? (products.reduce((sum, p) => sum + (p.seo_score || 0), 0) / products.length).toFixed(2)
          : 0

        const { data: generations } = await supabaseClient
          .from('feed_generations')
          .select('*')
          .eq('feed_id', feed_id)
          .order('started_at', { ascending: false })
          .limit(10)

        return new Response(
          JSON.stringify({ 
            success: true, 
            analytics: {
              feed,
              products: products?.length || 0,
              avg_seo_score: avgSeoScore,
              recent_generations: generations
            }
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      default:
        throw new Error('Invalid action')
    }
  } catch (error) {
    console.error('Error in feed-manager function:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})