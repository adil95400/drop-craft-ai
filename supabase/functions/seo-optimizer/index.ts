import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from JWT
    const jwt = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt);
    
    if (userError || !user) {
      throw new Error('Invalid auth token');
    }

    console.log(`SEO Optimizer action: ${action} for user: ${user.id}`);

    switch (action) {
      case 'analyze_url':
        return await analyzeURL(user.id, data);
      
      case 'generate_content':
        return await generateSEOContent(user.id, data);
      
      case 'keyword_research':
        return await keywordResearch(user.id, data);
      
      case 'competitor_analysis':
        return await competitorAnalysis(user.id, data);
      
      case 'generate_schema':
        return await generateSchema(user.id, data);
      
      case 'track_rankings':
        return await trackRankings(user.id, data);
      
      case 'get_analytics':
        return await getSEOAnalytics(user.id);
      
      default:
        throw new Error(`Unknown action: ${action}`);
    }

  } catch (error) {
    console.error('Error in SEO optimizer function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function analyzeURL(userId: string, data: any) {
  const { url } = data;
  
  if (!url) {
    throw new Error('URL is required');
  }

  console.log(`Analyzing URL: ${url}`);

  try {
    // Fetch page content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ShopoptiBot/1.0 SEO Analyzer'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    
    // Extract basic SEO elements
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    const metaDescMatch = html.match(/<meta[^>]*name=['"](description|Description)['"[^>]*content=['"]([^'"]+)['"]/i);
    const metaDescription = metaDescMatch ? metaDescMatch[2].trim() : '';
    
    const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const h1Tag = h1Match ? h1Match[1].trim() : '';
    
    // Count various elements
    const imgCount = (html.match(/<img[^>]*>/gi) || []).length;
    const imgAltCount = (html.match(/<img[^>]*alt=['"][^'"]*['"][^>]*>/gi) || []).length;
    const linkCount = (html.match(/<a[^>]*href=[^>]*>/gi) || []).length;
    const internalLinkCount = (html.match(new RegExp(`<a[^>]*href=['"][^'"]*${new URL(url).hostname}[^'"]*['"][^>]*>`, 'gi')) || []).length;
    
    // Simple scoring algorithm
    let seoScore = 0;
    const issues = [];
    const recommendations = [];
    
    // Title analysis
    if (title) {
      seoScore += 20;
      if (title.length > 60) {
        issues.push('Title too long (over 60 characters)');
        recommendations.push('Shorten title to under 60 characters');
      } else if (title.length < 30) {
        issues.push('Title too short (under 30 characters)');
        recommendations.push('Expand title to 30-60 characters');
      }
    } else {
      issues.push('Missing title tag');
      recommendations.push('Add a descriptive title tag');
    }
    
    // Meta description analysis
    if (metaDescription) {
      seoScore += 15;
      if (metaDescription.length > 160) {
        issues.push('Meta description too long (over 160 characters)');
        recommendations.push('Shorten meta description to under 160 characters');
      } else if (metaDescription.length < 120) {
        issues.push('Meta description too short (under 120 characters)');
        recommendations.push('Expand meta description to 120-160 characters');
      }
    } else {
      issues.push('Missing meta description');
      recommendations.push('Add a compelling meta description');
    }
    
    // H1 analysis
    if (h1Tag) {
      seoScore += 10;
    } else {
      issues.push('Missing H1 tag');
      recommendations.push('Add an H1 tag with your main keyword');
    }
    
    // Image optimization
    if (imgCount > 0) {
      const altPercentage = (imgAltCount / imgCount) * 100;
      if (altPercentage > 80) {
        seoScore += 15;
      } else {
        issues.push(`Only ${Math.round(altPercentage)}% of images have alt text`);
        recommendations.push('Add alt text to all images');
      }
    }
    
    // Internal linking
    if (internalLinkCount > 0) {
      seoScore += 10;
    } else {
      issues.push('No internal links found');
      recommendations.push('Add internal links to related content');
    }
    
    // Performance simulation (would use actual tools like Lighthouse in production)
    const performanceScore = 65 + Math.floor(Math.random() * 30);
    const accessibilityScore = 70 + Math.floor(Math.random() * 25);
    const bestPracticesScore = 75 + Math.floor(Math.random() * 20);
    
    seoScore = Math.min(seoScore + 40, 100); // Add base score and cap at 100
    
    const domain = new URL(url).hostname;
    
    // Save analysis to database
    const { data: analysis, error } = await supabase
      .from('seo_analyses')
      .insert({
        user_id: userId,
        url,
        domain,
        title,
        meta_description: metaDescription,
        h1_tag: h1Tag,
        performance_score: performanceScore,
        seo_score: seoScore,
        accessibility_score: accessibilityScore,
        best_practices_score: bestPracticesScore,
        issues,
        recommendations,
        technical_analysis: {
          images_total: imgCount,
          images_with_alt: imgAltCount,
          internal_links: internalLinkCount,
          external_links: linkCount - internalLinkCount
        }
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving analysis:', error);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        analysis: {
          url,
          title,
          meta_description: metaDescription,
          h1_tag: h1Tag,
          seo_score: seoScore,
          performance_score: performanceScore,
          accessibility_score: accessibilityScore,
          best_practices_score: bestPracticesScore,
          issues,
          recommendations,
          technical_data: {
            images_total: imgCount,
            images_with_alt: imgAltCount,
            internal_links: internalLinkCount,
            external_links: linkCount - internalLinkCount
          }
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error analyzing URL:', error);
    throw new Error(`Failed to analyze URL: ${error.message}`);
  }
}

async function generateSEOContent(userId: string, data: any) {
  if (!openAIApiKey) {
    throw new Error('OpenAI API key not configured');
  }

  const { keyword, content_type = 'all', language = 'fr' } = data;

  if (!keyword) {
    throw new Error('Keyword is required');
  }

  console.log(`Generating SEO content for keyword: ${keyword}`);

  const prompt = `Create SEO-optimized content for the keyword "${keyword}" in ${language}:

1. SEO Title (50-60 characters, include keyword naturally)
2. Meta Description (120-160 characters, compelling with keyword)
3. Article Content (500+ words, informative and engaging)
4. H2/H3 headings suggestions
5. Related keywords to include
6. Call-to-action suggestions

Focus on French e-commerce context and make it conversion-oriented.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-2025-08-07',
      messages: [
        { 
          role: 'system', 
          content: 'You are an expert SEO content creator specializing in French e-commerce. Create high-quality, optimized content that ranks well and converts visitors into customers.' 
        },
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: 1500,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
  }

  const aiResult = await response.json();
  const generatedContent = aiResult.choices[0].message.content;

  // Extract title and meta description from generated content
  const titleMatch = generatedContent.match(/(?:SEO Title|Titre SEO)[:\s]*(.+?)(?:\n|$)/i);
  const title = titleMatch ? titleMatch[1].trim().replace(/['"]/g, '') : '';
  
  const metaMatch = generatedContent.match(/(?:Meta Description|Description Meta)[:\s]*(.+?)(?:\n|$)/i);
  const metaDescription = metaMatch ? metaMatch[1].trim().replace(/['"]/g, '') : '';

  // Calculate optimization score based on keyword usage and content quality
  const keywordDensity = (generatedContent.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
  const contentLength = generatedContent.length;
  const optimizationScore = Math.min(90, 50 + (keywordDensity * 5) + (contentLength > 1000 ? 20 : 10));

  // Save generated content to database
  const { data: savedContent, error } = await supabase
    .from('generated_content')
    .insert({
      user_id: userId,
      content_type: 'article',
      target_keyword: keyword,
      generated_title: title,
      generated_meta_description: metaDescription,
      generated_content: generatedContent,
      optimization_score: optimizationScore,
      language,
      ai_model: 'gpt-5-2025-08-07',
      tokens_used: aiResult.usage?.total_tokens || 0
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving generated content:', error);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      content: {
        title,
        meta_description: metaDescription,
        full_content: generatedContent,
        optimization_score: optimizationScore,
        keyword_density: keywordDensity,
        content_length: contentLength,
        content_id: savedContent?.id
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function keywordResearch(userId: string, data: any) {
  const { seed_keyword, market = 'fr' } = data;

  if (!seed_keyword) {
    throw new Error('Seed keyword is required');
  }

  console.log(`Performing keyword research for: ${seed_keyword}`);

  // Simulate keyword research data (in production, would use tools like SEMrush API, Ahrefs API, or Google Keyword Planner)
  const mockKeywords = [
    {
      keyword: seed_keyword,
      search_volume: 8900,
      difficulty: 65,
      cpc: 1.45,
      competition: 'medium',
      trend: 'stable'
    },
    {
      keyword: `${seed_keyword} pas cher`,
      search_volume: 3200,
      difficulty: 45,
      cpc: 0.95,
      competition: 'low',
      trend: 'rising'
    },
    {
      keyword: `${seed_keyword} avis`,
      search_volume: 2100,
      difficulty: 40,
      cpc: 0.80,
      competition: 'low',
      trend: 'stable'
    },
    {
      keyword: `meilleur ${seed_keyword}`,
      search_volume: 1800,
      difficulty: 55,
      cpc: 1.20,
      competition: 'medium',
      trend: 'rising'
    },
    {
      keyword: `${seed_keyword} 2024`,
      search_volume: 1500,
      difficulty: 35,
      cpc: 0.70,
      competition: 'low',
      trend: 'seasonal'
    }
  ];

  // Save keywords to database
  const keywordsToSave = mockKeywords.map(kw => ({
    user_id: userId,
    keyword: kw.keyword,
    search_volume: kw.search_volume,
    difficulty_score: kw.difficulty,
    cpc: kw.cpc,
    competition: kw.competition,
    trends: [{ period: '2024', trend: kw.trend }]
  }));

  const { data: savedKeywords, error } = await supabase
    .from('seo_keywords')
    .upsert(keywordsToSave, { onConflict: 'user_id,keyword' })
    .select();

  if (error) {
    console.error('Error saving keywords:', error);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      keywords: mockKeywords,
      total_found: mockKeywords.length,
      avg_search_volume: mockKeywords.reduce((sum, kw) => sum + kw.search_volume, 0) / mockKeywords.length
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function competitorAnalysis(userId: string, data: any) {
  const { domain, keywords = [] } = data;

  if (!domain) {
    throw new Error('Domain is required');
  }

  console.log(`Analyzing competitors for domain: ${domain}`);

  // Simulate competitor analysis (in production, would use tools like SEMrush, Ahrefs)
  const competitorData = {
    domain,
    analysis_date: new Date().toISOString(),
    organic_keywords: 1250,
    organic_traffic: 15600,
    paid_keywords: 45,
    paid_traffic: 890,
    backlinks: 2340,
    domain_authority: 42,
    top_competitors: [
      {
        domain: 'competitor1.com',
        overlap_keywords: 340,
        traffic_share: 0.15,
        authority_score: 65
      },
      {
        domain: 'competitor2.fr',
        overlap_keywords: 280,
        traffic_share: 0.12,
        authority_score: 58
      }
    ],
    opportunities: [
      {
        keyword: 'coque telephone samsung',
        competitor_position: 3,
        our_position: null,
        opportunity_score: 85,
        search_volume: 4500
      },
      {
        keyword: 'protection ecran iphone',
        competitor_position: 5,
        our_position: 15,
        opportunity_score: 72,
        search_volume: 2300
      }
    ]
  };

  return new Response(
    JSON.stringify({ 
      success: true, 
      analysis: competitorData
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function generateSchema(userId: string, data: any) {
  const { page_type, product_data, business_data } = data;

  console.log(`Generating schema markup for: ${page_type}`);

  let schema = {};

  switch (page_type) {
    case 'product':
      schema = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product_data?.name || "Produit",
        "description": product_data?.description || "Description du produit",
        "sku": product_data?.sku || "SKU123",
        "image": product_data?.images || [],
        "brand": {
          "@type": "Brand",
          "name": product_data?.brand || "Marque"
        },
        "offers": {
          "@type": "Offer",
          "priceCurrency": "EUR",
          "price": product_data?.price || "0.00",
          "availability": "https://schema.org/InStock",
          "seller": {
            "@type": "Organization",
            "name": business_data?.name || "Nom de l'entreprise"
          }
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": product_data?.rating || "4.5",
          "bestRating": "5",
          "worstRating": "1",
          "ratingCount": product_data?.review_count || "10"
        }
      };
      break;

    case 'organization':
      schema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": business_data?.name || "Nom de l'entreprise",
        "url": business_data?.website || "https://example.com",
        "logo": business_data?.logo || "https://example.com/logo.png",
        "description": business_data?.description || "Description de l'entreprise",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": business_data?.address?.street || "",
          "addressLocality": business_data?.address?.city || "",
          "postalCode": business_data?.address?.postal_code || "",
          "addressCountry": business_data?.address?.country || "FR"
        },
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": business_data?.phone || "",
          "contactType": "Customer Service",
          "availableLanguage": ["French"]
        }
      };
      break;

    case 'faq':
      schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": (data.faqs || []).map((faq: any) => ({
          "@type": "Question",
          "name": faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
          }
        }))
      };
      break;

    default:
      throw new Error(`Unsupported schema type: ${page_type}`);
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      schema: JSON.stringify(schema, null, 2),
      schema_type: page_type
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function trackRankings(userId: string, data: any) {
  const { keywords = [], domain } = data;

  console.log(`Tracking rankings for ${keywords.length} keywords`);

  // Simulate ranking tracking (in production, would use actual search APIs)
  const rankingData = keywords.map((keyword: string) => ({
    keyword,
    domain,
    position: Math.floor(Math.random() * 100) + 1,
    previous_position: Math.floor(Math.random() * 100) + 1,
    change: Math.floor(Math.random() * 20) - 10,
    search_volume: Math.floor(Math.random() * 10000) + 100,
    url: `${domain}/products/${keyword.replace(/\s+/g, '-')}`,
    last_updated: new Date().toISOString()
  }));

  // Update keywords in database with current positions
  for (const ranking of rankingData) {
    await supabase
      .from('seo_keywords')
      .upsert({
        user_id: userId,
        keyword: ranking.keyword,
        current_position: ranking.position,
        target_url: ranking.url,
        tracking_active: true
      }, { onConflict: 'user_id,keyword' });
  }

  return new Response(
    JSON.stringify({ 
      success: true, 
      rankings: rankingData,
      summary: {
        total_keywords: rankingData.length,
        avg_position: rankingData.reduce((sum, r) => sum + r.position, 0) / rankingData.length,
        improved: rankingData.filter(r => r.change > 0).length,
        declined: rankingData.filter(r => r.change < 0).length,
        stable: rankingData.filter(r => r.change === 0).length
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function getSEOAnalytics(userId: string) {
  // Get SEO analyses
  const { data: analyses, error: analysesError } = await supabase
    .from('seo_analyses')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (analysesError) {
    console.error('Error fetching analyses:', analysesError);
    throw analysesError;
  }

  // Get tracked keywords
  const { data: keywords, error: keywordsError } = await supabase
    .from('seo_keywords')
    .select('*')
    .eq('user_id', userId)
    .eq('tracking_active', true);

  if (keywordsError) {
    console.error('Error fetching keywords:', keywordsError);
    throw keywordsError;
  }

  // Get generated content
  const { data: content, error: contentError } = await supabase
    .from('generated_content')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (contentError) {
    console.error('Error fetching content:', contentError);
    throw contentError;
  }

  const analytics = {
    analyses: {
      total: analyses.length,
      avg_seo_score: analyses.reduce((sum, a) => sum + (a.seo_score || 0), 0) / analyses.length || 0,
      avg_performance_score: analyses.reduce((sum, a) => sum + (a.performance_score || 0), 0) / analyses.length || 0,
      recent_analyses: analyses
    },
    keywords: {
      total_tracked: keywords.length,
      avg_position: keywords.reduce((sum, k) => sum + (k.current_position || 100), 0) / keywords.length || 0,
      top_10_count: keywords.filter(k => (k.current_position || 100) <= 10).length,
      total_search_volume: keywords.reduce((sum, k) => sum + (k.search_volume || 0), 0)
    },
    content: {
      total_generated: content.length,
      avg_optimization_score: content.reduce((sum, c) => sum + (c.optimization_score || 0), 0) / content.length || 0,
      recent_content: content
    }
  };

  return new Response(
    JSON.stringify({ 
      success: true, 
      analytics
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}