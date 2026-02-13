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

function sanitizeString(input: string, maxLength = 1000): string {
  if (typeof input !== "string") return "";
  return input.slice(0, maxLength).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "").trim();
}

// ── Rate Limiting ───────────────────────────────────────────────────────────

const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, endpoint: string, maxRequests = 60, windowMs = 60000): boolean {
  const key = `${userId}:${endpoint}`;
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now >= entry.resetAt) { rateLimitStore.set(key, { count: 1, resetAt: now + windowMs }); return true; }
  entry.count++;
  return entry.count <= maxRequests;
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

function serviceClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

type Auth = NonNullable<Awaited<ReturnType<typeof authenticate>>>;

// ── Route matching ──────────────────────────────────────────────────────────

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const pp = pattern.split("/").filter(Boolean);
  const pathParts = path.split("/").filter(Boolean);
  if (pp.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < pp.length; i++) {
    if (pp[i].startsWith(":")) params[pp[i].slice(1)] = pathParts[i];
    else if (pp[i] !== pathParts[i]) return null;
  }
  return params;
}

// ── Generic CRUD Factory ────────────────────────────────────────────────────

interface CrudConfig {
  table: string;
  userField?: string; // default "user_id"
  useAdmin?: boolean; // use service client instead of user client
  orderBy?: string;
  orderAsc?: boolean;
  selectList?: string;
  selectOne?: string;
}

function crudList(cfg: CrudConfig) {
  return async (url: URL, auth: Auth, reqId: string) => {
    const { page, perPage, from, to } = parsePagination(url);
    const db = cfg.useAdmin ? serviceClient() : auth.supabase;
    const uf = cfg.userField ?? "user_id";
    let q = db.from(cfg.table).select(cfg.selectList ?? "*", { count: "exact" }).eq(uf, auth.user.id);
    const status = url.searchParams.get("status");
    if (status) q = q.eq("status", status);
    q = q.order(cfg.orderBy ?? "created_at", { ascending: cfg.orderAsc ?? false }).range(from, to);
    const { data, count, error } = await q;
    if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
    return json({ items: data || [], meta: { page, per_page: perPage, total: count || 0 } }, 200, reqId);
  };
}

function crudGet(cfg: CrudConfig) {
  return async (id: string, auth: Auth, reqId: string) => {
    const db = cfg.useAdmin ? serviceClient() : auth.supabase;
    const { data, error } = await db.from(cfg.table).select(cfg.selectOne ?? "*").eq("id", id).eq(cfg.userField ?? "user_id", auth.user.id).single();
    if (error) return errorResponse("NOT_FOUND", `${cfg.table} not found`, 404, reqId);
    return json(data, 200, reqId);
  };
}

function crudCreate(cfg: CrudConfig) {
  return async (req: Request, auth: Auth, reqId: string) => {
    const body = await req.json();
    const db = cfg.useAdmin ? serviceClient() : auth.supabase;
    const { data, error } = await db.from(cfg.table).insert({ ...body, [cfg.userField ?? "user_id"]: auth.user.id }).select().single();
    if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
    return json(data, 201, reqId);
  };
}

function crudUpdate(cfg: CrudConfig) {
  return async (id: string, req: Request, auth: Auth, reqId: string) => {
    const body = await req.json();
    const db = cfg.useAdmin ? serviceClient() : auth.supabase;
    const { data, error } = await db.from(cfg.table).update({ ...body, updated_at: new Date().toISOString() }).eq("id", id).eq(cfg.userField ?? "user_id", auth.user.id).select().single();
    if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
    return json(data, 200, reqId);
  };
}

function crudDelete(cfg: CrudConfig) {
  return async (id: string, auth: Auth, reqId: string) => {
    const db = cfg.useAdmin ? serviceClient() : auth.supabase;
    const { error } = await db.from(cfg.table).delete().eq("id", id).eq(cfg.userField ?? "user_id", auth.user.id);
    if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
    return json({ success: true }, 200, reqId);
  };
}

function crudSimpleList(table: string, opts?: { orderBy?: string; filterField?: string; filterValue?: any; useAdmin?: boolean }) {
  return async (auth: Auth, reqId: string) => {
    const db = opts?.useAdmin ? serviceClient() : auth.supabase;
    let q = db.from(table).select("*").eq("user_id", auth.user.id);
    if (opts?.filterField) q = q.eq(opts.filterField, opts.filterValue);
    q = q.order(opts?.orderBy ?? "created_at", { ascending: false });
    const { data, error } = await q;
    if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
    return json({ items: data || [] }, 200, reqId);
  };
}

function crudSimpleListActive(table: string, orderBy = "created_at") {
  return async (auth: Auth, reqId: string) => {
    const db = serviceClient();
    const { data, error } = await db.from(table).select("*").eq("is_active", true).order(orderBy, { ascending: true });
    if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
    return json({ items: data || [] }, 200, reqId);
  };
}

// ── CRUD Configs ────────────────────────────────────────────────────────────

const automationTriggersCfg: CrudConfig = { table: "automation_triggers", useAdmin: true };
const automationActionsCfg: CrudConfig = { table: "automation_actions", useAdmin: true, orderBy: "execution_order", orderAsc: true };
const automationWorkflowsCfg: CrudConfig = { table: "automation_workflows", useAdmin: true, orderBy: "updated_at" };
const integrationsCfg: CrudConfig = { table: "integrations", useAdmin: true };
const adAccountsCfg: CrudConfig = { table: "ad_accounts", useAdmin: true };
const adCampaignsCfg: CrudConfig = { table: "ad_campaigns", useAdmin: true };
const marketingCampaignsCfg: CrudConfig = { table: "marketing_campaigns", useAdmin: true };
const automatedCampaignsCfg: CrudConfig = { table: "automated_campaigns", useAdmin: true };
const promotionCampaignsCfg: CrudConfig = { table: "promotion_campaigns", useAdmin: true };
const promotionRulesCfg: CrudConfig = { table: "promotion_automation_rules", useAdmin: true };
const crmTasksCfg: CrudConfig = { table: "crm_tasks", useAdmin: true };
const crmDealsCfg: CrudConfig = { table: "crm_deals", useAdmin: true };
const pricingRulesCfg: CrudConfig = { table: "pricing_rules", useAdmin: true };

// ── SHA-256 helper ──────────────────────────────────────────────────────────

async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ── Import Jobs Handlers ─────────────────────────────────────────────────────

function mapJobRow(row: any) {
  return {
    job_id: row.id, status: row.status, job_type: row.job_subtype ?? row.job_type, name: row.name,
    progress: { total: row.items_total ?? 0, processed: row.items_processed ?? 0, success: row.items_succeeded ?? 0, failed: row.items_failed ?? 0, percent: row.progress_percent ?? 0 },
    created_at: row.created_at, started_at: row.started_at, completed_at: row.completed_at, error_message: row.error_message,
  };
}

async function createImportJob(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.source?.type) return errorResponse("VALIDATION_ERROR", "source.type is required", 400, reqId);
  const admin = serviceClient();
  const { data: job, error } = await admin.from("background_jobs").insert({
    user_id: auth.user.id, job_type: "import", job_subtype: body.source.type, status: "queued",
    name: `Import ${body.source.type}`, input_data: { source: body.source, preset_id: body.preset_id, options: body.options },
    metadata: { idempotency_key: req.headers.get("idempotency-key"), source_type: body.source.type },
    items_total: 0, items_processed: 0, items_succeeded: 0, items_failed: 0, progress_percent: 0,
  }).select("id, status").single();
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

  if (action === "retry") {
    const body = await req.json().catch(() => ({}));
    const onlyFailed = body.only_failed !== false;
    const uq = admin.from("import_job_items").update({ status: "pending", errors: [], updated_at: new Date().toISOString() }).eq("job_id", jobId);
    if (onlyFailed) uq.eq("status", "failed");
    await uq;
    await admin.from("background_jobs").update({ status: "queued", updated_at: new Date().toISOString() }).eq("id", jobId);
    return json({ job_id: jobId, status: "queued" }, 200, reqId);
  }
  if (action === "cancel") {
    if (job.status === "completed" || job.status === "cancelled") return errorResponse("INVALID_STATE", `Cannot cancel job in ${job.status} state`, 409, reqId);
    await admin.from("background_jobs").update({ status: "cancelled", completed_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", jobId);
    return json({ job_id: jobId, status: "cancelled" }, 200, reqId);
  }
  if (action === "resume") {
    if (!["cancelled", "paused", "failed"].includes(job.status)) return errorResponse("INVALID_STATE", `Cannot resume job in ${job.status} state`, 409, reqId);
    await admin.from("import_job_items").update({ status: "pending", updated_at: new Date().toISOString() }).eq("job_id", jobId).in("status", ["cancelled", "paused"]);
    await admin.from("background_jobs").update({ status: "queued", updated_at: new Date().toISOString(), completed_at: null }).eq("id", jobId);
    return json({ job_id: jobId, status: "queued", remaining: (job.items_total ?? 0) - (job.items_processed ?? 0) }, 200, reqId);
  }
  if (action === "replay") {
    const { data: newJob, error } = await admin.from("background_jobs").insert({
      user_id: auth.user.id, job_type: job.job_type, job_subtype: job.job_subtype, status: "queued",
      name: `Replay: ${job.name || job.job_subtype}`, input_data: job.input_data,
      metadata: { ...((job.metadata as any) || {}), replayed_from: jobId },
      items_total: 0, items_processed: 0, items_succeeded: 0, items_failed: 0, progress_percent: 0,
    }).select("id, status").single();
    if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
    return json({ job_id: newJob.id, status: newJob.status, replayed_from: jobId }, 201, reqId);
  }
  return errorResponse("INVALID_ACTION", "Unknown action", 400, reqId);
}

async function proxyEdgeFunction(fnName: string, req: Request, auth: Auth, reqId: string, bodyOverride?: any) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const resp = await fetch(`${supabaseUrl}/functions/v1/${fnName}`, {
    method: "POST",
    headers: { Authorization: req.headers.get("authorization") || "", "Content-Type": "application/json", apikey: Deno.env.get("SUPABASE_ANON_KEY")! },
    body: JSON.stringify(bodyOverride ?? await req.json().catch(() => ({}))),
  });
  const data = await resp.json();
  return json(data, resp.status, reqId);
}

// ── Preset Handlers ──────────────────────────────────────────────────────────

function mapPresetRow(row: any) {
  return { id: row.id, name: row.name, scope: row.scope, store_id: row.store_id, platform: row.platform, version: row.version, is_default: row.is_default, columns_signature: row.columns_signature, columns: row.columns, has_header: row.has_header, delimiter: row.delimiter, encoding: row.encoding, mapping: row.mapping, last_used_at: row.last_used_at, use_count: row.usage_count, created_at: row.created_at, updated_at: row.updated_at };
}

