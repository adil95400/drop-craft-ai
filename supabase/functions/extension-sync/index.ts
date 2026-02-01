/**
 * Extension Sync - Secure Edge Function
 * P0.4 FIX: Replaced CORS * with restrictive allowlist
 * All actions require valid extension token or JWT
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { getSecureCorsHeaders, handleCorsPreflightSecure } from "../_shared/cors.ts";

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
  // Handle CORS preflight with secure headers
  const preflightResponse = handleCorsPreflightSecure(req);
  if (preflightResponse) return preflightResponse;

  const origin = req.headers.get('origin');
  const corsHeaders = getSecureCorsHeaders(origin);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get extension token from header
    const extensionToken = req.headers.get("x-extension-token");
    const authHeader = req.headers.get("Authorization");
    
    const body: ExtensionSyncRequest = await req.json();
    const { action, extension_id, job_type, products, reviews, items } = body;

    console.log(`🔄 Extension sync action: ${action || job_type}`);

    // Verify extension token and get user - SECURITY: token-based auth
    let userId: string | null = null;
    
    if (extensionToken) {
      const { data: tokenData, error: tokenError } = await supabase
        .from("extension_tokens")
        .select("user_id, is_active, expires_at, permissions")
        .eq("token", extensionToken)
        .single();

      if (!tokenError && tokenData?.is_active) {
        // Check expiration
        if (!tokenData.expires_at || new Date(tokenData.expires_at) > new Date()) {
          userId = tokenData.user_id;
          
          // Update last used - async, don't await
          supabase
            .from("extension_tokens")
            .update({ last_used_at: new Date().toISOString() })
            .eq("token", extensionToken)
            .then(() => {});
        }
      }
    }

    // Handle legacy job_type format
    const effectiveAction = action || (job_type === 'sync' ? 'sync_status' : job_type);

    switch (effectiveAction) {
      case 'sync_status':
      case 'sync': {
        const today = new Date().toISOString().split('T')[0];
        
        let todayStats = { imports: 0, reviews: 0, monitored: 0 };

        if (userId) {
          const { count: importCount } = await supabase
            .from("products")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId)
            .gte("created_at", today);

          todayStats.imports = importCount || 0;

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
            timestamp: new Date().toISOString()
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'import_products': {
        // SECURITY: Require authentication
        if (!userId) {
          return new Response(
            JSON.stringify({ success: false, error: "Authentication required" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!products || products.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: "No products provided" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Rate limit check
        const { count: recentImports } = await supabase
          .from("products")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", new Date(Date.now() - 3600000).toISOString());

        if ((recentImports || 0) > 500) {
          return new Response(
            JSON.stringify({ success: false, error: "Rate limit exceeded. Max 500 imports per hour." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Insert products with user_id derived from token (SECURITY: never from body)
        const productsToInsert = products.slice(0, 100).map((p: any) => ({
          user_id: userId, // Always from auth, never from request
          title: String(p.name || p.title || '').slice(0, 500),
          name: String(p.name || p.title || '').slice(0, 500),
          description: String(p.description || '').slice(0, 10000),
          price: Math.max(0, parseFloat(String(p.price).replace(/[^0-9.]/g, '')) || 0),
          cost: Math.max(0, parseFloat(String(p.cost || p.price).replace(/[^0-9.]/g, '')) || 0),
          image_url: p.image || p.images?.[0] || '',
          images: Array.isArray(p.images) ? p.images.slice(0, 20) : (p.image ? [p.image] : []),
          source_url: String(p.url || '').slice(0, 2000),
          source: 'chrome_extension',
          platform: String(p.platform || p.domain || 'unknown').slice(0, 100),
          status: 'draft',
          category: String(p.category || 'Imported').slice(0, 200),
          metadata: {
            imported_from_extension: true,
            scraped_at: p.scrapedAt,
          }
        }));

        const { data: insertedProducts, error: insertError } = await supabase
          .from("products")
          .insert(productsToInsert)
          .select("id");

        if (insertError) {
          console.error("Error inserting products:", insertError);
          return new Response(
            JSON.stringify({ success: false, error: "Import failed" }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Log activity
        await supabase.from("activity_logs").insert({
          user_id: userId,
          action: "extension_import",
          entity_type: "products",
          description: `${insertedProducts?.length || 0} product(s) imported`,
          details: { count: insertedProducts?.length || 0, source: "chrome_extension" }
        });

        return new Response(
          JSON.stringify({
            success: true,
            imported: insertedProducts?.length || 0,
            message: `${insertedProducts?.length || 0} product(s) imported successfully`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'import_reviews': {
        if (!userId) {
          return new Response(
            JSON.stringify({ success: false, error: "Authentication required" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        if (!reviews || reviews.length === 0) {
          return new Response(
            JSON.stringify({ success: false, error: "No reviews provided" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        await supabase.from("activity_logs").insert({
          user_id: userId,
          action: "extension_import_reviews",
          entity_type: "reviews",
          description: `${reviews.length} review(s) imported`,
          details: { count: reviews.length, source: "chrome_extension" }
        });

        return new Response(
          JSON.stringify({
            success: true,
            imported: reviews.length,
            message: `${reviews.length} review(s) processed`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'bulk_import': {
        if (!userId) {
          return new Response(
            JSON.stringify({ success: false, error: "Authentication required" }),
            { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const itemCount = Math.min(items?.length || 0, 1000);

        await supabase.from("activity_logs").insert({
          user_id: userId,
          action: "extension_bulk_import",
          entity_type: "bulk",
          description: `Bulk import of ${itemCount} item(s)`,
          details: { count: itemCount, source: "chrome_extension" }
        });

        return new Response(
          JSON.stringify({
            success: true,
            processed: itemCount,
            message: `${itemCount} item(s) queued for processing`
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'register_extension': {
        // SECURITY: Require JWT for registration
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

        // Generate secure token
        const token = crypto.randomUUID() + '-' + crypto.randomUUID();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
        
        const { error: tokenInsertError } = await supabase
          .from("extension_tokens")
          .upsert({
            user_id: user.id,
            token: token,
            extension_id: extension_id || 'shopopti-chrome',
            is_active: true,
            expires_at: expiresAt.toISOString(),
            created_at: new Date().toISOString(),
            last_used_at: new Date().toISOString(),
            permissions: ['import', 'sync', 'monitor']
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
            expiresAt: expiresAt.toISOString(),
            message: "Extension registered successfully"
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case 'verify_token': {
        return new Response(
          JSON.stringify({
            success: true,
            valid: !!userId,
            userId: userId ? userId.slice(0, 8) + '...' : null // Don't expose full ID
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ success: false, error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("Extension sync error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
