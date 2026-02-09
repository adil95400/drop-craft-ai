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

function mapPresetRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    scope: row.scope,
    store_id: row.store_id,
    platform: row.platform,
    version: row.version,
    is_default: row.is_default,
    columns_signature: row.columns_signature,
    columns: row.columns,
    has_header: row.has_header,
    delimiter: row.delimiter,
    encoding: row.encoding,
    mapping: row.mapping,
    last_used_at: row.last_used_at,
    use_count: row.usage_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// ── Preset Handlers ──────────────────────────────────────────────────────────

async function listPresets(url: URL, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const platform = url.searchParams.get("platform");
  const q = url.searchParams.get("q");

  const admin = serviceClient();
  let query = admin
    .from("mapping_presets")
    .select("*", { count: "exact" })
    .eq("user_id", auth.user.id)
    .order("usage_count", { ascending: false })
    .range(from, to);

  if (platform) query = query.eq("platform", platform);
  if (q) query = query.ilike("name", `%${q}%`);

  const { data, count, error } = await query;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);

  return json({ items: (data ?? []).map(mapPresetRow), meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function createPreset(req: Request, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const body = await req.json();
  if (!body.name) return errorResponse("VALIDATION_ERROR", "name is required", 400, reqId, [{ field: "name", reason: "required" }]);
  if (!body.mapping || typeof body.mapping !== "object") return errorResponse("VALIDATION_ERROR", "mapping is required", 400, reqId, [{ field: "mapping", reason: "required" }]);

  const admin = serviceClient();
  const { data, error } = await admin
    .from("mapping_presets")
    .insert({
      user_id: auth.user.id,
      name: body.name,
      mapping: body.mapping,
      platform: body.platform ?? "generic",
      scope: body.scope ?? "user",
      store_id: body.store_id ?? null,
      has_header: body.has_header ?? true,
      delimiter: body.delimiter ?? ",",
      encoding: body.encoding ?? "utf-8",
      columns: body.columns ?? null,
      columns_signature: body.columns ? await sha256(body.columns.sort().join("|")) : null,
      icon: body.icon ?? "csv",
    })
    .select("id, version")
    .single();

  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ id: data.id, version: data.version }, 201, reqId);
}

async function getPreset(presetId: string, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("mapping_presets")
    .select("*")
    .eq("id", presetId)
    .eq("user_id", auth.user.id)
    .single();

  if (error || !data) return errorResponse("NOT_FOUND", "Preset not found", 404, reqId);
  return json(mapPresetRow(data), 200, reqId);
}

async function updatePreset(presetId: string, req: Request, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const body = await req.json();
  const admin = serviceClient();

  // Fetch current to increment version
  const { data: current } = await admin.from("mapping_presets").select("version").eq("id", presetId).eq("user_id", auth.user.id).single();
  if (!current) return errorResponse("NOT_FOUND", "Preset not found", 404, reqId);

  const updates: any = { version: current.version + 1, updated_at: new Date().toISOString() };
  if (body.name !== undefined) updates.name = body.name;
  if (body.mapping !== undefined) updates.mapping = body.mapping;
  if (body.platform !== undefined) updates.platform = body.platform;
  if (body.columns !== undefined) {
    updates.columns = body.columns;
    updates.columns_signature = await sha256(body.columns.sort().join("|"));
  }
  if (body.has_header !== undefined) updates.has_header = body.has_header;
  if (body.delimiter !== undefined) updates.delimiter = body.delimiter;
  if (body.encoding !== undefined) updates.encoding = body.encoding;

  const { data, error } = await admin
    .from("mapping_presets")
    .update(updates)
    .eq("id", presetId)
    .eq("user_id", auth.user.id)
    .select("id, version")
    .single();

  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ id: data.id, version: data.version }, 200, reqId);
}

async function deletePreset(presetId: string, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const admin = serviceClient();
  const { error } = await admin.from("mapping_presets").delete().eq("id", presetId).eq("user_id", auth.user.id);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ success: true }, 200, reqId);
}