async function listPresets(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const platform = url.searchParams.get("platform");
  const q = url.searchParams.get("q");
  const admin = serviceClient();
  let query = admin.from("mapping_presets").select("*", { count: "exact" }).eq("user_id", auth.user.id).order("usage_count", { ascending: false }).range(from, to);
  if (platform) query = query.eq("platform", platform);
  if (q) query = query.ilike("name", `%${q}%`);
  const { data, count, error } = await query;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: (data ?? []).map(mapPresetRow), meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function createPreset(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.name) return errorResponse("VALIDATION_ERROR", "name is required", 400, reqId);
  if (!body.mapping || typeof body.mapping !== "object") return errorResponse("VALIDATION_ERROR", "mapping is required", 400, reqId);
  const admin = serviceClient();
  const { data, error } = await admin.from("mapping_presets").insert({
    user_id: auth.user.id, name: body.name, mapping: body.mapping, platform: body.platform ?? "generic",
    scope: body.scope ?? "user", store_id: body.store_id ?? null, has_header: body.has_header ?? true,
    delimiter: body.delimiter ?? ",", encoding: body.encoding ?? "utf-8", columns: body.columns ?? null,
    columns_signature: body.columns ? await sha256(body.columns.sort().join("|")) : null, icon: body.icon ?? "csv",
  }).select("id, version").single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ id: data.id, version: data.version }, 201, reqId);
}

async function presetAction(action: string, presetId: string, req: Request, auth: Auth, reqId: string) {
  const admin = serviceClient();
  if (action === "get") {
    const { data, error } = await admin.from("mapping_presets").select("*").eq("id", presetId).eq("user_id", auth.user.id).single();
    if (error || !data) return errorResponse("NOT_FOUND", "Preset not found", 404, reqId);
    return json(mapPresetRow(data), 200, reqId);
  }
  if (action === "update") {
    const body = await req.json();
    const { data: current } = await admin.from("mapping_presets").select("version").eq("id", presetId).eq("user_id", auth.user.id).single();
    if (!current) return errorResponse("NOT_FOUND", "Preset not found", 404, reqId);
    const updates: any = { version: current.version + 1, updated_at: new Date().toISOString() };
    for (const f of ["name", "mapping", "platform", "has_header", "delimiter", "encoding"]) if ((body as any)[f] !== undefined) updates[f] = (body as any)[f];
    if (body.columns !== undefined) { updates.columns = body.columns; updates.columns_signature = await sha256(body.columns.sort().join("|")); }
    const { data, error } = await admin.from("mapping_presets").update(updates).eq("id", presetId).eq("user_id", auth.user.id).select("id, version").single();
    if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
    return json({ id: data.id, version: data.version }, 200, reqId);
  }
  if (action === "delete") {
    const { error } = await admin.from("mapping_presets").delete().eq("id", presetId).eq("user_id", auth.user.id);
    if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
    return json({ success: true }, 200, reqId);
  }
  if (action === "default") {
    const { data: preset } = await admin.from("mapping_presets").select("platform").eq("id", presetId).eq("user_id", auth.user.id).single();
    if (!preset) return errorResponse("NOT_FOUND", "Preset not found", 404, reqId);
    await admin.from("mapping_presets").update({ is_default: false }).eq("user_id", auth.user.id).eq("platform", preset.platform).eq("is_default", true);
    await admin.from("mapping_presets").update({ is_default: true }).eq("id", presetId);
    return json({ id: presetId, is_default: true }, 200, reqId);
  }
  if (action === "export") {
    const { data, error } = await admin.from("mapping_presets").select("*").eq("id", presetId).eq("user_id", auth.user.id).single();
    if (error || !data) return errorResponse("NOT_FOUND", "Preset not found", 404, reqId);
    const { id, user_id, created_at, updated_at, usage_count, last_used_at, ...exportable } = data;
    return json({ preset: exportable }, 200, reqId);
  }
  return errorResponse("INVALID_ACTION", "Unknown action", 400, reqId);
}

async function importPreset(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.preset) return errorResponse("VALIDATION_ERROR", "preset object required", 400, reqId);
  const p = body.preset;
  const admin = serviceClient();
  const { data, error } = await admin.from("mapping_presets").insert({
    user_id: auth.user.id, name: p.name ?? "Imported Preset", mapping: p.mapping ?? {},
    platform: p.platform ?? "generic", scope: p.scope ?? "user", has_header: p.has_header ?? true,
    delimiter: p.delimiter ?? ",", encoding: p.encoding ?? "utf-8", columns: p.columns ?? null,
    columns_signature: p.columns_signature ?? null, icon: p.icon ?? "csv", version: 1,
  }).select("id, version").single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ id: data.id, version: data.version }, 201, reqId);
}

// ── CSV Upload Handlers ──────────────────────────────────────────────────────

async function createUploadSession(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.filename) return errorResponse("VALIDATION_ERROR", "filename is required", 400, reqId);
  const admin = serviceClient();
  const uploadId = crypto.randomUUID();
  const filePath = `imports/${auth.user.id}/${uploadId}/${body.filename}`;
  const { data: signedData } = await admin.storage.from("import-files").createSignedUploadUrl(filePath);
  const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
  const { data, error } = await admin.from("import_uploads").insert({ id: uploadId, user_id: auth.user.id, filename: body.filename, file_path: filePath, status: "pending", expires_at: expiresAt }).select("id").single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ upload_id: data.id, upload_url: signedData?.signedUrl ?? null, expires_at: expiresAt }, 201, reqId);
}

function detectDelimiter(text: string): string {
  const firstLine = text.split("\n")[0] ?? "";
  const counts: Record<string, number> = { ",": 0, ";": 0, "\t": 0, "|": 0 };
  for (const char of Object.keys(counts)) counts[char] = firstLine.split(char).length - 1;
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
      if (synonyms.includes(lower)) { mapping[col] = { field }; break; }
    }
  }
  return mapping;
}

async function analyzeUpload(uploadId: string, req: Request, auth: Auth, reqId: string) {
  const body = await req.json().catch(() => ({}));
  const admin = serviceClient();
  const { data: upload } = await admin.from("import_uploads").select("*").eq("id", uploadId).eq("user_id", auth.user.id).single();
  if (!upload) return errorResponse("NOT_FOUND", "Upload not found", 404, reqId);
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
      if (hasHeader && lines.length > 0) columns = lines[0].split(delimiter).map((c: string) => c.trim().replace(/^"|"$/g, ""));
      const dataLines = hasHeader ? lines.slice(1, 6) : lines.slice(0, 5);
      sampleRows = dataLines.map((line: string) => { const values = line.split(delimiter).map((v: string) => v.trim().replace(/^"|"$/g, "")); const row: Record<string, string> = {}; columns.forEach((col, i) => { row[col] = values[i] ?? ""; }); return row; });
      signature = await sha256(columns.sort().join("|"));
      await admin.from("import_uploads").update({ columns, sample_rows: sampleRows, columns_signature: signature, has_header: hasHeader, delimiter, status: "analyzed", updated_at: new Date().toISOString() }).eq("id", uploadId);
    }
  }
  const suggestedMapping = suggestMapping(columns);
  let matchingPresets: any[] = [];
  if (signature) {
    const { data: presets } = await admin.from("mapping_presets").select("id, name, columns_signature, usage_count").eq("user_id", auth.user.id).eq("columns_signature", signature);
    matchingPresets = (presets ?? []).map(p => ({ preset_id: p.id, name: p.name, confidence: 1.0 }));
  }
  if (matchingPresets.length === 0 && columns.length > 0) {
    const { data: allPresets } = await admin.from("mapping_presets").select("id, name, columns").eq("user_id", auth.user.id).not("columns", "is", null);
    for (const p of allPresets ?? []) {
      if (!p.columns) continue;
      const overlap = (p.columns as string[]).filter((c: string) => columns.includes(c)).length;
      const confidence = overlap / Math.max(columns.length, (p.columns as string[]).length);
      if (confidence > 0.5) matchingPresets.push({ preset_id: p.id, name: p.name, confidence: Math.round(confidence * 100) / 100 });
    }
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
  const { data: job, error } = await admin.from("background_jobs").insert({
    user_id: auth.user.id, job_type: "ai_enrichment", job_subtype: "seo", status: "queued",
    name: `AI Enrichment (${body.product_ids.length} products)`,
    input_data: { product_ids: body.product_ids, language: body.language ?? "fr", tone: body.tone ?? "premium", targets: body.targets ?? ["seo_title", "meta_description", "tags"], store_id: body.store_id },
    metadata: { idempotency_key: req.headers.get("idempotency-key") },
    items_total: body.product_ids.length, items_processed: 0, items_succeeded: 0, items_failed: 0, progress_percent: 0,
  }).select("id, status").single();
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
  const { product_ids, language, tone, targets } = params;
  let succeeded = 0, failed = 0;
  for (let i = 0; i < product_ids.length; i++) {
    try {
      const { data: product } = await admin.from("products").select("title, description, tags, seo_title, seo_description, sku").eq("id", product_ids[i]).single();
      if (!product) throw new Error("Product not found");
      const prompt = `Tu es un expert SEO e-commerce. Génère du contenu optimisé.\nLangue: ${language ?? "fr"}, Ton: ${tone ?? "premium"}\nProduit: ${product.title}\nDescription: ${product.description ?? "aucune"}\nTags: ${(product.tags ?? []).join(", ") || "aucun"}\nRetourne JSON: {"seo_title":"...","meta_description":"...","tags":["..."],"keywords":["..."]}`;
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: "Expert SEO e-commerce. JSON only." }, { role: "user", content: prompt }], temperature: 0.3 }),
      });
      if (!aiResp.ok) throw new Error(`AI error ${aiResp.status}`);
      const aiData = await aiResp.json();
      const content = aiData.choices?.[0]?.message?.content ?? "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const generated = jsonMatch ? JSON.parse(jsonMatch[0]) : {};
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
  return {
    id: row.id, name: row.name || row.title || "Produit sans nom", title: row.title, description: row.description ?? null,
    sku: row.sku ?? null, barcode: row.barcode ?? null, price: row.price ?? 0, compare_at_price: row.compare_at_price ?? null,
    cost_price: row.cost_price ?? 0, category: row.category ?? null, brand: row.brand ?? null, supplier: row.supplier ?? null,
    supplier_url: row.supplier_url ?? null, status: row.status ?? "draft", stock_quantity: row.stock_quantity ?? 0,
    weight: row.weight ?? null, weight_unit: row.weight_unit ?? "kg", images: allImages,
    variants: Array.isArray(row.variants) ? row.variants : [], tags: row.tags ?? [],
    seo_title: row.seo_title ?? null, seo_description: row.seo_description ?? null,
    is_published: row.is_published ?? false, view_count: row.view_count ?? 0,
    profit_margin: row.cost_price && row.price > 0 ? Math.round(((row.price - row.cost_price) / row.price) * 10000) / 100 : null,
    created_at: row.created_at, updated_at: row.updated_at,
  };
}

