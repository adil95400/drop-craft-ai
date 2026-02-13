import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key, x-request-id",
  "Access-Control-Expose-Headers": "x-request-id",
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function requestId(req: Request): string { return req.headers.get("x-request-id") ?? crypto.randomUUID(); }
function json(body: unknown, status = 200, reqId: string) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "x-request-id": reqId } });
}
function errorResponse(code: string, message: string, status: number, reqId: string, details?: unknown) {
  return json({ error: { code, message, ...(details ? { details } : {}) } }, status, reqId);
}
function parsePagination(url: URL) {
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("per_page") ?? "20", 10)));
  return { page, perPage, from: (page - 1) * perPage, to: page * perPage - 1 };
}
function sanitizeString(input: string, maxLength = 1000): string {
  if (typeof input !== "string") return "";
  return input.slice(0, maxLength).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").trim();
}

// ── Rate Limiting ───────────────────────────────────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(userId: string, endpoint: string, maxRequests = 60, windowMs = 60000): boolean {
  const key = `${userId}:${endpoint}`; const now = Date.now(); const entry = rateLimitStore.get(key);
  if (!entry || now >= entry.resetAt) { rateLimitStore.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  entry.count++; return entry.count <= maxRequests;
}

// ── Auth & Client ───────────────────────────────────────────────────────────
async function authenticate(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { user, supabase };
}
function serviceClient() { return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!); }
type Auth = NonNullable<Awaited<ReturnType<typeof authenticate>>>;

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const pp = pattern.split("/").filter(Boolean); const pathParts = path.split("/").filter(Boolean);
  if (pp.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) { if (pp[i].startsWith(":")) params[pp[i].slice(1)] = pathParts[i]; else if (pp[i] !== pathParts[i]) return null; }
  return params;
}

// ── SHA-256 helper ──────────────────────────────────────────────────────────
async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Import Jobs ─────────────────────────────────────────────────────────────
function mapJobRow(row: any) {
  return { job_id: row.id, status: row.status, job_type: row.job_subtype ?? row.job_type, name: row.name, progress: { total: row.items_total ?? 0, processed: row.items_processed ?? 0, success: row.items_succeeded ?? 0, failed: row.items_failed ?? 0, percent: row.progress_percent ?? 0 }, created_at: row.created_at, started_at: row.started_at, completed_at: row.completed_at, error_message: row.error_message };
}

async function createImportJob(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.source?.type) return errorResponse("VALIDATION_ERROR", "source.type is required", 400, reqId);
  const admin = serviceClient();
  const { data: job, error } = await admin.from("background_jobs").insert({ user_id: auth.user.id, job_type: "import", job_subtype: body.source.type, status: "queued", name: `Import ${body.source.type}`, input_data: { source: body.source, preset_id: body.preset_id, options: body.options }, metadata: { idempotency_key: req.headers.get("idempotency-key"), source_type: body.source.type }, items_total: 0, items_processed: 0, items_succeeded: 0, items_failed: 0, progress_percent: 0 }).select("id, status").single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ job_id: job.id, status: job.status }, 201, reqId);
}

async function listImportJobs(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const status = url.searchParams.get("status");
  const admin = serviceClient();
  let q = admin.from("background_jobs").select("*", { count: "exact" }).eq("user_id", auth.user.id).eq("job_type", "import").order("created_at", { ascending: false }).range(from, to);
  if (status) q = q.in("status", status.split("|"));
  const { data, count, error } = await q;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: (data ?? []).map(mapJobRow), meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function getImportJob(jobId: string, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin.from("background_jobs").select("*").eq("id", jobId).eq("user_id", auth.user.id).eq("job_type", "import").single();
  if (error || !data) return errorResponse("NOT_FOUND", "Job not found", 404, reqId);
  const job: any = mapJobRow(data);
  if (data.started_at && data.items_total && data.items_processed && data.items_processed > 0) {
    const elapsed = Date.now() - new Date(data.started_at).getTime();
    job.eta_seconds = Math.round(((data.items_total - data.items_processed) * (elapsed / data.items_processed)) / 1000);
  }
  return json(job, 200, reqId);
}

async function getJobItems(jobId: string, url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const status = url.searchParams.get("status");
  const admin = serviceClient();
  const { data: job } = await admin.from("background_jobs").select("id").eq("id", jobId).eq("user_id", auth.user.id).single();
  if (!job) return errorResponse("NOT_FOUND", "Job not found", 404, reqId);
  let q = admin.from("import_job_items").select("*", { count: "exact" }).eq("job_id", jobId).order("row_number", { ascending: true }).range(from, to);
  if (status) q = q.eq("status", status);
  const { data, count, error } = await q;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  const items = (data ?? []).map((r: any) => ({ item_id: r.id, row_number: r.row_number, status: r.status, errors: r.errors ?? [], warnings: r.warnings ?? [], raw: r.raw_data, mapped: r.mapped_data, product_id: r.product_id, created_at: r.created_at }));
  return json({ items, meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function jobAction(action: string, jobId: string, req: Request, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data: job } = await admin.from("background_jobs").select("*").eq("id", jobId).eq("user_id", auth.user.id).single();
  if (!job) return errorResponse("NOT_FOUND", "Job not found", 404, reqId);
  const now = new Date().toISOString();
  if (action === "retry") {
    const body = await req.json().catch(() => ({})); const onlyFailed = body.only_failed !== false;
    const uq = admin.from("import_job_items").update({ status: "pending", errors: [], updated_at: now }).eq("job_id", jobId);
    if (onlyFailed) uq.eq("status", "failed"); await uq;
    await admin.from("background_jobs").update({ status: "queued", updated_at: now }).eq("id", jobId);
    return json({ job_id: jobId, status: "queued" }, 200, reqId);
  }
  if (action === "cancel") {
    if (["completed", "cancelled"].includes(job.status)) return errorResponse("INVALID_STATE", `Cannot cancel job in ${job.status} state`, 409, reqId);
    await admin.from("background_jobs").update({ status: "cancelled", completed_at: now, updated_at: now }).eq("id", jobId);
    return json({ job_id: jobId, status: "cancelled" }, 200, reqId);
  }
  if (action === "resume") {
    if (!["cancelled", "paused", "failed"].includes(job.status)) return errorResponse("INVALID_STATE", `Cannot resume job in ${job.status} state`, 409, reqId);
    await admin.from("import_job_items").update({ status: "pending", updated_at: now }).eq("job_id", jobId).in("status", ["cancelled", "paused"]);
    await admin.from("background_jobs").update({ status: "queued", updated_at: now, completed_at: null }).eq("id", jobId);
    return json({ job_id: jobId, status: "queued", remaining: (job.items_total ?? 0) - (job.items_processed ?? 0) }, 200, reqId);
  }
  if (action === "replay") {
    const { data: newJob, error } = await admin.from("background_jobs").insert({ user_id: auth.user.id, job_type: job.job_type, job_subtype: job.job_subtype, status: "queued", name: `Replay: ${job.name || job.job_subtype}`, input_data: job.input_data, metadata: { ...((job.metadata as any) || {}), replayed_from: jobId }, items_total: 0, items_processed: 0, items_succeeded: 0, items_failed: 0, progress_percent: 0 }).select("id, status").single();
    if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
    return json({ job_id: newJob.id, status: newJob.status, replayed_from: jobId }, 201, reqId);
  }
  return errorResponse("INVALID_ACTION", "Unknown action", 400, reqId);
}

async function proxyEdgeFunction(fnName: string, req: Request, auth: Auth, reqId: string, bodyOverride?: any) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const resp = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, { method: "POST", headers: { Authorization: req.headers.get("authorization") || "", "Content-Type": "application/json", apikey: Deno.env.get("SUPABASE_ANON_KEY")! }, body: JSON.stringify(bodyOverride ?? await req.json().catch(() => ({}))) });
  const data = await resp.json();
  return json(data, resp.status, reqId);
}

// ── Presets ──────────────────────────────────────────────────────────────────
function mapPresetRow(row: any) {
  return { id: row.id, name: row.name, scope: row.scope, store_id: row.store_id, platform: row.platform, version: row.version, is_default: row.is_default, columns_signature: row.columns_signature, columns: row.columns, has_header: row.has_header, delimiter: row.delimiter, encoding: row.encoding, mapping: row.mapping, last_used_at: row.last_used_at, use_count: row.usage_count, created_at: row.created_at, updated_at: row.updated_at };
}

async function listPresets(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const platform = url.searchParams.get("platform"); const q = url.searchParams.get("q");
  const admin = serviceClient();
  let query = admin.from("mapping_presets").select("*", { count: "exact" }).eq("user_id", auth.user.id).order("usage_count", { ascending: false }).range(from, to);
  if (platform) query = query.eq("platform", platform); if (q) query = query.ilike("name", `%${q}%`);
  const { data, count, error } = await query;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: (data ?? []).map(mapPresetRow), meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function createPreset(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.name) return errorResponse("VALIDATION_ERROR", "name is required", 400, reqId);
  if (!body.mapping || typeof body.mapping !== "object") return errorResponse("VALIDATION_ERROR", "mapping is required", 400, reqId);
  const admin = serviceClient();
  const { data, error } = await admin.from("mapping_presets").insert({ user_id: auth.user.id, name: body.name, mapping: body.mapping, platform: body.platform ?? "generic", scope: body.scope ?? "user", store_id: body.store_id ?? null, has_header: body.has_header ?? true, delimiter: body.delimiter ?? ",", encoding: body.encoding ?? "utf-8", columns: body.columns ?? null, columns_signature: body.columns ? await sha256(body.columns.sort().join("|")) : null, icon: body.icon ?? "csv" }).select("id, version").single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ id: data.id, version: data.version }, 201, reqId);
}

