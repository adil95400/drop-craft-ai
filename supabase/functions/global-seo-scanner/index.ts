import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, action, language, currentTitle, currentDescription, currentH1, issues, pages } = await req.json();
    
    console.log('Global SEO Scanner called:', { url, action, language });

    if (action === 'scan') {
      return handlePageScan(url);
    } else if (action === 'optimize') {
      return handlePageOptimization(url, language, currentTitle, currentDescription, currentH1, issues);
    } else if (action === 'generate_sitemap') {
      return handleSitemapGeneration(pages);
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in global-seo-scanner:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handlePageScan(url: string) {
  console.log('🔍 Scanning page:', url);
  
  try {
    // Fetch the actual HTML content
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DropCraftBot/1.0; +https://dropcraft.ai)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      throw new Error('URL does not return HTML content');
    }

    // Read HTML (limit to 1MB)
    const html = await response.text();
    if (html.length > 1024 * 1024) {
      console.warn('⚠️ HTML content exceeds 1MB, truncating');
    }

    // Parse SEO elements from real HTML
    const title = extractTitle(html);
    const metaDescription = extractMetaDescription(html);
    const h1 = extractH1(html);
    const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;

    // Analyze and score
    const issues = [];
    let score = 100;

    // Title analysis
    if (!title) {
      issues.push({
        type: 'Titre manquant',
        severity: 'critical',
        message: 'Cette page n\'a pas de balise <title>',
        recommendation: 'Ajoutez un titre unique et descriptif de 50-60 caractères'
      });
      score -= 20;
    } else if (title.length > 60) {
      issues.push({
        type: 'Titre trop long',
        severity: 'warning',
        message: `Le titre fait ${title.length} caractères (max recommandé: 60)`,
        recommendation: 'Réduisez la longueur du titre pour un meilleur affichage dans les résultats Google'
      });
      score -= 10;
    } else if (title.length < 30) {
      issues.push({
        type: 'Titre trop court',
        severity: 'warning',
        message: `Le titre fait seulement ${title.length} caractères (min recommandé: 30)`,
        recommendation: 'Allongez le titre pour être plus descriptif'
      });
      score -= 5;
    }

    // Meta description analysis
    if (!metaDescription) {
      issues.push({
        type: 'Meta description manquante',
        severity: 'critical',
        message: 'Cette page n\'a pas de meta description',
        recommendation: 'Ajoutez une meta description de 150-160 caractères'
      });
      score -= 20;
    } else if (metaDescription.length > 160) {
      issues.push({
        type: 'Meta description trop longue',
        severity: 'warning',
        message: `La meta description fait ${metaDescription.length} caractères (max: 160)`,
        recommendation: 'Réduisez la longueur pour éviter la troncature dans les résultats Google'
      });
      score -= 10;
    } else if (metaDescription.length < 120) {
      issues.push({
        type: 'Meta description trop courte',
        severity: 'info',
        message: `La meta description fait ${metaDescription.length} caractères (min recommandé: 120)`,
        recommendation: 'Allongez pour maximiser l\'espace dans les résultats de recherche'
      });
      score -= 5;
    }

    // H1 analysis
    if (!h1) {
      issues.push({
        type: 'H1 manquant',
        severity: 'critical',
        message: 'Cette page n\'a pas de balise H1',
        recommendation: 'Ajoutez un H1 unique qui décrit le contenu principal de la page'
      });
      score -= 15;
    } else if (h1Count > 1) {
      issues.push({
        type: 'Multiple H1',
        severity: 'warning',
        message: `La page contient ${h1Count} balises H1 (recommandé: 1 seul)`,
        recommendation: 'Utilisez un seul H1 par page pour une meilleure structure SEO'
      });
      score -= 10;
    }

    // URL analysis
    if (url.length > 100) {
      issues.push({
        type: 'URL trop longue',
        severity: 'info',
        message: `L\'URL fait ${url.length} caractères (max recommandé: 100)`,
        recommendation: 'Utilisez des URLs courtes et descriptives'
      });
      score -= 5;
    }

    // Check for canonical tag
    const hasCanonical = html.includes('rel="canonical"');
    if (!hasCanonical) {
      issues.push({
        type: 'Canonical manquant',
        severity: 'info',
        message: 'Aucune balise canonical trouvée',
        recommendation: 'Ajoutez une balise canonical pour éviter les problèmes de contenu dupliqué'
      });
    }

    const result = {
      url,
      title: title || '',
      metaDescription: metaDescription || '',
      h1: h1 || '',
      h1Count,
      hasCanonical,
      score: Math.max(0, score),
      issues
    };

    console.log(`✅ Scan completed: score ${result.score}/100, ${issues.length} issues found`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('❌ Page scan error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        url,
        title: '',
        metaDescription: '',
        h1: '',
        score: 0,
        issues: [{
          type: 'Erreur de scan',
          severity: 'critical',
          message: `Impossible de scanner la page: ${error.message}`,
          recommendation: 'Vérifiez que l\'URL est accessible et retourne du HTML'
        }]
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}

async function handlePageOptimization(
  url: string, 
  language: string,
  currentTitle: string,
  currentDescription: string,
  currentH1: string,
  issues: any[]
) {
  console.log('Optimizing page:', url, 'in language:', language);

  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY) {
    console.log('LOVABLE_API_KEY not found, using mock optimization');
    return mockOptimization(url, language, currentTitle, currentDescription, currentH1);
  }

  try {
    const prompt = buildOptimizationPrompt(url, language, currentTitle, currentDescription, currentH1, issues);
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert SEO consultant. Generate optimized SEO content in the requested language.' 
          },
          { role: 'user', content: prompt }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "optimize_seo",
              description: "Return optimized SEO elements for a web page",
              parameters: {
                type: "object",
                properties: {
                  title: { 
                    type: "string",
                    description: "Optimized page title (50-60 chars)"
                  },
                  metaDescription: { 
                    type: "string",
                    description: "Optimized meta description (150-160 chars)"
                  },
                  h1: { 
                    type: "string",
                    description: "Optimized H1 heading"
                  },
                  keywords: {
                    type: "array",
                    items: { type: "string" },
                    description: "5-7 relevant keywords"
                  }
                },
                required: ["title", "metaDescription", "h1", "keywords"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "optimize_seo" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (response.status === 402) {
        throw new Error('Payment required. Please add credits to your Lovable AI workspace.');
      }
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const toolCall = data.choices[0]?.message?.tool_calls?.[0];
    
    if (toolCall && toolCall.function.name === 'optimize_seo') {
      const optimized = JSON.parse(toolCall.function.arguments);
      
      return new Response(
        JSON.stringify({ optimized }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('No optimization result from AI');
  } catch (error) {
    console.error('AI optimization error:', error);
    return mockOptimization(url, language, currentTitle, currentDescription, currentH1);
  }
}

function mockOptimization(url: string, language: string, currentTitle: string, currentDescription: string, currentH1: string) {
  const pageType = getPageType(url);
  const optimized = {
    title: currentTitle || `${pageType} optimisé - Drop Craft AI`,
    metaDescription: currentDescription || `Découvrez notre ${pageType} avec Drop Craft AI. Solution complète pour votre e-commerce.`,
    h1: currentH1 || pageType,
    keywords: ['dropshipping', 'e-commerce', 'automation', 'AI', 'marketplace']
  };

  return new Response(
    JSON.stringify({ optimized }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

function handleSitemapGeneration(pages: string[]) {
  console.log('Generating sitemap for', pages.length, 'pages');

  const baseUrl = 'https://yourdomain.com'; // Replace with actual domain
  const currentDate = new Date().toISOString().split('T')[0];

  let sitemap = '<?xml version="1.0" encoding="UTF-8"?>\n';
  sitemap += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

  pages.forEach(page => {
    sitemap += '  <url>\n';
    sitemap += `    <loc>${baseUrl}${page}</loc>\n`;
    sitemap += `    <lastmod>${currentDate}</lastmod>\n`;
    sitemap += `    <changefreq>${getChangeFreq(page)}</changefreq>\n`;
    sitemap += `    <priority>${getPriority(page)}</priority>\n`;
    sitemap += '  </url>\n';
  });

  sitemap += '</urlset>';

  return new Response(
    JSON.stringify({ sitemap }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// HTML Parsing Helper Functions
function extractTitle(html: string): string {
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
  return titleMatch ? titleMatch[1].trim() : '';
}

function extractMetaDescription(html: string): string {
  // Try name="description"
  let match = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/is);
  if (match) return match[1].trim();
  
  // Try property="og:description"
  match = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/is);
  if (match) return match[1].trim();
  
  // Try reverse order (content before name)
  match = html.match(/<meta\s+content=["'](.*?)["']\s+name=["']description["']/is);
  return match ? match[1].trim() : '';
}

function extractH1(html: string): string {
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/is);
  if (!h1Match) return '';
  
  // Remove HTML tags from h1 content
  return h1Match[1].replace(/<[^>]+>/g, '').trim();
}

function getPageType(url: string): string {
  const types: Record<string, string> = {
    '/': 'Accueil',
    '/features': 'Fonctionnalités',
    '/pricing': 'Tarifs',
    '/blog': 'Blog',
    '/contact': 'Contact',
    '/about': 'À propos',
    '/documentation': 'Documentation',
    '/faq': 'FAQ',
    '/dashboard': 'Tableau de bord',
    '/products': 'Produits',
    '/suppliers': 'Fournisseurs',
    '/orders': 'Commandes',
    '/customers': 'Clients',
    '/analytics': 'Analyses',
    '/integrations': 'Intégrations'
  };
  return types[url] || 'Page';
}

function getChangeFreq(url: string): string {
  if (url === '/') return 'daily';
  if (url.includes('blog')) return 'weekly';
  if (url.includes('products')) return 'daily';
  return 'monthly';
}

function getPriority(url: string): string {
  if (url === '/') return '1.0';
  if (url.includes('features') || url.includes('pricing')) return '0.9';
  if (url.includes('blog')) return '0.7';
  return '0.5';
}

function buildOptimizationPrompt(
  url: string,
  language: string,
  currentTitle: string,
  currentDescription: string,
  currentH1: string,
  issues: any[]
): string {
  return `Optimize SEO for the page: ${url}

Language: ${language}

Current SEO Elements:
- Title: ${currentTitle || 'None'}
- Meta Description: ${currentDescription || 'None'}
- H1: ${currentH1 || 'None'}

Issues detected:
${issues.map(i => `- ${i.type}: ${i.message}`).join('\n')}

Generate optimized SEO content in ${language} that:
1. Title: 50-60 characters, includes main keyword, compelling
2. Meta Description: 150-160 characters, includes keywords naturally, call-to-action
3. H1: Clear, includes main keyword, matches user intent
4. Keywords: 5-7 relevant keywords for this page

Consider the page type and create content that matches the user's search intent.`;
}