async function listProducts(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const admin = serviceClient();
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
  const admin = serviceClient();
  const { data, error } = await admin.from("products").select("*").eq("id", productId).eq("user_id", auth.user.id).single();
  if (error || !data) return errorResponse("NOT_FOUND", "Product not found", 404, reqId);
  return json(mapProductRow(data), 200, reqId);
}

async function createProduct(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.title && !body.name) return errorResponse("VALIDATION_ERROR", "title or name is required", 400, reqId);
  const admin = serviceClient();
  const { data, error } = await admin.from("products").insert({
    user_id: auth.user.id, title: body.title ?? body.name, name: body.name ?? body.title,
    description: body.description ?? null, sku: body.sku ?? null, barcode: body.barcode ?? null,
    price: body.price ?? 0, compare_at_price: body.compare_at_price ?? null, cost_price: body.cost_price ?? 0,
    category: body.category ?? null, brand: body.brand ?? null, supplier: body.supplier ?? null,
    status: body.status ?? "draft", stock_quantity: body.stock_quantity ?? 0,
    weight: body.weight ?? null, weight_unit: body.weight_unit ?? "kg",
    images: body.images ?? [], image_url: Array.isArray(body.images) && body.images.length > 0 ? body.images[0] : body.image_url ?? null,
    variants: body.variants ?? [], tags: body.tags ?? [],
    seo_title: body.seo_title ?? null, seo_description: body.seo_description ?? null,
  }).select("id, status, created_at").single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ id: data.id, status: data.status, created_at: data.created_at }, 201, reqId);
}

async function updateProduct(productId: string, req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const admin = serviceClient();
  const { data: existing } = await admin.from("products").select("id").eq("id", productId).eq("user_id", auth.user.id).single();
  if (!existing) return errorResponse("NOT_FOUND", "Product not found", 404, reqId);
  const updates: any = { updated_at: new Date().toISOString() };
  const allowed = ["title", "name", "description", "sku", "barcode", "price", "compare_at_price", "cost_price", "category", "brand", "supplier", "status", "stock_quantity", "weight", "weight_unit", "images", "variants", "tags", "seo_title", "seo_description", "is_published"];
  for (const f of allowed) if (body[f] !== undefined) updates[f] = body[f];
  if (body.images !== undefined) updates.image_url = Array.isArray(body.images) && body.images.length > 0 ? body.images[0] : null;
  const { data, error } = await admin.from("products").update(updates).eq("id", productId).eq("user_id", auth.user.id).select("id, status, updated_at").single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ id: data.id, status: data.status, updated_at: data.updated_at }, 200, reqId);
}

async function deleteProduct(productId: string, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { error } = await admin.from("products").delete().eq("id", productId).eq("user_id", auth.user.id);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ success: true }, 200, reqId);
}

async function bulkUpdateProducts(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.product_ids?.length || !body.updates) return errorResponse("VALIDATION_ERROR", "product_ids and updates required", 400, reqId);
  const admin = serviceClient();
  const updates: any = { ...body.updates, updated_at: new Date().toISOString() }; delete updates.id; delete updates.user_id;
  const { error, count } = await admin.from("products").update(updates).eq("user_id", auth.user.id).in("id", body.product_ids);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ updated: count ?? body.product_ids.length }, 200, reqId);
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
  if (agg && agg.length > 0) {
    for (const p of agg) { totalValue += (p.price ?? 0) * (p.stock_quantity ?? 0); totalCost += (p.cost_price ?? 0) * (p.stock_quantity ?? 0); }
    avgPrice = agg.reduce((s: number, p: any) => s + (p.price ?? 0), 0) / agg.length;
  }
  return json({ total: total ?? 0, active: active ?? 0, draft: draft ?? 0, inactive: (total ?? 0) - (active ?? 0) - (draft ?? 0), low_stock: lowStock ?? 0, out_of_stock: outOfStock ?? 0, total_value: Math.round(totalValue * 100) / 100, total_cost: Math.round(totalCost * 100) / 100, total_profit: Math.round((totalValue - totalCost) * 100) / 100, avg_price: Math.round(avgPrice * 100) / 100, profit_margin: totalValue > 0 ? Math.round(((totalValue - totalCost) / totalValue) * 10000) / 100 : 0 }, 200, reqId);
}

// ── SEO scoring ──────────────────────────────────────────────────────────────

function scoreProduct(product: any) {
  const issues: any[] = [], strengths: string[] = [];
  const title = product.seo_title || product.title || "";
  let titleScore = 0;
  if (!title) issues.push({ id: "no_title", severity: "critical", category: "seo", message: "Titre manquant", field: "title" });
  else { if (title.length >= 20 && title.length <= 70) { titleScore = 100; strengths.push("Titre optimal"); } else titleScore = title.length >= 10 ? 50 : 20; }
  const meta = product.seo_description || "";
  let metaScore = 0;
  if (!meta) issues.push({ id: "no_meta", severity: "critical", category: "seo", message: "Meta description manquante", field: "seo_description" });
  else { if (meta.length >= 120 && meta.length <= 160) { metaScore = 100; strengths.push("Meta description optimale"); } else metaScore = meta.length >= 50 ? 50 : 20; }
  const desc = product.description || "";
  let contentScore = 0;
  if (!desc) issues.push({ id: "no_desc", severity: "critical", category: "content", message: "Description manquante", field: "description" });
  else { contentScore = desc.length >= 300 ? 100 : desc.length >= 100 ? 80 : desc.length >= 50 ? 40 : 20; }
  const images = Array.isArray(product.images) ? product.images : [];
  let imageScore = images.length === 0 ? 0 : images.length < 2 ? 50 : Math.min(100, images.length * 25);
  const fields = { sku: product.sku, brand: product.brand, category: product.category, barcode: product.barcode, weight: product.weight };
  const filledCount = Object.values(fields).filter(v => v !== null && v !== undefined && v !== "").length;
  const dataScore = Math.round((filledCount / Object.keys(fields).length) * 100);
  const tags = Array.isArray(product.tags) ? product.tags : [];
  let aiScore = (tags.length >= 3 ? 40 : 0) + (product.brand ? 20 : 0) + (product.category ? 20 : 0) + (desc.length >= 100 ? 20 : 0);
  const globalScore = Math.round(titleScore * 0.25 + metaScore * 0.2 + contentScore * 0.2 + imageScore * 0.15 + dataScore * 0.1 + aiScore * 0.1);
  const criticalCount = issues.filter(i => i.severity === "critical").length;
  return {
    product_id: product.id, product_name: product.title || "Sans nom",
    current: { seo_title: product.seo_title, seo_description: product.seo_description, title: product.title, description: product.description },
    score: { global: globalScore, seo: Math.round((titleScore + metaScore) / 2), content: contentScore, images: imageScore, data: dataScore, ai_readiness: aiScore },
    status: globalScore >= 70 ? "optimized" : globalScore >= 40 ? "needs_work" : "critical",
    issues, strengths,
    business_impact: { traffic_impact: criticalCount > 2 ? "high" : criticalCount > 0 ? "medium" : "low", priority: criticalCount > 0 ? "urgent" : "normal" },
  };
}

// ── Product sub-resource handlers ────────────────────────────────────────────

async function getProductSeo(productId: string, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data: product, error } = await admin.from("products").select("id, title, description, seo_title, seo_description, images, tags, sku, brand, category, barcode, weight, status").eq("id", productId).eq("user_id", auth.user.id).single();
  if (error || !product) return errorResponse("NOT_FOUND", "Product not found", 404, reqId);
  return json(scoreProduct(product), 200, reqId);
}

async function getProductMetrics(productId: string, url: URL, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const periodType = url.searchParams.get("period") ?? "daily";
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "30", 10));
  const { data: product } = await admin.from("products").select("id").eq("id", productId).eq("user_id", auth.user.id).single();
  if (!product) return errorResponse("NOT_FOUND", "Product not found", 404, reqId);
  const { data: metrics, error } = await admin.from("product_metrics").select("*").eq("product_id", productId).eq("user_id", auth.user.id).eq("period_type", periodType).order("period_start", { ascending: false }).limit(limit);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  const totalRevenue = (metrics ?? []).reduce((s: number, m: any) => s + (m.revenue ?? 0), 0);
  const totalOrders = (metrics ?? []).reduce((s: number, m: any) => s + (m.orders ?? 0), 0);
  return json({ product_id: productId, period_type: periodType, summary: { total_revenue: totalRevenue, total_orders: totalOrders }, data_points: metrics ?? [] }, 200, reqId);
}

async function getProductStockHistory(productId: string, url: URL, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "30", 10));
  const { data, error } = await admin.from("stock_history").select("*").eq("product_id", productId).eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(limit);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ product_id: productId, history: data ?? [] }, 200, reqId);
}

// ── Drafts ────────────────────────────────────────────────────────────────────

async function listDrafts(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const admin = serviceClient();
  const { data, count, error } = await admin.from("products").select("id, title, description, sku, cost_price, status, images, tags, seo_title, seo_description, created_at, updated_at", { count: "exact" }).eq("user_id", auth.user.id).eq("status", "draft").order("created_at", { ascending: false }).range(from, to);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data ?? [], meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function publishDrafts(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.draft_ids?.length) return errorResponse("VALIDATION_ERROR", "draft_ids required", 400, reqId);
  const admin = serviceClient();
  const { data: drafts } = await admin.from("products").select("id").eq("user_id", auth.user.id).in("id", body.draft_ids).eq("status", "draft");
  const validIds = (drafts ?? []).map((d: any) => d.id);
  if (validIds.length === 0) return errorResponse("NOT_FOUND", "No valid drafts found", 404, reqId);
  await admin.from("products").update({ status: "active", updated_at: new Date().toISOString() }).in("id", validIds);
  return json({ published: validIds.length, skipped: body.draft_ids.length - validIds.length, product_ids: validIds }, 200, reqId);
}

// ── SEO Handlers (audit, generate, apply) ────────────────────────────────────

async function createSeoAudit(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.url) return errorResponse("VALIDATION_ERROR", "url is required", 400, reqId);
  const admin = serviceClient();
  const { data: audit, error } = await admin.from("seo_audits").insert({ user_id: auth.user.id, target_type: body.scope ?? "url", url: body.url, base_url: body.url, provider: body.provider ?? "internal", language: body.language ?? "fr", status: "pending", mode: body.scope ?? "page" }).select("id, status").single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ audit_id: audit.id, status: "pending" }, 201, reqId);
}