async function presetAction(action: string, presetId: string, req: Request, auth: Auth, reqId: string) {
  const admin = serviceClient();
  if (action === "get") { const { data, error } = await admin.from("mapping_presets").select("*").eq("id", presetId).eq("user_id", auth.user.id).single(); if (error || !data) return errorResponse("NOT_FOUND", "Preset not found", 404, reqId); return json(mapPresetRow(data), 200, reqId); }
  if (action === "update") {
    const body = await req.json();
    const { data: current } = await admin.from("mapping_presets").select("version").eq("id", presetId).eq("user_id", auth.user.id).single();
    if (!current) return errorResponse("NOT_FOUND", "Preset not found", 404, reqId);
    const updates: any = { version: current.version + 1, updated_at: new Date().toISOString() };
    for (const f of ["name", "mapping", "platform", "has_header", "delimiter", "encoding"]) if ((body as any)[f] !== undefined) updates[f] = (body as any)[f];
    if (body.columns !== undefined) { updates.columns = body.columns; updates.columns_signature = await sha256(body.columns.sort().join("|")); }
    const { data, error } = await admin.from("mapping_presets").update(updates).eq("id", presetId).eq("user_id", auth.user.id).select("id, version").single();
    if (error) return errorResponse("DB_ERROR", error.message, 500, reqId); return json({ id: data.id, version: data.version }, 200, reqId);
  }
  if (action === "delete") { const { error } = await admin.from("mapping_presets").delete().eq("id", presetId).eq("user_id", auth.user.id); if (error) return errorResponse("DB_ERROR", error.message, 500, reqId); return json({ success: true }, 200, reqId); }
  if (action === "default") { const { data: preset } = await admin.from("mapping_presets").select("platform").eq("id", presetId).eq("user_id", auth.user.id).single(); if (!preset) return errorResponse("NOT_FOUND", "Preset not found", 404, reqId); await admin.from("mapping_presets").update({ is_default: false }).eq("user_id", auth.user.id).eq("platform", preset.platform).eq("is_default", true); await admin.from("mapping_presets").update({ is_default: true }).eq("id", presetId); return json({ id: presetId, is_default: true }, 200, reqId); }
  if (action === "export") { const { data, error } = await admin.from("mapping_presets").select("*").eq("id", presetId).eq("user_id", auth.user.id).single(); if (error || !data) return errorResponse("NOT_FOUND", "Preset not found", 404, reqId); const { id, user_id, created_at, updated_at, usage_count, last_used_at, ...exportable } = data; return json({ preset: exportable }, 200, reqId); }
  return errorResponse("INVALID_ACTION", "Unknown action", 400, reqId);
}

async function importPreset(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.preset) return errorResponse("VALIDATION_ERROR", "preset object required", 400, reqId);
  const p = body.preset; const admin = serviceClient();
  const { data, error } = await admin.from("mapping_presets").insert({ user_id: auth.user.id, name: p.name ?? "Imported Preset", mapping: p.mapping ?? {}, platform: p.platform ?? "generic", scope: p.scope ?? "user", has_header: p.has_header ?? true, delimiter: p.delimiter ?? ",", encoding: p.encoding ?? "utf-8", columns: p.columns ?? null, columns_signature: p.columns_signature ?? null, icon: p.icon ?? "csv", version: 1 }).select("id, version").single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ id: data.id, version: data.version }, 201, reqId);
}

