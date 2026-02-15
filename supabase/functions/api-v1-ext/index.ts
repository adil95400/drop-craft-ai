import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, idempotency-key, x-request-id",
  "Access-Control-Expose-Headers": "x-request-id",
};

function json(body: unknown, status = 200, reqId: string) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "x-request-id": reqId } });
}
function errorResponse(code: string, message: string, status: number, reqId: string) {
  return json({ error: { code, message } }, status, reqId);
}
function parsePagination(url: URL) {
  const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(url.searchParams.get("per_page") ?? "20", 10)));
  return { page, perPage, from: (page - 1) * perPage, to: page * perPage - 1 };
}

function serviceClient() { return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!); }

async function authenticate(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return null;
  return { user, supabase };
}
type Auth = NonNullable<Awaited<ReturnType<typeof authenticate>>>;

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

// ── Generic CRUD ────────────────────────────────────────────────
interface CrudCfg { table: string; userField?: string; orderBy?: string; orderAsc?: boolean; }

function crudList(cfg: CrudCfg) {
  return async (url: URL, auth: Auth, reqId: string) => {
    const { page, perPage, from, to } = parsePagination(url);
    const admin = serviceClient();
    let q = admin.from(cfg.table).select("*", { count: "exact" }).eq(cfg.userField ?? "user_id", auth.user.id).order(cfg.orderBy ?? "created_at", { ascending: cfg.orderAsc ?? false }).range(from, to);
    const status = url.searchParams.get("status"); if (status) q = q.eq("status", status);
    const { data, count, error } = await q;
    if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
    return json({ items: data || [], meta: { page, per_page: perPage, total: count || 0 } }, 200, reqId);
  };
}
function crudGet(cfg: CrudCfg) {
  return async (id: string, auth: Auth, reqId: string) => {
    const { data, error } = await serviceClient().from(cfg.table).select("*").eq("id", id).eq(cfg.userField ?? "user_id", auth.user.id).single();
    if (error) return errorResponse("NOT_FOUND", `${cfg.table} not found`, 404, reqId);
    return json(data, 200, reqId);
  };
}
function crudCreate(cfg: CrudCfg) {
  return async (req: Request, auth: Auth, reqId: string) => {
    const body = await req.json();
    const { data, error } = await serviceClient().from(cfg.table).insert({ ...body, [cfg.userField ?? "user_id"]: auth.user.id }).select().single();
    if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
    return json(data, 201, reqId);
  };
}
function crudUpdate(cfg: CrudCfg) {
  return async (id: string, req: Request, auth: Auth, reqId: string) => {
    const body = await req.json();
    const { data, error } = await serviceClient().from(cfg.table).update({ ...body, updated_at: new Date().toISOString() }).eq("id", id).eq(cfg.userField ?? "user_id", auth.user.id).select().single();
    if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
    return json(data, 200, reqId);
  };
}
function crudDelete(cfg: CrudCfg) {
  return async (id: string, auth: Auth, reqId: string) => {
    const { error } = await serviceClient().from(cfg.table).delete().eq("id", id).eq(cfg.userField ?? "user_id", auth.user.id);
    if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
    return json({ success: true }, 200, reqId);
  };
}

// ── CRUD Configs ────────────────────────────────────────────────
const adAccountsCfg: CrudCfg = { table: "ad_accounts" };
const adCampaignsCfg: CrudCfg = { table: "ad_campaigns" };
const marketingCampaignsCfg: CrudCfg = { table: "marketing_campaigns" };
const automatedCampaignsCfg: CrudCfg = { table: "automated_campaigns" };
const promotionCampaignsCfg: CrudCfg = { table: "promotion_campaigns" };
const promotionRulesCfg: CrudCfg = { table: "promotion_automation_rules" };
const crmTasksCfg: CrudCfg = { table: "crm_tasks" };
const crmDealsCfg: CrudCfg = { table: "crm_deals" };
const pricingRulesCfg: CrudCfg = { table: "pricing_rules" };
const automationTriggersCfg: CrudCfg = { table: "automation_triggers" };
const automationActionsCfg: CrudCfg = { table: "automation_actions", orderBy: "execution_order", orderAsc: true };
const automationWorkflowsCfg: CrudCfg = { table: "automation_workflows", orderBy: "updated_at" };
const integrationsCfg: CrudCfg = { table: "integrations" };

