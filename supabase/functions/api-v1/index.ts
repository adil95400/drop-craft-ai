import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, idempotency-key, x-request-id",
  "Access-Control-Expose-Headers": "x-request-id",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function requestId(req: Request): string {
  return req.headers.get("x-request-id") ?? crypto.randomUUID();
}

function json(body: unknown, status = 200, reqId: string) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "x-request-id": reqId },
  });
}

function errorResponse(code: string, message: string, status: number, reqId: string, details?: unknown) {
  return json({ error: { code, message, ...(details ? { details } : {}) } }, status, reqId);
}

function parsePagination(url: URL) {
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("per_page") ?? "20", 10)));
  return { page, perPage, from: (page - 1) * perPage, to: page * perPage - 1 };
}

async function authenticate(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { user, supabase };
}

function serviceClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ── Route matching ───────────────────────────────────────────────────────────

interface RouteMatch {
  params: Record<string, string>;
}

function matchRoute(pattern: string, path: string): RouteMatch | null {
  const patternParts = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(":")) {
      params[patternParts[i].slice(1)] = pathParts[i];
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return { params };
}

// ── Import Jobs Handlers ─────────────────────────────────────────────────────

async function createImportJob(req: Request, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const body = await req.json();
  const { source, preset_id, options } = body;

  if (!source?.type) {
    return errorResponse("VALIDATION_ERROR", "source.type is required", 400, reqId, [{ field: "source.type", reason: "required" }]);
  }

  const admin = serviceClient();

  // Create the background job
  const { data: job, error } = await admin
    .from("background_jobs")
    .insert({
      user_id: auth.user.id,
      job_type: "import",
      job_subtype: source.type,
      status: "queued",
      name: `Import ${source.type}`,
      input_data: { source, preset_id, options },
      metadata: {
        idempotency_key: req.headers.get("idempotency-key"),
        source_type: source.type,
      },
      items_total: 0,
      items_processed: 0,
      items_succeeded: 0,
      items_failed: 0,
      progress_percent: 0,
    })
    .select("id, status")
    .single();

  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);

  return json({ job_id: job.id, status: job.status }, 201, reqId);
}

