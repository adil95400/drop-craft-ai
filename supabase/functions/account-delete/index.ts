import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { handleCorsPreflightSecure, createSecureCorsResponse } from "../_shared/cors.ts";

Deno.serve(async (req) => {
  const preflight = handleCorsPreflightSecure(req);
  if (preflight) return preflight;

  const origin = req.headers.get("origin");
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return createSecureCorsResponse({ error: "Unauthorized" }, origin, 401);
  }

  const url = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !serviceKey) {
    return createSecureCorsResponse(
      { error: "Server misconfigured" },
      origin,
      500
    );
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  try {
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) {
      return createSecureCorsResponse({ error: "Unauthorized" }, origin, 401);
    }

    const userId = userData.user.id;

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      return createSecureCorsResponse({ error: deleteError.message }, origin, 400);
    }

    return createSecureCorsResponse({ ok: true }, origin, 200);
  } catch (e) {
    return createSecureCorsResponse(
      { error: e instanceof Error ? e.message : "Unknown error" },
      origin,
      500
    );
  }
});
