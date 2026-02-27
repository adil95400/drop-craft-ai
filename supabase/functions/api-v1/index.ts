import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, idempotency-key, x-request-id",
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

// ── Auth & Client (with TTL cache) ──────────────────────────────────────────
const authCache = new Map<string, { user: any; supabase: any; expiresAt: number }>();
const AUTH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function authenticate(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");

  const cached = authCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    return { user: cached.user, supabase: cached.supabase };
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;

  authCache.set(token, { user, supabase, expiresAt: Date.now() + AUTH_CACHE_TTL });
  if (authCache.size > 200) {
    const now = Date.now();
    for (const [k, v] of authCache) { if (v.expiresAt < now) authCache.delete(k); }
  }

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

// ── Import Jobs (unified: writes to `jobs` table) ───────────────────────────
function mapJobRow(row: any) {
  return { job_id: row.id, status: row.status, job_type: row.job_subtype ?? row.job_type, name: row.name, progress: { total: row.total_items ?? 0, processed: row.processed_items ?? 0, success: (row.processed_items ?? 0) - (row.failed_items ?? 0), failed: row.failed_items ?? 0, percent: row.progress_percent ?? 0 }, created_at: row.created_at, started_at: row.started_at, completed_at: row.completed_at, error_message: row.error_message };
}

async function createImportJob(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.source?.type) return errorResponse("VALIDATION_ERROR", "source.type is required", 400, reqId);
  const admin = serviceClient();
  const { data: job, error } = await admin.from("jobs").insert({
    user_id: auth.user.id,
    job_type: "import",
    job_subtype: body.source.type,
    status: "pending",
    name: `Import ${body.source.type}`,
    input_data: { source: body.source, preset_id: body.preset_id, options: body.options },
    total_items: 0,
    processed_items: 0,
    failed_items: 0,
    progress_percent: 0
  }).select("id, status").single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ job_id: job.id, status: job.status }, 201, reqId);
}

