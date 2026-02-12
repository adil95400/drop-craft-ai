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

// ── AI Enrichment Handlers ───────────────────────────────────────────────────

async function createAiEnrichment(req: Request, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const body = await req.json();
  if (!body.product_ids?.length) return errorResponse("VALIDATION_ERROR", "product_ids required", 400, reqId, [{ field: "product_ids", reason: "required" }]);

  const admin = serviceClient();
  const { data: job, error } = await admin
    .from("background_jobs")
    .insert({
      user_id: auth.user.id,
      job_type: "ai_enrichment",
      job_subtype: "seo",
      status: "queued",
      name: `AI Enrichment (${body.product_ids.length} products)`,
      input_data: {
        product_ids: body.product_ids,
        language: body.language ?? "fr",
        tone: body.tone ?? "premium",
        targets: body.targets ?? ["seo_title", "meta_description", "tags"],
        store_id: body.store_id,
      },
      metadata: { idempotency_key: req.headers.get("idempotency-key") },
      items_total: body.product_ids.length,
      items_processed: 0,
      items_succeeded: 0,
      items_failed: 0,
      progress_percent: 0,
    })
    .select("id, status")
    .single();

  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);

  // Create individual job items for each product
  const items = body.product_ids.map((pid: string, i: number) => ({
    job_id: job.id,
    row_number: i + 1,
    status: "pending",
    raw_data: { product_id: pid },
    mapped_data: null,
    product_id: pid,
  }));

  await admin.from("import_job_items").insert(items);

  // Fire-and-forget: process enrichments asynchronously
  processAiEnrichments(job.id, auth.user.id, body).catch(console.error);

  return json({ job_id: job.id, status: "queued" }, 201, reqId);
}

async function processAiEnrichments(jobId: string, userId: string, params: any) {
  const admin = serviceClient();
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    await admin.from("background_jobs").update({ status: "failed", error_message: "LOVABLE_API_KEY not configured" }).eq("id", jobId);
    return;
  }

  await admin.from("background_jobs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", jobId);

  const { product_ids, language, tone, targets } = params;
  let succeeded = 0, failed = 0;

  for (let i = 0; i < product_ids.length; i++) {
    const productId = product_ids[i];
    try {
      // Fetch product
      const { data: product } = await admin.from("products").select("title, description, tags, seo_title, seo_description, sku").eq("id", productId).single();
      if (!product) throw new Error("Product not found");

      const prompt = `Tu es un expert SEO e-commerce. Génère du contenu optimisé pour ce produit.
Langue: ${language ?? "fr"}, Ton: ${tone ?? "premium"}
Produit: ${product.title}
Description actuelle: ${product.description ?? "aucune"}
Tags actuels: ${(product.tags ?? []).join(", ") || "aucun"}
SKU: ${product.sku ?? "N/A"}

Retourne UNIQUEMENT un JSON avec les champs demandés: ${(targets ?? ["seo_title", "meta_description", "tags"]).join(", ")}
Format: { "seo_title": "...", "meta_description": "...", "tags": ["..."] }`;

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!aiResp.ok) {
        const status = aiResp.status;
        throw new Error(status === 429 ? "Rate limited" : status === 402 ? "Credits exhausted" : `AI error ${status}`);
      }

      const aiData = await aiResp.json();
      const content = aiData.choices?.[0]?.message?.content ?? "";

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const generated = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      // Update product with generated content
      const updates: any = {};
      if (generated.seo_title) updates.seo_title = generated.seo_title;
      if (generated.meta_description) updates.seo_description = generated.meta_description;
      if (generated.tags) updates.tags = generated.tags;

      if (Object.keys(updates).length > 0) {
        await admin.from("products").update(updates).eq("id", productId);
      }

      // Update job item
      await admin.from("import_job_items").update({
        status: "success",
        mapped_data: generated,
        updated_at: new Date().toISOString(),
      }).eq("job_id", jobId).eq("product_id", productId);

      succeeded++;
    } catch (err: any) {
      await admin.from("import_job_items").update({
        status: "failed",
        errors: [{ code: "AI_ERROR", message: err.message }],
        updated_at: new Date().toISOString(),
      }).eq("job_id", jobId).eq("product_id", productId);
      failed++;
    }

    // Update progress
    const processed = succeeded + failed;
    await admin.from("background_jobs").update({
      items_processed: processed,
      items_succeeded: succeeded,
      items_failed: failed,
      progress_percent: Math.round((processed / product_ids.length) * 100),
      updated_at: new Date().toISOString(),
    }).eq("id", jobId);
  }

  await admin.from("background_jobs").update({
    status: failed === product_ids.length ? "failed" : "completed",
    completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", jobId);
}

async function getAiEnrichment(jobId: string, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("background_jobs")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", auth.user.id)
    .eq("job_type", "ai_enrichment")
    .single();

  if (error || !data) return errorResponse("NOT_FOUND", "Enrichment job not found", 404, reqId);
  const job = mapJobRow(data);
  return json(job, 200, reqId);
}

async function getAiEnrichmentItems(jobId: string, url: URL, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  // Reuse the same getJobItems logic — items are in import_job_items
  return await getJobItems(jobId, url, auth, reqId);
}

// ── Drafts Handlers ──────────────────────────────────────────────────────────

async function listDrafts(url: URL, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const admin = serviceClient();

  const { data, count, error } = await admin
    .from("products")
    .select("id, title, description, sku, cost_price, status, images, tags, seo_title, seo_description, created_at, updated_at", { count: "exact" })
    .eq("user_id", auth.user.id)
    .eq("status", "draft")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);

  return json({
    items: data ?? [],
    meta: { page, per_page: perPage, total: count ?? 0 },
  }, 200, reqId);
}

async function publishDrafts(req: Request, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const body = await req.json();
  if (!body.draft_ids?.length) return errorResponse("VALIDATION_ERROR", "draft_ids required", 400, reqId);

  const admin = serviceClient();

  // Verify ownership and draft status
  const { data: drafts, error: fetchErr } = await admin
    .from("products")
    .select("id, status")
    .eq("user_id", auth.user.id)
    .in("id", body.draft_ids)
    .eq("status", "draft");

  if (fetchErr) return errorResponse("DB_ERROR", fetchErr.message, 500, reqId);

  const validIds = (drafts ?? []).map((d: any) => d.id);
  if (validIds.length === 0) return errorResponse("NOT_FOUND", "No valid drafts found", 404, reqId);

  // Update status to active
  const { error: updateErr } = await admin
    .from("products")
    .update({ status: "active", updated_at: new Date().toISOString() })
    .in("id", validIds);

  if (updateErr) return errorResponse("DB_ERROR", updateErr.message, 500, reqId);

  return json({
    published: validIds.length,
    skipped: body.draft_ids.length - validIds.length,
    product_ids: validIds,
  }, 200, reqId);
}