async function listSeoAudits(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const admin = serviceClient();
  let q = admin.from("seo_audits").select("*", { count: "exact" }).eq("user_id", auth.user.id).order("created_at", { ascending: false }).range(from, to);
  const targetType = url.searchParams.get("target_type"); if (targetType) q = q.eq("target_type", targetType);
  const status = url.searchParams.get("status"); if (status) q = q.eq("status", status);
  const { data, count, error } = await q;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: (data ?? []).map((r: any) => ({ audit_id: r.id, url: r.url ?? r.base_url, score: r.score, status: r.status, created_at: r.created_at })), meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function getSeoAudit(auditId: string, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data: audit, error } = await admin.from("seo_audits").select("*").eq("id", auditId).eq("user_id", auth.user.id).single();
  if (error || !audit) return errorResponse("NOT_FOUND", "Audit not found", 404, reqId);
  const { data: issues } = await admin.from("seo_issues").select("*").eq("audit_id", auditId);
  return json({ audit_id: audit.id, url: audit.url ?? audit.base_url, score: audit.score, status: audit.status, summary: audit.summary, issues: issues ?? [] }, 200, reqId);
}

async function createSeoGenerate(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.target_id) return errorResponse("VALIDATION_ERROR", "target_id is required", 400, reqId);
  const admin = serviceClient();
  const { data: job, error } = await admin.from("seo_ai_generations").insert({ user_id: auth.user.id, target_type: body.target_type ?? "product", target_id: body.target_id, type: (body.actions ?? ["title"]).join(","), actions: body.actions ?? ["title", "description", "meta"], tone: body.tone ?? "conversion", language: body.language ?? "fr", status: "pending" }).select("id, status").single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ job_id: job.id, status: "pending" }, 201, reqId);
}

async function getSeoGeneration(jobId: string, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin.from("seo_ai_generations").select("*").eq("id", jobId).eq("user_id", auth.user.id).single();
  if (error || !data) return errorResponse("NOT_FOUND", "Job not found", 404, reqId);
  return json(data, 200, reqId);
}

async function applySeoContent(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.product_id || !body.content) return errorResponse("VALIDATION_ERROR", "product_id and content required", 400, reqId);
  const admin = serviceClient();
  const updates: any = { updated_at: new Date().toISOString() };
  if (body.content.seo_title) updates.seo_title = body.content.seo_title;
  if (body.content.meta_description) updates.seo_description = body.content.meta_description;
  if (body.content.tags) updates.tags = body.content.tags;
  if (body.content.description) updates.description = body.content.description;
  const { error } = await admin.from("products").update(updates).eq("id", body.product_id).eq("user_id", auth.user.id);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ success: true, product_id: body.product_id }, 200, reqId);
}

// ── SEO Product Audit ────────────────────────────────────────────────────────

async function auditProductSeo(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const productIds: string[] = body.product_ids ?? (body.product_id ? [body.product_id] : []);
  if (productIds.length === 0) return errorResponse("VALIDATION_ERROR", "product_ids required", 400, reqId);
  const admin = serviceClient();
  const { data: products, error } = await admin.from("products").select("id, title, description, seo_title, seo_description, images, tags, sku, brand, category, barcode, weight, status").eq("user_id", auth.user.id).in("id", productIds);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  const results = (products ?? []).map((p: any) => scoreProduct(p));
  return json({ products: results, total: results.length, audited_at: new Date().toISOString() }, 200, reqId);
}

async function listProductSeoScores(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const admin = serviceClient();
  const { data: products, count, error } = await admin.from("products").select("id, title, description, seo_title, seo_description, images, tags, sku, brand, category, barcode, weight, status", { count: "exact" }).eq("user_id", auth.user.id).order("updated_at", { ascending: true }).range(from, to);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  const scored = (products ?? []).map((p: any) => scoreProduct(p));
  return json({ items: scored, meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

// ── Misc CRUD-like endpoints ─────────────────────────────────────────────────

async function listProductEvents(url: URL, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const productId = url.searchParams.get("product_id");
  const limit = Math.min(100, parseInt(url.searchParams.get("limit") ?? "50", 10));
  let q = admin.from("product_events").select("*").eq("user_id", auth.user.id);
  if (productId) q = q.eq("product_id", productId);
  const { data, error } = await q.order("created_at", { ascending: false }).limit(limit);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data ?? [] }, 200, reqId);
}

async function getProductSeoData(url: URL, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const productId = url.searchParams.get("product_id");
  if (!productId) return errorResponse("VALIDATION_ERROR", "product_id required", 400, reqId);
  let q = admin.from("product_seo").select("*").eq("user_id", auth.user.id).eq("product_id", productId).eq("language", url.searchParams.get("language") ?? "fr");
  const storeId = url.searchParams.get("store_id");
  if (storeId) q = q.eq("store_id", storeId); else q = q.is("store_id", null);
  const { data, error } = await q.maybeSingle();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ seo: data }, 200, reqId);
}

async function upsertProductSeoData(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const admin = serviceClient();
  const { data, error } = await admin.from("product_seo").upsert({ ...body, user_id: auth.user.id, language: body.language ?? "fr" }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 200, reqId);
}

async function listProductSeoVersions(url: URL, auth: Auth, reqId: string) {
  const productId = url.searchParams.get("product_id");
  if (!productId) return errorResponse("VALIDATION_ERROR", "product_id required", 400, reqId);
  const admin = serviceClient();
  const { data, error } = await admin.from("product_seo_versions").select("*").eq("user_id", auth.user.id).eq("product_id", productId).order("created_at", { ascending: false }).limit(50);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data ?? [] }, 200, reqId);
}

// ── Store Products, AI Generations, Inventory, Prices ────────────────────────

async function listStoreProducts(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const admin = serviceClient();
  let q = admin.from("store_products").select("*", { count: "exact" }).eq("user_id", auth.user.id);
  const storeId = url.searchParams.get("store_id"); if (storeId) q = q.eq("store_id", storeId);
  const status = url.searchParams.get("status"); if (status) q = q.eq("status", status);
  q = q.order("created_at", { ascending: false }).range(from, to);
  const { data, count, error } = await q;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data ?? [], meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function upsertStoreProduct(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const admin = serviceClient();
  const { data, error } = await admin.from("store_products").upsert({ ...body, user_id: auth.user.id }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 200, reqId);
}

async function listAiGenerations(url: URL, auth: Auth, reqId: string) {
  const { page, perPage } = parsePagination(url);
  const limit = parseInt(url.searchParams.get("limit") ?? "20", 10);
  let q = auth.supabase.from("ai_generations").select("*", { count: "exact" }).eq("user_id", auth.user.id);
  const targetType = url.searchParams.get("target_type"); if (targetType) q = q.eq("target_type", targetType);
  const { data, count, error } = await q.order("created_at", { ascending: false }).range(0, Math.min(limit, 100) - 1);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data ?? [], meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function createAiGeneration(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const { data, error } = await auth.supabase.from("ai_generations").insert({ ...body, user_id: auth.user.id }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 201, reqId);
}

async function listInventoryLocations(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin.from("inventory_locations").select("*").eq("user_id", auth.user.id);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data ?? [] }, 200, reqId);
}

async function listInventoryLevels(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const admin = serviceClient();
  const { data, count, error } = await admin.from("inventory_levels").select("*", { count: "exact" }).eq("user_id", auth.user.id).range(from, to);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data ?? [], meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function upsertInventoryLevel(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const admin = serviceClient();
  const { data, error } = await admin.from("inventory_levels").upsert({ ...body, user_id: auth.user.id }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 200, reqId);
}

async function listProductPrices(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const admin = serviceClient();
  const { data, count, error } = await admin.from("product_prices").select("*", { count: "exact" }).eq("user_id", auth.user.id).range(from, to);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data ?? [], meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function upsertProductPrice(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const admin = serviceClient();
  const { data, error } = await admin.from("product_prices").upsert({ ...body, user_id: auth.user.id }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 200, reqId);
}

// ── Orders / Customers ───────────────────────────────────────────────────────

async function listOrders(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  let q = auth.supabase.from("orders").select("*, customer:customers(*), order_items(*)", { count: "exact" }).eq("user_id", auth.user.id);
  const status = url.searchParams.get("status"); if (status) q = q.eq("status", status);
  const search = url.searchParams.get("q"); if (search) q = q.or(`order_number.ilike.%${search}%,customer_email.ilike.%${search}%`);
  const { data, count, error } = await q.order("created_at", { ascending: false }).range(from, to);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data ?? [], meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function getOrder(orderId: string, auth: Auth, reqId: string) {
  const { data, error } = await auth.supabase.from("orders").select("*, customer:customers(*), order_items(*, product:products(*))").eq("id", orderId).eq("user_id", auth.user.id).single();
  if (error) return errorResponse("NOT_FOUND", "Order not found", 404, reqId);
  return json(data, 200, reqId);
}

async function createOrder(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const { data, error } = await auth.supabase.from("orders").insert({
    user_id: auth.user.id, order_number: body.order_number || `ORD-${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`,
    customer_id: body.customer_id || null, customer_name: body.customer_name || null,
    customer_email: body.customer_email || null, status: body.status || "pending",
    payment_status: body.payment_status || "pending", subtotal: body.subtotal || 0,
    shipping_cost: body.shipping_cost || 0, total_amount: body.total_amount || 0,
    shipping_address: body.shipping_address || null, currency: body.currency || "EUR",
  }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  if (body.items?.length) {
    const items = body.items.map((item: any) => ({ ...item, order_id: data.id, user_id: auth.user.id }));
    await auth.supabase.from("order_items").insert(items);
  }
  return json(data, 201, reqId);
}

async function updateOrder(orderId: string, req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const { data, error } = await auth.supabase.from("orders").update({ ...body, updated_at: new Date().toISOString() }).eq("id", orderId).eq("user_id", auth.user.id).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 200, reqId);
}

async function deleteOrder(orderId: string, auth: Auth, reqId: string) {
  const { error } = await auth.supabase.from("orders").delete().eq("id", orderId).eq("user_id", auth.user.id);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ success: true }, 200, reqId);
}

async function getOrderStats(auth: Auth, reqId: string) {
  const { data } = await auth.supabase.from("orders").select("total_amount, status, created_at").eq("user_id", auth.user.id);
  const orders = data || [];
  const total = orders.length;
  const totalRevenue = orders.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
  return json({ total, totalRevenue, pending: orders.filter((o: any) => o.status === "pending").length, delivered: orders.filter((o: any) => o.status === "delivered").length }, 200, reqId);
}

async function listCustomers(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  let q = auth.supabase.from("customers").select("*", { count: "exact" }).eq("user_id", auth.user.id);
  const search = url.searchParams.get("q"); if (search) q = q.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
  const { data, count, error } = await q.order("created_at", { ascending: false }).range(from, to);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data ?? [], meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function createCustomer(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const { data, error } = await auth.supabase.from("customers").insert({ ...body, user_id: auth.user.id }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 201, reqId);
}

async function getCustomer(id: string, auth: Auth, reqId: string) {
  const { data, error } = await auth.supabase.from("customers").select("*").eq("id", id).eq("user_id", auth.user.id).single();
  if (error) return errorResponse("NOT_FOUND", "Customer not found", 404, reqId);
  return json(data, 200, reqId);
}

async function updateCustomer(id: string, req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const { data, error } = await auth.supabase.from("customers").update(body).eq("id", id).eq("user_id", auth.user.id).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 200, reqId);
}

async function deleteCustomer(id: string, auth: Auth, reqId: string) {
  const { error } = await auth.supabase.from("customers").delete().eq("id", id).eq("user_id", auth.user.id);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ success: true }, 200, reqId);
}

