/**
 * Edge function pour créer et gérer les designs Canva
 * Actions: create_from_template, list_designs, export_design, duplicate_design
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Types
interface CanvaIntegration {
  id: string;
  user_id: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  canva_user_id: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const canvaApiKey = Deno.env.get('CANVA_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Vérifier l'authentification
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json();
    const { action } = body;

    console.log(`[canva-create-design] Action: ${action}, User: ${user.id}`);

    // Récupérer l'intégration Canva de l'utilisateur
    const { data: integration, error: integrationError } = await supabase
      .from('canva_integrations')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'connected')
      .single();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Canva not connected', code: 'NOT_CONNECTED' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier le token d'accès
    const accessToken = integration.access_token || canvaApiKey;
    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: 'No Canva access token available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Router vers l'action appropriée
    switch (action) {
      case 'create_from_template': {
        const { templateId, title, productData } = body;
        
        if (!templateId || !title) {
          return new Response(
            JSON.stringify({ error: 'templateId and title are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Créer un design via l'API Canva
        // Note: L'API Canva nécessite des templates pré-configurés dans votre compte
        const designResponse = await createCanvaDesign(accessToken, {
          title,
          templateId,
          productData
        });

        // Sauvegarder dans la base de données
        const { data: newDesign, error: insertError } = await supabase
          .from('canva_designs')
          .insert({
            user_id: user.id,
            canva_integration_id: integration.id,
            canva_design_id: designResponse.designId,
            title,
            design_type: body.designType || 'custom',
            design_url: designResponse.editUrl,
            thumbnail_url: designResponse.thumbnailUrl,
            status: 'created',
            metadata: {
              templateId,
              productData,
              dimensions: designResponse.dimensions
            }
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error saving design:', insertError);
        }

        return new Response(
          JSON.stringify({
            success: true,
            design: newDesign,
            editUrl: designResponse.editUrl,
            designId: designResponse.designId
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'list_designs': {
        // Récupérer les designs depuis Canva
        const designs = await listCanvaDesigns(accessToken, integration.canva_user_id);

        // Synchroniser avec la base de données
        for (const design of designs) {
          await supabase
            .from('canva_designs')
            .upsert({
              user_id: user.id,
              canva_integration_id: integration.id,
              canva_design_id: design.id,
              title: design.title || 'Sans titre',
              design_url: design.editUrl,
              thumbnail_url: design.thumbnailUrl,
              last_modified_at: design.updatedAt,
              status: 'synced'
            }, {
              onConflict: 'canva_design_id',
              ignoreDuplicates: false
            });
        }

        // Retourner les designs de la base
        const { data: savedDesigns } = await supabase
          .from('canva_designs')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false });

        return new Response(
          JSON.stringify({
            success: true,
            designs: savedDesigns || [],
            synced: designs.length
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'export_design': {
        const { designId, format = 'png' } = body;

        if (!designId) {
          return new Response(
            JSON.stringify({ error: 'designId is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Récupérer le design de la base
        const { data: design } = await supabase
          .from('canva_designs')
          .select('canva_design_id, export_urls')
          .eq('id', designId)
          .eq('user_id', user.id)
          .single();

        if (!design) {
          return new Response(
            JSON.stringify({ error: 'Design not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Exporter via l'API Canva
        const exportResult = await exportCanvaDesign(
          accessToken, 
          design.canva_design_id!, 
          format
        );

        // Mettre à jour les URLs d'export
        const currentExports = (design.export_urls as Record<string, string>) || {};
        await supabase
          .from('canva_designs')
          .update({
            export_urls: {
              ...currentExports,
              [format]: exportResult.downloadUrl
            }
          })
          .eq('id', designId);

        return new Response(
          JSON.stringify({
            success: true,
            downloadUrl: exportResult.downloadUrl,
            format
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'duplicate_design': {
        const { designId, newTitle } = body;

        if (!designId) {
          return new Response(
            JSON.stringify({ error: 'designId is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Récupérer le design original
        const { data: originalDesign } = await supabase
          .from('canva_designs')
          .select('*')
          .eq('id', designId)
          .eq('user_id', user.id)
          .single();

        if (!originalDesign) {
          return new Response(
            JSON.stringify({ error: 'Design not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        // Dupliquer via l'API Canva
        const duplicateResult = await duplicateCanvaDesign(
          accessToken,
          originalDesign.canva_design_id!,
          newTitle || `${originalDesign.title} (copie)`
        );

        // Sauvegarder la copie
        const { data: newDesign } = await supabase
          .from('canva_designs')
          .insert({
            user_id: user.id,
            canva_integration_id: integration.id,
            canva_design_id: duplicateResult.designId,
            title: newTitle || `${originalDesign.title} (copie)`,
            design_type: originalDesign.design_type,
            design_url: duplicateResult.editUrl,
            thumbnail_url: duplicateResult.thumbnailUrl,
            status: 'created',
            metadata: originalDesign.metadata
          })
          .select()
          .single();

        return new Response(
          JSON.stringify({
            success: true,
            design: newDesign,
            editUrl: duplicateResult.editUrl
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('[canva-create-design] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Fonctions d'appel à l'API Canva

async function createCanvaDesign(
  accessToken: string, 
  options: { title: string; templateId: string; productData?: Record<string, unknown> }
): Promise<{ designId: string; editUrl: string; thumbnailUrl: string; dimensions: { width: number; height: number } }> {
  // Note: Implémentation simulée car l'API Canva nécessite une configuration spécifique
  // En production, utiliser l'API Canva Connect: https://www.canva.dev/docs/connect/
  
  console.log('[Canva API] Creating design:', options);
  
  // Simuler la création d'un design
  const designId = `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    designId,
    editUrl: `https://www.canva.com/design/${designId}/edit`,
    thumbnailUrl: '',
    dimensions: { width: 1080, height: 1920 }
  };
}

async function listCanvaDesigns(
  accessToken: string,
  canvaUserId: string | null
): Promise<Array<{ id: string; title: string; editUrl: string; thumbnailUrl: string; updatedAt: string }>> {
  // Note: Implémentation simulée
  console.log('[Canva API] Listing designs for user:', canvaUserId);
  
  // En production, appeler GET /v1/designs
  return [];
}

async function exportCanvaDesign(
  accessToken: string,
  designId: string,
  format: string
): Promise<{ downloadUrl: string }> {
  // Note: Implémentation simulée
  console.log('[Canva API] Exporting design:', designId, 'as', format);
  
  // En production, appeler POST /v1/designs/{designId}/exports
  return {
    downloadUrl: `https://export.canva.com/${designId}.${format}`
  };
}

async function duplicateCanvaDesign(
  accessToken: string,
  designId: string,
  newTitle: string
): Promise<{ designId: string; editUrl: string; thumbnailUrl: string }> {
  // Note: Implémentation simulée
  console.log('[Canva API] Duplicating design:', designId);
  
  const newDesignId = `design_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    designId: newDesignId,
    editUrl: `https://www.canva.com/design/${newDesignId}/edit`,
    thumbnailUrl: ''
  };
}