// ── CSV Upload ──────────────────────────────────────────────────────────────
async function createUploadSession(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.filename) return errorResponse("VALIDATION_ERROR", "filename is required", 400, reqId);
  const admin = serviceClient(); const uploadId = crypto.randomUUID();
  const filePath = `imports/${auth.user.id}/${uploadId}/${body.filename}`;
  const { data: signedData } = await admin.storage.from("import-files").createSignedUploadUrl(filePath);
  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
  const { data, error } = await admin.from("import_uploads").insert({ id: uploadId, user_id: auth.user.id, filename: body.filename, file_path: filePath, status: "pending", expires_at: expiresAt }).select("id").single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ upload_id: data.id, upload_url: signedData?.signedUrl ?? null, expires_at: expiresAt }, 201, reqId);
}

const FIELD_SYNONYMS: Record<string, string[]> = { title: ["title", "product title", "product_title", "name", "product name", "product_name", "nom", "titre"], sku: ["sku", "variant sku", "variant_sku", "reference", "ref", "code"], price: ["price", "sale price", "sale_price", "prix", "prix_vente", "variant price"], description: ["description", "body", "body_html", "body html", "desc"], images: ["image", "image_url", "image url", "images", "image src", "image_src", "photo"], stock: ["stock", "inventory", "quantity", "qty", "inventory_quantity"], weight: ["weight", "poids", "weight_value"], category: ["category", "type", "product type", "product_type", "categorie"], brand: ["brand", "vendor", "marque", "manufacturer"], barcode: ["barcode", "gtin", "ean", "upc", "isbn"] };

function suggestMapping(columns: string[]): Record<string, { field: string }> {
  const mapping: Record<string, { field: string }> = {};
  for (const col of columns) { const lower = col.toLowerCase().trim(); for (const [field, synonyms] of Object.entries(FIELD_SYNONYMS)) { if (synonyms.includes(lower)) { mapping[col] = { field }; break; } } }
  return mapping;
}

async function analyzeUpload(uploadId: string, req: Request, auth: Auth, reqId: string) {
  const body = await req.json().catch(() => ({})); const admin = serviceClient();
  const { data: upload } = await admin.from("import_uploads").select("*").eq("id", uploadId).eq("user_id", auth.user.id).single();
  if (!upload) return errorResponse("NOT_FOUND", "Upload not found", 404, reqId);
  let columns: string[] = upload.columns ?? []; let sampleRows: any[] = []; let signature: string | null = upload.columns_signature;
  if (upload.file_path) {
    const { data: fileData } = await admin.storage.from("import-files").download(upload.file_path);
    if (fileData) {
      const text = await fileData.text();
      const firstLine = text.split("\n")[0] ?? ""; const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0, "|": 0 };
      for (const char of Object.keys(counts)) counts[char] = firstLine.split(char).length - 1;
      const autoDelim = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      const delimiter = body.delimiter === "auto" ? autoDelim : (body.delimiter ?? upload.delimiter ?? ",");
      const hasHeader = body.has_header ?? upload.has_header ?? true;
      const lines = text.split("\n").filter((l: string) => l.trim());
      if (hasHeader && lines.length > 0) columns = lines[0].split(delimiter).map((c: string) => c.trim().replace(/^"|"$/g, ""));
      const dataLines = hasHeader ? lines.slice(1, 6) : lines.slice(0, 5);
      sampleRows = dataLines.map((line: string) => { const values = line.split(delimiter).map((v: string) => v.trim().replace(/^"|"$/g, "")); const row: Record<string, string> = {}; columns.forEach((col, i) => { row[col] = values[i] ?? ""; }); return row; });
      signature = await sha256(columns.sort().join("|"));
      await admin.from("import_uploads").update({ columns, sample_rows: sampleRows, columns_signature: signature, has_header: hasHeader, delimiter, status: "analyzed", updated_at: new Date().toISOString() }).eq("id", uploadId);
    }
  }
  const suggestedMapping = suggestMapping(columns);
  let matchingPresets: any[] = [];
  if (signature) { const { data: presets } = await admin.from("mapping_presets").select("id, name, columns_signature, usage_count").eq("user_id", auth.user.id).eq("columns_signature", signature); matchingPresets = (presets ?? []).map(p => ({ preset_id: p.id, name: p.name, confidence: 1.0 })); }
  if (matchingPresets.length === 0 && columns.length > 0) {
    const { data: allPresets } = await admin.from("mapping_presets").select("id, name, columns").eq("user_id", auth.user.id).not("columns", "is", null);
    for (const p of allPresets ?? []) { if (!p.columns) continue; const overlap = (p.columns as string[]).filter((c: string) => columns.includes(c)).length; const confidence = overlap / Math.max(columns.length, (p.columns as string[]).length); if (confidence > 0.5) matchingPresets.push({ preset_id: p.id, name: p.name, confidence: Math.round(confidence * 100) / 100 }); }
    matchingPresets.sort((a: any, b: any) => b.confidence - a.confidence);
  }
  await admin.from("import_uploads").update({ suggested_mapping: suggestedMapping, matching_presets: matchingPresets }).eq("id", uploadId);
  return json({ columns, sample_rows: sampleRows, signature, suggested_mapping: suggestedMapping, matching_presets: matchingPresets }, 200, reqId);
}

// ── AI Enrichment ────────────────────────────────────────────────────────────
async function createAiEnrichment(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.product_ids?.length) return errorResponse("VALIDATION_ERROR", "product_ids required", 400, reqId);
  const admin = serviceClient();
  const { data: job, error } = await admin.from("background_jobs").insert({ user_id: auth.user.id, job_type: "ai_enrichment", job_subtype: "seo", status: "queued", name: `AI Enrichment (${body.product_ids.length} products)`, input_data: { product_ids: body.product_ids, language: body.language ?? "fr", tone: body.tone ?? "premium", targets: body.targets ?? ["seo_title", "meta_description", "tags"], store_id: body.store_id }, metadata: { idempotency_key: req.headers.get("idempotency-key") }, items_total: body.product_ids.length, items_processed: 0, items_succeeded: 0, items_failed: 0, progress_percent: 0 }).select("id, status").single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  const items = body.product_ids.map((pid: string, i: number) => ({ job_id: job.id, row_number: i + 1, status: "pending", raw_data: { product_id: pid }, mapped_data: null, product_id: pid }));
  await admin.from("import_job_items").insert(items);
  processAiEnrichments(job.id, auth.user.id, body).catch(console.error);
  return json({ job_id: job.id, status: "queued" }, 201, reqId);
}