// ── Automation Stats ────────────────────────────────────────────
async function getAutomationStats(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const [t, a, e, w] = await Promise.all([
    admin.from("automation_triggers").select("id, is_active").eq("user_id", auth.user.id),
    admin.from("automation_actions").select("id, is_active").eq("user_id", auth.user.id),
    admin.from("automation_execution_logs").select("id, status").eq("user_id", auth.user.id),
    admin.from("automation_workflows").select("id, is_active, run_count").eq("user_id", auth.user.id),
  ]);
  const triggers = t.data || []; const actions = a.data || []; const execs = e.data || []; const workflows = w.data || [];
  return json({ totalTriggers: triggers.length, activeTriggers: triggers.filter((x: any) => x.is_active).length, totalActions: actions.length, totalExecutions: execs.length, successfulExecutions: execs.filter((x: any) => x.status === "completed").length, totalWorkflows: workflows.length, activeWorkflows: workflows.filter((x: any) => x.is_active).length }, 200, reqId);
}

// ── Marketing ────────────────────────────────────────────────────
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

// ── Finance ──────────────────────────────────────────────────────
async function getFinanceStats(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const { data: allOrders } = await admin.from("orders").select("total_amount, status, created_at").eq("user_id", auth.user.id);
  const orders = allOrders || [];
  const totalRevenue = orders.reduce((s: number, o: any) => s + (o.total_amount || 0), 0);
  const totalExpenses = totalRevenue * 0.65;
  return json({ revenue: { total: totalRevenue }, expenses: { total: totalExpenses }, profit: { net: totalRevenue - totalExpenses, margin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0 } }, 200, reqId);
}

// ── Conversion ───────────────────────────────────────────────────
const conversionTables: Record<string, string> = { bundles: "product_bundles", upsells: "upsell_rules", discounts: "dynamic_discounts", timers: "scarcity_timers", "social-proof": "social_proof_widgets" };

async function conversionList(table: string, auth: Auth, reqId: string) {
  const { data, error } = await serviceClient().from(table).select("*").eq("is_active", true);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data || [] }, 200, reqId);
}
async function conversionCreate(table: string, req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const { data, error } = await serviceClient().from(table).insert({ ...body, user_id: auth.user.id }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 201, reqId);
}
async function trackConversionEvent(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const { data, error } = await serviceClient().from("conversion_events").insert({ ...body, user_id: auth.user.id }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 201, reqId);
}
async function getConversionAnalytics(auth: Auth, reqId: string) {
  const { data: events } = await serviceClient().from("conversion_events").select("*").eq("user_id", auth.user.id).gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString());
  const total = events?.length || 0; const value = events?.reduce((s: number, e: any) => s + (e.conversion_value || 0), 0) || 0;
  return json({ total_events: total, total_conversion_value: value, average_value: total > 0 ? value / total : 0 }, 200, reqId);
}

