import { createClient } from "npm:@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Non autorisé' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const { topic, keywords = [], tone = 'professional', language = 'fr', category = 'ecommerce' } = await req.json()

    if (!topic) {
      return new Response(JSON.stringify({ error: 'Le sujet est requis' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const prompt = `Tu es un expert en content marketing e-commerce et SEO.
Génère un article de blog complet et optimisé SEO sur le sujet suivant: "${topic}"

Contraintes:
- Langue: ${language === 'fr' ? 'Français' : 'English'}
- Ton: ${tone}
- Catégorie: ${category}
- Mots-clés à intégrer naturellement: ${keywords.join(', ') || 'aucun spécifié'}
- Longueur: 1500-2000 mots
- Structure: titre H1 accrocheur, introduction engageante, 4-6 sections H2, conclusion avec CTA

Réponds UNIQUEMENT en JSON valide avec ce format:
{
  "title": "Titre SEO optimisé (max 60 chars)",
  "seo_title": "Titre pour la balise title",
  "seo_description": "Meta description (max 155 chars)",
  "excerpt": "Extrait court (2-3 phrases)",
  "content": "Contenu complet en Markdown",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "${category}",
  "estimated_reading_time": 7
}`

    // Use Lovable AI gateway
    const aiResponse = await fetch('https://jsmwckzrmqecwwrswwrz.supabase.co/functions/v1/ai-gateway', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-nano',
        messages: [
          { role: 'system', content: 'Tu es un rédacteur SEO expert. Réponds uniquement en JSON valide.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 4000,
        temperature: 0.7,
      })
    })

    let article: any

    if (aiResponse.ok) {
      const aiData = await aiResponse.json()
      const raw = aiData.choices?.[0]?.message?.content || ''
      try {
        const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        article = JSON.parse(cleaned)
      } catch {
        article = {
          title: topic,
          seo_title: topic,
          seo_description: `Découvrez notre guide complet sur ${topic}.`,
          excerpt: `Article sur ${topic} pour optimiser votre e-commerce.`,
          content: raw || `# ${topic}\n\nContenu en cours de génération...`,
          tags: keywords.length ? keywords : ['ecommerce', 'guide'],
          category,
          estimated_reading_time: 5,
        }
      }
    } else {
      article = {
        title: topic,
        seo_title: topic,
        seo_description: `Guide complet : ${topic}`,
        excerpt: `Tout savoir sur ${topic}.`,
        content: `# ${topic}\n\nL'IA n'a pas pu générer le contenu. Veuillez réessayer.`,
        tags: keywords.length ? keywords : ['ecommerce'],
        category,
        estimated_reading_time: 3,
      }
    }

    // Save to blog_posts
    const slug = article.title
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80)

    const { data: post, error: insertError } = await supabase
      .from('blog_posts')
      .insert({
        user_id: user.id,
        title: article.title,
        content: article.content,
        excerpt: article.excerpt,
        seo_title: article.seo_title,
        seo_description: article.seo_description,
        tags: article.tags,
        category: article.category || category,
        status: 'draft',
        ai_generated: true,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Blog insert error:', insertError)
      return new Response(JSON.stringify({ error: 'Erreur lors de la sauvegarde' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ success: true, post, article }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (err) {
    console.error('Blog generator error:', err)
    return new Response(JSON.stringify({ error: 'Erreur serveur' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