async function processAiEnrichments(jobId: string, userId: string, params: any) {
  const admin = serviceClient();
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) { await admin.from("background_jobs").update({ status: "failed", error_message: "LOVABLE_API_KEY not configured" }).eq("id", jobId); return; }
  await admin.from("background_jobs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", jobId);
  const { product_ids, language, tone } = params;
  let succeeded = 0, failed = 0;
  for (let i = 0; i < product_ids.length; i++) {
    try {
      const { data: product } = await admin.from("products").select("title, description, tags, seo_title, seo_description, sku").eq("id", product_ids[i]).single();
      if (!product) throw new Error("Product not found");
      const prompt = `Tu es un expert SEO e-commerce. Génère du contenu optimisé.\nLangue: ${language ?? "fr"}, Ton: ${tone ?? "premium"}\nProduit: ${product.title}\nDescription: ${product.description ?? "aucune"}\nTags: ${(product.tags ?? []).join(", ") || "aucun"}\nRetourne JSON: {"seo_title":"...","meta_description":"...","tags":["..."],"keywords":["..."]}`;
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: "Expert SEO e-commerce. JSON only." }, { role: "user", content: prompt }], temperature: 0.3 }) });
      if (!aiResp.ok) throw new Error(`AI error ${aiResp.status}`);
      const aiData = await aiResp.json(); const content = aiData.choices?.[0]?.message?.content ?? "";
      const jsonMatch = content.match(/\{[\s\S]*\}/); const generated = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
      const updates: any = { updated_at: new Date().toISOString() };
      if (generated.seo_title) updates.seo_title = generated.seo_title;
      if (generated.meta_description) updates.seo_description = generated.meta_description;
      if (generated.tags?.length) updates.tags = generated.tags;
      await admin.from("products").update(updates).eq("id", product_ids[i]);
      await admin.from("import_job_items").update({ status: "success", mapped_data: generated, updated_at: new Date().toISOString() }).eq("job_id", jobId).eq("product_id", product_ids[i]);
      succeeded++;
    } catch (err: any) {
      await admin.from("import_job_items").update({ status: "failed", errors: [err.message], updated_at: new Date().toISOString() }).eq("job_id", jobId).eq("product_id", product_ids[i]);
      failed++;
    }
    await admin.from("background_jobs").update({ items_processed: i + 1, items_succeeded: succeeded, items_failed: failed, progress_percent: Math.round(((i + 1) / product_ids.length) * 100), updated_at: new Date().toISOString() }).eq("id", jobId);
  }
  await admin.from("background_jobs").update({ status: failed === product_ids.length ? "failed" : "completed", completed_at: new Date().toISOString(), items_processed: product_ids.length, items_succeeded: succeeded, items_failed: failed, progress_percent: 100 }).eq("id", jobId);
}

// ── Products CRUD ────────────────────────────────────────────────────────────
function mapProductRow(row: any) {
  const imagesArr = Array.isArray(row.images) ? row.images : [];
  const allImages = [...imagesArr, ...(row.image_url && !imagesArr.includes(row.image_url) ? [row.image_url] : [])].filter((img: string) => typeof img === "string" && img.startsWith("http"));
  return { id: row.id, name: row.name || row.title || "Produit sans nom", title: row.title, description: row.description ?? null, sku: row.sku ?? null, barcode: row.barcode ?? null, price: row.price ?? 0, compare_at_price: row.compare_at_price ?? null, cost_price: row.cost_price ?? 0, category: row.category ?? null, brand: row.brand ?? null, supplier: row.supplier ?? null, supplier_url: row.supplier_url ?? null, status: row.status ?? "draft", stock_quantity: row.stock_quantity ?? 0, weight: row.weight ?? null, weight_unit: row.weight_unit ?? "kg", images: allImages, variants: Array.isArray(row.variants) ? row.variants : [], tags: row.tags ?? [], seo_title: row.seo_title ?? null, seo_description: row.seo_description ?? null, is_published: row.is_published ?? false, view_count: row.view_count ?? 0, profit_margin: row.cost_price && row.price > 0 ? Math.round(((row.price - row.cost_price) / row.price) * 10000) / 100 : null, created_at: row.created_at, updated_at: row.updated_at };
}

async function listProducts(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url); const admin = serviceClient();
  let q = admin.from("products").select("*", { count: "exact" }).eq("user_id", auth.user.id).order("created_at", { ascending: false }).range(from, to);
  const status = url.searchParams.get("status"); if (status) q = q.eq("status", status);
  const category = url.searchParams.get("category"); if (category) q = q.eq("category", category);
  const search = url.searchParams.get("q"); if (search) q = q.or(`title.ilike.%${search}%,name.ilike.%${search}%,sku.ilike.%${search}%`);
  if (url.searchParams.get("low_stock") === "true") q = q.lt("stock_quantity", 10);
  const { data, count, error } = await q;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: (data ?? []).map(mapProductRow), meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function getProduct(productId: string, auth: Auth, reqId: string) {
  const { data, error } = await serviceClient().from("products").select("*").eq("id", productId).eq("user_id", auth.user.id).single();
  if (error || !data) return errorResponse("NOT_FOUND", "Product not found", 404, reqId);
  return json(mapProductRow(data), 200, reqId);
}

async function createProduct(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.title && !body.name) return errorResponse("VALIDATION_ERROR", "title or name is required", 400, reqId);
  const { data, error } = await serviceClient().from("products").insert({ user_id: auth.user.id, title: body.title ?? body.name, name: body.name ?? body.title, description: body.description ?? null, sku: body.sku ?? null, barcode: body.barcode ?? null, price: body.price ?? 0, compare_at_price: body.compare_at_price ?? null, cost_price: body.cost_price ?? 0, category: body.category ?? null, brand: body.brand ?? null, supplier: body.supplier ?? null, status: body.status ?? "draft", stock_quantity: body.stock_quantity ?? 0, weight: body.weight ?? null, weight_unit: body.weight_unit ?? "kg", images: body.images ?? [], image_url: Array.isArray(body.images) && body.images.length > 0 ? body.images[0] : body.image_url ?? null, variants: body.variants ?? [], tags: body.tags ?? [], seo_title: body.seo_title ?? null, seo_description: body.seo_description ?? null }).select("id, status, created_at").single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ id: data.id, status: data.status, created_at: data.created_at }, 201, reqId);
}