async function listImportJobs(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const status = url.searchParams.get("status");
  const admin = serviceClient();
  let q = admin.from("jobs").select("*", { count: "exact" }).eq("user_id", auth.user.id).eq("job_type", "import").order("created_at", { ascending: false }).range(from, to);
  if (status) q = q.in("status", status.split("|"));
  const { data, count, error } = await q;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: (data ?? []).map(mapJobRow), meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function getImportJob(jobId: string, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin.from("jobs").select("*").eq("id", jobId).eq("user_id", auth.user.id).eq("job_type", "import").single();
  if (error || !data) return errorResponse("NOT_FOUND", "Job not found", 404, reqId);
  const job: any = mapJobRow(data);
  if (data.started_at && data.total_items && data.processed_items && data.processed_items > 0) {
    const elapsed = Date.now() - new Date(data.started_at).getTime();
    job.eta_seconds = Math.round(((data.total_items - data.processed_items) * (elapsed / data.processed_items)) / 1000);
  }
  return json(job, 200, reqId);
}

async function getJobItems(jobId: string, url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const status = url.searchParams.get("status");
  const admin = serviceClient();
  const { data: job } = await admin.from("jobs").select("id").eq("id", jobId).eq("user_id", auth.user.id).single();
  if (!job) return errorResponse("NOT_FOUND", "Job not found", 404, reqId);
  let q = admin.from("job_items").select("*", { count: "exact" }).eq("job_id", jobId).order("created_at", { ascending: true }).range(from, to);
  if (status) q = q.eq("status", status);
  const { data, count, error } = await q;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  const items = (data ?? []).map((r: any) => ({ item_id: r.id, status: r.status, errors: r.error_code ? [r.error_code] : [], message: r.message, product_id: r.product_id, created_at: r.created_at }));
  return json({ items, meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function jobAction(action: string, jobId: string, req: Request, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data: job } = await admin.from("jobs").select("*").eq("id", jobId).eq("user_id", auth.user.id).single();
  if (!job) return errorResponse("NOT_FOUND", "Job not found", 404, reqId);
  const now = new Date().toISOString();
  if (action === "retry") {
    const body = await req.json().catch(() => ({})); const onlyFailed = body.only_failed !== false;
    const uq = admin.from("job_items").update({ status: "pending", error_code: null, updated_at: now } as any).eq("job_id", jobId);
    if (onlyFailed) uq.eq("status", "error"); await uq;
    await admin.from("jobs").update({ status: "pending", updated_at: now }).eq("id", jobId);
    return json({ job_id: jobId, status: "pending" }, 200, reqId);
  }
  if (action === "cancel") {
    if (["completed", "cancelled"].includes(job.status)) return errorResponse("INVALID_STATE", `Cannot cancel job in ${job.status} state`, 409, reqId);
    await admin.from("jobs").update({ status: "cancelled", completed_at: now, updated_at: now }).eq("id", jobId);
    return json({ job_id: jobId, status: "cancelled" }, 200, reqId);
  }
  if (action === "resume") {
    if (!["cancelled", "failed"].includes(job.status)) return errorResponse("INVALID_STATE", `Cannot resume job in ${job.status} state`, 409, reqId);
    await admin.from("job_items").update({ status: "pending", updated_at: now } as any).eq("job_id", jobId).in("status", ["error"]);
    await admin.from("jobs").update({ status: "pending", updated_at: now, completed_at: null }).eq("id", jobId);
    return json({ job_id: jobId, status: "pending", remaining: (job.total_items ?? 0) - (job.processed_items ?? 0) }, 200, reqId);
  }
  if (action === "replay") {
    const { data: newJob, error } = await admin.from("jobs").insert({
      user_id: auth.user.id,
      job_type: job.job_type,
      job_subtype: job.job_subtype,
      status: "pending",
      name: `Replay: ${job.name || job.job_subtype}`,
      input_data: job.input_data,
      metadata: { ...((job.metadata as any) || {}), replayed_from: jobId },
      total_items: 0,
      processed_items: 0,
      failed_items: 0,
      progress_percent: 0
    }).select("id, status").single();
    if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
    return json({ job_id: newJob.id, status: newJob.status, replayed_from: jobId }, 201, reqId);
  }
  return errorResponse("INVALID_ACTION", "Unknown action", 400, reqId);
}

// ── Products ────────────────────────────────────────────────────────────────
async function listProducts(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const q_param = url.searchParams.get("q");
  const status = url.searchParams.get("status");
  const admin = serviceClient();
  let q = admin.from("products").select("*", { count: "exact" }).eq("user_id", auth.user.id).order("created_at", { ascending: false }).range(from, to);
  if (status) q = q.eq("status", status);
  if (q_param) q = q.or(`title.ilike.%${q_param}%,sku.ilike.%${q_param}%`);
  const { data, count, error } = await q;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data ?? [], meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function getProduct(id: string, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin.from("products").select("*").eq("id", id).eq("user_id", auth.user.id).single();
  if (error || !data) return errorResponse("NOT_FOUND", "Product not found", 404, reqId);
  return json(data, 200, reqId);
}

async function createProduct(req: Request, auth: Auth, reqId: string) {
  const raw = await req.json();
  // Strip generated column "name" and read-only fields
  delete raw.name; delete raw.id; delete raw.user_id; delete raw.created_at; delete raw.updated_at;
  const admin = serviceClient();
  const { data, error } = await admin.from("products").insert({ ...raw, user_id: auth.user.id }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 201, reqId);
}

// "name" is a GENERATED column (= title), never include it in updates
const PRODUCT_ALLOWED_FIELDS = new Set([
  "title","description","description_html","sku","barcode","price","compare_at_price",
  "cost_price","category","brand","supplier","supplier_url","supplier_product_id","status",
  "stock_quantity","weight","weight_unit","images","variants","tags","seo_title","seo_description",
  "shopify_product_id","google_product_id","is_published","image_url","product_type","vendor",
  "default_language","primary_image_url","currency","source_type","source_url","supplier_name",
  "profit_margin","main_image_url","bullet_points","collections","source_of_truth","fallback_supplier_id"
]);

async function updateProduct(id: string, req: Request, auth: Auth, reqId: string) {
  const raw = await req.json();
  // Only allow known product columns
  const body: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    if (PRODUCT_ALLOWED_FIELDS.has(k)) body[k] = v;
  }
  if (Object.keys(body).length === 0) {
    return errorResponse("VALIDATION", "No valid fields to update", 400, reqId);
  }
  const admin = serviceClient();
  console.log(`[updateProduct] id=${id}, user=${auth.user.id}, fields=${Object.keys(body).join(",")}`);
  const { data, error } = await admin.from("products").update(body).eq("id", id).eq("user_id", auth.user.id).select().single();
  if (error) {
    console.error(`[updateProduct] DB error: ${error.message}`, error.details, error.hint);
    return errorResponse("DB_ERROR", error.message, 400, reqId);
  }
  if (!data) return errorResponse("NOT_FOUND", "Product not found", 404, reqId);
  return json(data, 200, reqId);
}

async function deleteProduct(id: string, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { error } = await admin.from("products").delete().eq("id", id).eq("user_id", auth.user.id);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ ok: true }, 200, reqId);
}

async function productStats(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin.from("products").select("status, price, cost_price, stock_quantity").eq("user_id", auth.user.id);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  const rows = data ?? [];
  const total = rows.length;
  const counts: Record<string, number> = {};
  let totalValue = 0, totalCost = 0, totalProfit = 0, priceSum = 0, lowStock = 0, outOfStock = 0;
  for (const row of rows) {
    counts[row.status ?? "unknown"] = (counts[row.status ?? "unknown"] || 0) + 1;
    const price = Number(row.price) || 0;
    const cost = Number(row.cost_price) || 0;
    const stock = Number(row.stock_quantity) || 0;
    totalValue += price * stock;
    totalCost += cost * stock;
    totalProfit += (price - cost) * stock;
    priceSum += price;
    if (stock > 0 && stock < 10) lowStock++;
    if (stock === 0) outOfStock++;
  }
  return json({
    total,
    active: counts["active"] ?? 0,
    draft: counts["draft"] ?? 0,
    inactive: counts["inactive"] ?? 0,
    archived: counts["archived"] ?? 0,
    low_stock: lowStock,
    out_of_stock: outOfStock,
    total_value: Math.round(totalValue * 100) / 100,
    total_cost: Math.round(totalCost * 100) / 100,
    total_profit: Math.round(totalProfit * 100) / 100,
    avg_price: total > 0 ? Math.round((priceSum / total) * 100) / 100 : 0,
    profit_margin: totalValue > 0 ? Math.round(((totalValue - totalCost) / totalValue) * 10000) / 100 : 0,
    by_status: counts,
  }, 200, reqId);
}

async function bulkUpdateProducts(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const ids = body.ids || body.product_ids;
  const updates = body.updates || {};
  if (!Array.isArray(ids) || ids.length === 0) return errorResponse("VALIDATION_ERROR", "ids or product_ids array required", 400, reqId);
  delete updates.user_id;
  const admin = serviceClient();
  const { error } = await admin.from("products").update(updates).in("id", ids).eq("user_id", auth.user.id);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ ok: true, updated: ids.length }, 200, reqId);
}

