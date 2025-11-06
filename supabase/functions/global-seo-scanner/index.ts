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

function handlePageScan(url: string) {
  console.log('Scanning page:', url);
  
  // Simulate page scanning and SEO analysis
  const issues = [];
  let score = 100;

  // Mock title analysis
  const title = getPageTitle(url);
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
  }

  // Mock meta description analysis
  const metaDescription = getPageMetaDescription(url);
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
      recommendation: 'Réduisez la longueur pour éviter la troncature'
    });
    score -= 10;
  }

  // Mock H1 analysis
  const h1 = getPageH1(url);
  if (!h1) {
    issues.push({
      type: 'H1 manquant',
      severity: 'critical',
      message: 'Cette page n\'a pas de balise H1',
      recommendation: 'Ajoutez un H1 unique qui décrit le contenu principal de la page'
    });
    score -= 15;
  }

  // Additional checks
  if (url.length > 100) {
    issues.push({
      type: 'URL trop longue',
      severity: 'info',
      message: 'L\'URL est très longue',
      recommendation: 'Utilisez des URLs courtes et descriptives'
    });
    score -= 5;
  }

  const result = {
    url,
    title: title || '',
    metaDescription: metaDescription || '',
    h1: h1 || '',
    score: Math.max(0, score),
    issues
  };

  return new Response(
    JSON.stringify(result),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
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

// Helper functions
function getPageTitle(url: string): string {
  const titles: Record<string, string> = {
    '/': 'Drop Craft AI - Plateforme de Dropshipping Intelligent',
    '/features': 'Fonctionnalités - Drop Craft AI',
    '/pricing': 'Tarifs - Drop Craft AI',
    '/blog': 'Blog - Drop Craft AI',
  };
  return titles[url] || '';
}

function getPageMetaDescription(url: string): string {
  const descriptions: Record<string, string> = {
    '/': 'Automatisez votre business e-commerce avec l\'IA. Gestion de produits, synchronisation multi-marketplace et optimisation automatique.',
  };
  return descriptions[url] || '';
}

function getPageH1(url: string): string {
  const h1s: Record<string, string> = {
    '/': 'Dropshipping Intelligent avec l\'IA',
    '/features': 'Fonctionnalités Complètes',
    '/pricing': 'Tarifs Transparents',
  };
  return h1s[url] || '';
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