async function updateProduct(productId: string, req: Request, auth: Auth, reqId: string) {
  const body = await req.json(); const admin = serviceClient();
  const { data: existing } = await admin.from("products").select("id").eq("id", productId).eq("user_id", auth.user.id).single();
  if (!existing) return errorResponse("NOT_FOUND", "Product not found", 404, reqId);
  const updates: any = { updated_at: new Date().toISOString() };
  for (const f of ["title", "name", "description", "sku", "barcode", "price", "compare_at_price", "cost_price", "category", "brand", "supplier", "status", "stock_quantity", "weight", "weight_unit", "images", "variants", "tags", "seo_title", "seo_description", "is_published"]) if (body[f] !== undefined) updates[f] = body[f];
  if (body.images !== undefined) updates.image_url = Array.isArray(body.images) && body.images.length > 0 ? body.images[0] : null;
  const { data, error } = await admin.from("products").update(updates).eq("id", productId).eq("user_id", auth.user.id).select("id, status, updated_at").single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ id: data.id, status: data.status, updated_at: data.updated_at }, 200, reqId);
}

async function getProductStats(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const [{ count: total }, { count: active }, { count: draft }, { count: lowStock }, { count: outOfStock }] = await Promise.all([
    admin.from("products").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id),
    admin.from("products").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id).eq("status", "active"),
    admin.from("products").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id).eq("status", "draft"),
    admin.from("products").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id).lt("stock_quantity", 10).gt("stock_quantity", 0),
    admin.from("products").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id).eq("stock_quantity", 0),
  ]);
  const { data: agg } = await admin.from("products").select("price, cost_price, stock_quantity").eq("user_id", auth.user.id);
  let totalValue = 0, totalCost = 0, avgPrice = 0;
  if (agg && agg.length > 0) { for (const p of agg) { totalValue += (p.price ?? 0) * (p.stock_quantity ?? 0); totalCost += (p.cost_price ?? 0) * (p.stock_quantity ?? 0); } avgPrice = agg.reduce((s: number, p: any) => s + (p.price ?? 0), 0) / agg.length; }
  return json({ total: total ?? 0, active: active ?? 0, draft: draft ?? 0, inactive: (total ?? 0) - (active ?? 0) - (draft ?? 0), low_stock: lowStock ?? 0, out_of_stock: outOfStock ?? 0, total_value: Math.round(totalValue * 100) / 100, total_cost: Math.round(totalCost * 100) / 100, total_profit: Math.round((totalValue - totalCost) * 100) / 100, avg_price: Math.round(avgPrice * 100) / 100, profit_margin: totalValue > 0 ? Math.round(((totalValue - totalCost) / totalValue) * 10000) / 100 : 0 }, 200, reqId);
}

// ── SEO scoring ──────────────────────────────────────────────────────────────
function scoreProduct(product: any) {
  const issues: any[] = [], strengths: string[] = [];
  const title = product.seo_title || product.title || "";
  let titleScore = 0;
  if (!title) issues.push({ id: "no_title", severity: "critical", category: "seo", message: "Titre manquant", field: "title" });
  else { titleScore = title.length >= 20 && title.length <= 70 ? 100 : title.length >= 10 ? 50 : 20; if (titleScore === 100) strengths.push("Titre optimal"); }
  const meta = product.seo_description || "";
  let metaScore = 0;
  if (!meta) issues.push({ id: "no_meta", severity: "critical", category: "seo", message: "Meta description manquante", field: "seo_description" });
  else { metaScore = meta.length >= 120 && meta.length <= 160 ? 100 : meta.length >= 50 ? 50 : 20; if (metaScore === 100) strengths.push("Meta description optimale"); }
  const desc = product.description || ""; let contentScore = 0;
  if (!desc) issues.push({ id: "no_desc", severity: "critical", category: "content", message: "Description manquante", field: "description" });
  else contentScore = desc.length >= 300 ? 100 : desc.length >= 100 ? 80 : desc.length >= 50 ? 40 : 20;
  const images = Array.isArray(product.images) ? product.images : [];
  const imageScore = images.length === 0 ? 0 : images.length < 2 ? 50 : Math.min(100, images.length * 25);
  const fields = { sku: product.sku, brand: product.brand, category: product.category, barcode: product.barcode, weight: product.weight };
  const dataScore = Math.round((Object.values(fields).filter(v => v !== null && v !== undefined && v !== "").length / Object.keys(fields).length) * 100);
  const tags = Array.isArray(product.tags) ? product.tags : [];
  const aiScore = (tags.length >= 3 ? 40 : 0) + (product.brand ? 20 : 0) + (product.category ? 20 : 0) + (desc.length >= 100 ? 20 : 0);
  const globalScore = Math.round(titleScore * 0.25 + metaScore * 0.2 + contentScore * 0.2 + imageScore * 0.15 + dataScore * 0.1 + aiScore * 0.1);
  const criticalCount = issues.filter(i => i.severity === "critical").length;
  return { product_id: product.id, product_name: product.title || "Sans nom", current: { seo_title: product.seo_title, seo_description: product.seo_description, title: product.title, description: product.description }, score: { global: globalScore, seo: Math.round((titleScore + metaScore) / 2), content: contentScore, images: imageScore, data: dataScore, ai_readiness: aiScore }, status: globalScore >= 70 ? "optimized" : globalScore >= 40 ? "needs_work" : "critical", issues, strengths, business_impact: { traffic_impact: criticalCount > 2 ? "high" : criticalCount > 0 ? "medium" : "low", priority: criticalCount > 0 ? "urgent" : "normal" } };
}

// ── SEO handlers ─────────────────────────────────────────────────────────────
async function getProductSeo(productId: string, auth: Auth, reqId: string) {
  const { data: product, error } = await serviceClient().from("products").select("id, title, description, seo_title, seo_description, images, tags, sku, brand, category, barcode, weight, status").eq("id", productId).eq("user_id", auth.user.id).single();
  if (error || !product) return errorResponse("NOT_FOUND", "Product not found", 404, reqId);
  return json(scoreProduct(product), 200, reqId);
}

async function createSeoAudit(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.url) return errorResponse("VALIDATION_ERROR", "url is required", 400, reqId);
  const { data, error } = await serviceClient().from("seo_audits").insert({ user_id: auth.user.id, target_type: body.scope ?? "url", url: body.url, base_url: body.url, provider: body.provider ?? "internal", language: body.language ?? "fr", status: "pending", mode: body.scope ?? "page" }).select("id, status").single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ audit_id: data.id, status: "pending" }, 201, reqId);
}

async function listSeoAudits(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url); const admin = serviceClient();
  let q = admin.from("seo_audits").select("*", { count: "exact" }).eq("user_id", auth.user.id).order("created_at", { ascending: false }).range(from, to);
  const targetType = url.searchParams.get("target_type"); if (targetType) q = q.eq("target_type", targetType);
  const status = url.searchParams.get("status"); if (status) q = q.eq("status", status);
  const { data, count, error } = await q;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: (data ?? []).map((r: any) => ({ audit_id: r.id, url: r.url ?? r.base_url, score: r.score, status: r.status, created_at: r.created_at })), meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

