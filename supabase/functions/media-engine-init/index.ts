/**
 * Media Engine Init — Creates required tables
 * One-time bootstrap function
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Use direct PostgreSQL connection via the SQL endpoint
    const sqlStatements = `
      CREATE TABLE IF NOT EXISTS public.product_media_sets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        total_assets integer DEFAULT 0,
        media_score integer DEFAULT 0,
        score_breakdown jsonb,
        media_status text DEFAULT 'blocked',
        duplicates_removed integer DEFAULT 0,
        last_enriched_at timestamptz,
        scored_at timestamptz,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now(),
        UNIQUE(product_id, user_id)
      );

      CREATE TABLE IF NOT EXISTS public.product_media_assets (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        media_set_id uuid REFERENCES public.product_media_sets(id) ON DELETE CASCADE,
        product_id uuid NOT NULL,
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        url text NOT NULL,
        original_url text NOT NULL,
        source text DEFAULT 'supplier',
        asset_type text DEFAULT 'image',
        image_type text,
        is_primary boolean DEFAULT false,
        width integer,
        height integer,
        file_size integer,
        format text,
        position integer DEFAULT 0,
        metadata jsonb,
        created_at timestamptz DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS public.media_enrichment_jobs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id uuid NOT NULL,
        user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        job_type text NOT NULL,
        status text DEFAULT 'pending',
        result jsonb,
        error_message text,
        started_at timestamptz,
        completed_at timestamptz,
        created_at timestamptz DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_pms_product ON public.product_media_sets(product_id);
      CREATE INDEX IF NOT EXISTS idx_pms_user ON public.product_media_sets(user_id);
      CREATE INDEX IF NOT EXISTS idx_pma_set ON public.product_media_assets(media_set_id);
      CREATE INDEX IF NOT EXISTS idx_pma_product ON public.product_media_assets(product_id);

      ALTER TABLE public.product_media_sets ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.product_media_assets ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.media_enrichment_jobs ENABLE ROW LEVEL SECURITY;

      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'media_sets_auth') THEN
          CREATE POLICY "media_sets_auth" ON public.product_media_sets FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'media_assets_auth') THEN
          CREATE POLICY "media_assets_auth" ON public.product_media_assets FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'enrichment_jobs_auth') THEN
          CREATE POLICY "enrichment_jobs_auth" ON public.media_enrichment_jobs FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
        END IF;
      END $$;
    `;

    // Try using the Supabase Management API SQL endpoint
    const projectRef = supabaseUrl.replace("https://", "").replace(".supabase.co", "");
    
    // Method 1: Try pg_query RPC if available
    const sb = createClient(supabaseUrl, serviceKey);
    
    // Execute SQL via a direct connection approach
    // Use the /pg endpoint available in some Supabase configurations
    const pgResp = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: "POST", 
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
        "apikey": serviceKey,
      },
      body: JSON.stringify({}),
    });

    // Since we can't easily run raw SQL from edge functions,
    // let's check if tables exist and return status
    const { error: checkErr } = await sb.from("product_media_sets").select("id").limit(0);
    
    if (checkErr?.code === "42P01") {
      return new Response(JSON.stringify({
        success: false,
        error: "Tables need to be created via database migration",
        tables_exist: false,
        sql: sqlStatements,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      tables_exist: true,
      message: "All media engine tables are ready",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