// ── Products CRUD Handlers ───────────────────────────────────────────────────

function mapProductRow(row: any) {
  const imagesArr = Array.isArray(row.images) ? row.images : [];
  const allImages = [
    ...imagesArr,
    ...(row.image_url && !imagesArr.includes(row.image_url) ? [row.image_url] : []),
  ].filter((img: string) => typeof img === "string" && img.startsWith("http"));

  return {
    id: row.id,
    name: row.name || row.title || "Produit sans nom",
    title: row.title,
    description: row.description ?? null,
    sku: row.sku ?? null,
    barcode: row.barcode ?? null,
    price: row.price ?? 0,
    compare_at_price: row.compare_at_price ?? null,
    cost_price: row.cost_price ?? 0,
    category: row.category ?? null,
    brand: row.brand ?? null,
    supplier: row.supplier ?? null,
    supplier_url: row.supplier_url ?? null,
    supplier_product_id: row.supplier_product_id ?? null,
    status: row.status ?? "draft",
    stock_quantity: row.stock_quantity ?? 0,
    weight: row.weight ?? null,
    weight_unit: row.weight_unit ?? "kg",
    images: allImages,
    variants: Array.isArray(row.variants) ? row.variants : [],
    tags: row.tags ?? [],
    seo_title: row.seo_title ?? null,
    seo_description: row.seo_description ?? null,
    is_published: row.is_published ?? false,
    product_type: row.product_type ?? null,
    vendor: row.vendor ?? null,
    view_count: row.view_count ?? 0,
    profit_margin: row.cost_price && row.price > 0 ? Math.round(((row.price - row.cost_price) / row.price) * 10000) / 100 : null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

async function listProducts(url: URL, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const admin = serviceClient();

  let query = admin
    .from("products")
    .select("*", { count: "exact" })
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  const status = url.searchParams.get("status");
  if (status) query = query.eq("status", status);

  const category = url.searchParams.get("category");
  if (category) query = query.eq("category", category);

  const search = url.searchParams.get("q");
  if (search) query = query.or(`title.ilike.%${search}%,name.ilike.%${search}%,sku.ilike.%${search}%`);

  const low_stock = url.searchParams.get("low_stock");
  if (low_stock === "true") query = query.lt("stock_quantity", 10);

  const { data, count, error } = await query;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);

  return json({ items: (data ?? []).map(mapProductRow), meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function getProduct(productId: string, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("products")
    .select("*")
    .eq("id", productId)
    .eq("user_id", auth.user.id)
    .single();

  if (error || !data) return errorResponse("NOT_FOUND", "Product not found", 404, reqId);
  return json(mapProductRow(data), 200, reqId);
}

async function createProduct(req: Request, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const body = await req.json();
  if (!body.title && !body.name) return errorResponse("VALIDATION_ERROR", "title or name is required", 400, reqId);

  const admin = serviceClient();
  const { data, error } = await admin
    .from("products")
    .insert({
      user_id: auth.user.id,
      title: body.title ?? body.name,
      name: body.name ?? body.title,
      description: body.description ?? null,
      sku: body.sku ?? null,
      barcode: body.barcode ?? null,
      price: body.price ?? 0,
      compare_at_price: body.compare_at_price ?? null,
      cost_price: body.cost_price ?? 0,
      category: body.category ?? null,
      brand: body.brand ?? null,
      supplier: body.supplier ?? null,
      supplier_url: body.supplier_url ?? null,
      supplier_product_id: body.supplier_product_id ?? null,
      status: body.status ?? "draft",
      stock_quantity: body.stock_quantity ?? 0,
      weight: body.weight ?? null,
      weight_unit: body.weight_unit ?? "kg",
      images: body.images ?? [],
      image_url: Array.isArray(body.images) && body.images.length > 0 ? body.images[0] : body.image_url ?? null,
      variants: body.variants ?? [],
      tags: body.tags ?? [],
      seo_title: body.seo_title ?? null,
      seo_description: body.seo_description ?? null,
      product_type: body.product_type ?? null,
      vendor: body.vendor ?? null,
    })
    .select("id, status, created_at")
    .single();

  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ id: data.id, status: data.status, created_at: data.created_at }, 201, reqId);
}

async function updateProduct(productId: string, req: Request, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const body = await req.json();
  const admin = serviceClient();

  // Verify ownership
  const { data: existing } = await admin.from("products").select("id").eq("id", productId).eq("user_id", auth.user.id).single();
  if (!existing) return errorResponse("NOT_FOUND", "Product not found", 404, reqId);

  const updates: any = { updated_at: new Date().toISOString() };
  const allowedFields = [
    "title", "name", "description", "sku", "barcode", "price", "compare_at_price",
    "cost_price", "category", "brand", "supplier", "supplier_url", "supplier_product_id",
    "status", "stock_quantity", "weight", "weight_unit", "images", "variants", "tags",
    "seo_title", "seo_description", "is_published", "product_type", "vendor",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  // Sync image_url with images array
  if (body.images !== undefined) {
    updates.image_url = Array.isArray(body.images) && body.images.length > 0 ? body.images[0] : null;
  }

  const { data, error } = await admin
    .from("products")
    .update(updates)
    .eq("id", productId)
    .eq("user_id", auth.user.id)
    .select("id, status, updated_at")
    .single();

  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ id: data.id, status: data.status, updated_at: data.updated_at }, 200, reqId);
}

async function deleteProduct(productId: string, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const admin = serviceClient();
  const { error } = await admin.from("products").delete().eq("id", productId).eq("user_id", auth.user.id);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ success: true }, 200, reqId);
}

async function bulkUpdateProducts(req: Request, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const body = await req.json();
  if (!body.product_ids?.length) return errorResponse("VALIDATION_ERROR", "product_ids required", 400, reqId);
  if (!body.updates || typeof body.updates !== "object") return errorResponse("VALIDATION_ERROR", "updates required", 400, reqId);

  const admin = serviceClient();
  const updates: any = { ...body.updates, updated_at: new Date().toISOString() };
  // Prevent changing user_id or id
  delete updates.id;
  delete updates.user_id;

  const { error, count } = await admin
    .from("products")
    .update(updates)
    .eq("user_id", auth.user.id)
    .in("id", body.product_ids);

  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ updated: count ?? body.product_ids.length }, 200, reqId);
}