// ── Integrations ────────────────────────────────────────────────────────────
async function listIntegrations(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const admin = serviceClient();
  const { data, count, error } = await admin.from("integrations").select("id, platform, platform_name, store_url, connection_status, is_active, created_at, updated_at", { count: "exact" }).eq("user_id", auth.user.id).order("created_at", { ascending: false }).range(from, to);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data ?? [], meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

// ── Proxy to api-v1-ext ─────────────────────────────────────────────────────
async function proxyEdgeFunction(fnName: string, req: Request, auth: Auth, reqId: string) {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const targetUrl = `${supabaseUrl}/functions/v1/${fnName}${new URL(req.url).pathname.replace(/^\/api-v1/, "")}${new URL(req.url).search}`;
  const headers = new Headers(req.headers);
  headers.set("x-request-id", reqId);
  const proxyReq = new Request(targetUrl, { method: req.method, headers, body: req.body, });
  try {
    const resp = await fetch(proxyReq);
    const respHeaders = new Headers(resp.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => respHeaders.set(k, v));
    return new Response(resp.body, { status: resp.status, headers: respHeaders });
  } catch (err: any) {
    return errorResponse("PROXY_ERROR", err.message ?? "Failed to proxy request", 502, reqId);
  }
}

// ── SEO ─────────────────────────────────────────────────────────────────────

async function listSeoAudits(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const status = url.searchParams.get("status");
  const targetType = url.searchParams.get("target_type");
  const admin = serviceClient();
  let q = admin.from("seo_audits").select("*", { count: "exact" }).eq("user_id", auth.user.id).order("created_at", { ascending: false }).range(from, to);
  if (status) q = q.eq("status", status);
  if (targetType) q = q.eq("target_type", targetType);
  const { data, count, error } = await q;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  const items = (data ?? []).map((a: any) => ({
    audit_id: a.id,
    target_type: a.target_type ?? "url",
    target_id: a.target_id,
    url: a.url,
    score: a.score,
    status: a.status ?? "completed",
    provider: a.provider ?? "internal",
    language: a.language ?? "fr",
    summary: a.summary,
    created_at: a.created_at,
    completed_at: a.completed_at,
  }));
  return json({ items, meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function getSeoAudit(auditId: string, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data, error } = await admin.from("seo_audits").select("*").eq("id", auditId).eq("user_id", auth.user.id).single();
  if (error || !data) return errorResponse("NOT_FOUND", "Audit not found", 404, reqId);
  // Fetch issues
  const { data: pages } = await admin.from("seo_audit_pages").select("id").eq("audit_id", auditId);
  const pageIds = (pages ?? []).map((p: any) => p.id);
  let issues: any[] = [];
  if (pageIds.length > 0) {
    const { data: issueRows } = await admin.from("seo_issues").select("*").in("page_id", pageIds);
    issues = issueRows ?? [];
  }
  return json({
    audit_id: data.id,
    target_type: data.target_type ?? "url",
    target_id: data.target_id,
    url: data.url,
    score: data.score,
    status: data.status ?? "completed",
    provider: data.provider ?? "internal",
    language: data.language ?? "fr",
    summary: data.summary,
    error_message: data.error_message,
    issues,
    created_at: data.created_at,
    completed_at: data.completed_at,
  }, 200, reqId);
}

async function createSeoAudit(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.url) return errorResponse("VALIDATION_ERROR", "url is required", 400, reqId);
  const admin = serviceClient();
  const { data, error } = await admin.from("seo_audits").insert({
    user_id: auth.user.id,
    url: body.url,
    target_type: body.scope ?? "url",
    target_id: body.target_id ?? null,
    language: body.language ?? "fr",
    provider: body.provider ?? "internal",
    status: "pending",
    options: body.options ?? {},
  }).select("id, status").single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ audit_id: data.id, status: data.status }, 201, reqId);
}

