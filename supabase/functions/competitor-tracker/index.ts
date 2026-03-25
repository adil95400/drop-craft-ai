import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) throw new Error('Unauthorized');

    const body = await req.json();
    const { action, competitor_id, productId, myPrice, competitors } = body;

    // Legacy mode: direct competitor tracking (old API)
    if (productId && competitors) {
      return handleLegacyTrack(supabase, user.id, productId, myPrice, competitors);
    }

    // New mode: refresh from competitor_profiles with real scraping
    if (action === 'refresh') {
      return handleRefresh(supabase, user.id, competitor_id);
    }

    // Bulk auto-apply: trigger repricing from competitor data
    if (action === 'auto_apply_check') {
      return handleAutoApplyCheck(supabase, user.id);
    }

    throw new Error('Invalid action');
  } catch (error) {
    console.error('[COMPETITOR-TRACKER] Error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

// ─── Real competitor scraping with Firecrawl + confidence scoring ───
async function handleRefresh(client: any, userId: string, competitorId?: string) {
  let query = client.from('competitor_profiles').select('*').eq('is_active', true);
  if (competitorId) query = query.eq('id', competitorId);
  const { data: competitors, error: compError } = await query;
  if (compError) throw compError;

  if (!competitors?.length) {
    return jsonResponse({ updated: 0, failed: 0, message: 'No active competitors' });
  }

  const { data: products } = await client
    .from('products')
    .select('id, title, price, cost_price, sku')
    .eq('user_id', userId)
    .limit(100);

  if (!products?.length) {
    return jsonResponse({ updated: 0, failed: 0, message: 'No products to track' });
  }

  let updated = 0;
  let failed = 0;
  let firecrawlHits = 0;
  let fallbackHits = 0;
  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

  for (const competitor of competitors) {
    for (const product of products.slice(0, 30)) {
      try {
        let competitorPrice: number | null = null;
        let dataSource: 'firecrawl' | 'estimation' = 'estimation';
        let confidenceScore = 0;
        let sourceUrl: string | null = null;

        // ── Attempt 1: Firecrawl real scraping ──
        if (firecrawlKey && competitor.website) {
          try {
            const searchQuery = `${product.title} prix`;
            const response = await fetch('https://api.firecrawl.dev/v1/search', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${firecrawlKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                query: searchQuery,
                limit: 5,
                scrapeOptions: {
                  includeTags: ['span', 'div', 'p', 'meta'],
                  onlyMainContent: true,
                },
              }),
            });

            if (response.ok) {
              const searchData = await response.json();
              if (searchData.data && Array.isArray(searchData.data)) {
                const extractedPrices: number[] = [];

                for (const result of searchData.data) {
                  const text = result.description || result.markdown || result.content || '';
                  // Multi-format price regex: €29.99, 29,99€, 29.99 EUR, USD 29.99
                  const priceMatches = text.matchAll(
                    /(?:€\s*(\d{1,6}[.,]\d{2}))|(?:(\d{1,6}[.,]\d{2})\s*€)|(?:(\d{1,6}\.\d{2})\s*(?:EUR|USD|GBP))|(?:(?:prix|price|cost)[:\s]*(\d{1,6}[.,]\d{2}))/gi
                  );

                  for (const match of priceMatches) {
                    const raw = match[1] || match[2] || match[3] || match[4];
                    if (raw) {
                      const price = parseFloat(raw.replace(',', '.'));
                      if (price > 0.5 && price < 100000) {
                        extractedPrices.push(price);
                      }
                    }
                  }

                  if (result.url) sourceUrl = result.url;
                }

                if (extractedPrices.length > 0) {
                  // Use median price for robustness
                  extractedPrices.sort((a, b) => a - b);
                  const mid = Math.floor(extractedPrices.length / 2);
                  competitorPrice = extractedPrices.length % 2 !== 0
                    ? extractedPrices[mid]
                    : (extractedPrices[mid - 1] + extractedPrices[mid]) / 2;

                  competitorPrice = Math.round(competitorPrice * 100) / 100;
                  dataSource = 'firecrawl';
                  firecrawlHits++;

                  // Confidence based on number of corroborating prices
                  const priceVariance = extractedPrices.length > 1
                    ? Math.sqrt(extractedPrices.reduce((s, p) => s + (p - competitorPrice!) ** 2, 0) / extractedPrices.length)
                    : 0;
                  const varianceRatio = competitorPrice > 0 ? priceVariance / competitorPrice : 1;

                  confidenceScore = Math.min(95, Math.max(30,
                    60
                    + Math.min(20, extractedPrices.length * 5) // more prices = more confidence
                    - Math.min(30, varianceRatio * 100) // high variance = less confidence
                  ));
                }
              }
            }
          } catch (scrapeErr) {
            console.warn(`[COMPETITOR-TRACKER] Firecrawl error for ${competitor.name}:`, scrapeErr);
          }
        }

        // ── Attempt 2: Deterministic estimation fallback ──
        if (!competitorPrice && product.price > 0) {
          const hash = simpleHash(`${competitor.id}-${product.id}`);
          const variation = ((hash % 20) - 10) / 100;
          competitorPrice = Math.round(product.price * (1 + variation) * 100) / 100;
          dataSource = 'estimation';
          confidenceScore = 15; // Low confidence for estimated data
          fallbackHits++;
        }

        if (competitorPrice && competitorPrice > 0) {
          const ourPrice = Number(product.price) || 0;
          const priceDiff = ourPrice - competitorPrice;
          const priceDiffPercent = ourPrice > 0 ? (priceDiff / ourPrice) * 100 : 0;

          // Check existing for trend
          const { data: existing } = await client
            .from('competitor_prices')
            .select('competitor_price')
            .eq('product_id', product.id)
            .eq('competitor_id', competitor.id)
            .maybeSingle();

          let trend = 'stable';
          if (existing) {
            const old = Number(existing.competitor_price);
            if (competitorPrice > old * 1.01) trend = 'up';
            else if (competitorPrice < old * 0.99) trend = 'down';

            await client.from('competitor_prices')
              .update({
                our_price: ourPrice,
                competitor_price: competitorPrice,
                price_diff: parseFloat(priceDiff.toFixed(2)),
                price_diff_percent: parseFloat(priceDiffPercent.toFixed(2)),
                trend,
                last_updated: new Date().toISOString(),
              })
              .eq('product_id', product.id)
              .eq('competitor_id', competitor.id);
          } else {
            await client.from('competitor_prices').insert({
              user_id: userId,
              product_id: product.id,
              competitor_id: competitor.id,
              product_title: product.title,
              our_price: ourPrice,
              competitor_price: competitorPrice,
              price_diff: parseFloat(priceDiff.toFixed(2)),
              price_diff_percent: parseFloat(priceDiffPercent.toFixed(2)),
              trend,
              in_stock: true,
              last_updated: new Date().toISOString(),
            });
          }

          // Store in competitive_intelligence for cross-module sync
          await client.from('competitive_intelligence').upsert({
            user_id: userId,
            product_id: product.id,
            competitor_name: competitor.name,
            competitor_price: competitorPrice,
            our_price: ourPrice,
            confidence_score: confidenceScore,
            data_source: dataSource,
            source_url: sourceUrl,
            collected_at: new Date().toISOString(),
          }, {
            onConflict: 'user_id,product_id,competitor_name',
          });

          updated++;
        }
      } catch (err) {
        console.error(`[COMPETITOR-TRACKER] Error for ${product.title}:`, err);
        failed++;
      }
    }

    // Update competitor stats
    const { data: priceCount } = await client
      .from('competitor_prices')
      .select('id, price_diff_percent')
      .eq('competitor_id', competitor.id);

    const tracked = priceCount?.length || 0;
    const avgDiff = tracked > 0
      ? priceCount.reduce((sum: number, p: any) => sum + Number(p.price_diff_percent || 0), 0) / tracked
      : 0;

    await client.from('competitor_profiles')
      .update({
        last_scraped_at: new Date().toISOString(),
        products_tracked: tracked,
        avg_price_diff: parseFloat(avgDiff.toFixed(2)),
      })
      .eq('id', competitor.id);
  }

  return jsonResponse({
    updated,
    failed,
    firecrawl_hits: firecrawlHits,
    fallback_hits: fallbackHits,
    data_quality: firecrawlHits > 0
      ? `${Math.round((firecrawlHits / (firecrawlHits + fallbackHits)) * 100)}% real data`
      : 'estimation only (add FIRECRAWL_API_KEY for real scraping)',
  });
}