async function getCustomerStats(auth: Auth, reqId: string) {
  const { data } = await auth.supabase.from("customers").select("id, total_orders, created_at").eq("user_id", auth.user.id);
  const c = data || [];
  return json({ total: c.length, active: c.filter((x: any) => (x.total_orders || 0) > 0).length }, 200, reqId);
}

// ── Dashboard ────────────────────────────────────────────────────────────────

async function getDashboardStats(url: URL, auth: Auth, reqId: string) {
  const now = new Date(); const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const [ordersRes, productsRes, customersRes] = await Promise.all([
    auth.supabase.from("orders").select("total_amount, status, created_at").eq("user_id", auth.user.id),
    auth.supabase.from("products").select("id, status, created_at").eq("user_id", auth.user.id),
    auth.supabase.from("customers").select("id, total_orders, created_at").eq("user_id", auth.user.id),
  ]);
  const orders = ordersRes.data || []; const products = productsRes.data || []; const customers = customersRes.data || [];
  const ordersToday = orders.filter((o: any) => new Date(o.created_at) >= today);
  const validStatuses = ["delivered", "completed", "processing", "shipped"];
  const revenueToday = ordersToday.filter((o: any) => validStatuses.includes(o.status || "")).reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
  return json({
    revenue: { today: revenueToday }, orders: { today: ordersToday.length },
    customers: { active: customers.filter((c: any) => (c.total_orders || 0) > 0).length },
    products: { active: products.filter((p: any) => p.status === "active").length },
  }, 200, reqId);
}

async function getDashboardActivity(url: URL, auth: Auth, reqId: string) {
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "10", 10), 50);
  const [ordersRes, productsRes] = await Promise.all([
    auth.supabase.from("orders").select("id, order_number, total_amount, status, created_at").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(limit),
    auth.supabase.from("products").select("id, title, price, created_at").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(5),
  ]);
  const events: any[] = [];
  for (const o of ordersRes.data || []) events.push({ id: `order-${o.id}`, type: "order", title: `Commande ${o.order_number}`, description: `${(o.total_amount || 0).toFixed(2)} €`, timestamp: o.created_at });
  for (const p of productsRes.data || []) events.push({ id: `product-${p.id}`, type: "product", title: "Produit ajouté", description: p.title, timestamp: p.created_at });
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return json({ items: events.slice(0, limit) }, 200, reqId);
}

// ── Stats helpers (use generic pattern) ──────────────────────────────────────

async function getIntegrationStats(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data } = await admin.from("integrations").select("connection_status, is_active, last_sync_at").eq("user_id", auth.user.id);
  const items = data || [];
  return json({ total: items.length, active: items.filter((i: any) => i.is_active).length, connected: items.filter((i: any) => i.connection_status === "connected").length }, 200, reqId);
}

async function syncIntegration(id: string, req: Request, auth: Auth, reqId: string) {
  const admin = serviceClient();
  await admin.from("integrations").update({ last_sync_at: new Date().toISOString() }).eq("id", id).eq("user_id", auth.user.id);
  return json({ success: true, integration_id: id }, 200, reqId);
}

async function testIntegration(id: string, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data } = await admin.from("integrations").select("id").eq("id", id).eq("user_id", auth.user.id).single();
  if (!data) return errorResponse("NOT_FOUND", "Integration not found", 404, reqId);
  return json({ success: true, integration_id: id }, 200, reqId);
}

async function getSupplierStats(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data } = await admin.from("premium_suppliers").select("id, is_verified, is_featured, category, rating");
  const items = data || [];
  return json({ total: items.length, verified: items.filter((s: any) => s.is_verified).length, featured: items.filter((s: any) => s.is_featured).length, avgRating: items.length > 0 ? items.reduce((sum: number, s: any) => sum + (s.rating || 0), 0) / items.length : 0 }, 200, reqId);
}

async function listSuppliers(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const admin = serviceClient();
  let q = admin.from("premium_suppliers").select("*", { count: "exact" }).order("name").range(from, to);
  const qSearch = url.searchParams.get("q"); if (qSearch) q = q.ilike("name", `%${qSearch}%`);
  const category = url.searchParams.get("category"); if (category) q = q.eq("category", category);
  const { data, error, count } = await q;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data || [], meta: { page, per_page: perPage, total: count || 0 } }, 200, reqId);
}

async function getSupplier(id: string, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin.from("premium_suppliers").select("*").eq("id", id).single();
  if (error) return errorResponse("NOT_FOUND", "Supplier not found", 404, reqId);
  return json(data, 200, reqId);
}

async function getAutomationStats(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const [t, a, e, w] = await Promise.all([
    admin.from("automation_triggers").select("id, is_active").eq("user_id", auth.user.id),
    admin.from("automation_actions").select("id, is_active").eq("user_id", auth.user.id),
    admin.from("automation_execution_logs").select("id, status").eq("user_id", auth.user.id),
    admin.from("automation_workflows").select("id, is_active, run_count").eq("user_id", auth.user.id),
  ]);
  const triggers = t.data || []; const actions = a.data || []; const execs = e.data || []; const workflows = w.data || [];
  const successful = execs.filter((x: any) => x.status === "completed").length;
  return json({ totalTriggers: triggers.length, activeTriggers: triggers.filter((x: any) => x.is_active).length, totalActions: actions.length, totalExecutions: execs.length, successfulExecutions: successful, totalWorkflows: workflows.length, activeWorkflows: workflows.filter((x: any) => x.is_active).length }, 200, reqId);
}

async function executeAutomation(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const admin = serviceClient();
  const { data, error } = await admin.from("automation_execution_logs").insert({ user_id: auth.user.id, trigger_id: body.trigger_id, status: "completed", input_data: body.context_data || {} }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 201, reqId);
}

async function toggleAutomationWorkflow(id: string, req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const admin = serviceClient();
  const { error } = await admin.from("automation_workflows").update({ is_active: body.is_active, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", auth.user.id);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ success: true }, 200, reqId);
}

async function runAutomationWorkflow(id: string, auth: Auth, reqId: string) {
  const admin = serviceClient();
  await admin.from("automation_workflows").update({ last_run_at: new Date().toISOString(), run_count: 1 }).eq("id", id).eq("user_id", auth.user.id);
  return json({ success: true, workflow_id: id }, 200, reqId);
}

// ── Marketing ────────────────────────────────────────────────────────────────

async function getMarketingStats(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data } = await admin.from("marketing_campaigns").select("*").eq("user_id", auth.user.id);
  const c = data || [];
  return json({ totalCampaigns: c.length, activeCampaigns: c.filter((x: any) => x.status === "active").length, totalRevenue: c.reduce((s: number, x: any) => s + (x.revenue || 0), 0) }, 200, reqId);
}

async function getMarketingDashboardStats(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const [cRes, aRes] = await Promise.all([
    admin.from("marketing_campaigns").select("*").eq("user_id", auth.user.id),
    admin.from("automated_campaigns").select("id, is_active").eq("user_id", auth.user.id),
  ]);
  const c = cRes.data || []; const a = aRes.data || [];
  return json({ activeCampaigns: c.filter((x: any) => x.status === "active").length, totalCampaigns: c.length, automationsActive: a.filter((x: any) => x.is_active).length, totalRevenue: c.reduce((s: number, x: any) => s + (x.revenue || 0), 0) }, 200, reqId);
}

async function listMarketingCampaigns(url: URL, auth: Auth, reqId: string) {
  return crudList(marketingCampaignsCfg)(url, auth, reqId);
}

async function toggleMarketingAutomation(id: string, req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const admin = serviceClient();
  const { error } = await admin.from("automated_campaigns").update({ is_active: body.is_active }).eq("id", id).eq("user_id", auth.user.id);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ success: true }, 200, reqId);
}

// ── Finance ──────────────────────────────────────────────────────────────────

async function getFinanceStats(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data: allOrders } = await admin.from("orders").select("total_amount, status, created_at").eq("user_id", auth.user.id);
  const orders = allOrders || [];
  const totalRevenue = orders.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
  const totalExpenses = totalRevenue * 0.65;
  return json({ revenue: { total: totalRevenue }, expenses: { total: totalExpenses }, profit: { net: totalRevenue - totalExpenses, margin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0 } }, 200, reqId);
}

// ── Conversion (simple table list/create) ────────────────────────────────────

const conversionTables: Record<string, string> = {
  bundles: "product_bundles", upsells: "upsell_rules", discounts: "dynamic_discounts",
  timers: "scarcity_timers", "social-proof": "social_proof_widgets",
};

async function conversionList(table: string, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin.from(table).select("*").eq("is_active", true);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data || [] }, 200, reqId);
}

async function conversionCreate(table: string, req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const admin = serviceClient();
  const { data, error } = await admin.from(table).insert({ ...body, user_id: auth.user.id }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 201, reqId);
}

async function trackConversionEvent(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const admin = serviceClient();
  const { data, error } = await admin.from("conversion_events").insert({ ...body, user_id: auth.user.id }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 201, reqId);
}

async function getConversionAnalytics(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data: events } = await admin.from("conversion_events").select("*").eq("user_id", auth.user.id).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString());
  const totalEvents = events?.length || 0;
  const totalValue = events?.reduce((s: number, e: any) => s + (e.conversion_value || 0), 0) || 0;
  return json({ total_events: totalEvents, total_conversion_value: totalValue, average_value: totalEvents > 0 ? totalValue / totalEvents : 0 }, 200, reqId);
}

// ── Advanced Analytics ───────────────────────────────────────────────────────

async function listPerformanceMetrics(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin.from("analytics_insights").select("id, metric_name, metric_value, metric_type, recorded_at").eq("user_id", auth.user.id).order("recorded_at", { ascending: false }).limit(20);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data || [] }, 200, reqId);
}

async function listAdvancedReports(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin.from("advanced_reports").select("id, report_name, report_type, status, last_generated_at, report_data").eq("user_id", auth.user.id).order("last_generated_at", { ascending: false }).limit(20);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data || [] }, 200, reqId);
}

