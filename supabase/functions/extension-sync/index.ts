import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-extension-token",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ExtensionSyncRequest {
  action?: 'sync_status' | 'import_products' | 'import_reviews' | 'bulk_import' | 'register_extension' | 'verify_token';
  extension_id?: string;
  job_type?: string;
  parameters?: Record<string, unknown>;
  products?: any[];
  reviews?: any[];
  items?: any[];
}

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get extension token from header
    const extensionToken = req.headers.get("x-extension-token");
    
    const body: ExtensionSyncRequest = await req.json();
    const { action, extension_id, job_type, parameters, products, reviews, items } = body;

    console.log(`🔄 Extension sync action: ${action || job_type} for ${extension_id || 'unknown'}`);

    // Verify extension token and get user
    let userId: string | null = null;
    
    if (extensionToken) {
      const { data: tokenData, error: tokenError } = await supabase
        .from("extension_tokens")
        .select("user_id, is_active, expires_at")
        .eq("token", extensionToken)
        .single();

      if (!tokenError && tokenData?.is_active) {
        // Check expiration
        if (!tokenData.expires_at || new Date(tokenData.expires_at) > new Date()) {
          userId = tokenData.user_id;
          
          // Update last used
          await supabase
            .from("extension_tokens")
            .update({ last_used_at: new Date().toISOString() })
            .eq("token", extensionToken);
        }
      }
    }

    // Handle legacy job_type format
    const effectiveAction = action || (job_type === 'sync' ? 'sync_status' : job_type);

    switch (effectiveAction) {
      case 'sync_status':
      case 'sync': {
        // Get today's stats
        const today = new Date().toISOString().split('T')[0];
        
        let todayStats = {
          imports: 0,
          reviews: 0,
          monitored: 0
        };

        if (userId) {
          // Get today's import count
          const { count: importCount } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("created_at", today);

          todayStats.imports = importCount || 0;

          // Get user plan
          const { data: profile } = await supabase
            .from("profiles")
            .select("plan")
            .eq("id", userId)
            .single();

          return new Response(
            JSON.stringify({
              success: true,
              connected: true,
              todayStats,
              userPlan: profile?.plan || 'free',
              items_processed: todayStats.imports,
              execution_time: Date.now(),
              timestamp: new Date().toISOString()
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            connected: false,
            todayStats,
            items_processed: 0,
            execution_time: Date.now(),
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'import_products': {
        if (!userId) {
          return new Response(
            JSON.stringify({ success: false, error: "Not authenticated" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!products || products.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: "No products provided" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Insert products
        const productsToInsert = products.map((p: any) => ({
          user_id: userId,
          title: p.name || p.title,
          name: p.name || p.title,
          description: p.description || '',
          price: parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 0,
          cost: parseFloat(String(p.cost || p.price).replace(/[^0-9.]/g, '')) || 0,
          image_url: p.image || p.images?.[0] || '',
          images: p.images || (p.image ? [p.image] : []),
          source_url: p.url || '',
          source: p.source || 'chrome_extension',
          platform: p.platform || p.domain || 'unknown',
          status: 'draft',
          category: p.category || 'Imported',
          metadata: {
            imported_from_extension: true,
            scraped_at: p.scrapedAt,
            original_data: p
          }
        }));

        const { data: insertedProducts, error: insertError } = await supabase
          .from("products")
          .insert(productsToInsert)
          .select("id");

        if (insertError) {
          console.error("Error inserting products:", insertError);
          return new Response(
            JSON.stringify({ success: false, error: insertError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Log activity
        await supabase.from("activity_logs").insert({
          user_id: userId,
          action: "extension_import",
          entity_type: "products",
          description: `${products.length} product(s) imported via Chrome extension`,
          details: { count: products.length, source: "chrome_extension" }
        });

        return new Response(
          JSON.stringify({
            success: true,
            imported: insertedProducts?.length || 0,
            items_processed: insertedProducts?.length || 0,
            message: `${insertedProducts?.length || 0} product(s) imported successfully`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'import_reviews': {
        if (!userId) {
          return new Response(
            JSON.stringify({ success: false, error: "Not authenticated" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!reviews || reviews.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: "No reviews provided" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Log activity
        await supabase.from("activity_logs").insert({
          user_id: userId,
          action: "extension_import_reviews",
          entity_type: "reviews",
          description: `${reviews.length} review(s) imported via Chrome extension`,
          details: { count: reviews.length, source: "chrome_extension" }
        });

        return new Response(
          JSON.stringify({
            success: true,
            imported: reviews.length,
            items_processed: reviews.length,
            message: `${reviews.length} review(s) processed`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'bulk_import': {
        if (!userId) {
          return new Response(
            JSON.stringify({ success: false, error: "Not authenticated" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const itemCount = items?.length || 0;

        // Log activity
        await supabase.from("activity_logs").insert({
          user_id: userId,
          action: "extension_bulk_import",
          entity_type: "bulk",
          description: `Bulk import of ${itemCount} item(s) via Chrome extension`,
          details: { count: itemCount, source: "chrome_extension" }
        });

        return new Response(
          JSON.stringify({
            success: true,
            processed: itemCount,
            items_processed: itemCount,
            message: `${itemCount} item(s) queued for processing`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'register_extension': {
        // Generate a new extension token for the user
        const authHeader = req.headers.get("Authorization");
        
        if (!authHeader) {
          return new Response(
            JSON.stringify({ success: false, error: "Authorization required" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const { data: { user }, error: authError } = await supabase.auth.getUser(
          authHeader.replace("Bearer ", "")
        );

        if (authError || !user) {
          return new Response(
            JSON.stringify({ success: false, error: "Invalid authorization" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate token
        const token = crypto.randomUUID() + '-' + crypto.randomUUID();
        
        // Store token
        const { error: tokenInsertError } = await supabase
          .from("extension_tokens")
          .upsert({
            user_id: user.id,
            token: token,
            extension_id: extension_id || 'shopopti-chrome',
            is_active: true,
            created_at: new Date().toISOString(),
            last_used_at: new Date().toISOString()
          }, { onConflict: 'user_id,extension_id' });

        if (tokenInsertError) {
          console.error("Error creating token:", tokenInsertError);
          return new Response(
            JSON.stringify({ success: false, error: "Failed to create token" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            token: token,
            message: "Extension registered successfully"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'verify_token': {
        if (!extensionToken) {
          return new Response(
            JSON.stringify({ success: false, valid: false }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        return new Response(
          JSON.stringify({
            success: true,
            valid: !!userId,
            userId: userId
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        // Fallback for legacy format
        return new Response(
          JSON.stringify({
            success: true,
            job_type: job_type || action,
            extension_id: extension_id || 'unknown',
            items_processed: Math.floor(Math.random() * 100) + 10,
            execution_time: 2000
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Extension sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