async function getProductStats(auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const admin = serviceClient();

  const [
    { count: total },
    { count: active },
    { count: draft },
    { count: lowStock },
    { count: outOfStock },
  ] = await Promise.all([
    admin.from("products").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id),
    admin.from("products").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id).eq("status", "active"),
    admin.from("products").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id).eq("status", "draft"),
    admin.from("products").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id).lt("stock_quantity", 10).gt("stock_quantity", 0),
    admin.from("products").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id).eq("stock_quantity", 0),
  ]);

  // Aggregate values
  const { data: agg } = await admin
    .from("products")
    .select("price, cost_price, stock_quantity")
    .eq("user_id", auth.user.id);

  let totalValue = 0, totalCost = 0, avgPrice = 0;
  if (agg && agg.length > 0) {
    for (const p of agg) {
      totalValue += (p.price ?? 0) * (p.stock_quantity ?? 0);
      totalCost += (p.cost_price ?? 0) * (p.stock_quantity ?? 0);
    }
    avgPrice = agg.reduce((s: number, p: any) => s + (p.price ?? 0), 0) / agg.length;
  }

  return json({
    total: total ?? 0,
    active: active ?? 0,
    draft: draft ?? 0,
    inactive: (total ?? 0) - (active ?? 0) - (draft ?? 0),
    low_stock: lowStock ?? 0,
    out_of_stock: outOfStock ?? 0,
    total_value: Math.round(totalValue * 100) / 100,
    total_cost: Math.round(totalCost * 100) / 100,
    total_profit: Math.round((totalValue - totalCost) * 100) / 100,
    avg_price: Math.round(avgPrice * 100) / 100,
    profit_margin: totalValue > 0 ? Math.round(((totalValue - totalCost) / totalValue) * 10000) / 100 : 0,
  }, 200, reqId);
}

// ── Product SEO / Metrics / Stock Endpoints ──────────────────────────────────

async function getProductSeo(productId: string, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const admin = serviceClient();
  const { data: product, error } = await admin
    .from("products")
    .select("id, title, description, seo_title, seo_description, images, tags, sku, brand, category, barcode, weight, status")
    .eq("id", productId).eq("user_id", auth.user.id).single();
  if (error || !product) return errorResponse("NOT_FOUND", "Product not found", 404, reqId);

  const scored = scoreProduct(product);

  // Fetch latest audit if exists
  const { data: latestAudit } = await admin.from("seo_scores")
    .select("*").eq("product_id", productId).eq("user_id", auth.user.id)
    .order("created_at", { ascending: false }).limit(1).maybeSingle();

  // Fetch history count
  const { count: historyCount } = await admin.from("seo_history_snapshots")
    .select("*", { count: "exact", head: true }).eq("product_id", productId).eq("user_id", auth.user.id);

  return json({
    ...scored,
    latest_audit: latestAudit ?? null,
    history_count: historyCount ?? 0,
  }, 200, reqId);
}

async function optimizeProduct(productId: string, req: Request, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const body = await req.json().catch(() => ({}));
  const admin = serviceClient();

  // Verify ownership
  const { data: product } = await admin.from("products")
    .select("id, title, description, tags, seo_title, seo_description, sku, brand, category")
    .eq("id", productId).eq("user_id", auth.user.id).single();
  if (!product) return errorResponse("NOT_FOUND", "Product not found", 404, reqId);

  // Snapshot before optimization
  await admin.from("seo_history_snapshots").insert({
    product_id: productId,
    user_id: auth.user.id,
    snapshot_type: "before_optimization",
    score_data: scoreProduct(product).score,
    seo_data: { seo_title: product.seo_title, seo_description: product.seo_description, tags: product.tags },
  });

  // Create AI enrichment job for this single product
  const { data: job, error } = await admin.from("background_jobs").insert({
    user_id: auth.user.id,
    job_type: "ai_enrichment",
    job_subtype: "product_optimize",
    status: "queued",
    name: `Optimize: ${product.title ?? product.id}`,
    input_data: {
      product_ids: [productId],
      language: body.language ?? "fr",
      tone: body.tone ?? "premium",
      targets: body.targets ?? ["seo_title", "meta_description", "tags"],
    },
    items_total: 1, items_processed: 0, items_succeeded: 0, items_failed: 0, progress_percent: 0,
  }).select("id, status").single();

  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);

  // Fire-and-forget
  processAiEnrichments(job.id, auth.user.id, {
    product_ids: [productId],
    language: body.language ?? "fr",
    tone: body.tone ?? "premium",
    targets: body.targets ?? ["seo_title", "meta_description", "tags"],
  }).catch(console.error);

  return json({ job_id: job.id, status: "queued", product_id: productId }, 202, reqId);
}

async function getProductMetrics(productId: string, url: URL, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const admin = serviceClient();
  const periodType = url.searchParams.get("period") ?? "daily";
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "30", 10));

  // Verify ownership
  const { data: product } = await admin.from("products").select("id").eq("id", productId).eq("user_id", auth.user.id).single();
  if (!product) return errorResponse("NOT_FOUND", "Product not found", 404, reqId);

  const { data: metrics, error } = await admin.from("product_metrics")
    .select("*")
    .eq("product_id", productId).eq("user_id", auth.user.id).eq("period_type", periodType)
    .order("period_start", { ascending: false })
    .limit(limit);

  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);

  // Summary
  const totalRevenue = (metrics ?? []).reduce((s: number, m: any) => s + (m.revenue ?? 0), 0);
  const totalOrders = (metrics ?? []).reduce((s: number, m: any) => s + (m.orders ?? 0), 0);
  const totalViews = (metrics ?? []).reduce((s: number, m: any) => s + (m.views ?? 0), 0);
  const avgConversion = totalViews > 0 ? totalOrders / totalViews : 0;

  return json({
    product_id: productId,
    period_type: periodType,
    summary: {
      total_revenue: Math.round(totalRevenue * 100) / 100,
      total_orders: totalOrders,
      total_views: totalViews,
      avg_conversion_rate: Math.round(avgConversion * 10000) / 100,
    },
    data_points: (metrics ?? []).reverse(),
  }, 200, reqId);
}