// ── Misc data handlers (inline) ──────────────────────────────────────────────
async function simpleTableList(table: string, auth: Auth, url: URL, reqId: string, extraFilters?: (q: any) => any) {
  const { page, perPage, from, to } = parsePagination(url); const admin = serviceClient();
  let q = admin.from(table).select("*", { count: "exact" }).eq("user_id", auth.user.id).order("created_at", { ascending: false }).range(from, to);
  if (extraFilters) q = extraFilters(q);
  const { data, count, error } = await q;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data || [], meta: { page, per_page: perPage, total: count || 0 } }, 200, reqId);
}

async function simpleUpsert(table: string, req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const { data, error } = await serviceClient().from(table).upsert({ ...body, user_id: auth.user.id, updated_at: new Date().toISOString() }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 200, reqId);
}

// ── Orders & Customers ──────────────────────────────────────────────────────
async function listOrders(url: URL, auth: Auth, reqId: string) { return simpleTableList("orders", auth, url, reqId); }
async function createOrder(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const { data, error } = await serviceClient().from("orders").insert({ ...body, user_id: auth.user.id }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 201, reqId);
}
async function getOrderStats(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data } = await admin.from("orders").select("total_amount, status").eq("user_id", auth.user.id);
  const orders = data || [];
  return json({ total: orders.length, pending: orders.filter((o: any) => o.status === "pending").length, processing: orders.filter((o: any) => o.status === "processing").length, completed: orders.filter((o: any) => o.status === "completed").length, revenue: orders.reduce((s: number, o: any) => s + (o.total_amount || 0), 0) }, 200, reqId);
}
async function listCustomers(url: URL, auth: Auth, reqId: string) { return simpleTableList("customers", auth, url, reqId); }
async function createCustomer(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const { data, error } = await serviceClient().from("customers").insert({ ...body, user_id: auth.user.id }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 201, reqId);
}
async function getCustomerStats(auth: Auth, reqId: string) {
  const { count } = await serviceClient().from("customers").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id);
  return json({ total: count || 0 }, 200, reqId);
}

// ── Proxy to ext function ────────────────────────────────────────────────────
async function proxyToExt(req: Request, apiPath: string, reqId: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const newUrl = new URL(req.url);
  const extUrl = `${supabaseUrl}/functions/v1/api-v1-ext${apiPath}${newUrl.search}`;
  const resp = await fetch(extUrl, {
    method: req.method,
    headers: { Authorization: req.headers.get("authorization") || "", "Content-Type": "application/json", apikey: Deno.env.get("SUPABASE_ANON_KEY")!, "x-request-id": reqId },
    body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.text().catch(() => "{}"),
  });
  const data = await resp.text();
  return new Response(data, { status: resp.status, headers: { ...corsHeaders, "Content-Type": "application/json", "x-request-id": reqId } });
}