async function listImportJobs(url: URL, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const status = url.searchParams.get("status");

  const admin = serviceClient();
  let query = admin
    .from("background_jobs")
    .select("*", { count: "exact" })
    .eq("user_id", auth.user.id)
    .eq("job_type", "import")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status) {
    const statuses = status.split("|");
    query = query.in("status", statuses);
  }

  const { data, count, error } = await query;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);

  const items = (data ?? []).map(mapJobRow);
  return json({ items, meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function getImportJob(jobId: string, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("background_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", auth.user.id)
    .eq("job_type", "import")
    .single();

  if (error || !data) return errorResponse("NOT_FOUND", "Job not found", 404, reqId);

  const job = mapJobRow(data);

  // Calculate ETA
  if (data.started_at && data.items_total && data.items_processed && data.items_processed > 0) {
    const elapsed = Date.now() - new Date(data.started_at).getTime();
    const msPerItem = elapsed / data.items_processed;
    const remaining = data.items_total - data.items_processed;
    (job as any).eta_seconds = Math.round((remaining * msPerItem) / 1000);
  }

  return json(job, 200, reqId);
}

async function getJobItems(jobId: string, url: URL, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const status = url.searchParams.get("status");

  const admin = serviceClient();

  // Verify job ownership
  const { data: job } = await admin
    .from("background_jobs")
    .select("id")
    .eq("id", jobId)
    .eq("user_id", auth.user.id)
    .single();

  if (!job) return errorResponse("NOT_FOUND", "Job not found", 404, reqId);

  let query = admin
    .from("import_job_items")
    .select("*", { count: "exact" })
    .eq("job_id", jobId)
    .order("row_number", { ascending: true })
    .range(from, to);

  if (status) query = query.eq("status", status);

  const { data, count, error } = await query;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);

  const items = (data ?? []).map((row: any) => ({
    item_id: row.id,
    row_number: row.row_number,
    status: row.status,
    errors: row.errors ?? [],
    warnings: row.warnings ?? [],
    raw: row.raw_data,
    mapped: row.mapped_data,
    product_id: row.product_id,
    created_at: row.created_at,
  }));

  return json({ items, meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function retryJob(jobId: string, req: Request, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const admin = serviceClient();
  const body = await req.json().catch(() => ({}));
  const onlyFailed = body.only_failed !== false;

  // Verify ownership
  const { data: job } = await admin
    .from("background_jobs")
    .select("id, status")
    .eq("id", jobId)
    .eq("user_id", auth.user.id)
    .single();

  if (!job) return errorResponse("NOT_FOUND", "Job not found", 404, reqId);

  // Reset failed items
  const updateQuery = admin
    .from("import_job_items")
    .update({ status: "pending", errors: [], updated_at: new Date().toISOString() })
    .eq("job_id", jobId);

  if (onlyFailed) updateQuery.eq("status", "failed");

  const { error: itemsError } = await updateQuery;
  if (itemsError) return errorResponse("DB_ERROR", itemsError.message, 500, reqId);

  // Reset job status
  await admin
    .from("background_jobs")
    .update({ status: "queued", updated_at: new Date().toISOString() })
    .eq("id", jobId);

  return json({ job_id: jobId, status: "queued" }, 200, reqId);
}

async function cancelJob(jobId: string, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const admin = serviceClient();

  const { data: job } = await admin
    .from("background_jobs")
    .select("id, status")
    .eq("id", jobId)
    .eq("user_id", auth.user.id)
    .single();

  if (!job) return errorResponse("NOT_FOUND", "Job not found", 404, reqId);
  if (job.status === "completed" || job.status === "cancelled") {
    return errorResponse("INVALID_STATE", `Cannot cancel job in ${job.status} state`, 409, reqId);
  }

  await admin
    .from("background_jobs")
    .update({ status: "cancelled", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", jobId);

  return json({ job_id: jobId, status: "cancelled" }, 200, reqId);
}

// ── Mappers ──────────────────────────────────────────────────────────────────

function mapJobRow(row: any) {
  return {
    job_id: row.id,
    status: row.status,
    job_type: row.job_subtype ?? row.job_type,
    name: row.name,
    progress: {
      total: row.items_total ?? 0,
      processed: row.items_processed ?? 0,
      success: row.items_succeeded ?? 0,
      failed: row.items_failed ?? 0,
      percent: row.progress_percent ?? 0,
    },
    created_at: row.created_at,
    started_at: row.started_at,
    completed_at: row.completed_at,
    error_message: row.error_message,
  };
}

// ── Router ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const reqId = requestId(req);
  const url = new URL(req.url);

  // Strip the function path prefix to get the API path
  // Edge function URL: /api-v1/v1/import/jobs → path = /v1/import/jobs
  const fullPath = url.pathname;
  const apiPath = fullPath.replace(/^\/api-v1/, "") || "/";

  try {
    // ── Health (public) ───────────────────────────────────────
    if (req.method === "GET" && (apiPath === "/v1/health" || apiPath === "/v1")) {
      return json({ status: "ok", version: "1.0.0", timestamp: new Date().toISOString() }, 200, reqId);
    }

    // Auth check for all other routes
    const auth = await authenticate(req);
    if (!auth) {
      return errorResponse("UNAUTHORIZED", "Valid Bearer token required", 401, reqId);
    }

    // ── Import Jobs ────────────────────────────────────────────
    if (req.method === "POST" && matchRoute("/v1/import/jobs", apiPath)) {
      return await createImportJob(req, auth, reqId);
    }

    if (req.method === "GET" && matchRoute("/v1/import/jobs", apiPath)) {
      return await listImportJobs(url, auth, reqId);
    }

    const jobMatch = matchRoute("/v1/import/jobs/:jobId", apiPath);
    if (req.method === "GET" && jobMatch) {
      return await getImportJob(jobMatch.params.jobId, auth, reqId);
    }

    const itemsMatch = matchRoute("/v1/import/jobs/:jobId/items", apiPath);
    if (req.method === "GET" && itemsMatch) {
      return await getJobItems(itemsMatch.params.jobId, url, auth, reqId);
    }

    const retryMatch = matchRoute("/v1/import/jobs/:jobId/retry", apiPath);
    if (req.method === "POST" && retryMatch) {
      return await retryJob(retryMatch.params.jobId, req, auth, reqId);
    }

    const cancelMatch = matchRoute("/v1/import/jobs/:jobId/cancel", apiPath);
    if (req.method === "POST" && cancelMatch) {
      return await cancelJob(cancelMatch.params.jobId, auth, reqId);
    }

    // ── Health already handled above ──────────────────────────

    return errorResponse("NOT_FOUND", `Route ${req.method} ${apiPath} not found`, 404, reqId);
  } catch (err) {
    console.error("Unhandled error:", err);
    return errorResponse("INTERNAL_ERROR", "Internal server error", 500, reqId);
  }
});