async function getProductStockHistory(productId: string, url: URL, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const admin = serviceClient();
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "30", 10));
  const snapshotType = url.searchParams.get("type") ?? "daily";

  const { data: product } = await admin.from("products").select("id").eq("id", productId).eq("user_id", auth.user.id).single();
  if (!product) return errorResponse("NOT_FOUND", "Product not found", 404, reqId);

  const { data, error } = await admin.from("stock_snapshots")
    .select("*")
    .eq("product_id", productId).eq("user_id", auth.user.id).eq("snapshot_type", snapshotType)
    .order("recorded_at", { ascending: false })
    .limit(limit);

  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);

  return json({ product_id: productId, snapshots: (data ?? []).reverse() }, 200, reqId);
}

// ── SEO Handlers ─────────────────────────────────────────────────────────────

async function createSeoAudit(req: Request, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const body = await req.json();
  if (!body.url) return errorResponse("VALIDATION_ERROR", "url is required", 400, reqId);

  const admin = serviceClient();
  const { data: audit, error } = await admin
    .from("seo_audits")
    .insert({
      user_id: auth.user.id,
      target_type: body.scope ?? body.target_type ?? "url",
      target_id: body.target_id ?? null,
      url: body.url,
      base_url: body.url,
      scope: body.options ? Object.keys(body.options).filter((k: string) => body.options[k]).join(",") : "full",
      provider: body.provider ?? "internal",
      language: body.language ?? "fr",
      status: "pending",
      mode: body.scope ?? "page",
    })
    .select("id, status")
    .single();

  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);

  // Fire-and-forget: run the audit asynchronously
  processSeoAudit(audit.id, auth.user.id, body).catch(console.error);

  return json({ audit_id: audit.id, status: "pending" }, 201, reqId);
}

async function processSeoAudit(auditId: string, userId: string, params: any) {
  const admin = serviceClient();
  const apiKey = Deno.env.get("OPENAI_API_KEY");

  await admin.from("seo_audits").update({ status: "running", started_at: new Date().toISOString() }).eq("id", auditId);

  if (!apiKey) {
    await admin.from("seo_audits").update({ status: "failed", error_message: "OPENAI_API_KEY not configured" }).eq("id", auditId);
    return;
  }

  try {
    const prompt = `Tu es un expert SEO. Analyse l'URL suivante et retourne un audit SEO structuré.
URL: ${params.url}
Langue: ${params.language ?? "fr"}

Retourne UNIQUEMENT un JSON avec cette structure:
{
  "score": <number 0-100>,
  "checks": [
    {
      "check_type": "<meta_title|meta_description|h1|images_alt|content_length|mobile_friendly|page_speed|canonical|robots|sitemap|ssl|structured_data>",
      "category": "<meta|content|structure|performance|mobile>",
      "status": "<pass|warning|fail>",
      "impact": "<critical|high|medium|low>",
      "current_value": "<what you found or estimated>",
      "expected_value": "<what is recommended>",
      "recommendation": "<actionable fix>"
    }
  ]
}
Génère au moins 8 checks couvrant meta, content, structure et performance.`;

    const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "Tu es un expert SEO e-commerce. Réponds uniquement en JSON valide." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      throw new Error(status === 429 ? "Rate limited – réessayez dans quelques instants" : status === 402 ? "Crédits IA épuisés – rechargez votre workspace" : `AI error ${status}`);
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { score: 0, checks: [] };

    // Insert audit items
    const checks = result.checks ?? [];
    if (checks.length > 0) {
      const items = checks.map((c: any) => ({
        audit_id: auditId,
        severity: c.status === "fail" ? "error" : c.status === "warning" ? "warning" : "info",
        code: c.check_type,
        message: c.recommendation ?? "",
        evidence: { current_value: c.current_value, expected_value: c.expected_value, impact: c.impact, category: c.category },
        recommendation: c.recommendation,
        is_fixable: c.status !== "pass",
      }));
      await admin.from("seo_issues").insert(items);
    }

    // Calculate summary scores by category
    const summary: any = {};
    for (const c of checks) {
      const cat = c.category ?? "meta";
      if (!summary[`${cat}_score`]) {
        const catChecks = checks.filter((x: any) => x.category === cat);
        const passed = catChecks.filter((x: any) => x.status === "pass").length;
        summary[`${cat}_score`] = catChecks.length > 0 ? Math.round((passed / catChecks.length) * 100) : 0;
      }
    }

    await admin.from("seo_audits").update({
      status: "completed",
      score: result.score ?? 0,
      summary: { ...summary, total_checks: checks.length, passed: checks.filter((c: any) => c.status === "pass").length },
      finished_at: new Date().toISOString(),
    }).eq("id", auditId);

  } catch (err: any) {
    await admin.from("seo_audits").update({
      status: "failed",
      error_message: err.message,
      finished_at: new Date().toISOString(),
    }).eq("id", auditId);
  }
}