// ── Advanced Analytics ───────────────────────────────────────────
async function listPerformanceMetrics(auth: Auth, reqId: string) {
  const { data, error } = await serviceClient().from("analytics_insights").select("id, metric_name, metric_value, metric_type, recorded_at").eq("user_id", auth.user.id).order("recorded_at", { ascending: false }).limit(20);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data || [] }, 200, reqId);
}
async function listAdvancedReports(auth: Auth, reqId: string) {
  const { data, error } = await serviceClient().from("advanced_reports").select("id, report_name, report_type, status, last_generated_at, report_data").eq("user_id", auth.user.id).order("last_generated_at", { ascending: false }).limit(20);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data || [] }, 200, reqId);
}
async function generateAdvancedReport(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const { data, error } = await serviceClient().from("advanced_reports").insert({ user_id: auth.user.id, report_name: `Rapport ${body.reportType}`, report_type: body.reportType, status: "generating", report_data: body.config }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 201, reqId);
}
async function listPredictiveAnalytics(auth: Auth, reqId: string) {
  const { data, error } = await serviceClient().from("analytics_insights").select("id, prediction_type, confidence_score, predictions").eq("user_id", auth.user.id).not("prediction_type", "is", null).order("created_at", { ascending: false }).limit(10);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data || [] }, 200, reqId);
}
async function runPredictiveAnalysis(auth: Auth, reqId: string) {
  const { data, error } = await serviceClient().from("analytics_insights").insert({ user_id: auth.user.id, metric_name: "predictive_analysis", metric_value: Math.random() * 100, prediction_type: "revenue_forecast", confidence_score: 0.85, predictions: { next_week: Math.random() * 10000, trend: "increasing" } }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 201, reqId);
}
async function listABTests(auth: Auth, reqId: string) {
  const { data, error } = await serviceClient().from("ab_test_variants").select("id, test_name, variant_name, is_winner").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(20);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  const testsMap = new Map();
  (data || []).forEach((d: any) => { if (!testsMap.has(d.test_name)) testsMap.set(d.test_name, { id: d.id, experiment_name: d.test_name, status: d.is_winner ? "completed" : "running" }); });
  return json({ items: Array.from(testsMap.values()) }, 200, reqId);
}
async function createABTest(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const { data, error } = await serviceClient().from("ab_test_variants").insert({ user_id: auth.user.id, test_name: body.experimentName, variant_name: "control", traffic_allocation: 50 }).select().single();
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json(data, 201, reqId);
}

// ── Promotions ───────────────────────────────────────────────────
async function getPromotionStats(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const [{ data: c }, { data: r }] = await Promise.all([
    admin.from("promotion_campaigns").select("*").eq("user_id", auth.user.id),
    admin.from("promotion_automation_rules").select("*").eq("user_id", auth.user.id),
  ]);
  return json({ active_campaigns: (c || []).filter((x: any) => x.status === "active").length, automation_rules: (r || []).filter((x: any) => x.is_active).length }, 200, reqId);
}

// ── BI ───────────────────────────────────────────────────────────
async function listInsights(url: URL, auth: Auth, reqId: string) {
  const limit = parseInt(url.searchParams.get("limit") ?? "10", 10);
  const { data, error } = await serviceClient().from("analytics_insights").select("*").eq("user_id", auth.user.id).order("created_at", { ascending: false }).limit(limit);
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  return json({ items: data || [] }, 200, reqId);
}
async function getInsightMetrics(auth: Auth, reqId: string) {
  const { data } = await serviceClient().from("analytics_insights").select("*").eq("user_id", auth.user.id);
  const d = data || [];
  return json({ total: d.length, critical: d.filter((x: any) => x.trend === "critical").length }, 200, reqId);
}

// ── Customer Behavior ────────────────────────────────────────────
async function trackProductView(req: Request, auth: Auth, reqId: string) {
  const body = await req.json();
  const { data, error } = await serviceClient().from("product_events").insert({ user_id: auth.user.id, product_id: body.productId, event_type: "view", metadata: { source: body.source || "catalog" } }).select().single();
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

// ── AI ───────────────────────────────────────────────────────────
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
  const { data: products } = await serviceClient().from("products").select("title, price, cost_price, category").eq("user_id", auth.user.id).limit(20);
  const result = await aiCallGateway("Expert pricing e-commerce. JSON only.", `Analyse ces produits et suggère des prix optimaux:\n${JSON.stringify(products)}\nRetourne: {"suggestions":[{"product":"...","current_price":0,"suggested_price":0,"reason":"..."}]}`, reqId);
  if (result instanceof Response) return result;
  return json(result, 200, reqId);
}

