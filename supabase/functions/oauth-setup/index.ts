import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user) {
      throw new Error('Non autorisé');
    }

    const { platform } = await req.json();

    let profileData = null;
    
    // Check if profile exists
    const { data: existingProfile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!existingProfile) {
      // Create profile from OAuth data
      const metadata = user.user_metadata || {};
      
      profileData = {
        user_id: user.id,
        email: user.email,
        first_name: metadata.given_name || metadata.first_name || '',
        last_name: metadata.family_name || metadata.last_name || '',
        avatar_url: metadata.avatar_url || metadata.picture || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: profileError } = await supabaseClient
        .from('profiles')
        .insert(profileData);

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    } else {
      profileData = existingProfile;
    }

    // Log OAuth authentication
    await supabaseClient.from('activity_logs').insert({
      user_id: user.id,
      action: 'oauth_login',
      description: `Connexion OAuth réussie (${platform})`,
      entity_type: 'auth',
      metadata: {
        platform,
        provider: platform,
        first_login: !existingProfile
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          profile: profileData
        },
        message: 'OAuth setup completed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in oauth-setup:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});