async function listSeoAudits(url: URL, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const admin = serviceClient();

  let query = admin
    .from("seo_audits")
    .select("*", { count: "exact" })
    .eq("user_id", auth.user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  const targetType = url.searchParams.get("target_type");
  if (targetType) query = query.eq("target_type", targetType);

  const status = url.searchParams.get("status");
  if (status) query = query.eq("status", status);

  const { data, count, error } = await query;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);

  const items = (data ?? []).map((r: any) => ({
    audit_id: r.id,
    target_type: r.target_type ?? r.mode ?? "url",
    target_id: r.target_id,
    url: r.url ?? r.base_url,
    score: r.score,
    status: r.status,
    provider: r.provider ?? "internal",
    language: r.language ?? "fr",
    summary: r.summary,
    created_at: r.created_at,
    completed_at: r.finished_at,
  }));

  return json({ items, meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function getSeoAudit(auditId: string, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const admin = serviceClient();

  const { data: audit, error } = await admin
    .from("seo_audits")
    .select("*")
    .eq("id", auditId)
    .eq("user_id", auth.user.id)
    .single();

  if (error || !audit) return errorResponse("NOT_FOUND", "Audit not found", 404, reqId);

  // Fetch issues for this audit
  const { data: issues } = await admin
    .from("seo_issues")
    .select("*")
    .eq("audit_id", auditId)
    .order("created_at", { ascending: true });

  return json({
    audit_id: audit.id,
    target_type: audit.target_type ?? audit.mode ?? "url",
    target_id: audit.target_id,
    url: audit.url ?? audit.base_url,
    score: audit.score,
    status: audit.status,
    provider: audit.provider ?? "internal",
    language: audit.language ?? "fr",
    summary: audit.summary,
    error_message: audit.error_message,
    created_at: audit.created_at,
    completed_at: audit.finished_at,
    issues: (issues ?? []).map((i: any) => ({
      id: i.id,
      check_type: i.code,
      category: i.evidence?.category ?? "meta",
      status: i.severity === "error" ? "fail" : i.severity === "warning" ? "warning" : "pass",
      impact: i.evidence?.impact ?? "medium",
      current_value: i.evidence?.current_value,
      expected_value: i.evidence?.expected_value,
      recommendation: i.recommendation,
    })),
  }, 200, reqId);
}

async function createSeoGenerate(req: Request, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const body = await req.json();
  if (!body.target_id) return errorResponse("VALIDATION_ERROR", "target_id is required", 400, reqId);

  const admin = serviceClient();
  const { data: job, error } = await admin
    .from("seo_ai_generations")
    .insert({
      user_id: auth.user.id,
      target_type: body.target_type ?? "product",
      target_id: body.target_id,
      type: (body.actions ?? ["title"]).join(","),
      actions: body.actions ?? ["title", "description", "meta"],
      tone: body.tone ?? "conversion",
      language: body.language ?? "fr",
      status: "pending",
    })
    .select("id, status")
    .single();

  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);

  // Fire-and-forget: process generation asynchronously
  processSeoGeneration(job.id, auth.user.id, body).catch(console.error);

  return json({ job_id: job.id, status: "pending" }, 201, reqId);
}

async function processSeoGeneration(jobId: string, userId: string, params: any) {
  const admin = serviceClient();
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  const startTime = Date.now();

  await admin.from("seo_ai_generations").update({ status: "running" }).eq("id", jobId);

  if (!apiKey) {
    await admin.from("seo_ai_generations").update({ status: "failed", error_message: "OPENAI_API_KEY not configured" }).eq("id", jobId);
    return;
  }

  try {
    // Fetch target content for snapshot
    let currentContent: any = {};
    if (params.target_type === "product" && params.target_id) {
      const { data: product } = await admin.from("products").select("title, description, seo_title, seo_description, tags, sku, category, brand").eq("id", params.target_id).single();
      if (product) currentContent = product;
    }

    // Save input snapshot
    await admin.from("seo_ai_generations").update({ input: currentContent }).eq("id", jobId);

    const actions = params.actions ?? ["title", "description", "meta"];
    const prompt = `Tu es un expert SEO e-commerce. Génère du contenu SEO optimisé.
Langue: ${params.language ?? "fr"}, Ton: ${params.tone ?? "conversion"}
Type: ${params.target_type ?? "product"}
Actions demandées: ${actions.join(", ")}

Contenu actuel:
${JSON.stringify(currentContent, null, 2)}

Retourne UNIQUEMENT un JSON avec les champs suivants selon les actions demandées:
{
  ${actions.includes("title") ? '"title": "titre SEO optimisé (max 60 chars)",' : ""}
  ${actions.includes("description") ? '"description": "description produit optimisée SEO",' : ""}
  ${actions.includes("meta") ? '"meta_description": "meta description optimisée (max 155 chars)",' : ""}
  ${actions.includes("keywords") ? '"keywords": ["mot-clé1", "mot-clé2", ...],' : ""}
  ${actions.includes("tags") ? '"tags": ["tag1", "tag2", ...],' : ""}
  ${actions.includes("categories") ? '"categories": ["catégorie suggérée"],' : ""}
  "seo_score": <estimated score 0-100>
}`;

    const aiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "Tu es un expert SEO e-commerce. Réponds uniquement en JSON valide." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      throw new Error(status === 429 ? "Rate limited – réessayez dans quelques instants" : status === 402 ? "Crédits IA épuisés – rechargez votre workspace" : `AI error ${status}`);
    }

    const aiData = await aiResp.json();
    const content = aiData.choices?.[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const generated = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    const tokensUsed = aiData.usage?.total_tokens ?? 0;

    await admin.from("seo_ai_generations").update({
      status: "completed",
      result: generated,
      output: generated,
      tokens_used: tokensUsed,
      duration_ms: Date.now() - startTime,
    }).eq("id", jobId);

  } catch (err: any) {
    await admin.from("seo_ai_generations").update({
      status: "failed",
      error_message: err.message,
      duration_ms: Date.now() - startTime,
    }).eq("id", jobId);
  }
}

async function applySeoContent(req: Request, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const body = await req.json();
  if (!body.target_id || !body.fields) return errorResponse("VALIDATION_ERROR", "target_id and fields are required", 400, reqId);

  const admin = serviceClient();
  const targetType = body.target_type ?? "product";

  if (targetType === "product") {
    // Map SEO fields to product columns
    const updates: any = { updated_at: new Date().toISOString() };
    if (body.fields.title) updates.seo_title = body.fields.title;
    if (body.fields.meta_description) updates.seo_description = body.fields.meta_description;
    if (body.fields.description) updates.description = body.fields.description;
    if (body.fields.tags) updates.tags = body.fields.tags;

    const { error } = await admin.from("products").update(updates).eq("id", body.target_id).eq("user_id", auth.user.id);
    if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);

    // If there's a job_id, mark it as applied
    if (body.job_id) {
      await admin.from("seo_ai_generations").update({ applied_at: new Date().toISOString() }).eq("id", body.job_id).eq("user_id", auth.user.id);
    }

    return json({ success: true, target_id: body.target_id, applied_fields: Object.keys(body.fields) }, 200, reqId);
  }

  return errorResponse("NOT_IMPLEMENTED", `Apply not supported for target_type: ${targetType}`, 400, reqId);
}

async function getSeoGeneration(jobId: string, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin
    .from("seo_ai_generations")
    .select("*")
    .eq("id", jobId)
    .eq("user_id", auth.user.id)
    .single();

  if (error || !data) return errorResponse("NOT_FOUND", "Generation job not found", 404, reqId);

  return json({
    job_id: data.id,
    target_type: data.target_type ?? "product",
    target_id: data.target_id,
    actions: data.actions ?? [],
    tone: data.tone ?? "conversion",
    language: data.language ?? "fr",
    status: data.status,
    input: data.input,
    result: data.result ?? data.output,
    applied_at: data.applied_at,
    error_message: data.error_message,
    tokens_used: data.tokens_used,
    duration_ms: data.duration_ms,
    created_at: data.created_at,
  }, 200, reqId);
}

// ── Quota Enforcement Helper ─────────────────────────────────────────────────

async function checkSeoQuota(admin: any, userId: string, quotaKey: string, count: number, reqId: string): Promise<Response | null> {
  // Get user plan
  const { data: profile } = await admin.from("profiles").select("subscription_plan").eq("id", userId).single();
  const plan = profile?.subscription_plan || "free";

  // Get limit
  const { data: limitRow } = await admin.from("plan_limits").select("limit_value").eq("plan_name", plan).eq("limit_key", quotaKey).single();
  const limit = limitRow?.limit_value ?? 0;
  if (limit === -1) return null; // unlimited

  // Get current usage
  const { data: usage } = await admin.from("quota_usage").select("current_usage").eq("user_id", userId).eq("quota_key", quotaKey).single();
  const current = usage?.current_usage ?? 0;

  if (current + count > limit) {
    return errorResponse("QUOTA_EXCEEDED", `Limite ${quotaKey} atteinte (${current}/${limit}). Passez à un plan supérieur.`, 429, reqId, { quota_key: quotaKey, current, limit, plan });
  }
  return null;
}

async function incrementSeoQuota(admin: any, userId: string, quotaKey: string, count: number) {
  const now = new Date();
  const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
  await admin.from("quota_usage").upsert({
    user_id: userId,
    quota_key: quotaKey,
    current_usage: count,
    period_start: now.toISOString(),
    period_end: periodEnd,
  }, { onConflict: "user_id,quota_key" });
  // Increment via SQL to be safe
  await admin.rpc("increment_user_quota", { p_user_id: userId, p_quota_key: quotaKey, p_increment: count }).catch(() => {});
}

// ── SEO Product Audit Handlers ───────────────────────────────────────────────

async function auditProductSeo(req: Request, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const body = await req.json();
  const productIds: string[] = body.product_ids ?? (body.product_id ? [body.product_id] : []);
  if (productIds.length === 0) return errorResponse("VALIDATION_ERROR", "product_ids or product_id is required", 400, reqId);
  if (productIds.length > 50) return errorResponse("VALIDATION_ERROR", "Maximum 50 products per audit", 400, reqId);

  const admin = serviceClient();

  // Enforce quota
  const quotaBlock = await checkSeoQuota(admin, auth.user.id, "seo_audits", productIds.length, reqId);
  if (quotaBlock) return quotaBlock;
  const { data: products, error } = await admin
    .from("products")
    .select("id, title, description, seo_title, seo_description, images, tags, sku, brand, category, barcode, weight, status")
    .eq("user_id", auth.user.id)
    .in("id", productIds);

  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  if (!products || products.length === 0) return errorResponse("NOT_FOUND", "No products found", 404, reqId);

  const results = products.map((p: any) => scoreProduct(p));

  // Store scores in product_seo table and create version snapshots
  for (const result of results) {
    const seoData = {
      user_id: auth.user.id,
      product_id: result.product_id,
      language: body.language ?? "fr",
      seo_score: result.score.global,
      score_details: result.score,
      issues: result.issues,
      strengths: result.strengths,
      business_impact: result.business_impact,
      last_audited_at: new Date().toISOString(),
    };

    // Upsert score
    await admin.from("product_seo").upsert(seoData, { onConflict: "user_id,product_id,language" }).select();

    // Create version snapshot
    await admin.from("product_seo_versions").insert({
      user_id: auth.user.id,
      product_id: result.product_id,
      language: body.language ?? "fr",
      version: Date.now(),
      fields_json: {
        seo_title: result.current.seo_title,
        meta_description: result.current.seo_description,
        score: result.score,
        issues_count: result.issues.length,
      },
      source: "audit",
    });
  }

  // Increment quota after success
  await incrementSeoQuota(admin, auth.user.id, "seo_audits", results.length);

  return json({ products: results, total: results.length, audited_at: new Date().toISOString() }, 200, reqId);
}

function scoreProduct(product: any) {
  const issues: Array<{ id: string; severity: string; category: string; message: string; field?: string; recommendation?: string }> = [];
  const strengths: string[] = [];

  // ── Title scoring ──
  let titleScore = 0;
  const title = product.seo_title || product.title || "";
  if (!title) {
    issues.push({ id: "no_title", severity: "critical", category: "seo", message: "Titre manquant", field: "title", recommendation: "Ajoutez un titre produit optimisé de 20-70 caractères" });
  } else {
    if (title.length < 20) issues.push({ id: "title_short", severity: "warning", category: "seo", message: `Titre trop court (${title.length} car.)`, field: "title", recommendation: "Allongez le titre à minimum 20 caractères avec des mots-clés" });
    else if (title.length > 70) issues.push({ id: "title_long", severity: "warning", category: "seo", message: `Titre trop long (${title.length} car.)`, field: "title", recommendation: "Raccourcissez le titre à maximum 70 caractères" });
    else { titleScore = 100; strengths.push("Titre de longueur optimale"); }
    if (title.length >= 10) titleScore = Math.max(titleScore, 50);
  }

  // ── Meta description scoring ──
  let metaScore = 0;
  const meta = product.seo_description || "";
  if (!meta) {
    issues.push({ id: "no_meta", severity: "critical", category: "seo", message: "Meta description manquante", field: "seo_description", recommendation: "Ajoutez une meta description de 120-160 caractères" });
  } else {
    if (meta.length < 120) issues.push({ id: "meta_short", severity: "warning", category: "seo", message: `Meta description courte (${meta.length} car.)`, field: "seo_description", recommendation: "Allongez à 120-160 caractères" });
    else if (meta.length > 160) issues.push({ id: "meta_long", severity: "info", category: "seo", message: `Meta description longue (${meta.length} car.)`, field: "seo_description", recommendation: "Raccourcissez à max 160 caractères" });
    else { metaScore = 100; strengths.push("Meta description optimale"); }
    if (meta.length >= 50) metaScore = Math.max(metaScore, 50);
  }

  // ── Content scoring ──
  let contentScore = 0;
  const desc = product.description || "";
  if (!desc) {
    issues.push({ id: "no_desc", severity: "critical", category: "content", message: "Description produit manquante", field: "description", recommendation: "Ajoutez une description riche de minimum 100 caractères" });
  } else {
    if (desc.length < 100) issues.push({ id: "desc_short", severity: "warning", category: "content", message: `Description courte (${desc.length} car.)`, field: "description", recommendation: "Enrichissez la description (min 100 caractères)" });
    else { contentScore = 80; strengths.push("Description produit présente"); }
    if (desc.length >= 300) { contentScore = 100; strengths.push("Description riche et détaillée"); }
    else if (desc.length >= 50) contentScore = Math.max(contentScore, 40);
  }

  // ── Images scoring ──
  let imageScore = 0;
  const images = Array.isArray(product.images) ? product.images : [];
  if (images.length === 0) {
    issues.push({ id: "no_images", severity: "critical", category: "images", message: "Aucune image produit", field: "images", recommendation: "Ajoutez au moins 2 images de qualité" });
  } else if (images.length < 2) {
    imageScore = 50;
    issues.push({ id: "few_images", severity: "warning", category: "images", message: "Une seule image", field: "images", recommendation: "Ajoutez plus d'images (recommandé: 3+)" });
  } else {
    imageScore = Math.min(100, images.length * 25);
    strengths.push(`${images.length} images produit`);
  }
  // Check alt texts
  const imagesWithAlt = images.filter((img: any) => typeof img === "object" && img.alt);
  if (images.length > 0 && imagesWithAlt.length < images.length) {
    issues.push({ id: "missing_alt", severity: "warning", category: "images", message: `${images.length - imagesWithAlt.length} image(s) sans texte alt`, field: "images", recommendation: "Ajoutez des textes alternatifs SEO pour chaque image" });
    imageScore = Math.max(0, imageScore - 20);
  }

  // ── Data completeness ──
  let dataScore = 0;
  const fields = { sku: product.sku, brand: product.brand, category: product.category, barcode: product.barcode, weight: product.weight };
  const filledCount = Object.values(fields).filter(v => v !== null && v !== undefined && v !== "").length;
  dataScore = Math.round((filledCount / Object.keys(fields).length) * 100);
  if (!product.sku) issues.push({ id: "no_sku", severity: "warning", category: "data", message: "SKU manquant", field: "sku", recommendation: "Ajoutez un SKU unique" });
  if (!product.brand) issues.push({ id: "no_brand", severity: "info", category: "data", message: "Marque non renseignée", field: "brand", recommendation: "Renseignez la marque pour le Google Shopping" });
  if (!product.category) issues.push({ id: "no_category", severity: "warning", category: "data", message: "Catégorie manquante", field: "category", recommendation: "Catégorisez le produit" });
  if (filledCount >= 4) strengths.push("Données produit bien renseignées");

  // ── AI readiness ──
  let aiScore = 0;
  const tags = Array.isArray(product.tags) ? product.tags : [];
  if (tags.length >= 3) { aiScore += 40; strengths.push(`${tags.length} tags produit`); }
  else issues.push({ id: "few_tags", severity: "info", category: "ai", message: `Peu de tags (${tags.length})`, field: "tags", recommendation: "Ajoutez 5+ tags pour le Google Shopping et IA" });
  if (product.brand) aiScore += 20;
  if (product.category) aiScore += 20;
  if (desc.length >= 100) aiScore += 20;

  // ── Global score ──
  const globalScore = Math.round(titleScore * 0.25 + metaScore * 0.2 + contentScore * 0.2 + imageScore * 0.15 + dataScore * 0.1 + aiScore * 0.1);

  // ── Business impact estimation ──
  const criticalCount = issues.filter(i => i.severity === "critical").length;
  const warningCount = issues.filter(i => i.severity === "warning").length;
  const trafficImpact = criticalCount > 2 ? "high" : criticalCount > 0 ? "medium" : warningCount > 2 ? "low" : "minimal";
  const conversionImpact = (!desc || desc.length < 50) ? "high" : images.length < 2 ? "medium" : "low";
  const estimatedTrafficGain = Math.min(50, criticalCount * 15 + warningCount * 5);
  const estimatedConversionGain = Math.min(30, (100 - globalScore) * 0.3);

  return {
    product_id: product.id,
    product_name: product.title || product.seo_title || "Sans nom",
    current: { seo_title: product.seo_title, seo_description: product.seo_description, title: product.title, description: product.description },
    score: { global: globalScore, seo: Math.round((titleScore + metaScore) / 2), content: contentScore, images: imageScore, data: dataScore, ai_readiness: aiScore },
    status: globalScore >= 70 ? "optimized" : globalScore >= 40 ? "needs_work" : "critical",
    issues,
    strengths,
    business_impact: {
      traffic_impact: trafficImpact,
      conversion_impact: conversionImpact,
      estimated_traffic_gain_percent: estimatedTrafficGain,
      estimated_conversion_gain_percent: estimatedConversionGain,
      priority: criticalCount > 0 ? "urgent" : warningCount > 2 ? "high" : "normal",
    },
  };
}

async function listProductSeoScores(url: URL, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const admin = serviceClient();
  const statusFilter = url.searchParams.get("status"); // optimized | needs_work | critical
  const minScore = url.searchParams.get("min_score");
  const maxScore = url.searchParams.get("max_score");
  const sort = url.searchParams.get("sort") ?? "score_asc";

  // Fetch products with their SEO data
  let query = admin.from("products").select("id, title, description, seo_title, seo_description, images, tags, sku, brand, category, barcode, weight, status", { count: "exact" }).eq("user_id", auth.user.id);

  const ascending = sort === "score_asc";
  query = query.order("updated_at", { ascending }).range(from, to);

  const { data: products, count, error } = await query;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);

  let scored = (products ?? []).map((p: any) => scoreProduct(p));

  // Apply filters
  if (statusFilter) scored = scored.filter((s: any) => s.status === statusFilter);
  if (minScore) scored = scored.filter((s: any) => s.score.global >= parseInt(minScore));
  if (maxScore) scored = scored.filter((s: any) => s.score.global <= parseInt(maxScore));

  // Sort
  scored.sort((a: any, b: any) => ascending ? a.score.global - b.score.global : b.score.global - a.score.global);

  // Stats
  const avgScore = scored.length > 0 ? Math.round(scored.reduce((s: number, p: any) => s + p.score.global, 0) / scored.length) : 0;
  const criticalCount = scored.filter((s: any) => s.status === "critical").length;
  const needsWorkCount = scored.filter((s: any) => s.status === "needs_work").length;
  const optimizedCount = scored.filter((s: any) => s.status === "optimized").length;

  return json({
    items: scored,
    stats: { avg_score: avgScore, critical: criticalCount, needs_work: needsWorkCount, optimized: optimizedCount, total: count ?? 0 },
    meta: { page, per_page: perPage, total: count ?? 0 },
  }, 200, reqId);
}