async function generateAdvancedReport(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const admin = serviceClient();
  const { data, error } = await admin.from("advanced_reports").insert({ user_id: auth.user.id, report_name: `Rapport ${body.reportType}`, report_type: body.reportType, status: "generating", report_data: body.config }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 201, reqId);
}

async function listPredictiveAnalytics(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin.from("analytics_insights").select("id, prediction_type, confidence_score, predictions").eq("user_id", auth.user.id).not("prediction_type", "is", null).order("created_at", { ascending: false }).limit(10);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data || [] }, 200, reqId);
}

async function runPredictiveAnalysis(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin.from("analytics_insights").insert({ user_id: auth.user.id, metric_name: "predictive_analysis", metric_value: Math.random() * 100, prediction_type: "revenue_forecast", confidence_score: 0.85, predictions: { next_week: Math.random() * 10000, trend: "increasing" } }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 201, reqId);
}

async function listABTests(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin.from("ab_test_variants").select("id, test_name, variant_name, is_winner").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(20);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  const testsMap = new Map();
  (data || []).forEach((d: any) => { if (!testsMap.has(d.test_name)) testsMap.set(d.test_name, { id: d.id, experiment_name: d.test_name, status: d.is_winner ? "completed" : "running" }); });
  return json({ items: Array.from(testsMap.values()) }, 200, reqId);
}

async function createABTest(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const admin = serviceClient();
  const { data, error } = await admin.from("ab_test_variants").insert({ user_id: auth.user.id, test_name: body.experimentName, variant_name: "control", traffic_allocation: 50 }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 201, reqId);
}

// ── Promotions ───────────────────────────────────────────────────────────────

async function getPromotionStats(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data: c } = await admin.from("promotion_campaigns").select("*").eq("user_id", auth.user.id);
  const { data: r } = await admin.from("promotion_automation_rules").select("*").eq("user_id", auth.user.id);
  return json({ active_campaigns: (c || []).filter((x: any) => x.status === "active").length, automation_rules: (r || []).filter((x: any) => x.is_active).length }, 200, reqId);
}

async function togglePromotionRule(id: string, req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const admin = serviceClient();
  const { error } = await admin.from("promotion_automation_rules").update({ is_active: body.is_active }).eq("id", id).eq("user_id", auth.user.id);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ success: true }, 200, reqId);
}

// ── Business Intelligence ────────────────────────────────────────────────────

async function listInsights(url: URL, auth: Auth, reqId: string) {
  const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);
  const admin = serviceClient();
  const { data, error } = await admin.from("analytics_insights").select("*").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(limit);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data || [] }, 200, reqId);
}

async function getInsightMetrics(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data } = await admin.from("analytics_insights").select("*").eq("user_id", auth.user.id);
  const d = data || [];
  return json({ total: d.length, critical: d.filter((x: any) => x.trend === "critical").length }, 200, reqId);
}

async function acknowledgeInsight(id: string, auth: Auth, reqId: string) {
  const admin = serviceClient();
  await admin.from("analytics_insights").update({ metadata: { acknowledged: true, acknowledged_at: new Date().toISOString() } }).eq("id", id).eq("user_id", auth.user.id);
  return json({ success: true }, 200, reqId);
}

async function dismissInsight(id: string, auth: Auth, reqId: string) {
  const admin = serviceClient();
  await admin.from("analytics_insights").delete().eq("id", id).eq("user_id", auth.user.id);
  return json({ success: true }, 200, reqId);
}

// ── Customer Behavior ────────────────────────────────────────────────────────

async function trackProductView(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const admin = serviceClient();
  const { data, error } = await admin.from("product_events").insert({ user_id: auth.user.id, product_id: body.productId, event_type: "view", metadata: { source: body.source || "catalog" } }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 201, reqId);
}

async function compareSupplierPrices(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const admin = serviceClient();
  const { data: product } = await admin.from("products").select("*").eq("id", body.productId).single();
  const { data: suppliers } = await admin.from("suppliers").select("*").limit(10);
  return json({ product, suppliers: suppliers || [], comparison: [] }, 200, reqId);
}

// ── Advanced AI ──────────────────────────────────────────────────────────────

async function aiCallGateway(systemPrompt: string, userPrompt: string, reqId: string) {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) return errorResponse("CONFIG_ERROR", "LOVABLE_API_KEY not configured", 500, reqId);
  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-2.5-flash", messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }], temperature: 0.4 }),
  });
  if (!resp.ok) {
    if (resp.status === 429) return errorResponse("RATE_LIMITED", "AI rate limited", 429, reqId);
    if (resp.status === 402) return errorResponse("CREDITS_EXHAUSTED", "AI credits exhausted", 402, reqId);
    return errorResponse("AI_ERROR", `AI gateway error ${resp.status}`, 500, reqId);
  }
  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return errorResponse("AI_PARSE_ERROR", "No valid JSON in AI response", 500, reqId);
  return JSON.parse(jsonMatch[0]);
}

async function aiPricingSuggestions(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const admin = serviceClient();
  const { data: products } = await admin.from("products").select("title, price, cost_price, category").eq("user_id", auth.user.id).limit(20);
  const result = await aiCallGateway("Expert pricing e-commerce. JSON only.", `Analyse ces produits et suggère des prix optimaux:\n${JSON.stringify(products)}\nRetourne: {"suggestions":[{"product":"...","current_price":0,"suggested_price":0,"reason":"..."}]}`, reqId);
  if (result instanceof Response) return result;
  return json(result, 200, reqId);
}

async function aiTrendingProducts(url: URL, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const { data: recentOrders } = await admin.from("order_items").select("product_id, quantity").eq("user_id", auth.user.id).gte("created_at", sevenDaysAgo);
  const { data: olderOrders } = await admin.from("order_items").select("product_id, quantity").eq("user_id", auth.user.id).gte("created_at", thirtyDaysAgo).lt("created_at", sevenDaysAgo);
  const recentMap: Record<string, number> = {}; const olderMap: Record<string, number> = {};
  for (const o of recentOrders || []) recentMap[o.product_id] = (recentMap[o.product_id] || 0) + (o.quantity || 1);
  for (const o of olderOrders || []) olderMap[o.product_id] = (olderMap[o.product_id] || 0) + (o.quantity || 1);
  const productIds = [...new Set([...Object.keys(recentMap), ...Object.keys(olderMap)])].slice(0, 20);
  if (productIds.length === 0) return json({ trending: [] }, 200, reqId);
  const { data: products } = await admin.from("products").select("id, title, price, category").in("id", productIds);
  const trending = (products || []).map((p: any) => {
    const recent = recentMap[p.id] || 0; const older = olderMap[p.id] || 0;
    const velocity = older > 0 ? ((recent - older / 3.29) / (older / 3.29)) * 100 : recent > 0 ? 100 : 0;
    return { ...p, recent_sales: recent, older_sales: older, velocity: Math.round(velocity) };
  }).sort((a: any, b: any) => b.velocity - a.velocity);
  return json({ trending }, 200, reqId);
}

async function aiPerformanceAnalysis(req: Request, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const [{ data: orders }, { data: products }] = await Promise.all([
    admin.from("orders").select("total_amount, status").eq("user_id", auth.user.id),
    admin.from("products").select("id, status, price").eq("user_id", auth.user.id),
  ]);
  const totalRevenue = (orders || []).reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
  const result = await aiCallGateway("Expert business analyst. JSON only.",
    `Analyse: ${(orders || []).length} commandes, ${totalRevenue}€ CA, ${(products || []).length} produits.\nRetourne: {"score":0,"swot":{"strengths":[],"weaknesses":[],"opportunities":[],"threats":[]},"actions":[{"title":"...","priority":"high|medium|low","impact":"..."}]}`, reqId);
  if (result instanceof Response) return result;
  return json(result, 200, reqId);
}

async function aiBusinessSummary(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const [{ count: orderCount }, { count: productCount }, { count: customerCount }] = await Promise.all([
    admin.from("orders").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id),
    admin.from("products").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id),
    admin.from("customers").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id),
  ]);
  return json({ summary: { orders: orderCount || 0, products: productCount || 0, customers: customerCount || 0, health_score: Math.min(100, (orderCount || 0) * 2 + (productCount || 0) * 3) } }, 200, reqId);
}

// ── Monetization ─────────────────────────────────────────────────────────────

const PLAN_QUOTA_MAP: Record<string, Record<string, number>> = {
  free: { products: 50, imports_monthly: 5, ai_generations: 20, stores: 1, workflows: 2 },
  standard: { products: 500, imports_monthly: 50, ai_generations: 200, stores: 3, workflows: 10 },
  pro: { products: 5000, imports_monthly: 500, ai_generations: 2000, stores: 10, workflows: 50 },
  ultra_pro: { products: -1, imports_monthly: -1, ai_generations: -1, stores: -1, workflows: -1 },
};

async function getMonetizationPlan(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data: profile } = await admin.from("profiles").select("subscription_plan").eq("user_id", auth.user.id).maybeSingle();
  const plan = profile?.subscription_plan || "free";
  return json({ plan, limits: PLAN_QUOTA_MAP[plan] || PLAN_QUOTA_MAP.free }, 200, reqId);
}

async function getMonetizationUsage(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const [products, imports, aiGens, stores, workflows] = await Promise.all([
    admin.from("products").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id),
    admin.from("background_jobs").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id).eq("job_type", "import").gte("created_at", monthStart),
    admin.from("ai_generations").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id).gte("created_at", monthStart),
    admin.from("integrations").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id),
    admin.from("automation_workflows").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id),
  ]);
  const { data: profile } = await admin.from("profiles").select("subscription_plan").eq("user_id", auth.user.id).maybeSingle();
  const plan = profile?.subscription_plan || "free";
  const limits = PLAN_QUOTA_MAP[plan] || PLAN_QUOTA_MAP.free;
  const raw: Record<string, number> = { products: products.count || 0, imports_monthly: imports.count || 0, ai_generations: aiGens.count || 0, stores: stores.count || 0, workflows: workflows.count || 0 };
  const usage: Record<string, any> = {};
  for (const [key, current] of Object.entries(raw)) {
    const limit = limits[key] ?? 0;
    usage[key] = { current, limit: limit === -1 ? Infinity : limit, percentage: limit === -1 ? 0 : limit > 0 ? Math.min(100, (current / limit) * 100) : 100 };
  }
  return json({ plan, usage, alerts: Object.entries(usage).filter(([, v]) => v.percentage >= 80).map(([k]) => k) }, 200, reqId);
}

async function getMonetizationCredits(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin.from("credit_addons").select("*").eq("user_id", auth.user.id).eq("status", "active");
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  const totalRemaining = (data || []).reduce((s: number, a: any) => s + (a.credits_remaining || 0), 0);
  return json({ credits: data || [], total_remaining: totalRemaining }, 200, reqId);
}

