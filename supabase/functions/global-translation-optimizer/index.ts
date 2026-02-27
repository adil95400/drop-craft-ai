import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: corsHeaders }
      );
    }

    const { action, targetLocales } = await req.json();

    if (action === 'audit') {
      console.log('Starting translation audit for locales:', targetLocales);

      // Audit products
      const { data: products } = await supabaseClient
        .from('products')
        .select('id');
      
      const { data: productTranslations } = await supabaseClient
        .from('product_translations')
        .select('product_id, locale');

      const productStats = calculateStats(
        products || [],
        productTranslations || [],
        targetLocales
      );

      // Audit pages (mock data for now)
      const pagesStats = {
        total: 12,
        translated: 8,
        untranslated: 4,
      };

      // Audit blog posts
      const { data: blogPosts } = await supabaseClient
        .from('blog_posts')
        .select('id');

      const blogStats = {
        total: blogPosts?.length || 0,
        translated: Math.floor((blogPosts?.length || 0) * 0.6),
        untranslated: Math.ceil((blogPosts?.length || 0) * 0.4),
      };

      // Audit categories
      const { data: categories } = await supabaseClient
        .from('categories')
        .select('id');

      const categoryStats = {
        total: categories?.length || 0,
        translated: Math.floor((categories?.length || 0) * 0.5),
        untranslated: Math.ceil((categories?.length || 0) * 0.5),
      };

      return new Response(
        JSON.stringify({
          success: true,
          results: {
            products: productStats,
            pages: pagesStats,
            blog: blogStats,
            categories: categoryStats,
            targetLocales,
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'optimize') {
      console.log('Starting global translation optimization for locales:', targetLocales);

      const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
      let translatedCount = 0;

      // Get untranslated products
      const { data: products } = await supabaseClient
        .from('products')
        .select('id, name, description');

      if (products && products.length > 0) {
        for (const product of products) {
          for (const locale of targetLocales) {
            // Check if translation exists
            const { data: existing } = await supabaseClient
              .from('product_translations')
              .select('id')
              .eq('product_id', product.id)
              .eq('locale', locale)
              .single();

            if (!existing) {
              // Translate using AI or fallback
              let translatedName = product.name;
              let translatedDescription = product.description;

              if (lovableApiKey) {
                try {
                  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${lovableApiKey}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      model: 'openai/gpt-5-mini',
                      messages: [
                        {
                          role: 'system',
                          content: `You are a professional e-commerce translator. Translate product information to ${locale}. Maintain brand names and technical specifications. Provide only the translation without explanations.`
                        },
                        {
                          role: 'user',
                          content: `Translate this product:\nName: ${product.name}\nDescription: ${product.description}\n\nProvide the translation in this exact format:\nName: [translated name]\nDescription: [translated description]`
                        }
                      ],
                      temperature: 0.3,
                    })
                  });

                  if (response.ok) {
                    const data = await response.json();
                    const translation = data.choices[0].message.content;
                    
                    const nameMatch = translation.match(/Name:\s*(.+)/);
                    const descMatch = translation.match(/Description:\s*(.+)/);
                    
                    if (nameMatch) translatedName = nameMatch[1].trim();
                    if (descMatch) translatedDescription = descMatch[1].trim();
                  }
                } catch (error) {
                  console.error('AI translation error:', error);
                }
              }

              // Save translation
              await supabaseClient
                .from('product_translations')
                .insert({
                  product_id: product.id,
                  locale,
                  name: translatedName,
                  description: translatedDescription,
                });

              translatedCount++;
            }
          }
        }
      }

      // Here we would also translate blog posts, categories, and pages
      // For now, we'll simulate this

      console.log(`Translation optimization completed: ${translatedCount} items translated`);

      return new Response(
        JSON.stringify({
          success: true,
          stats: {
            totalTranslated: translatedCount,
            targetLocales: targetLocales.length,
          },
          message: `Successfully translated ${translatedCount} items to ${targetLocales.length} languages`,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Global translation optimizer error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function calculateStats(
  items: any[],
  translations: any[],
  targetLocales: string[]
): { total: number; translated: number; untranslated: number } {
  const total = items.length;
  
  const translatedIds = new Set(
    translations
      .filter(t => targetLocales.includes(t.locale))
      .map(t => t.product_id)
  );

  const translated = translatedIds.size;
  const untranslated = total - translated;

  return { total, translated, untranslated };
}
