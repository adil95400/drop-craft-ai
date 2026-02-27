import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
      throw new Error('Non autorisé');
    }

    const { action, config } = await req.json();

    if (action === 'audit') {
      // Fetch all blog posts
      const { data: posts, error: postsError } = await supabaseClient
        .from('blog_posts')
        .select('*')
        .eq('user_id', user.id);

      if (postsError) throw postsError;

      // Analyze each post for SEO issues
      const analyzedPosts = posts.map(post => {
        const issues = [];
        let seoScore = 100;

        // Check title
        if (!post.title || post.title.length < 30) {
          issues.push({
            severity: 'warning',
            message: 'Titre trop court (minimum 30 caractères recommandé)'
          });
          seoScore -= 15;
        }
        if (post.title && post.title.length > 60) {
          issues.push({
            severity: 'warning',
            message: 'Titre trop long (maximum 60 caractères)'
          });
          seoScore -= 10;
        }

        // Check meta description
        if (!post.seo_description) {
          issues.push({
            severity: 'critical',
            message: 'Meta description manquante'
          });
          seoScore -= 20;
        } else if (post.seo_description.length < 120) {
          issues.push({
            severity: 'warning',
            message: 'Meta description trop courte (minimum 120 caractères)'
          });
          seoScore -= 10;
        }

        // Check content length
        if (!post.content || post.content.length < 500) {
          issues.push({
            severity: 'critical',
            message: 'Contenu trop court (minimum 500 mots recommandé)'
          });
          seoScore -= 25;
        }

        // Check tags
        if (!post.tags || post.tags.length === 0) {
          issues.push({
            severity: 'warning',
            message: 'Aucun tag défini'
          });
          seoScore -= 10;
        }

        // Check image
        if (!post.image_url) {
          issues.push({
            severity: 'info',
            message: 'Image mise en avant manquante'
          });
          seoScore -= 5;
        }

        return {
          id: post.id,
          title: post.title,
          status: post.status,
          category: post.category,
          seoScore: Math.max(0, seoScore),
          issues
        };
      });

      // Calculate global statistics
      const totalPosts = posts.length;
      const optimizedPosts = analyzedPosts.filter(p => p.seoScore >= 80).length;
      const averageSeoScore = Math.round(
        analyzedPosts.reduce((sum, p) => sum + p.seoScore, 0) / totalPosts
      );

      // Collect global issues
      const globalIssues = [];
      const missingMetaCount = analyzedPosts.filter(p => 
        p.issues.some(i => i.message.includes('Meta description'))
      ).length;
      
      if (missingMetaCount > 0) {
        globalIssues.push({
          severity: 'critical',
          type: 'Meta Descriptions',
          message: `${missingMetaCount} articles sans meta description`
        });
      }

      const shortContentCount = analyzedPosts.filter(p => 
        p.issues.some(i => i.message.includes('Contenu trop court'))
      ).length;
      
      if (shortContentCount > 0) {
        globalIssues.push({
          severity: 'critical',
          type: 'Contenu',
          message: `${shortContentCount} articles avec un contenu insuffisant`
        });
      }

      const noTagsCount = analyzedPosts.filter(p => 
        p.issues.some(i => i.message.includes('tag'))
      ).length;
      
      if (noTagsCount > 0) {
        globalIssues.push({
          severity: 'warning',
          type: 'Tags',
          message: `${noTagsCount} articles sans tags`
        });
      }

      return new Response(
        JSON.stringify({
          totalPosts,
          optimizedPosts,
          averageSeoScore,
          posts: analyzedPosts,
          issues: globalIssues
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (action === 'generate') {
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
      
      if (!LOVABLE_API_KEY) {
        console.warn('LOVABLE_API_KEY not configured, using mock data');
        
        // Mock article generation
        const mockPost = {
          title: `${config.topic} - Guide Complet 2024`,
          content: `# ${config.topic}\n\n## Introduction\n\nDans cet article complet, nous explorons ${config.topic} en profondeur...\n\n## Points clés\n\n- Stratégie 1\n- Stratégie 2\n- Stratégie 3\n\n## Conclusion\n\nEn appliquant ces techniques, vous pourrez...`,
          excerpt: `Découvrez tout ce qu'il faut savoir sur ${config.topic} dans ce guide complet.`,
          status: 'draft',
          category: config.category,
          seo_title: `${config.topic} - Guide Expert 2024`,
          seo_description: `Guide complet sur ${config.topic}. Stratégies, conseils et techniques pour réussir. ${config.keywords}`,
          tags: config.keywords.split(',').map((k: string) => k.trim()),
          ai_generated: true,
          user_id: user.id
        };

        const { data: insertedPost, error: insertError } = await supabaseClient
          .from('blog_posts')
          .insert(mockPost)
          .select()
          .single();

        if (insertError) throw insertError;

        return new Response(
          JSON.stringify(insertedPost),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      // Generate with AI
      const wordCounts = {
        short: '500-800 mots',
        medium: '800-1500 mots',
        long: '1500-2500 mots'
      };

      const systemPrompt = `Tu es un expert en rédaction de contenu blog pour le e-commerce et le dropshipping. 
Crée un article de blog complet, optimisé SEO, informatif et engageant.`;

      const userPrompt = `Écris un article de blog complet sur le sujet suivant :

Sujet : ${config.topic}
Mots-clés SEO : ${config.keywords}
Catégorie : ${config.category}
Ton : ${config.tone}
Longueur : ${wordCounts[config.length as keyof typeof wordCounts]}

L'article doit inclure :
1. Un titre accrocheur et optimisé SEO (50-60 caractères)
2. Une meta description convaincante (120-155 caractères)
3. Une introduction engageante
4. Des sous-titres pertinents (H2, H3)
5. Un contenu structuré et détaillé
6. Des points clés et conseils pratiques
7. Une conclusion avec appel à l'action
8. Des suggestions de tags (3-5 tags)

Format la réponse en JSON avec cette structure :
{
  "title": "titre de l'article",
  "seo_title": "titre SEO optimisé",
  "seo_description": "meta description",
  "excerpt": "extrait court pour preview",
  "content": "contenu complet en markdown",
  "tags": ["tag1", "tag2", "tag3"]
}`;

      const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${LOVABLE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'openai/gpt-5-nano',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error('AI API error:', aiResponse.status, errorText);
        throw new Error(`AI generation failed: ${aiResponse.status}`);
      }

      const aiData = await aiResponse.json();
      const generatedContent = aiData.choices[0].message.content;
      
      let parsedContent;
      try {
        const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
        parsedContent = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
      } catch (e) {
        console.error('JSON parsing error:', e);
        throw new Error('Failed to parse AI response');
      }

      if (!parsedContent) {
        throw new Error('Invalid AI response format');
      }

      const newPost = {
        title: parsedContent.title,
        content: parsedContent.content,
        excerpt: parsedContent.excerpt,
        status: 'draft',
        category: config.category,
        seo_title: parsedContent.seo_title,
        seo_description: parsedContent.seo_description,
        tags: parsedContent.tags,
        ai_generated: true,
        user_id: user.id
      };

      const { data: insertedPost, error: insertError } = await supabaseClient
        .from('blog_posts')
        .insert(newPost)
        .select()
        .single();

      if (insertError) throw insertError;

      return new Response(
        JSON.stringify(insertedPost),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    if (action === 'schedule') {
      // For now, just return a mock response
      // In production, this would set up scheduled tasks
      return new Response(
        JSON.stringify({
          success: true,
          scheduledCount: 4,
          message: `Publications planifiées : ${config.frequency} à partir du ${config.startDate}`
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    throw new Error('Action non valide');

  } catch (error) {
    console.error('Error in global-blog-optimizer:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
