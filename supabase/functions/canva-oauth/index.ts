import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  { auth: { persistSession: false } }
);

const CANVA_CLIENT_ID = Deno.env.get('CANVA_CLIENT_ID');
const CANVA_CLIENT_SECRET = Deno.env.get('CANVA_CLIENT_SECRET');
const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user) {
      throw new Error('Non autorisé');
    }

    const { action, ...payload } = await req.json();

    console.log(`Processing Canva OAuth action: ${action}`);

    switch (action) {
      case 'initiate': {
        const { redirect_uri } = payload;
        
        // Générer un state unique pour la sécurité
        const state = crypto.randomUUID();
        
        // Stocker le state temporairement (vous pourriez utiliser Redis ou une table temporaire)
        await supabaseClient
          .from('canva_integrations')
          .upsert({
            user_id: user.id,
            canva_user_id: 'temp',
            access_token: 'temp',
            status: 'pending',
            canva_brand_id: state // Temporairement stocké ici
          }, {
            onConflict: 'user_id'
          });

        const authUrl = new URL('https://www.canva.com/api/oauth/authorize');
        authUrl.searchParams.set('client_id', CANVA_CLIENT_ID!);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set('redirect_uri', redirect_uri);
        authUrl.searchParams.set('scope', 'design:read design:write design:meta:read user:read');
        authUrl.searchParams.set('state', state);

        console.log('Generated Canva OAuth URL:', authUrl.toString());

        return new Response(
          JSON.stringify({
            success: true,
            auth_url: authUrl.toString(),
            state
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'callback': {
        const { code, state } = payload;
        
        // Vérifier le state
        const { data: pendingIntegration } = await supabaseClient
          .from('canva_integrations')
          .select('*')
          .eq('user_id', user.id)
          .eq('canva_brand_id', state)
          .single();

        if (!pendingIntegration) {
          throw new Error('État OAuth invalide');
        }

        // Échanger le code contre un token d'accès
        const tokenResponse = await fetch('https://api.canva.com/rest/v1/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            client_id: CANVA_CLIENT_ID!,
            client_secret: CANVA_CLIENT_SECRET!,
            code,
            redirect_uri: payload.redirect_uri
          })
        });

        if (!tokenResponse.ok) {
          const errorText = await tokenResponse.text();
          console.error('Token exchange failed:', errorText);
          throw new Error('Échec de l\'échange de token');
        }

        const tokenData = await tokenResponse.json();
        console.log('Token exchange successful');

        // Obtenir les informations utilisateur Canva
        const userResponse = await fetch(`${CANVA_API_BASE}/user`, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        });

        if (!userResponse.ok) {
          throw new Error('Impossible de récupérer les informations utilisateur');
        }

        const canvaUser = await userResponse.json();
        console.log('Canva user info retrieved:', canvaUser.id);

        // Sauvegarder l'intégration
        const { error: updateError } = await supabaseClient
          .from('canva_integrations')
          .update({
            canva_user_id: canvaUser.id,
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            token_expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
            canva_team_id: canvaUser.team?.id || null,
            canva_brand_id: null, // Reset du state temporaire
            status: 'active'
          })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Database update error:', updateError);
          throw new Error('Erreur de sauvegarde');
        }

        // Log de l'événement
        await supabaseClient.from('activity_logs').insert({
          user_id: user.id,
          action: 'canva_connected',
          description: 'Connexion Canva établie avec succès',
          entity_type: 'integration',
          metadata: {
            canva_user_id: canvaUser.id,
            team_id: canvaUser.team?.id
          }
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Connexion Canva réussie',
            user: canvaUser
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'refresh_token': {
        const { data: integration } = await supabaseClient
          .from('canva_integrations')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!integration || !integration.refresh_token) {
          throw new Error('Aucune intégration ou token de rafraîchissement trouvé');
        }

        const refreshResponse = await fetch('https://api.canva.com/rest/v1/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            grant_type: 'refresh_token',
            client_id: CANVA_CLIENT_ID!,
            client_secret: CANVA_CLIENT_SECRET!,
            refresh_token: integration.refresh_token
          })
        });

        if (!refreshResponse.ok) {
          throw new Error('Échec du rafraîchissement du token');
        }

        const newTokenData = await refreshResponse.json();

        await supabaseClient
          .from('canva_integrations')
          .update({
            access_token: newTokenData.access_token,
            refresh_token: newTokenData.refresh_token,
            token_expires_at: new Date(Date.now() + newTokenData.expires_in * 1000).toISOString()
          })
          .eq('user_id', user.id);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Token rafraîchi avec succès'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'disconnect': {
        await supabaseClient
          .from('canva_integrations')
          .update({ status: 'inactive' })
          .eq('user_id', user.id);

        await supabaseClient.from('activity_logs').insert({
          user_id: user.id,
          action: 'canva_disconnected',
          description: 'Connexion Canva supprimée',
          entity_type: 'integration'
        });

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Déconnexion réussie'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      default:
        throw new Error('Action non supportée');
    }

  } catch (error: any) {
    console.error('Canva OAuth error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Erreur interne' 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});