async function listProductSeoScores(url: URL, auth: Auth, reqId: string) {
  const { page, perPage, from, to } = parsePagination(url);
  const status = url.searchParams.get("status");
  const sort = url.searchParams.get("sort");
  const admin = serviceClient();
  let q = admin.from("products").select("id, title, seo_title, seo_description, description, images, status, price, category", { count: "exact" }).eq("user_id", auth.user.id).range(from, to);
  if (status === "active") q = q.eq("status", "active");
  
  const { data, count, error } = await q;
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  
  const items = (data ?? []).map((p: any) => {
    // Compute a simple SEO score
    let score = 0;
    const issues: any[] = [];
    const strengths: string[] = [];
    
    if (p.seo_title && p.seo_title.length >= 10) { score += 20; strengths.push("Titre SEO présent"); }
    else issues.push({ id: "no_seo_title", severity: "critical", category: "title", message: "Titre SEO manquant", recommendation: "Ajoutez un titre SEO de 50-60 caractères" });
    
    if (p.seo_description && p.seo_description.length >= 20) { score += 20; strengths.push("Meta description présente"); }
    else issues.push({ id: "no_seo_desc", severity: "critical", category: "meta", message: "Meta description manquante", recommendation: "Ajoutez une meta description de 150-160 caractères" });
    
    if (p.title && p.title.length >= 5) { score += 20; strengths.push("Titre produit présent"); }
    else issues.push({ id: "no_title", severity: "warning", category: "content", message: "Titre produit trop court" });
    
    if (p.description && p.description.length >= 50) { score += 20; strengths.push("Description détaillée"); }
    else issues.push({ id: "short_desc", severity: "warning", category: "content", message: "Description trop courte", recommendation: "Minimum 150 caractères recommandés" });
    
    const imgs = Array.isArray(p.images) ? p.images : [];
    if (imgs.length > 0) { score += 20; strengths.push("Images présentes"); }
    else issues.push({ id: "no_images", severity: "warning", category: "images", message: "Aucune image produit" });
    
    const statusLabel = score >= 80 ? "optimized" : score >= 50 ? "needs_work" : "critical";
    
    return {
      product_id: p.id,
      product_name: p.title ?? "Sans titre",
      current: { seo_title: p.seo_title, seo_description: p.seo_description, title: p.title, description: p.description },
      score: { global: score, seo: (p.seo_title ? 50 : 0) + (p.seo_description ? 50 : 0), content: p.description?.length > 50 ? 80 : 30, images: imgs.length > 0 ? 100 : 0, data: score, ai_readiness: score },
      status: statusLabel,
      issues,
      strengths,
      business_impact: { traffic_impact: score < 50 ? "high" : "medium", conversion_impact: score < 50 ? "high" : "low", estimated_traffic_gain_percent: Math.max(0, 80 - score), estimated_conversion_gain_percent: Math.max(0, 40 - score / 2), priority: score < 40 ? "urgent" : score < 70 ? "high" : "normal" },
    };
  });
  
  // Sort
  if (sort === "score_asc") items.sort((a: any, b: any) => a.score.global - b.score.global);
  else if (sort === "score_desc") items.sort((a: any, b: any) => b.score.global - a.score.global);
  
  const stats = {
    avg_score: items.length > 0 ? Math.round(items.reduce((s: number, i: any) => s + i.score.global, 0) / items.length) : 0,
    critical: items.filter((i: any) => i.status === "critical").length,
    needs_work: items.filter((i: any) => i.status === "needs_work").length,
    optimized: items.filter((i: any) => i.status === "optimized").length,
    total: count ?? 0,
  };
  
  return json({ items, stats, meta: { page, per_page: perPage, total: count ?? 0 } }, 200, reqId);
}