async function setPresetDefault(presetId: string, req: Request, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const body = await req.json().catch(() => ({}));
  const admin = serviceClient();

  // Get preset to know platform
  const { data: preset } = await admin.from("mapping_presets").select("platform").eq("id", presetId).eq("user_id", auth.user.id).single();
  if (!preset) return errorResponse("NOT_FOUND", "Preset not found", 404, reqId);

  // Unset current defaults for same user + platform
  await admin.from("mapping_presets").update({ is_default: false }).eq("user_id", auth.user.id).eq("platform", preset.platform).eq("is_default", true);

  // Set new default
  await admin.from("mapping_presets").update({ is_default: true }).eq("id", presetId);

  return json({ id: presetId, is_default: true }, 200, reqId);
}

async function exportPreset(presetId: string, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin.from("mapping_presets").select("*").eq("id", presetId).eq("user_id", auth.user.id).single();
  if (error || !data) return errorResponse("NOT_FOUND", "Preset not found", 404, reqId);

  const { id, user_id, created_at, updated_at, usage_count, last_used_at, ...exportable } = data;
  return json({ preset: exportable }, 200, reqId);
}

async function importPreset(req: Request, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const body = await req.json();
  if (!body.preset) return errorResponse("VALIDATION_ERROR", "preset object required", 400, reqId);

  const p = body.preset;
  const admin = serviceClient();
  const { data, error } = await admin
    .from("mapping_presets")
    .insert({
      user_id: auth.user.id,
      name: p.name ?? "Imported Preset",
      mapping: p.mapping ?? {},
      platform: p.platform ?? "generic",
      scope: p.scope ?? "user",
      store_id: p.store_id ?? null,
      has_header: p.has_header ?? true,
      delimiter: p.delimiter ?? ",",
      encoding: p.encoding ?? "utf-8",
      columns: p.columns ?? null,
      columns_signature: p.columns_signature ?? null,
      icon: p.icon ?? "csv",
      version: 1,
    })
    .select("id, version")
    .single();

  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ id: data.id, version: data.version }, 201, reqId);
}

// ── CSV Upload Handlers ──────────────────────────────────────────────────────