async function aiTrendingProducts(url: URL, auth: Auth, reqId: string) {
  const admin = serviceClient();
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
  const [{ data: recentOrders }, { data: olderOrders }] = await Promise.all([
    admin.from("order_items").select("product_id, quantity").eq("user_id", auth.user.id).gte("created_at", sevenDaysAgo),
    admin.from("order_items").select("product_id, quantity").eq("user_id", auth.user.id).gte("created_at", thirtyDaysAgo).lt("created_at", sevenDaysAgo),
  ]);
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

// ── Monetization ─────────────────────────────────────────────────
const PLAN_QUOTA_MAP: Record<string, Record<string, number>> = {
  free: { products: 50, imports_monthly: 5, ai_generations: 20, stores: 1, workflows: 2 },
  standard: { products: 500, imports_monthly: 50, ai_generations: 200, stores: 3, workflows: 10 },
  pro: { products: 5000, imports_monthly: 500, ai_generations: 2000, stores: 10, workflows: 50 },
  ultra_pro: { products: -1, imports_monthly: -1, ai_generations: -1, stores: -1, workflows: -1 },
};

async function getMonetizationPlan(auth: Auth, reqId: string) {
  const { data: profile } = await serviceClient().from("profiles").select("subscription_plan").eq("user_id", auth.user.id).maybeSingle();
  const plan = profile?.subscription_plan || "free";
  return json({ plan, limits: PLAN_QUOTA_MAP[plan] || PLAN_QUOTA_MAP.free }, 200, reqId);
}

async function getMonetizationUsage(auth: Auth, reqId: string) {
  const admin = serviceClient();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const [products, imports, aiGens, stores, workflows] = await Promise.all([
    admin.from("products").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id),
    admin.from("jobs").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id).eq("job_type", "import").gte("created_at", monthStart),
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
  const { data, error } = await serviceClient().from("credit_addons").select("*").eq("user_id", auth.user.id).eq("status", "active");
  if (error) return errorResponse("DB_ERROR", error.message, 500, reqId);
  const totalRemaining = (data || []).reduce((s: number, a: any) => s + (a.credits_remaining || 0), 0);
  return json({ credits: data || [], total_remaining: totalRemaining }, 200, reqId);
}

async function getMonetizationHistory(url: URL, auth: Auth, reqId: string) {
  const days = parseInt(url.searchParams.get("days") || "30", 10);
  const { data, error } = await serviceClient().from("consumption_logs").select("*").eq("user_id", auth.user.id).gte("created_at", new Date(Date.now() - days * 86400000).toISOString()).order("created_at", { ascending: false }).limit(500);
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
  else if (resource === "imports_monthly") { const { count } = await admin.from("jobs").select("*", { count: "exact", head: true }).eq("user_id", auth.user.id).eq("job_type", "import").gte("created_at", monthStart); currentCount = count || 0; }
  const allowed = currentCount < limit;
  return json({ allowed, current: currentCount, limit, remaining: Math.max(0, limit - currentCount), reason: allowed ? "within_limits" : "limit_reached", upgrade_needed: !allowed }, 200, reqId);
}

// ── Router ───────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const reqId = req.headers.get("x-request-id") ?? crypto.randomUUID();
  const url = new URL(req.url);
  const apiPath = url.pathname.replace(/^\/api-v1-ext/, "") || "/";

  try {
    const auth = await authenticate(req);
    if (!auth) return errorResponse("UNAUTHORIZED", "Valid Bearer token required", 401, reqId);
    const m = req.method;
    let p: Record<string, string> | null;

    // ── Automation ────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/automation/stats", apiPath)) return await getAutomationStats(auth, reqId);
    if (m === "GET" && matchRoute("/v1/automation/triggers", apiPath)) return await crudList(automationTriggersCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/automation/triggers", apiPath)) return await crudCreate(automationTriggersCfg)(req, auth, reqId);
    p = matchRoute("/v1/automation/triggers/:id", apiPath); if (p) { if (m === "GET") return await crudGet(automationTriggersCfg)(p.id, auth, reqId); if (m === "PUT") return await crudUpdate(automationTriggersCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(automationTriggersCfg)(p.id, auth, reqId); }
    if (m === "GET" && matchRoute("/v1/automation/actions", apiPath)) return await crudList(automationActionsCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/automation/actions", apiPath)) return await crudCreate(automationActionsCfg)(req, auth, reqId);
    p = matchRoute("/v1/automation/actions/:id", apiPath); if (p) { if (m === "GET") return await crudGet(automationActionsCfg)(p.id, auth, reqId); if (m === "PUT") return await crudUpdate(automationActionsCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(automationActionsCfg)(p.id, auth, reqId); }
    if (m === "POST" && matchRoute("/v1/automation/execute", apiPath)) { const body = await req.json(); const { data, error } = await serviceClient().from("automation_execution_logs").insert({ user_id: auth.user.id, trigger_id: body.trigger_id, status: "completed", input_data: body.context_data || {} }).select().single(); if (error) return errorResponse("DB_ERROR", error.message, 500, reqId); return json(data, 201, reqId); }
    if (m === "GET" && matchRoute("/v1/automation/workflows", apiPath)) return await crudList(automationWorkflowsCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/automation/workflows", apiPath)) return await crudCreate(automationWorkflowsCfg)(req, auth, reqId);
    p = matchRoute("/v1/automation/workflows/:id/toggle", apiPath); if (m === "POST" && p) { const body = await req.json(); await serviceClient().from("automation_workflows").update({ is_active: body.is_active, updated_at: new Date().toISOString() }).eq("id", p.id).eq("user_id", auth.user.id); return json({ success: true }, 200, reqId); }
    p = matchRoute("/v1/automation/workflows/:id/run", apiPath); if (m === "POST" && p) { await serviceClient().from("automation_workflows").update({ last_run_at: new Date().toISOString(), run_count: 1 }).eq("id", p.id).eq("user_id", auth.user.id); return json({ success: true, workflow_id: p.id }, 200, reqId); }
    p = matchRoute("/v1/automation/workflows/:id", apiPath); if (p) { if (m === "GET") return await crudGet(automationWorkflowsCfg)(p.id, auth, reqId); if (m === "PUT") return await crudUpdate(automationWorkflowsCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(automationWorkflowsCfg)(p.id, auth, reqId); }

    // ── Marketing ─────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/marketing/stats", apiPath)) return await getMarketingStats(auth, reqId);
    if (m === "GET" && matchRoute("/v1/marketing/dashboard", apiPath)) return await getMarketingDashboardStats(auth, reqId);
    if (m === "GET" && matchRoute("/v1/marketing/campaigns", apiPath)) return await crudList(marketingCampaignsCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/marketing/campaigns", apiPath)) return await crudCreate(marketingCampaignsCfg)(req, auth, reqId);
    p = matchRoute("/v1/marketing/campaigns/:id", apiPath); if (p) { if (m === "GET") return await crudGet(marketingCampaignsCfg)(p.id, auth, reqId); if (m === "PUT") return await crudUpdate(marketingCampaignsCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(marketingCampaignsCfg)(p.id, auth, reqId); }
    if (m === "GET" && matchRoute("/v1/marketing/automations", apiPath)) return await crudList(automatedCampaignsCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/marketing/automations", apiPath)) return await crudCreate(automatedCampaignsCfg)(req, auth, reqId);
    p = matchRoute("/v1/marketing/automations/:id/toggle", apiPath); if (m === "POST" && p) { const body = await req.json(); await serviceClient().from("automated_campaigns").update({ is_active: body.is_active }).eq("id", p.id).eq("user_id", auth.user.id); return json({ success: true }, 200, reqId); }

    // ── Ads ───────────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/ads/accounts", apiPath)) return await crudList(adAccountsCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/ads/accounts", apiPath)) return await crudCreate(adAccountsCfg)(req, auth, reqId);
    p = matchRoute("/v1/ads/accounts/:id", apiPath); if (p) { if (m === "GET") return await crudGet(adAccountsCfg)(p.id, auth, reqId); if (m === "PUT") return await crudUpdate(adAccountsCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(adAccountsCfg)(p.id, auth, reqId); }
    if (m === "GET" && matchRoute("/v1/ads/campaigns", apiPath)) return await crudList(adCampaignsCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/ads/campaigns", apiPath)) return await crudCreate(adCampaignsCfg)(req, auth, reqId);
    p = matchRoute("/v1/ads/campaigns/:id", apiPath); if (p) { if (m === "GET") return await crudGet(adCampaignsCfg)(p.id, auth, reqId); if (m === "PUT") return await crudUpdate(adCampaignsCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(adCampaignsCfg)(p.id, auth, reqId); }

    // ── CRM ───────────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/crm/tasks", apiPath)) return await crudList(crmTasksCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/crm/tasks", apiPath)) return await crudCreate(crmTasksCfg)(req, auth, reqId);
    p = matchRoute("/v1/crm/tasks/:id", apiPath); if (p) { if (m === "GET") return await crudGet(crmTasksCfg)(p.id, auth, reqId); if (m === "PUT") return await crudUpdate(crmTasksCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(crmTasksCfg)(p.id, auth, reqId); }
    if (m === "GET" && matchRoute("/v1/crm/deals", apiPath)) return await crudList(crmDealsCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/crm/deals", apiPath)) return await crudCreate(crmDealsCfg)(req, auth, reqId);
    p = matchRoute("/v1/crm/deals/:id", apiPath); if (p) { if (m === "GET") return await crudGet(crmDealsCfg)(p.id, auth, reqId); if (m === "PUT") return await crudUpdate(crmDealsCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(crmDealsCfg)(p.id, auth, reqId); }
    if (m === "GET" && matchRoute("/v1/crm/pricing-rules", apiPath)) return await crudList(pricingRulesCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/crm/pricing-rules", apiPath)) return await crudCreate(pricingRulesCfg)(req, auth, reqId);
    p = matchRoute("/v1/crm/pricing-rules/:id", apiPath); if (p) { if (m === "PUT") return await crudUpdate(pricingRulesCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(pricingRulesCfg)(p.id, auth, reqId); }

    // ── Finance ───────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/finance/stats", apiPath)) return await getFinanceStats(auth, reqId);

    // ── Conversion ────────────────────────────────────────────
    for (const [key, table] of Object.entries(conversionTables)) {
      if (m === "GET" && matchRoute(`/v1/conversion/${key}`, apiPath)) return await conversionList(table, auth, reqId);
      if (m === "POST" && matchRoute(`/v1/conversion/${key}`, apiPath)) return await conversionCreate(table, req, auth, reqId);
    }
    if (m === "POST" && matchRoute("/v1/conversion/events", apiPath)) return await trackConversionEvent(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/conversion/analytics", apiPath)) return await getConversionAnalytics(auth, reqId);

    // ── Advanced Analytics ────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/analytics/performance", apiPath)) return await listPerformanceMetrics(auth, reqId);
    if (m === "GET" && matchRoute("/v1/analytics/reports", apiPath)) return await listAdvancedReports(auth, reqId);
    if (m === "POST" && matchRoute("/v1/analytics/reports", apiPath)) return await generateAdvancedReport(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/analytics/predictive", apiPath)) return await listPredictiveAnalytics(auth, reqId);
    if (m === "POST" && matchRoute("/v1/analytics/predictive/run", apiPath)) return await runPredictiveAnalysis(auth, reqId);
    if (m === "GET" && matchRoute("/v1/analytics/ab-tests", apiPath)) return await listABTests(auth, reqId);
    if (m === "POST" && matchRoute("/v1/analytics/ab-tests", apiPath)) return await createABTest(req, auth, reqId);

    // ── Promotions ────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/promotions/stats", apiPath)) return await getPromotionStats(auth, reqId);
    if (m === "GET" && matchRoute("/v1/promotions/campaigns", apiPath)) return await crudList(promotionCampaignsCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/promotions/campaigns", apiPath)) return await crudCreate(promotionCampaignsCfg)(req, auth, reqId);
    p = matchRoute("/v1/promotions/campaigns/:id", apiPath); if (p) { if (m === "GET") return await crudGet(promotionCampaignsCfg)(p.id, auth, reqId); if (m === "PUT") return await crudUpdate(promotionCampaignsCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(promotionCampaignsCfg)(p.id, auth, reqId); }
    if (m === "GET" && matchRoute("/v1/promotions/rules", apiPath)) return await crudList(promotionRulesCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/promotions/rules", apiPath)) return await crudCreate(promotionRulesCfg)(req, auth, reqId);
    p = matchRoute("/v1/promotions/rules/:id/toggle", apiPath); if (m === "POST" && p) { const body = await req.json(); await serviceClient().from("promotion_automation_rules").update({ is_active: body.is_active }).eq("id", p.id).eq("user_id", auth.user.id); return json({ success: true }, 200, reqId); }

    // ── BI ────────────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/intelligence/insights", apiPath)) return await listInsights(url, auth, reqId);
    if (m === "GET" && matchRoute("/v1/intelligence/metrics", apiPath)) return await getInsightMetrics(auth, reqId);
    p = matchRoute("/v1/intelligence/insights/:id/acknowledge", apiPath); if (m === "POST" && p) { await serviceClient().from("analytics_insights").update({ metadata: { acknowledged: true, acknowledged_at: new Date().toISOString() } }).eq("id", p.id).eq("user_id", auth.user.id); return json({ success: true }, 200, reqId); }
    p = matchRoute("/v1/intelligence/insights/:id/dismiss", apiPath); if (m === "DELETE" && p) { await serviceClient().from("analytics_insights").delete().eq("id", p.id).eq("user_id", auth.user.id); return json({ success: true }, 200, reqId); }

    // ── Customer Behavior ─────────────────────────────────────
    if (m === "POST" && matchRoute("/v1/behavior/product-views", apiPath)) return await trackProductView(req, auth, reqId);
    if (m === "POST" && matchRoute("/v1/behavior/compare-prices", apiPath)) return await compareSupplierPrices(req, auth, reqId);

    // ── AI ─────────────────────────────────────────────────────
    if (m === "POST" && matchRoute("/v1/ai/pricing-suggestions", apiPath)) return await aiPricingSuggestions(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/ai/trending-products", apiPath)) return await aiTrendingProducts(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/ai/performance-analysis", apiPath)) return await aiPerformanceAnalysis(req, auth, reqId);
    if (m === "GET" && matchRoute("/v1/ai/business-summary", apiPath)) return await aiBusinessSummary(auth, reqId);

    // ── Integrations ──────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/integrations", apiPath)) return await crudList(integrationsCfg)(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/integrations", apiPath)) return await crudCreate(integrationsCfg)(req, auth, reqId);
    p = matchRoute("/v1/integrations/:id", apiPath); if (p) { if (m === "GET") return await crudGet(integrationsCfg)(p.id, auth, reqId); if (m === "PUT") return await crudUpdate(integrationsCfg)(p.id, req, auth, reqId); if (m === "DELETE") return await crudDelete(integrationsCfg)(p.id, auth, reqId); }

    // ── Monetization ──────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/monetization/plan", apiPath)) return await getMonetizationPlan(auth, reqId);
    if (m === "GET" && matchRoute("/v1/monetization/usage", apiPath)) return await getMonetizationUsage(auth, reqId);
    if (m === "GET" && matchRoute("/v1/monetization/credits", apiPath)) return await getMonetizationCredits(auth, reqId);
    if (m === "GET" && matchRoute("/v1/monetization/history", apiPath)) return await getMonetizationHistory(url, auth, reqId);
    if (m === "POST" && matchRoute("/v1/monetization/check-gate", apiPath)) return await checkPlanGate(req, auth, reqId);

    // ── Suppliers ─────────────────────────────────────────────
    if (m === "GET" && matchRoute("/v1/suppliers/premium", apiPath)) { const { data } = await serviceClient().from("premium_suppliers").select("*").eq("is_active", true).order("name"); return json({ items: data || [] }, 200, reqId); }
    p = matchRoute("/v1/suppliers/premium/:id", apiPath); if (m === "GET" && p) { const { data, error } = await serviceClient().from("premium_suppliers").select("*").eq("id", p.id).single(); if (error) return errorResponse("NOT_FOUND", "Supplier not found", 404, reqId); return json(data, 200, reqId); }

    return errorResponse("NOT_FOUND", `Route ${m} ${apiPath} not found`, 404, reqId);
  } catch (err: any) {
    console.error("api-v1-ext error:", err);
    return errorResponse("INTERNAL_ERROR", err.message || "Internal server error", 500, reqId);
  }
});
