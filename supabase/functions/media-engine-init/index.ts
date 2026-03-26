/**
 * Media Engine Init — Creates required tables via direct PostgreSQL connection
 * Call once to bootstrap the media engine tables
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREATE_SQL = `
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
CREATE INDEX IF NOT EXISTS idx_mej_product ON public.media_enrichment_jobs(product_id);

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Use the SUPABASE_DB_URL which edge functions have access to
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    
    if (!dbUrl) {
      return new Response(JSON.stringify({
        success: false,
        error: "SUPABASE_DB_URL not available",
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Import postgres module available in Deno edge functions
    const { default: postgres } = await import("https://deno.land/x/postgresjs@v3.4.5/mod.js");
    
    const sql = postgres(dbUrl);
    
    await sql.unsafe(CREATE_SQL);
    
    await sql.end();

    return new Response(JSON.stringify({
      success: true,
      message: "Media engine tables created successfully",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Init error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