async function createUploadSession(req: Request, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const body = await req.json();
  if (!body.filename) return errorResponse("VALIDATION_ERROR", "filename is required", 400, reqId);

  const admin = serviceClient();
  const uploadId = crypto.randomUUID();
  const filePath = `imports/${auth.user.id}/${uploadId}/${body.filename}`;

  // Create signed upload URL
  const { data: signedData, error: signError } = await admin.storage
    .from("import-files")
    .createSignedUploadUrl(filePath);

  // If bucket doesn't exist, create a record without signed URL (client can upload via other means)
  const uploadUrl = signedData?.signedUrl ?? null;

  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();

  const { data, error } = await admin
    .from("import_uploads")
    .insert({
      id: uploadId,
      user_id: auth.user.id,
      filename: body.filename,
      file_path: filePath,
      status: "pending",
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);

  return json({ upload_id: data.id, upload_url: uploadUrl, expires_at: expiresAt }, 201, reqId);
}

async function analyzeUpload(uploadId: string, req: Request, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const body = await req.json().catch(() => ({}));
  const admin = serviceClient();

  // Verify ownership
  const { data: upload } = await admin.from("import_uploads").select("*").eq("id", uploadId).eq("user_id", auth.user.id).single();
  if (!upload) return errorResponse("NOT_FOUND", "Upload not found", 404, reqId);

  // Try to download and parse the file
  let columns: string[] = upload.columns ?? [];
  let sampleRows: any[] = [];
  let signature: string | null = upload.columns_signature;

  if (upload.file_path) {
    const { data: fileData } = await admin.storage.from("import-files").download(upload.file_path);
    if (fileData) {
      const text = await fileData.text();
      const delimiter = body.delimiter === "auto" ? detectDelimiter(text) : (body.delimiter ?? upload.delimiter ?? ",");
      const hasHeader = body.has_header ?? upload.has_header ?? true;
      const lines = text.split("\n").filter((l: string) => l.trim());

      if (hasHeader && lines.length > 0) {
        columns = lines[0].split(delimiter).map((c: string) => c.trim().replace(/^"|"$/g, ""));
      }

      // Sample rows (max 5)
      const dataLines = hasHeader ? lines.slice(1, 6) : lines.slice(0, 5);
      sampleRows = dataLines.map((line: string) => {
        const values = line.split(delimiter).map((v: string) => v.trim().replace(/^"|"$/g, ""));
        const row: Record<string, string> = {};
        columns.forEach((col, i) => { row[col] = values[i] ?? ""; });
        return row;
      });

      signature = await sha256(columns.sort().join("|"));

      // Update upload record
      await admin.from("import_uploads").update({
        columns,
        sample_rows: sampleRows,
        columns_signature: signature,
        has_header: hasHeader,
        delimiter,
        status: "analyzed",
        updated_at: new Date().toISOString(),
      }).eq("id", uploadId);
    }
  }

  // Suggest mapping based on column names
  const suggestedMapping = suggestMapping(columns);

  // Find matching presets by signature
  let matchingPresets: any[] = [];
  if (signature) {
    const { data: presets } = await admin
      .from("mapping_presets")
      .select("id, name, columns_signature, usage_count")
      .eq("user_id", auth.user.id)
      .eq("columns_signature", signature);

    matchingPresets = (presets ?? []).map(p => ({
      preset_id: p.id,
      name: p.name,
      confidence: 1.0,
    }));
  }

  // Also find partial matches by platform heuristics
  if (matchingPresets.length === 0 && columns.length > 0) {
    const { data: allPresets } = await admin
      .from("mapping_presets")
      .select("id, name, columns")
      .eq("user_id", auth.user.id)
      .not("columns", "is", null);

    for (const p of allPresets ?? []) {
      if (!p.columns) continue;
      const overlap = (p.columns as string[]).filter((c: string) => columns.includes(c)).length;
      const confidence = overlap / Math.max(columns.length, (p.columns as string[]).length);
      if (confidence > 0.5) {
        matchingPresets.push({ preset_id: p.id, name: p.name, confidence: Math.round(confidence * 100) / 100 });
      }
    }
    matchingPresets.sort((a: any, b: any) => b.confidence - a.confidence);
  }

  // Update matching presets in upload
  await admin.from("import_uploads").update({
    suggested_mapping: suggestedMapping,
    matching_presets: matchingPresets,
  }).eq("id", uploadId);

  return json({ columns, sample_rows: sampleRows, signature, suggested_mapping: suggestedMapping, matching_presets: matchingPresets }, 200, reqId);
}

// ── Utility functions ────────────────────────────────────────────────────────

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0] ?? "";
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0, "|": 0 };
  for (const char of Object.keys(counts)) {
    counts[char] = firstLine.split(char).length - 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

const FIELD_SYNONYMS: Record<string, string[]> = {
  title: ["title", "product title", "product_title", "name", "product name", "product_name", "nom", "titre"],
  sku: ["sku", "variant sku", "variant_sku", "reference", "ref", "code"],
  price: ["price", "sale price", "sale_price", "prix", "prix_vente", "variant price"],
  description: ["description", "body", "body_html", "body html", "desc"],
  images: ["image", "image_url", "image url", "images", "image src", "image_src", "photo"],
  stock: ["stock", "inventory", "quantity", "qty", "inventory_quantity"],
  weight: ["weight", "poids", "weight_value"],
  category: ["category", "type", "product type", "product_type", "categorie"],
  brand: ["brand", "vendor", "marque", "manufacturer"],
  barcode: ["barcode", "gtin", "ean", "upc", "isbn"],
};

function suggestMapping(columns: string[]): Record<string, { field: string }> {
  const mapping: Record<string, { field: string }> = {};
  for (const col of columns) {
    const lower = col.toLowerCase().trim();
    for (const [field, synonyms] of Object.entries(FIELD_SYNONYMS)) {
      if (synonyms.includes(lower)) {
        mapping[col] = { field };
        break;
      }
    }
  }
  return mapping;
}

// ── Router ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const reqId = requestId(req);
  const url = new URL(req.url);
  const fullPath = url.pathname;
  const apiPath = fullPath.replace(/^\/api-v1/, "") || "/";

  try {
    // ── Health (public) ───────────────────────────────────────
    if (req.method === "GET" && (apiPath === "/v1/health" || apiPath === "/v1")) {
      return json({ status: "ok", version: "1.0.0", timestamp: new Date().toISOString() }, 200, reqId);
    }

    const auth = await authenticate(req);
    if (!auth) return errorResponse("UNAUTHORIZED", "Valid Bearer token required", 401, reqId);

    // ── Import Jobs ────────────────────────────────────────────
    if (req.method === "POST" && matchRoute("/v1/import/jobs", apiPath)) return await createImportJob(req, auth, reqId);
    if (req.method === "GET" && matchRoute("/v1/import/jobs", apiPath)) return await listImportJobs(url, auth, reqId);

    const jobMatch = matchRoute("/v1/import/jobs/:jobId", apiPath);
    if (req.method === "GET" && jobMatch) return await getImportJob(jobMatch.params.jobId, auth, reqId);

    const itemsMatch = matchRoute("/v1/import/jobs/:jobId/items", apiPath);
    if (req.method === "GET" && itemsMatch) return await getJobItems(itemsMatch.params.jobId, url, auth, reqId);

    const retryMatch = matchRoute("/v1/import/jobs/:jobId/retry", apiPath);
    if (req.method === "POST" && retryMatch) return await retryJob(retryMatch.params.jobId, req, auth, reqId);

    const cancelMatch = matchRoute("/v1/import/jobs/:jobId/cancel", apiPath);
    if (req.method === "POST" && cancelMatch) return await cancelJob(cancelMatch.params.jobId, auth, reqId);

    // ── Presets ─────────────────────────────────────────────────
    if (req.method === "GET" && matchRoute("/v1/import/presets", apiPath)) return await listPresets(url, auth, reqId);
    if (req.method === "POST" && matchRoute("/v1/import/presets", apiPath)) return await createPreset(req, auth, reqId);
    if (req.method === "POST" && matchRoute("/v1/import/presets/import", apiPath)) return await importPreset(req, auth, reqId);

    const presetMatch = matchRoute("/v1/import/presets/:presetId", apiPath);
    if (req.method === "GET" && presetMatch) return await getPreset(presetMatch.params.presetId, auth, reqId);
    if (req.method === "PUT" && presetMatch) return await updatePreset(presetMatch.params.presetId, req, auth, reqId);
    if (req.method === "DELETE" && presetMatch) return await deletePreset(presetMatch.params.presetId, auth, reqId);

    const defaultMatch = matchRoute("/v1/import/presets/:presetId/default", apiPath);
    if (req.method === "POST" && defaultMatch) return await setPresetDefault(defaultMatch.params.presetId, req, auth, reqId);

    const exportMatch = matchRoute("/v1/import/presets/:presetId/export", apiPath);
    if (req.method === "GET" && exportMatch) return await exportPreset(exportMatch.params.presetId, auth, reqId);

    // ── CSV Uploads ─────────────────────────────────────────────
    if (req.method === "POST" && matchRoute("/v1/import/csv/uploads", apiPath)) return await createUploadSession(req, auth, reqId);

    const analyzeMatch = matchRoute("/v1/import/csv/uploads/:uploadId/analyze", apiPath);
    if (req.method === "POST" && analyzeMatch) return await analyzeUpload(analyzeMatch.params.uploadId, req, auth, reqId);

    return errorResponse("NOT_FOUND", `Route ${req.method} ${apiPath} not found`, 404, reqId);
  } catch (err) {
    console.error("Unhandled error:", err);
    return errorResponse("INTERNAL_ERROR", "Internal server error", 500, reqId);
  }
});