async function auditProductsSeo(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const productIds = body.product_ids;
  if (!Array.isArray(productIds) || productIds.length === 0) return errorResponse("VALIDATION_ERROR", "product_ids array required", 400, reqId);
  // Reuse scores logic for specific products
  const admin = serviceClient();
  const { data, error } = await admin.from("products").select("id, title, seo_title, seo_description, description, images").eq("user_id", auth.user.id).in("id", productIds);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  
  const products = (data ?? []).map((p: any) => {
    let score = 0;
    if (p.seo_title && p.seo_title.length >= 10) score += 25;
    if (p.seo_description && p.seo_description.length >= 20) score += 25;
    if (p.title && p.title.length >= 5) score += 25;
    if (p.description && p.description.length >= 50) score += 25;
    return {
      product_id: p.id,
      product_name: p.title ?? "Sans titre",
      current: { seo_title: p.seo_title, seo_description: p.seo_description, title: p.title, description: p.description },
      score: { global: score, seo: (p.seo_title ? 50 : 0) + (p.seo_description ? 50 : 0), content: p.description?.length > 50 ? 80 : 30, images: Array.isArray(p.images) && p.images.length > 0 ? 100 : 0, data: score, ai_readiness: score },
      status: score >= 80 ? "optimized" : score >= 50 ? "needs_work" : "critical",
      issues: [],
      strengths: [],
      business_impact: { traffic_impact: "medium", conversion_impact: "low", estimated_traffic_gain_percent: 0, estimated_conversion_gain_percent: 0, priority: "normal" },
    };
  });
  
  return json({ products, total: products.length, audited_at: new Date().toISOString() }, 200, reqId);
}

