import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { campaign_type, target_audience, campaign_name } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `Tu es un expert en marketing digital et copywriting. 
Tu dois générer du contenu d'email marketing persuasif et engageant.
Utilise des techniques de copywriting éprouvées (AIDA, PAS, storytelling).
Le contenu doit être professionnel mais accessible, avec un ton amical.`;

    const userPrompt = `Génère un email marketing pour:
- Nom de campagne: ${campaign_name}
- Type: ${campaign_type}
- Audience cible: ${target_audience}

Format de réponse (JSON uniquement):
{
  "subject": "Sujet accrocheur de 40-60 caractères",
  "content": "Contenu complet de l'email en HTML avec structure marketing persuasive"
}`;

    console.log('Calling Lovable AI for marketing content generation...');
    
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', aiResponse.status, errorText);
      throw new Error(`AI generation failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const generatedText = aiData.choices[0].message.content;
    
    console.log('AI Response received:', generatedText.substring(0, 200));

    // Parse JSON response
    let parsedContent;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = generatedText.match(/```json\n([\s\S]*?)\n```/) || 
                       generatedText.match(/```\n([\s\S]*?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : generatedText;
      parsedContent = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Fallback if JSON parsing fails
      parsedContent = {
        subject: campaign_name,
        content: generatedText
      };
    }

    // Log the generation in activity logs
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (user) {
      await supabase.from('activity_logs').insert({
        user_id: user.id,
        action: 'ai_content_generation',
        description: `Contenu marketing généré par IA pour ${campaign_name}`,
        metadata: {
          campaign_type,
          target_audience,
          generated_at: new Date().toISOString()
        }
      });
    }

    return new Response(
      JSON.stringify(parsedContent),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in marketing-ai-generator:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        subject: 'Erreur de génération',
        content: 'Impossible de générer le contenu automatiquement'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