async function getMonetizationHistory(url: URL, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const days = parseInt(url.searchParams.get("days") || "30", 10);
  const { data, error } = await admin.from("consumption_logs").select("*").eq("user_id", auth.user.id).gte("created_at", new Date(Date.now() - days * 86400000).toISOString()).order("created_at", { ascending: false }).limit(500);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  const byDay: Record<string, { date: string; actions: number; tokens: number; cost: number }> = {};
  for (const log of data || []) {
    const day = (log as any).created_at.slice(0, 10);
    if (!byDay[day]) byDay[day] = { date: day, actions: 0, tokens: 0, cost: 0 };
    byDay[day].actions += 1; byDay[day].tokens += (log as any).tokens_used || 0; byDay[day].cost += (log as any).cost_usd || 0;
  }
  return json({ by_day: Object.values(byDay).sort((a, b) => a.date.localeCompare(b.date)), total_actions: (data || []).length }, 200, reqId);
}

async function checkPlanGate(req: Request, auth: Auth, reqId: string) {
  const { resource } = await req.json();
  const admin = serviceClient();
  const { data: profile } = await admin.from("profiles").select("subscription_plan").eq("user_id", auth.user.id).maybeSingle();
  const plan = profile?.subscription_plan || "free";
  const limits = PLAN_QUOTA_MAP[plan] || PLAN_QUOTA_MAP.free;
  const limit = limits[resource];
  if (limit === undefined) return json({ allowed: true, reason: "unknown_resource" }, 200, reqId);
  if (limit === -1) return json({ allowed: true, reason: "unlimited" }, 200, reqId);
  let currentCount = 0;
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  if (resource === "products") { const { count } = await admin.from("products").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id); currentCount = count || 0; }
  else if (resource === "ai_generations") { const { count } = await admin.from("ai_generations").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id).gte("created_at", monthStart); currentCount = count || 0; }
  else if (resource === "imports_monthly") { const { count } = await admin.from("background_jobs").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id).eq("job_type", "import").gte("created_at", monthStart); currentCount = count || 0; }
  const allowed = currentCount < limit;
  return json({ allowed, current: currentCount, limit, remaining: Math.max(0, limit - currentCount), reason: allowed ? "within_limits" : "limit_reached", upgrade_needed: !allowed }, 200, reqId);
}