async function seoGenerate(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.target_id) return errorResponse("VALIDATION_ERROR", "target_id is required", 400, reqId);
  const admin = serviceClient();
  const { data: job, error } = await admin.from("jobs").insert({
    user_id: auth.user.id,
    job_type: "seo",
    job_subtype: "generate",
    status: "pending",
    name: `SEO Generate: ${body.target_type ?? "product"}`,
    input_data: body,
  }).select("id, status").single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ job_id: job.id, status: job.status }, 201, reqId);
}

async function seoApply(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  if (!body.target_id || !body.fields) return errorResponse("VALIDATION_ERROR", "target_id and fields required", 400, reqId);
  const admin = serviceClient();
  // Apply SEO fields to the product
  const updates: Record<string, unknown> = {};
  const appliedFields: string[] = [];
  for (const [k, v] of Object.entries(body.fields)) {
    if (PRODUCT_ALLOWED_FIELDS.has(k)) { updates[k] = v; appliedFields.push(k); }
  }
  if (Object.keys(updates).length > 0) {
    const { error } = await admin.from("products").update(updates).eq("id", body.target_id).eq("user_id", auth.user.id);
    if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  }
  return json({ success: true, target_id: body.target_id, applied_fields: appliedFields }, 200, reqId);
}

// ── Router ──────────────────────────────────────────────────────────────────
const EXT_PREFIXES = ["/v1/automation", "/v1/marketing", "/v1/ads", "/v1/crm", "/v1/finance", "/v1/monetization", "/v1/ai", "/v1/bi"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const reqId = requestId(req);
  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api-v1/, "");

    // Proxy to api-v1-ext for extension domains
    if (EXT_PREFIXES.some(p => path.startsWith(p))) {
      const auth = await authenticate(req);
      if (!auth) return errorResponse("UNAUTHORIZED", "Authentication required", 401, reqId);
      return proxyEdgeFunction("api-v1-ext", req, auth, reqId);
    }

    // Health check
    if (path === "/v1/health" || path === "/health") return json({ status: "ok", version: "1.0.0", timestamp: new Date().toISOString() }, 200, reqId);

    // Auth required for all other routes
    const auth = await authenticate(req);
    if (!auth) return errorResponse("UNAUTHORIZED", "Authentication required", 401, reqId);

    // Rate limiting
    if (!checkRateLimit(auth.user.id, path)) return errorResponse("RATE_LIMITED", "Too many requests", 429, reqId);

    const m = req.method;

    // ── SEO
    if (path === "/v1/seo/audits" && m === "GET") return listSeoAudits(url, auth, reqId);
    if (path === "/v1/seo/audit" && m === "POST") return createSeoAudit(req, auth, reqId);
    if (path === "/v1/seo/products/scores" && m === "GET") return listProductSeoScores(url, auth, reqId);
    if (path === "/v1/seo/products/audit" && m === "POST") return auditProductsSeo(req, auth, reqId);
    if (path === "/v1/seo/generate" && m === "POST") return seoGenerate(req, auth, reqId);
    if (path === "/v1/seo/apply" && m === "POST") return seoApply(req, auth, reqId);
    let params = matchRoute("/v1/seo/audits/:id", path);
    if (params && m === "GET") return getSeoAudit(params.id, auth, reqId);
    params = matchRoute("/v1/seo/generate/:id", path);
    if (params && m === "GET") {
      const admin = serviceClient();
      const { data, error } = await admin.from("jobs").select("*").eq("id", params.id).eq("user_id", auth.user.id).single();
      if (error || !data) return errorResponse("NOT_FOUND", "Generation job not found", 404, reqId);
      return json({ job_id: data.id, status: data.status, target_type: data.input_data?.target_type, target_id: data.input_data?.target_id, result: data.output_data, created_at: data.created_at }, 200, reqId);
    }
    params = matchRoute("/v1/seo/products/:id/score", path);
    if (params && m === "GET") {
      const admin = serviceClient();
      const { data: p, error } = await admin.from("products").select("id, title, seo_title, seo_description, description, images").eq("id", params.id).eq("user_id", auth.user.id).single();
      if (error || !p) return errorResponse("NOT_FOUND", "Product not found", 404, reqId);
      let score = 0;
      if (p.seo_title && p.seo_title.length >= 10) score += 25;
      if (p.seo_description && p.seo_description.length >= 20) score += 25;
      if (p.title && p.title.length >= 5) score += 25;
      if (p.description && p.description.length >= 50) score += 25;
      return json({ product_id: p.id, product_name: p.title, score: { global: score }, status: score >= 80 ? "optimized" : score >= 50 ? "needs_work" : "critical", issues: [], strengths: [] }, 200, reqId);
    }
    params = matchRoute("/v1/seo/products/:id/history", path);
    if (params && m === "GET") {
      const admin = serviceClient();
      const { data } = await admin.from("seo_history_snapshots").select("*").eq("product_id", params.id).order("created_at", { ascending: false }).limit(20);
      return json({ items: data ?? [], meta: { page: 1, per_page: 20, total: (data ?? []).length } }, 200, reqId);
    }

    // ── Products
    if (path === "/v1/products/stats" && m === "GET") return productStats(auth, reqId);
    if (path === "/v1/products/bulk" && (m === "PATCH" || m === "POST")) return bulkUpdateProducts(req, auth, reqId);
    if (path === "/v1/products" && m === "GET") return listProducts(url, auth, reqId);
    if (path === "/v1/products" && m === "POST") return createProduct(req, auth, reqId);
    params = matchRoute("/v1/products/:id", path);
    if (params && m === "GET") return getProduct(params.id, auth, reqId);
    if (params && m === "PUT") return updateProduct(params.id, req, auth, reqId);
    if (params && m === "PATCH") return updateProduct(params.id, req, auth, reqId);
    if (params && m === "DELETE") return deleteProduct(params.id, auth, reqId);

    // ── Integrations
    if (path === "/v1/integrations" && m === "GET") return listIntegrations(url, auth, reqId);

    // ── Import Jobs
    // Support both /imports/jobs and /import/jobs paths
    if ((path === "/v1/imports/jobs" || path === "/v1/import/jobs") && m === "POST") return createImportJob(req, auth, reqId);
    if ((path === "/v1/imports/jobs" || path === "/v1/import/jobs") && m === "GET") return listImportJobs(url, auth, reqId);
    params = matchRoute("/v1/imports/jobs/:id", path) ?? matchRoute("/v1/import/jobs/:id", path);
    if (params && m === "GET") return getImportJob(params.id, auth, reqId);
    params = matchRoute("/v1/imports/jobs/:id/items", path) ?? matchRoute("/v1/import/jobs/:id/items", path);
    if (params && m === "GET") return getJobItems(params.id, url, auth, reqId);
    for (const action of ["retry", "cancel", "resume", "replay", "enrich"]) {
      params = matchRoute(`/v1/imports/jobs/:id/${action}`, path) ?? matchRoute(`/v1/import/jobs/:id/${action}`, path);
      if (params && m === "POST") return jobAction(action, params.id, req, auth, reqId);
    }

    return errorResponse("NOT_FOUND", `Route not found: ${m} ${path}`, 404, reqId);
  } catch (err: any) {
    console.error("[api-v1] Unhandled error:", err);
    return errorResponse("INTERNAL_ERROR", err.message ?? "Internal server error", 500, reqId);
  }
});