// ── Router ───────────────────────────────────────────────────────────────────
const EXT_PREFIXES = ["/v1/automation/", "/v1/marketing/", "/v1/ads/", "/v1/crm/", "/v1/finance/", "/v1/conversion/", "/v1/analytics/", "/v1/promotions/", "/v1/intelligence/", "/v1/behavior/", "/v1/ai/pricing-suggestions", "/v1/ai/trending-products", "/v1/ai/performance-analysis", "/v1/ai/business-summary", "/v1/integrations", "/v1/monetization/", "/v1/suppliers/premium"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const reqId = requestId(req);
  const url = new URL(req.url);
  const apiPath = url.pathname.replace(/^\/api-v1/, "") || "/";

  try {
    if (req.method === "GET" && (apiPath === "/v1/health" || apiPath === "/v1")) {
      return json({ status: "ok", version: "1.3.0", timestamp: new Date().toISOString() }, 200, reqId);
    }

    // Delegate to ext function for non-core routes
    if (EXT_PREFIXES.some(p => apiPath.startsWith(p))) return await proxyToExt(req, apiPath, reqId);

    const auth = await authenticate(req);
    if (!auth) return errorResponse("UNAUTHORIZED", "Valid Bearer token required", 401, reqId);

    const rateLimitEndpoint = apiPath.split("/").slice(0, 3).join("/");
    if (!checkRateLimit(auth.user.id, rateLimitEndpoint)) return errorResponse("RATE_LIMITED", "Too many requests", 429, reqId);

    const m = req.method;
    let p: Record<string, string> | null;

    // ── Products ────────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/products/stats", apiPath)) return await getProductStats(auth, reqId);
    if (m === "GET" && matchRoute("/v1/products", apiPath)) return await listProducts(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/products", apiPath)) return await createProduct(req, auth, reqId);
    if (m === "POST" && matchRoute("/v1/products/bulk", apiPath)) { const body = await req.json(); if (!body.product_ids?.length || !body.updates) return errorResponse("VALIDATION_ERROR", "product_ids and updates required", 400, reqId); const updates: any = { ...body.updates, updated_at: new Date().toISOString() }; delete updates.id; delete updates.user_id; const { error, count } = await serviceClient().from("products").update(updates).eq("user_id", auth.user.id).in("id", body.product_ids); if (error) return errorResponse("DB_ERROR", error.message, 500, reqId); return json({ updated: count ?? body.product_ids.length }, 200, reqId); }

    p = matchRoute("/v1/products/:id/seo", apiPath); if (m === "GET" && p) return await getProductSeo(p.id, auth, reqId);
    p = matchRoute("/v1/products/:id/optimize", apiPath); if (m === "POST" && p) return await createAiEnrichment(req, auth, reqId);
    p = matchRoute("/v1/products/:id/metrics", apiPath); if (m === "GET" && p) { const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "30", 10)); const periodType = url.searchParams.get("period") ?? "daily"; const { data: metrics } = await serviceClient().from("product_metrics").select("*").eq("product_id", p.id).eq("user_id", auth.user.id).eq("period_type", periodType).order("period_start", { ascending: false }).limit(limit); return json({ product_id: p.id, period_type: periodType, summary: { total_revenue: (metrics ?? []).reduce((s: number, m: any) => s + (m.revenue ?? 0), 0), total_orders: (metrics ?? []).reduce((s: number, m: any) => s + (m.orders ?? 0), 0) }, data_points: metrics ?? [] }, 200, reqId); }
    p = matchRoute("/v1/products/:id/stock-history", apiPath); if (m === "GET" && p) { const { data } = await serviceClient().from("stock_history").select("*").eq("product_id", p.id).eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(30); return json({ product_id: p.id, history: data ?? [] }, 200, reqId); }

    p = matchRoute("/v1/products/:id", apiPath);
    if (p && !["stats", "drafts", "bulk"].includes(p.id)) {
      if (m === "GET") return await getProduct(p.id, auth, reqId);
      if (m === "PUT") return await updateProduct(p.id, req, auth, reqId);
      if (m === "DELETE") { await serviceClient().from("products").delete().eq("id", p.id).eq("user_id", auth.user.id); return json({ success: true }, 200, reqId); }
    }

    // ── Import Jobs ─────────────────────────────────────────────
    if (m === "POST" && matchRoute("/v1/import/jobs", apiPath)) return await createImportJob(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/import/jobs", apiPath)) return await listImportJobs(url, auth, reqId);
    p = matchRoute("/v1/import/jobs/:id/items", apiPath); if (m === "GET" && p) return await getJobItems(p.id, url, auth, reqId);
    for (const action of ["retry", "cancel", "resume", "replay"]) { p = matchRoute(`/v1/import/jobs/:id/${action}`, apiPath); if (m === "POST" && p) return await jobAction(action, p.id, req, auth, reqId); }
    p = matchRoute("/v1/import/jobs/:id", apiPath); if (m === "GET" && p) return await getImportJob(p.id, auth, reqId);

    // ── Dedup & Enrich ──────────────────────────────────────────
    if (m === "POST" && matchRoute("/v1/import/deduplicate/scan", apiPath)) return await proxyEdgeFunction("detect-duplicates", req, auth, reqId, { action: "scan", threshold: 0.75 });
    if (m === "POST" && matchRoute("/v1/import/deduplicate/merge", apiPath)) return await proxyEdgeFunction("detect-duplicates", req, auth, reqId);
    if (m === "POST" && matchRoute("/v1/import/enrich", apiPath)) return await proxyEdgeFunction("ai-enrich-import", req, auth, reqId);

    // ── Presets ──────────────────────────────────────────────────
    if (m === "POST" && matchRoute("/v1/import/presets/import", apiPath)) return await importPreset(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/import/presets", apiPath)) return await listPresets(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/import/presets", apiPath)) return await createPreset(req, auth, reqId);
    p = matchRoute("/v1/import/presets/:id/default", apiPath); if (m === "POST" && p) return await presetAction("default", p.id, req, auth, reqId);
    p = matchRoute("/v1/import/presets/:id/export", apiPath); if (m === "GET" && p) return await presetAction("export", p.id, req, auth, reqId);
    p = matchRoute("/v1/import/presets/:id", apiPath); if (p) { if (m === "GET") return await presetAction("get", p.id, req, auth, reqId); if (m === "PUT") return await presetAction("update", p.id, req, auth, reqId); if (m === "DELETE") return await presetAction("delete", p.id, req, auth, reqId); }

    // ── CSV Uploads ─────────────────────────────────────────────
    if (m === "POST" && matchRoute("/v1/import/csv/uploads", apiPath)) return await createUploadSession(req, auth, reqId);
    p = matchRoute("/v1/import/csv/uploads/:id/analyze", apiPath); if (m === "POST" && p) return await analyzeUpload(p.id, req, auth, reqId);

    // ── AI Enrichments ──────────────────────────────────────────
    if (m === "POST" && matchRoute("/v1/ai/enrichments", apiPath)) return await createAiEnrichment(req, auth, reqId);
    p = matchRoute("/v1/ai/enrichments/:id/items", apiPath); if (m === "GET" && p) return await getJobItems(p.id, url, auth, reqId);
    p = matchRoute("/v1/ai/enrichments/:id", apiPath); if (m === "GET" && p) { const { data } = await serviceClient().from("background_jobs").select("*").eq("id", p.id).eq("user_id", auth.user.id).eq("job_type", "ai_enrichment").single(); if (!data) return errorResponse("NOT_FOUND", "Job not found", 404, reqId); return json(mapJobRow(data), 200, reqId); }

    // ── Drafts ───────────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/products/drafts", apiPath)) { const { page, perPage, from, to } = parsePagination(url); const { data, count, error } = await serviceClient().from("products").select("id, title, description, sku, cost_price, status, images, tags, seo_title, seo_description, created_at, updated_at", { count: "exact" }).eq("user_id", auth.user.id).eq("status", "draft").order("created_at", { ascending: false }).range(from, to); if (error) return errorResponse("DB_ERROR", error.message, 500, reqId); return json({ items: data ?? [], meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId); }
    if (m === "POST" && matchRoute("/v1/products/drafts/publish", apiPath)) { const body = await req.json(); if (!body.draft_ids?.length) return errorResponse("VALIDATION_ERROR", "draft_ids required", 400, reqId); const admin = serviceClient(); const { data: drafts } = await admin.from("products").select("id").eq("user_id", auth.user.id).in("id", body.draft_ids).eq("status", "draft"); const validIds = (drafts ?? []).map((d: any) => d.id); if (validIds.length === 0) return errorResponse("NOT_FOUND", "No valid drafts found", 404, reqId); await admin.from("products").update({ status: "active", updated_at: new Date().toISOString() }).in("id", validIds); return json({ published: validIds.length, skipped: body.draft_ids.length - validIds.length, product_ids: validIds }, 200, reqId); }

    // ── SEO ──────────────────────────────────────────────────────
    if (m === "POST" && matchRoute("/v1/seo/audit", apiPath)) return await createSeoAudit(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/seo/audits", apiPath)) return await listSeoAudits(url, auth, reqId);
    p = matchRoute("/v1/seo/audits/:id", apiPath); if (m === "GET" && p) { const admin = serviceClient(); const { data: audit } = await admin.from("seo_audits").select("*").eq("id", p.id).eq("user_id", auth.user.id).single(); if (!audit) return errorResponse("NOT_FOUND", "Audit not found", 404, reqId); const { data: issues } = await admin.from("seo_issues").select("*").eq("audit_id", p.id); return json({ audit_id: audit.id, url: audit.url ?? audit.base_url, score: audit.score, status: audit.status, summary: audit.summary, issues: issues ?? [] }, 200, reqId); }
    if (m === "POST" && matchRoute("/v1/seo/generate", apiPath)) { const body = await req.json(); if (!body.target_id) return errorResponse("VALIDATION_ERROR", "target_id is required", 400, reqId); const { data, error } = await serviceClient().from("seo_ai_generations").insert({ user_id: auth.user.id, target_type: body.target_type ?? "product", target_id: body.target_id, type: (body.actions ?? ["title"]).join(","), actions: body.actions ?? ["title", "description", "meta"], tone: body.tone ?? "conversion", language: body.language ?? "fr", status: "pending" }).select("id, status").single(); if (error) return errorResponse("DB_ERROR", error.message, 500, reqId); return json({ job_id: data.id, status: "pending" }, 201, reqId); }
    p = matchRoute("/v1/seo/generate/:id", apiPath); if (m === "GET" && p) { const { data, error } = await serviceClient().from("seo_ai_generations").select("*").eq("id", p.id).eq("user_id", auth.user.id).single(); if (error || !data) return errorResponse("NOT_FOUND", "Job not found", 404, reqId); return json(data, 200, reqId); }
    if (m === "POST" && matchRoute("/v1/seo/apply", apiPath)) { const body = await req.json(); if (!body.product_id || !body.content) return errorResponse("VALIDATION_ERROR", "product_id and content required", 400, reqId); const updates: any = { updated_at: new Date().toISOString() }; if (body.content.seo_title) updates.seo_title = body.content.seo_title; if (body.content.meta_description) updates.seo_description = body.content.meta_description; if (body.content.tags) updates.tags = body.content.tags; if (body.content.description) updates.description = body.content.description; await serviceClient().from("products").update(updates).eq("id", body.product_id).eq("user_id", auth.user.id); return json({ success: true, product_id: body.product_id }, 200, reqId); }
    if (m === "POST" && matchRoute("/v1/seo/products/audit", apiPath)) { const body = await req.json(); const productIds: string[] = body.product_ids ?? (body.product_id ? [body.product_id] : []); if (productIds.length === 0) return errorResponse("VALIDATION_ERROR", "product_ids required", 400, reqId); const { data: products, error } = await serviceClient().from("products").select("id, title, description, seo_title, seo_description, images, tags, sku, brand, category, barcode, weight, status").eq("user_id", auth.user.id).in("id", productIds); if (error) return errorResponse("DB_ERROR", error.message, 500, reqId); return json({ products: (products ?? []).map((p: any) => scoreProduct(p)), total: (products ?? []).length, audited_at: new Date().toISOString() }, 200, reqId); }
    if (m === "GET" && matchRoute("/v1/seo/products/scores", apiPath)) { const { page, perPage, from, to } = parsePagination(url); const { data: products, count, error } = await serviceClient().from("products").select("id, title, description, seo_title, seo_description, images, tags, sku, brand, category, barcode, weight, status", { count: "exact" }).eq("user_id", auth.user.id).order("updated_at", { ascending: true }).range(from, to); if (error) return errorResponse("DB_ERROR", error.message, 500, reqId); return json({ items: (products ?? []).map((p: any) => scoreProduct(p)), meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId); }
    p = matchRoute("/v1/seo/products/:id/score", apiPath); if (m === "GET" && p) return await getProductSeo(p.id, auth, reqId);
    p = matchRoute("/v1/seo/products/:id/history", apiPath); if (m === "GET" && p) { const { data } = await serviceClient().from("product_seo_versions").select("*").eq("user_id", auth.user.id).eq("product_id", p.id).order("created_at", { ascending: false }).limit(50); return json({ items: data ?? [] }, 200, reqId); }

    // ── Misc data endpoints ─────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/inventory/locations", apiPath)) { const { data } = await serviceClient().from("inventory_locations").select("*").eq("user_id", auth.user.id).order("name"); return json({ items: data || [] }, 200, reqId); }
    if (m === "GET" && matchRoute("/v1/inventory/levels", apiPath)) return await simpleTableList("inventory_levels", auth, url, reqId, (q) => { const pid = url.searchParams.get("product_id"); return pid ? q.eq("product_id", pid) : q; });
    if (m === "POST" && matchRoute("/v1/inventory/levels", apiPath)) return await simpleUpsert("inventory_levels", req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/prices", apiPath)) return await simpleTableList("product_prices", auth, url, reqId, (q) => { const pid = url.searchParams.get("product_id"); return pid ? q.eq("product_id", pid) : q; });
    if (m === "POST" && matchRoute("/v1/prices", apiPath)) return await simpleUpsert("product_prices", req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/events", apiPath)) return await simpleTableList("product_events", auth, url, reqId, (q) => { const pid = url.searchParams.get("product_id"); return pid ? q.eq("product_id", pid) : q; });
    if (m === "GET" && matchRoute("/v1/product-seo", apiPath)) return await simpleTableList("product_seo", auth, url, reqId, (q) => { const pid = url.searchParams.get("product_id"); return pid ? q.eq("product_id", pid) : q; });
    if (m === "POST" && matchRoute("/v1/product-seo", apiPath)) return await simpleUpsert("product_seo", req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/product-seo/versions", apiPath)) return await simpleTableList("product_seo_versions", auth, url, reqId, (q) => { const pid = url.searchParams.get("product_id"); return pid ? q.eq("product_id", pid) : q; });
    if (m === "GET" && matchRoute("/v1/store-products", apiPath)) return await simpleTableList("store_products", auth, url, reqId, (q) => { const pid = url.searchParams.get("product_id"); return pid ? q.eq("product_id", pid) : q; });
    if (m === "POST" && matchRoute("/v1/store-products", apiPath)) return await simpleUpsert("store_products", req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/ai/generations", apiPath)) return await simpleTableList("ai_generations", auth, url, reqId);
    if (m === "POST" && matchRoute("/v1/ai/generations", apiPath)) { const body = await req.json(); const { data, error } = await serviceClient().from("ai_generations").insert({ ...body, user_id: auth.user.id }).select().single(); if (error) return errorResponse("DB_ERROR", error.message, 500, reqId); return json(data, 201, reqId); }

    // ── Orders & Customers ──────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/orders/stats", apiPath)) return await getOrderStats(auth, reqId);
    if (m === "GET" && matchRoute("/v1/orders", apiPath)) return await listOrders(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/orders", apiPath)) return await createOrder(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/customers/stats", apiPath)) return await getCustomerStats(auth, reqId);
    if (m === "GET" && matchRoute("/v1/customers", apiPath)) return await listCustomers(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/customers", apiPath)) return await createCustomer(req, auth, reqId);

    // ── Activity feed ───────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/activity", apiPath)) { const limit = parseInt(url.searchParams.get("limit") ?? "20", 10); const { data } = await serviceClient().from("activity_logs").select("*").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(limit); return json({ items: data || [] }, 200, reqId); }

    return errorResponse("NOT_FOUND", `Route ${m} ${apiPath} not found`, 404, reqId);
  } catch (err: any) {
    console.error("api-v1 error:", err);
    return errorResponse("INTERNAL_ERROR", err.message || "Internal server error", 500, reqId);
  }
});