// ── Router ───────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const reqId = requestId(req);
  const url = new URL(req.url);
  const apiPath = url.pathname.replace(/^\/api-v1/, "") || "/";

  try {
    if (req.method === "GET" && (apiPath === "/v1/health" || apiPath === "/v1")) {
      return json({ status: "ok", version: "1.2.0", timestamp: new Date().toISOString() }, 200, reqId);
    }

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
    if (m === "POST" && matchRoute("/v1/products/bulk", apiPath)) return await bulkUpdateProducts(req, auth, reqId);

    p = matchRoute("/v1/products/:id/seo", apiPath); if (m === "GET" && p) return await getProductSeo(p.id, auth, reqId);
    p = matchRoute("/v1/products/:id/optimize", apiPath); if (m === "POST" && p) return await createAiEnrichment(req, auth, reqId);
    p = matchRoute("/v1/products/:id/metrics", apiPath); if (m === "GET" && p) return await getProductMetrics(p.id, url, auth, reqId);
    p = matchRoute("/v1/products/:id/stock-history", apiPath); if (m === "GET" && p) return await getProductStockHistory(p.id, url, auth, reqId);

    p = matchRoute("/v1/products/:id", apiPath);
    if (p && p.id !== "stats" && p.id !== "drafts" && p.id !== "bulk") {
      if (m === "GET") return await getProduct(p.id, auth, reqId);
      if (m === "PUT") return await updateProduct(p.id, req, auth, reqId);
      if (m === "DELETE") return await deleteProduct(p.id, auth, reqId);
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
    p = matchRoute("/v1/import/presets/:id", apiPath);
    if (p) { if (m === "GET") return await presetAction("get", p.id, req, auth, reqId); if (m === "PUT") return await presetAction("update", p.id, req, auth, reqId); if (m === "DELETE") return await presetAction("delete", p.id, req, auth, reqId); }

    // ── CSV Uploads ─────────────────────────────────────────────
    if (m === "POST" && matchRoute("/v1/import/csv/uploads", apiPath)) return await createUploadSession(req, auth, reqId);
    p = matchRoute("/v1/import/csv/uploads/:id/analyze", apiPath); if (m === "POST" && p) return await analyzeUpload(p.id, req, auth, reqId);

    // ── AI Enrichments ──────────────────────────────────────────
    if (m === "POST" && matchRoute("/v1/ai/enrichments", apiPath)) return await createAiEnrichment(req, auth, reqId);
    p = matchRoute("/v1/ai/enrichments/:id/items", apiPath); if (m === "GET" && p) return await getJobItems(p.id, url, auth, reqId);
    p = matchRoute("/v1/ai/enrichments/:id", apiPath); if (m === "GET" && p) { const admin = serviceClient(); const { data } = await admin.from("background_jobs").select("*").eq("id", p.id).eq("user_id", auth.user.id).eq("job_type", "ai_enrichment").single(); if (!data) return errorResponse("NOT_FOUND", "Job not found", 404, reqId); return json(mapJobRow(data), 200, reqId); }

    // ── Drafts ───────────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/products/drafts", apiPath)) return await listDrafts(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/products/drafts/publish", apiPath)) return await publishDrafts(req, auth, reqId);

    // ── SEO ──────────────────────────────────────────────────────
    if (m === "POST" && matchRoute("/v1/seo/audit", apiPath)) return await createSeoAudit(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/seo/audits", apiPath)) return await listSeoAudits(url, auth, reqId);
    p = matchRoute("/v1/seo/audits/:id", apiPath); if (m === "GET" && p) return await getSeoAudit(p.id, auth, reqId);
    if (m === "POST" && matchRoute("/v1/seo/generate", apiPath)) return await createSeoGenerate(req, auth, reqId);
    p = matchRoute("/v1/seo/generate/:id", apiPath); if (m === "GET" && p) return await getSeoGeneration(p.id, auth, reqId);
    if (m === "POST" && matchRoute("/v1/seo/apply", apiPath)) return await applySeoContent(req, auth, reqId);
    if (m === "POST" && matchRoute("/v1/seo/products/audit", apiPath)) return await auditProductSeo(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/seo/products/scores", apiPath)) return await listProductSeoScores(url, auth, reqId);
    p = matchRoute("/v1/seo/products/:id/score", apiPath); if (m === "GET" && p) return await getProductSeo(p.id, auth, reqId);
    p = matchRoute("/v1/seo/products/:id/history", apiPath); if (m === "GET" && p) { const admin = serviceClient(); const { data } = await admin.from("product_seo_versions").select("*").eq("user_id", auth.user.id).eq("product_id", p.id).order("created_at", { ascending: false }).limit(50); return json({ items: data ?? [] }, 200, reqId); }

    // ── Misc data endpoints ─────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/inventory/locations", apiPath)) return await listInventoryLocations(auth, reqId);
    if (m === "GET" && matchRoute("/v1/inventory/levels", apiPath)) return await listInventoryLevels(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/inventory/levels", apiPath)) return await upsertInventoryLevel(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/prices", apiPath)) return await listProductPrices(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/prices", apiPath)) return await upsertProductPrice(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/events", apiPath)) return await listProductEvents(url, auth, reqId);
    if (m === "GET" && matchRoute("/v1/product-seo", apiPath)) return await getProductSeoData(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/product-seo", apiPath)) return await upsertProductSeoData(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/product-seo/versions", apiPath)) return await listProductSeoVersions(url, auth, reqId);
    if (m === "GET" && matchRoute("/v1/store-products", apiPath)) return await listStoreProducts(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/store-products", apiPath)) return await upsertStoreProduct(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/ai/generations", apiPath)) return await listAiGenerations(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/ai/generations", apiPath)) return await createAiGeneration(req, auth, reqId);

    // ── Orders & Customers ──────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/orders/stats", apiPath)) return await getOrderStats(auth, reqId);
    if (m === "GET" && matchRoute("/v1/orders", apiPath)) return await listOrders(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/orders", apiPath)) return await createOrder(req, auth, reqId);
    p = matchRoute("/v1/orders/:id", apiPath); if (p && p.id !== "stats") { if (m === "GET") return await getOrder(p.id, auth, reqId); if (m === "PUT") return await updateOrder(p.id, req, auth, reqId); if (m === "DELETE") return await deleteOrder(p.id, auth, reqId); }

    if (m === "GET" && matchRoute("/v1/customers/stats", apiPath)) return await getCustomerStats(auth, reqId);
    if (m === "GET" && matchRoute("/v1/customers", apiPath)) return await listCustomers(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/customers", apiPath)) return await createCustomer(req, auth, reqId);
    p = matchRoute("/v1/customers/:id", apiPath); if (p && p.id !== "stats") { if (m === "GET") return await getCustomer(p.id, auth, reqId); if (m === "PUT") return await updateCustomer(p.id, req, auth, reqId); if (m === "DELETE") return await deleteCustomer(p.id, auth, reqId); }

    // ── Dashboard ───────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/dashboard/stats", apiPath)) return await getDashboardStats(url, auth, reqId);
    if (m === "GET" && matchRoute("/v1/dashboard/activity", apiPath)) return await getDashboardActivity(url, auth, reqId);

    // ── Integrations ────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/integrations/stats", apiPath)) return await getIntegrationStats(auth, reqId);
    if (m === "GET" && matchRoute("/v1/integrations", apiPath)) return await crudList(integrationsCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/integrations", apiPath)) return await crudCreate(integrationsCfg)(req, auth, reqId);
    p = matchRoute("/v1/integrations/:id/sync", apiPath); if (m === "POST" && p) return await syncIntegration(p.id, req, auth, reqId);
    p = matchRoute("/v1/integrations/:id/test", apiPath); if (m === "POST" && p) return await testIntegration(p.id, auth, reqId);
    p = matchRoute("/v1/integrations/:id", apiPath); if (p && p.id !== "stats") { if (m === "GET") return await crudGet(integrationsCfg)(p.id, auth, reqId); if (m === "PUT") return await crudUpdate(integrationsCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(integrationsCfg)(p.id, auth, reqId); }

    // ── Suppliers ───────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/suppliers/stats", apiPath)) return await getSupplierStats(auth, reqId);
    if (m === "GET" && matchRoute("/v1/suppliers", apiPath)) return await listSuppliers(url, auth, reqId);
    p = matchRoute("/v1/suppliers/:id", apiPath); if (m === "GET" && p && p.id !== "stats") return await getSupplier(p.id, auth, reqId);

    // ── Automation ──────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/automation/stats", apiPath)) return await getAutomationStats(auth, reqId);
    if (m === "GET" && matchRoute("/v1/automation/triggers", apiPath)) return await crudList(automationTriggersCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/automation/triggers", apiPath)) return await crudCreate(automationTriggersCfg)(req, auth, reqId);
    p = matchRoute("/v1/automation/triggers/:id", apiPath); if (p) { if (m === "PUT") return await crudUpdate(automationTriggersCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(automationTriggersCfg)(p.id, auth, reqId); }
    if (m === "GET" && matchRoute("/v1/automation/actions", apiPath)) return await crudList(automationActionsCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/automation/actions", apiPath)) return await crudCreate(automationActionsCfg)(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/automation/executions", apiPath)) { const admin = serviceClient(); const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "100", 10), 500); const { data } = await admin.from("automation_execution_logs").select("*").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(limit); return json({ items: data || [] }, 200, reqId); }
    if (m === "POST" && matchRoute("/v1/automation/execute", apiPath)) return await executeAutomation(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/automation/workflows", apiPath)) return await crudList(automationWorkflowsCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/automation/workflows", apiPath)) return await crudCreate(automationWorkflowsCfg)(req, auth, reqId);
    p = matchRoute("/v1/automation/workflows/:id/toggle", apiPath); if (m === "POST" && p) return await toggleAutomationWorkflow(p.id, req, auth, reqId);
    p = matchRoute("/v1/automation/workflows/:id/run", apiPath); if (m === "POST" && p) return await runAutomationWorkflow(p.id, auth, reqId);
    p = matchRoute("/v1/automation/workflows/:id", apiPath); if (p) { if (m === "PUT") return await crudUpdate(automationWorkflowsCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(automationWorkflowsCfg)(p.id, auth, reqId); }

    // ── Marketing ───────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/marketing/stats", apiPath)) return await getMarketingStats(auth, reqId);
    if (m === "GET" && matchRoute("/v1/marketing/dashboard-stats", apiPath)) return await getMarketingDashboardStats(auth, reqId);
    if (m === "GET" && matchRoute("/v1/marketing/campaigns", apiPath)) return await listMarketingCampaigns(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/marketing/campaigns", apiPath)) return await crudCreate(marketingCampaignsCfg)(req, auth, reqId);
    p = matchRoute("/v1/marketing/campaigns/:id", apiPath); if (p) { if (m === "PUT") return await crudUpdate(marketingCampaignsCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(marketingCampaignsCfg)(p.id, auth, reqId); }
    if (m === "GET" && matchRoute("/v1/marketing/automations", apiPath)) return await crudList(automatedCampaignsCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/marketing/automations", apiPath)) return await crudCreate(automatedCampaignsCfg)(req, auth, reqId);
    p = matchRoute("/v1/marketing/automations/:id/toggle", apiPath); if (m === "POST" && p) return await toggleMarketingAutomation(p.id, req, auth, reqId);
    p = matchRoute("/v1/marketing/automations/:id", apiPath); if (p && m === "PUT") return await crudUpdate(automatedCampaignsCfg)(p.id, req, auth, reqId);

    // ── Ads ──────────────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/ads/accounts", apiPath)) return await crudSimpleList("ad_accounts", { useAdmin: true })(auth, reqId);
    if (m === "POST" && matchRoute("/v1/ads/accounts", apiPath)) return await crudCreate(adAccountsCfg)(req, auth, reqId);
    p = matchRoute("/v1/ads/accounts/:id", apiPath); if (m === "PUT" && p) return await crudUpdate(adAccountsCfg)(p.id, req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/ads/campaigns", apiPath)) return await crudList(adCampaignsCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/ads/campaigns", apiPath)) return await crudCreate(adCampaignsCfg)(req, auth, reqId);
    p = matchRoute("/v1/ads/campaigns/:id", apiPath); if (p) { if (m === "PUT") return await crudUpdate(adCampaignsCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(adCampaignsCfg)(p.id, auth, reqId); }

    // ── Business Intelligence ───────────────────────────────────
    if (m === "GET" && matchRoute("/v1/insights/metrics", apiPath)) return await getInsightMetrics(auth, reqId);
    if (m === "GET" && matchRoute("/v1/insights", apiPath)) return await listInsights(url, auth, reqId);
    p = matchRoute("/v1/insights/:id/acknowledge", apiPath); if (m === "POST" && p) return await acknowledgeInsight(p.id, auth, reqId);
    p = matchRoute("/v1/insights/:id", apiPath); if (m === "DELETE" && p && p.id !== "metrics") return await dismissInsight(p.id, auth, reqId);

    // ── CRM ─────────────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/crm/tasks", apiPath)) return await crudList(crmTasksCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/crm/tasks", apiPath)) return await crudCreate(crmTasksCfg)(req, auth, reqId);
    p = matchRoute("/v1/crm/tasks/:id", apiPath); if (p) { if (m === "PUT") return await crudUpdate(crmTasksCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(crmTasksCfg)(p.id, auth, reqId); }
    if (m === "GET" && matchRoute("/v1/crm/deals", apiPath)) return await crudList(crmDealsCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/crm/deals", apiPath)) return await crudCreate(crmDealsCfg)(req, auth, reqId);
    p = matchRoute("/v1/crm/deals/:id", apiPath); if (p) { if (m === "PUT") return await crudUpdate(crmDealsCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(crmDealsCfg)(p.id, auth, reqId); }

    // ── Pricing ─────────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/pricing/rules", apiPath)) return await crudList(pricingRulesCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/pricing/rules", apiPath)) return await crudCreate(pricingRulesCfg)(req, auth, reqId);
    p = matchRoute("/v1/pricing/rules/:id", apiPath); if (p) { if (m === "PUT") return await crudUpdate(pricingRulesCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(pricingRulesCfg)(p.id, auth, reqId); }

    // ── Finance ─────────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/finance/stats", apiPath)) return await getFinanceStats(auth, reqId);

    // ── Conversion ──────────────────────────────────────────────
    for (const [route, table] of Object.entries(conversionTables)) {
      if (m === "GET" && matchRoute(`/v1/conversion/${route}`, apiPath)) return await conversionList(table, auth, reqId);
      if (m === "POST" && matchRoute(`/v1/conversion/${route}`, apiPath)) return await conversionCreate(table, req, auth, reqId);
    }
    if (m === "POST" && matchRoute("/v1/conversion/track", apiPath)) return await trackConversionEvent(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/conversion/analytics", apiPath)) return await getConversionAnalytics(auth, reqId);

    // ── Advanced Analytics ──────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/analytics/performance", apiPath)) return await listPerformanceMetrics(auth, reqId);
    if (m === "GET" && matchRoute("/v1/analytics/reports", apiPath)) return await listAdvancedReports(auth, reqId);
    if (m === "POST" && matchRoute("/v1/analytics/reports", apiPath)) return await generateAdvancedReport(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/analytics/predictive", apiPath)) return await listPredictiveAnalytics(auth, reqId);
    if (m === "POST" && matchRoute("/v1/analytics/predictive", apiPath)) return await runPredictiveAnalysis(auth, reqId);
    if (m === "GET" && matchRoute("/v1/analytics/ab-tests", apiPath)) return await listABTests(auth, reqId);
    if (m === "POST" && matchRoute("/v1/analytics/ab-tests", apiPath)) return await createABTest(req, auth, reqId);

    // ── Promotions ──────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/promotions/stats", apiPath)) return await getPromotionStats(auth, reqId);
    if (m === "GET" && matchRoute("/v1/promotions/campaigns", apiPath)) return await crudList(promotionCampaignsCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/promotions/campaigns", apiPath)) return await crudCreate(promotionCampaignsCfg)(req, auth, reqId);
    p = matchRoute("/v1/promotions/campaigns/:id", apiPath); if (p) { if (m === "PUT") return await crudUpdate(promotionCampaignsCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(promotionCampaignsCfg)(p.id, auth, reqId); }
    if (m === "GET" && matchRoute("/v1/promotions/rules", apiPath)) return await crudSimpleList("promotion_automation_rules", { useAdmin: true })(auth, reqId);
    if (m === "POST" && matchRoute("/v1/promotions/rules", apiPath)) return await crudCreate(promotionRulesCfg)(req, auth, reqId);
    p = matchRoute("/v1/promotions/rules/:id", apiPath); if (p) { if (m === "PUT") return await togglePromotionRule(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(promotionRulesCfg)(p.id, auth, reqId); }

    // ── Customer Behavior ───────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/behavior/history", apiPath)) return await crudSimpleList("customer_behavior_analytics", { useAdmin: true })(auth, reqId);
    if (m === "POST" && matchRoute("/v1/behavior/analyze", apiPath)) return await proxyEdgeFunction("customer-intelligence", req, auth, reqId);
    p = matchRoute("/v1/behavior/:id", apiPath); if (p) { if (m === "GET") return await crudGet({ table: "customer_behavior_analytics", useAdmin: true })(p.id, auth, reqId); if (m === "DELETE") return await crudDelete({ table: "customer_behavior_analytics", useAdmin: true })(p.id, auth, reqId); }

    // ── Product Tracking ────────────────────────────────────────
    if (m === "POST" && matchRoute("/v1/tracking/product-view", apiPath)) return await trackProductView(req, auth, reqId);
    if (m === "POST" && matchRoute("/v1/tracking/supplier-compare", apiPath)) return await compareSupplierPrices(req, auth, reqId);

    // ── Advanced AI ─────────────────────────────────────────────
    if (m === "POST" && matchRoute("/v1/ai/pricing-suggestions", apiPath)) return await aiPricingSuggestions(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/ai/trending-products", apiPath)) return await aiTrendingProducts(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/ai/performance-analysis", apiPath)) return await aiPerformanceAnalysis(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/ai/business-summary", apiPath)) return await aiBusinessSummary(auth, reqId);

    // ── Monetization ────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/monetization/usage", apiPath)) return await getMonetizationUsage(auth, reqId);
    if (m === "GET" && matchRoute("/v1/monetization/plan", apiPath)) return await getMonetizationPlan(auth, reqId);
    if (m === "GET" && matchRoute("/v1/monetization/credits", apiPath)) return await getMonetizationCredits(auth, reqId);
    if (m === "GET" && matchRoute("/v1/monetization/history", apiPath)) return await getMonetizationHistory(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/monetization/check-gate", apiPath)) return await checkPlanGate(req, auth, reqId);

    return errorResponse("NOT_FOUND", `Route ${m} ${apiPath} not found`, 404, reqId);
  } catch (err) {
    console.error("Unhandled error:", err);
    return errorResponse("INTERNAL_ERROR", "Internal server error", 500, reqId);
  }
});
