import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getSecureCorsHeaders, handleCorsPreflightSecure } from "../_shared/secure-cors.ts";

Deno.serve(async (req) => {
  const corsHeaders = getSecureCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return handleCorsPreflightSecure(req);
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { accessToken, email } = await req.json();
    const apiKey = accessToken?.trim();
    const cjEmail = email?.trim();

    if (!apiKey) throw new Error("API Key CJ requis");
    if (!cjEmail) throw new Error("Email du compte CJ requis");

    // Step 1: Exchange API Key for Access Token
    const authResponse = await fetch(
      "https://developers.cjdropshipping.com/api2.0/v1/authentication/getAccessToken",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cjEmail, password: apiKey }),
      }
    );

    const authData = await authResponse.json();
    if (authData.code !== 200 || !authData.data?.accessToken) {
      throw new Error(`Erreur d'authentification CJ: ${authData.message || "API Key invalide"}`);
    }

    const finalAccessToken = authData.data.accessToken;
    const refreshToken = authData.data.refreshToken;

    // Step 2: Validate the token works
    const validationResponse = await fetch(
      "https://developers.cjdropshipping.com/api2.0/v1/product/list",
      {
        method: "POST",
        headers: {
          "CJ-Access-Token": finalAccessToken,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pageNum: 1, pageSize: 1 }),
      }
    );
    const validationData = await validationResponse.json();
    if (validationData.code !== 200) {
      throw new Error(`Token validation failed: ${validationData.message}`);
    }

    // 3. Find or create CJ supplier
    const { data: existingSupplier } = await supabase
      .from("suppliers")
      .select("id")
      .eq("user_id", user.id)
      .ilike("name", "%cj%")
      .single();

    let supplierId: string;
    if (existingSupplier) {
      supplierId = existingSupplier.id;
    } else {
      const { data: newSupplier, error: createError } = await supabase
        .from("suppliers")
        .insert({
          user_id: user.id,
          name: "CJ Dropshipping",
          type: "dropshipping",
          status: "active",
          api_type: "cj",
          country: "CN",
          currency: "USD",
        })
        .select("id")
        .single();
      if (createError) throw createError;
      supplierId = newSupplier.id;
    }

    // 4. Store credentials in vault
    const credentialsData = {
      connection_status: "active",
      connection_type: "api",
      access_token_encrypted: finalAccessToken,
      oauth_data: {
        accessToken: finalAccessToken,
        refreshToken,
        apiKey,
        email: cjEmail,
        connectorId: "cjdropshipping",
        platform: "CJ Dropshipping",
        validatedAt: new Date().toISOString(),
      },
      last_validation_at: new Date().toISOString(),
      last_error: null,
      error_count: 0,
    };

    const { data: existingCred } = await supabase
      .from("supplier_credentials_vault")
      .select("id")
      .eq("user_id", user.id)
      .eq("supplier_id", supplierId)
      .single();

    if (existingCred) {
      await supabase
        .from("supplier_credentials_vault")
        .update(credentialsData)
        .eq("id", existingCred.id);
    } else {
      await supabase.from("supplier_credentials_vault").insert({
        user_id: user.id,
        supplier_id: supplierId,
        ...credentialsData,
      });
    }

    // 5. Trigger product sync
    const { data: syncData } = await supabase.functions
      .invoke("supplier-sync-products", {
        body: { supplierId, limit: 100 },
        headers: { Authorization: authHeader },
      })
      .catch(() => ({ data: null }));

    if (syncData?.syncStats?.imported > 0) {
      await supabase
        .from("suppliers")
        .update({ product_count: syncData.syncStats.imported })
        .eq("id", supplierId);
    }

    // 6. Log activity
    await supabase.from("activity_logs").insert({
      user_id: user.id,
      action: "supplier_connect",
      entity_type: "supplier",
      entity_id: supplierId,
      description: "Connected CJ Dropshipping supplier",
      details: { supplier: "CJ Dropshipping", productsImported: syncData?.syncStats?.imported || 0 },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "CJ Dropshipping connected and synchronized",
        supplierId,
        syncStats: syncData?.syncStats || null,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[add-cj-credentials] Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