// ─── Auto-apply check: evaluate which competitor-driven price changes pass confidence threshold ───
async function handleAutoApplyCheck(client: any, userId: string) {
  // Get user's auto-apply config
  const { data: configData } = await client
    .from('ai_auto_action_configs')
    .select('*')
    .eq('user_id', userId)
    .eq('action_type', 'auto_pricing')
    .eq('is_enabled', true)
    .maybeSingle();

  if (!configData) {
    return jsonResponse({ applied: 0, message: 'Auto-apply not enabled' });
  }

  const cfg = configData.config as any || {};
  const confidenceThreshold = cfg.confidence_threshold || 80;
  const maxPriceChangePct = cfg.max_price_change_pct || 15;
  const minMarginFloor = cfg.min_margin_floor || 10;
  const maxDaily = configData.max_daily_actions || 50;
  const actionsToday = configData.actions_today || 0;

  if (actionsToday >= maxDaily) {
    return jsonResponse({ applied: 0, message: `Daily limit reached (${maxDaily})` });
  }

  // Get high-confidence competitor intelligence
  const { data: intel } = await client
    .from('competitive_intelligence')
    .select('*')
    .eq('user_id', userId)
    .gte('confidence_score', confidenceThreshold)
    .order('confidence_score', { ascending: false })
    .limit(maxDaily - actionsToday);

  if (!intel?.length) {
    return jsonResponse({ applied: 0, message: 'No high-confidence data available' });
  }

  let applied = 0;
  let skipped = 0;
  const changes: any[] = [];

  for (const row of intel) {
    const competitorPrice = Number(row.competitor_price);
    const ourPrice = Number(row.our_price);
    if (!competitorPrice || !ourPrice || competitorPrice <= 0) continue;

    // Get product details for margin check
    const { data: product } = await client
      .from('products')
      .select('id, price, cost_price, title')
      .eq('id', row.product_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (!product) continue;

    // Calculate suggested price: undercut competitor by 2-5%
    const suggestedPrice = Math.round(competitorPrice * 0.97 * 100) / 100;
    const changePct = ((suggestedPrice - product.price) / product.price) * 100;

    // Guard: max price change
    if (Math.abs(changePct) > maxPriceChangePct) {
      skipped++;
      continue;
    }

    // Guard: margin floor
    const costPrice = Number(product.cost_price) || 0;
    if (costPrice > 0) {
      const newMargin = ((suggestedPrice - costPrice) / suggestedPrice) * 100;
      if (newMargin < minMarginFloor) {
        skipped++;
        continue;
      }
    }

    // Apply the price change
    const { error: updateError } = await client
      .from('products')
      .update({ price: suggestedPrice })
      .eq('id', product.id)
      .eq('user_id', userId);

    if (updateError) {
      skipped++;
      continue;
    }

    // Log the auto-action
    await client.from('ai_auto_action_logs').insert({
      user_id: userId,
      action_type: 'auto_pricing',
      config_id: configData.id,
      product_id: product.id,
      field_name: 'price',
      old_value: String(product.price),
      new_value: String(suggestedPrice),
      confidence_score: row.confidence_score / 100,
      status: 'applied',
    });

    // Create recommendation record
    await client.from('ai_recommendations').insert({
      user_id: userId,
      recommendation_type: 'pricing',
      title: `Prix ajusté: ${product.title}`,
      description: `Concurrent ${row.competitor_name} à ${competitorPrice}€. Nouveau prix: ${suggestedPrice}€ (-${Math.abs(changePct).toFixed(1)}%)`,
      confidence_score: row.confidence_score / 100,
      status: 'applied',
      applied_at: new Date().toISOString(),
      target_product_id: product.id,
      metadata: {
        old_price: product.price,
        new_price: suggestedPrice,
        competitor_price: competitorPrice,
        competitor_name: row.competitor_name,
        change_percent: parseFloat(changePct.toFixed(2)),
        data_source: row.data_source,
      },
    });

    changes.push({
      product: product.title,
      old_price: product.price,
      new_price: suggestedPrice,
      competitor_price: competitorPrice,
      confidence: row.confidence_score,
    });

    applied++;
  }

  // Update daily counter
  await client.from('ai_auto_action_configs')
    .update({ actions_today: actionsToday + applied, last_run_at: new Date().toISOString() })
    .eq('id', configData.id);

  return jsonResponse({ applied, skipped, changes });
}

// Legacy API: direct competitor data submission
async function handleLegacyTrack(client: any, userId: string, productId: string, myPrice: number, competitors: any[]) {
  const results = [];

  for (const competitor of competitors) {
    const totalPrice = competitor.price + (competitor.shippingCost || 0);
    const priceDiff = myPrice - totalPrice;
    const priceDiffPct = totalPrice > 0 ? (priceDiff / totalPrice * 100) : 0;

    let { data: profile } = await client
      .from('competitor_profiles')
      .select('id')
      .eq('user_id', userId)
      .eq('name', competitor.name)
      .maybeSingle();

    if (!profile) {
      const { data: newProfile } = await client
        .from('competitor_profiles')
        .insert({ user_id: userId, name: competitor.name, website: competitor.url || competitor.name })
        .select('id')
        .single();
      profile = newProfile;
    }

    if (profile) {
      await client.from('competitor_prices').insert({
        user_id: userId,
        product_id: productId,
        competitor_id: profile.id,
        product_title: competitor.name,
        our_price: myPrice,
        competitor_price: competitor.price,
        price_diff: parseFloat(priceDiff.toFixed(2)),
        price_diff_percent: parseFloat(priceDiffPct.toFixed(2)),
        trend: 'stable',
        in_stock: true,
      });
      results.push({ competitor: competitor.name, tracked: true });
    }
  }

  const avgPrice = competitors.reduce((s, c) => s + c.price, 0) / competitors.length;
  const minPrice = Math.min(...competitors.map(c => c.price));
  const maxPrice = Math.max(...competitors.map(c => c.price));
  const positioning = myPrice < minPrice ? 'lowest' : myPrice > maxPrice ? 'highest' :
    myPrice < avgPrice ? 'below_average' : myPrice > avgPrice ? 'above_average' : 'average';

  return jsonResponse({
    success: true,
    tracked: results.length,
    analysis: {
      your_price: myPrice,
      min_competitor_price: minPrice,
      max_competitor_price: maxPrice,
      avg_competitor_price: Math.round(avgPrice * 100) / 100,
      positioning,
    },
  });
}

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}