async function getProductSeoScore(productId: string, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const admin = serviceClient();
  const { data: product, error } = await admin
    .from("products")
    .select("id, title, description, seo_title, seo_description, images, tags, sku, brand, category, barcode, weight, status")
    .eq("id", productId)
    .eq("user_id", auth.user.id)
    .single();

  if (error || !product) return errorResponse("NOT_FOUND", "Product not found", 404, reqId);

  return json(scoreProduct(product), 200, reqId);
}

async function getProductSeoHistory(productId: string, url: URL, auth: NonNullable<Awaited<ReturnType<typeof authenticate>>>, reqId: string) {
  const admin = serviceClient();
  const { page, perPage, from, to } = parsePagination(url);

  const { data, count, error } = await admin
    .from("product_seo_versions")
    .select("*", { count: "exact" })
    .eq("user_id", auth.user.id)
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);

  return json({
    items: (data ?? []).map((v: any) => ({
      id: v.id,
      version: v.version,
      source: v.source,
      fields: v.fields_json,
      created_at: v.created_at,
    })),
    meta: { page, per_page: perPage, total: count ?? 0 },
  }, 200, reqId);
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
      return json({ status: "ok", version: "1.1.0", timestamp: new Date().toISOString() }, 200, reqId);
    }

    const auth = await authenticate(req);
    if (!auth) return errorResponse("UNAUTHORIZED", "Valid Bearer token required", 401, reqId);

    // ── Products CRUD ──────────────────────────────────────────
    if (req.method === "GET" && matchRoute("/v1/products/stats", apiPath)) return await getProductStats(auth, reqId);
    if (req.method === "GET" && matchRoute("/v1/products", apiPath)) return await listProducts(url, auth, reqId);
    if (req.method === "POST" && matchRoute("/v1/products", apiPath)) return await createProduct(req, auth, reqId);
    if (req.method === "POST" && matchRoute("/v1/products/bulk", apiPath)) return await bulkUpdateProducts(req, auth, reqId);

    // ── Product sub-resources (must be before generic :productId) ──
    const productSeoMatch = matchRoute("/v1/products/:productId/seo", apiPath);
    if (req.method === "GET" && productSeoMatch) return await getProductSeo(productSeoMatch.params.productId, auth, reqId);

    const productOptimizeMatch = matchRoute("/v1/products/:productId/optimize", apiPath);
    if (req.method === "POST" && productOptimizeMatch) return await optimizeProduct(productOptimizeMatch.params.productId, req, auth, reqId);

    const productMetricsMatch = matchRoute("/v1/products/:productId/metrics", apiPath);
    if (req.method === "GET" && productMetricsMatch) return await getProductMetrics(productMetricsMatch.params.productId, url, auth, reqId);

    const productStockMatch = matchRoute("/v1/products/:productId/stock-history", apiPath);
    if (req.method === "GET" && productStockMatch) return await getProductStockHistory(productStockMatch.params.productId, url, auth, reqId);

    const productMatch = matchRoute("/v1/products/:productId", apiPath);
    if (productMatch && productMatch.params.productId !== "drafts" && productMatch.params.productId !== "stats" && productMatch.params.productId !== "bulk") {
      if (req.method === "GET") return await getProduct(productMatch.params.productId, auth, reqId);
      if (req.method === "PUT") return await updateProduct(productMatch.params.productId, req, auth, reqId);
      if (req.method === "DELETE") return await deleteProduct(productMatch.params.productId, auth, reqId);
    }

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
    if (req.method === "POST" && matchRoute("/v1/import/presets/import", apiPath)) return await importPreset(req, auth, reqId);
    if (req.method === "GET" && matchRoute("/v1/import/presets", apiPath)) return await listPresets(url, auth, reqId);
    if (req.method === "POST" && matchRoute("/v1/import/presets", apiPath)) return await createPreset(req, auth, reqId);

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

    // ── AI Enrichments ──────────────────────────────────────────
    if (req.method === "POST" && matchRoute("/v1/ai/enrichments", apiPath)) return await createAiEnrichment(req, auth, reqId);

    const aiJobMatch = matchRoute("/v1/ai/enrichments/:jobId", apiPath);
    if (req.method === "GET" && aiJobMatch) return await getAiEnrichment(aiJobMatch.params.jobId, auth, reqId);

    const aiItemsMatch = matchRoute("/v1/ai/enrichments/:jobId/items", apiPath);
    if (req.method === "GET" && aiItemsMatch) return await getAiEnrichmentItems(aiItemsMatch.params.jobId, url, auth, reqId);

    // ── Drafts / Publish ────────────────────────────────────────
    if (req.method === "GET" && matchRoute("/v1/products/drafts", apiPath)) return await listDrafts(url, auth, reqId);
    if (req.method === "POST" && matchRoute("/v1/products/drafts/publish", apiPath)) return await publishDrafts(req, auth, reqId);

    // ── SEO ────────────────────────────────────────────────────
    if (req.method === "POST" && matchRoute("/v1/seo/audit", apiPath)) return await createSeoAudit(req, auth, reqId);
    if (req.method === "GET" && matchRoute("/v1/seo/audits", apiPath)) return await listSeoAudits(url, auth, reqId);

    const seoAuditMatch = matchRoute("/v1/seo/audits/:auditId", apiPath);
    if (req.method === "GET" && seoAuditMatch) return await getSeoAudit(seoAuditMatch.params.auditId, auth, reqId);

    if (req.method === "POST" && matchRoute("/v1/seo/generate", apiPath)) return await createSeoGenerate(req, auth, reqId);

    const seoGenMatch = matchRoute("/v1/seo/generate/:jobId", apiPath);
    if (req.method === "GET" && seoGenMatch) return await getSeoGeneration(seoGenMatch.params.jobId, auth, reqId);

    if (req.method === "POST" && matchRoute("/v1/seo/apply", apiPath)) return await applySeoContent(req, auth, reqId);

    // ── SEO Product Audit ──────────────────────────────────────
    if (req.method === "POST" && matchRoute("/v1/seo/products/audit", apiPath)) return await auditProductSeo(req, auth, reqId);
    if (req.method === "GET" && matchRoute("/v1/seo/products/scores", apiPath)) return await listProductSeoScores(url, auth, reqId);

    const seoProductMatch = matchRoute("/v1/seo/products/:productId/score", apiPath);
    if (req.method === "GET" && seoProductMatch) return await getProductSeoScore(seoProductMatch.params.productId, auth, reqId);

    const seoHistoryMatch = matchRoute("/v1/seo/products/:productId/history", apiPath);
    if (req.method === "GET" && seoHistoryMatch) return await getProductSeoHistory(seoHistoryMatch.params.productId, url, auth, reqId);

    return errorResponse("NOT_FOUND", `Route ${req.method} ${apiPath} not found`, 404, reqId);
  } catch (err) {
    console.error("Unhandled error:", err);
    return errorResponse("INTERNAL_ERROR", "Internal server error", 500, reqId);
  }
});
