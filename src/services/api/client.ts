/**
 * API V1 Client — Centralized HTTP client for /v1 REST endpoints
 * Handles auth (JWT from Supabase session), error parsing, pagination.
 */
import { supabase } from '@/integrations/supabase/client'

const BASE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-v1/v1`

export interface ApiError {
  code: string
  message: string
  details?: any
}

export interface PaginatedResponse<T> {
  items: T[]
  meta: { page: number; per_page: number; total: number }
}

export interface PaginationParams {
  page?: number
  per_page?: number
}

async function getAuthHeaders(): Promise<Record<string, string>> {
  const { data: { session } } = await supabase.auth.getSession()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  }
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`
  }
  return headers
}

async function request<T>(
  method: string,
  path: string,
  options?: {
    body?: any
    params?: Record<string, string | number | undefined>
    idempotencyKey?: string
  }
): Promise<T> {
  const headers = await getAuthHeaders()
  
  if (options?.idempotencyKey) {
    headers['Idempotency-Key'] = options.idempotencyKey
  }

  let url = `${BASE_URL}${path}`
  if (options?.params) {
    const searchParams = new URLSearchParams()
    for (const [key, val] of Object.entries(options.params)) {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.set(key, String(val))
      }
    }
    const qs = searchParams.toString()
    if (qs) url += `?${qs}`
  }

  const resp = await fetch(url, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await resp.json()

  if (!resp.ok) {
    const err = data?.error as ApiError | undefined
    throw new Error(err?.message ?? `API error ${resp.status}`)
  }

  return data as T
}

// ── Convenience methods ─────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, params?: Record<string, string | number | undefined>) =>
    request<T>('GET', path, { params }),

  post: <T>(path: string, body?: any, idempotencyKey?: string) =>
    request<T>('POST', path, { body, idempotencyKey }),

  put: <T>(path: string, body?: any) =>
    request<T>('PUT', path, { body }),

  delete: <T>(path: string) =>
    request<T>('DELETE', path),
}

// ── Typed API modules ───────────────────────────────────────────────────────

// ── Products ────────────────────────────────────────────────────────────────

export interface ProductRecord {
  id: string
  name: string
  title: string | null
  description: string | null
  sku: string | null
  barcode: string | null
  price: number
  compare_at_price: number | null
  cost_price: number
  category: string | null
  brand: string | null
  supplier: string | null
  supplier_url: string | null
  supplier_product_id: string | null
  status: string
  stock_quantity: number
  weight: number | null
  weight_unit: string
  images: string[]
  variants: any[]
  tags: string[]
  seo_title: string | null
  seo_description: string | null
  is_published: boolean
  product_type: string | null
  vendor: string | null
  view_count: number
  profit_margin: number | null
  created_at: string
  updated_at: string
}

export interface ProductStats {
  total: number
  active: number
  draft: number
  inactive: number
  low_stock: number
  out_of_stock: number
  total_value: number
  total_cost: number
  total_profit: number
  avg_price: number
  profit_margin: number
}

export const productsApi = {
  list: (params?: PaginationParams & { status?: string; category?: string; q?: string; low_stock?: string }) =>
    api.get<PaginatedResponse<ProductRecord>>('/products', params as any),

  get: (id: string) =>
    api.get<ProductRecord>(`/products/${id}`),

  create: (body: Partial<ProductRecord>) =>
    api.post<{ id: string; status: string; created_at: string }>('/products', body, crypto.randomUUID()),

  update: (id: string, body: Partial<ProductRecord>) =>
    api.put<{ id: string; status: string; updated_at: string }>(`/products/${id}`, body),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/products/${id}`),

  bulkUpdate: (productIds: string[], updates: Partial<ProductRecord>) =>
    api.post<{ updated: number }>('/products/bulk', { product_ids: productIds, updates }),

  stats: () =>
    api.get<ProductStats>('/products/stats'),

  // ── Product sub-resources ──
  seo: (id: string) =>
    api.get<any>(`/products/${id}/seo`),

  optimize: (id: string, options?: { language?: string; tone?: string; targets?: string[] }) =>
    api.post<{ job_id: string; status: string; product_id: string }>(`/products/${id}/optimize`, options),

  metrics: (id: string, params?: { period?: string; limit?: number }) =>
    api.get<any>(`/products/${id}/metrics`, params as any),

  stockHistory: (id: string, params?: { type?: string; limit?: number }) =>
    api.get<any>(`/products/${id}/stock-history`, params as any),
}

// ── Inventory ───────────────────────────────────────────────────────────────

export const inventoryApi = {
  locations: () =>
    api.get<{ items: any[] }>('/inventory/locations'),

  levels: (params?: { variant_id?: string; location_id?: string }) =>
    api.get<{ items: any[] }>('/inventory/levels', params as any),

  upsertLevel: (body: any) =>
    api.post<any>('/inventory/levels', body),
}

// ── Product Prices ──────────────────────────────────────────────────────────

export const pricesApi = {
  list: (params?: { variant_id?: string; store_id?: string }) =>
    api.get<{ items: any[] }>('/prices', params as any),

  upsert: (body: any) =>
    api.post<any>('/prices', body),
}

// ── Product Events ──────────────────────────────────────────────────────────

export const eventsApi = {
  list: (params?: { product_id?: string; limit?: number }) =>
    api.get<{ items: any[] }>('/events', params as any),
}

// ── Product SEO CRUD ────────────────────────────────────────────────────────

export const productSeoApi = {
  get: (params: { product_id: string; store_id?: string; language?: string }) =>
    api.get<{ seo: any }>('/product-seo', params as any),

  upsert: (body: any) =>
    api.post<any>('/product-seo', body),

  versions: (params: { product_id: string }) =>
    api.get<{ items: any[] }>('/product-seo/versions', params as any),
}

// ── Store Products ──────────────────────────────────────────────────────────

export const storeProductsApi = {
  list: (params?: PaginationParams & { store_id?: string; status?: string }) =>
    api.get<PaginatedResponse<any>>('/store-products', params as any),

  upsert: (body: any) =>
    api.post<any>('/store-products', body),
}

// ── Import Jobs ─────────────────────────────────────────────────────────────


export const importJobsApi = {
  create: (body: any, idempotencyKey?: string) =>
    api.post<{ job_id: string; status: string }>('/import/jobs', body, idempotencyKey ?? crypto.randomUUID()),

  list: (params?: PaginationParams & { status?: string }) =>
    api.get<PaginatedResponse<any>>('/import/jobs', params as any),

  get: (jobId: string) =>
    api.get<any>(`/import/jobs/${jobId}`),

  getItems: (jobId: string, params?: PaginationParams & { status?: string }) =>
    api.get<PaginatedResponse<any>>(`/import/jobs/${jobId}/items`, params as any),

  retry: (jobId: string, onlyFailed = true) =>
    api.post<{ job_id: string; status: string }>(`/import/jobs/${jobId}/retry`, { only_failed: onlyFailed }),

  cancel: (jobId: string) =>
    api.post<{ job_id: string; status: string }>(`/import/jobs/${jobId}/cancel`),

  resume: (jobId: string) =>
    api.post<{ job_id: string; status: string; remaining: number }>(`/import/jobs/${jobId}/resume`),

  replay: (jobId: string) =>
    api.post<{ job_id: string; status: string; replayed_from: string }>(`/import/jobs/${jobId}/replay`),

  enrich: (jobId: string, options?: { language?: string; tone?: string }) =>
    api.post<{ success: boolean; job_id?: string; products_count: number }>('/import/jobs/enrich', { job_id: jobId, ...options }),
}

// ── Deduplication ───────────────────────────────────────────────────────────

export const deduplicationApi = {
  scan: (threshold?: number) =>
    api.post<{ success: boolean; groups: any[]; stats: any }>('/import/deduplicate/scan', { threshold: threshold ?? 0.75 }),

  merge: (keepId: string, removeIds: string[]) =>
    api.post<{ success: boolean; merged: number; keptId: string }>('/import/deduplicate/merge', { keep_id: keepId, remove_ids: removeIds }),
}

export const presetsApi = {
  list: (params?: PaginationParams & { platform?: string; q?: string }) =>
    api.get<PaginatedResponse<any>>('/import/presets', params as any),

  create: (body: any) =>
    api.post<{ id: string; version: number }>('/import/presets', body, crypto.randomUUID()),

  get: (id: string) =>
    api.get<any>(`/import/presets/${id}`),

  update: (id: string, body: any) =>
    api.put<{ id: string; version: number }>(`/import/presets/${id}`, body),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/import/presets/${id}`),

  setDefault: (id: string, storeId?: string) =>
    api.post(`/import/presets/${id}/default`, { store_id: storeId }),

  export: (id: string) =>
    api.get<{ preset: any }>(`/import/presets/${id}/export`),

  import: (preset: any) =>
    api.post<{ id: string; version: number }>('/import/presets/import', { preset }, crypto.randomUUID()),
}

export const csvUploadsApi = {
  createSession: (filename: string, storeId?: string) =>
    api.post<{ upload_id: string; upload_url: string | null; expires_at: string }>(
      '/import/csv/uploads',
      { filename, store_id: storeId },
    ),

  analyze: (uploadId: string, options?: { has_header?: boolean; delimiter?: string }) =>
    api.post<{
      columns: string[]
      sample_rows: any[]
      signature: string | null
      suggested_mapping: Record<string, { field: string }>
      matching_presets: Array<{ preset_id: string; name: string; confidence: number }>
    }>(`/import/csv/uploads/${uploadId}/analyze`, options),
}

export const aiEnrichmentsApi = {
  create: (body: { product_ids: string[]; language?: string; tone?: string; targets?: string[]; store_id?: string }) =>
    api.post<{ job_id: string; status: string }>('/ai/enrichments', body, crypto.randomUUID()),

  get: (jobId: string) =>
    api.get<any>(`/ai/enrichments/${jobId}`),

  getItems: (jobId: string, params?: PaginationParams & { status?: string }) =>
    api.get<PaginatedResponse<any>>(`/ai/enrichments/${jobId}/items`, params as any),
}

export const draftsApi = {
  list: (params?: PaginationParams) =>
    api.get<PaginatedResponse<any>>('/products/drafts', params as any),

  publish: (draftIds: string[], storeId?: string) =>
    api.post<{ published: number; skipped: number; product_ids: string[] }>(
      '/products/drafts/publish',
      { draft_ids: draftIds, store_id: storeId },
    ),
}

// ── AI Generations ──────────────────────────────────────────────────────────

export const aiGenerationsApi = {
  list: (params: { target_type?: string; target_id?: string; limit?: number }) =>
    api.get<{ items: any[] }>('/ai/generations', params as any),

  create: (body: any) =>
    api.post<any>('/ai/generations', body, crypto.randomUUID()),
}

// ── Orders ──────────────────────────────────────────────────────────────────

export const ordersApi = {
  list: (params?: PaginationParams & { status?: string; q?: string }) =>
    api.get<PaginatedResponse<any>>('/orders', params as any),

  get: (id: string) =>
    api.get<any>(`/orders/${id}`),

  create: (body: any) =>
    api.post<any>('/orders', body, crypto.randomUUID()),

  update: (id: string, body: any) =>
    api.put<any>(`/orders/${id}`, body),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/orders/${id}`),

  stats: () =>
    api.get<any>('/orders/stats'),
}

// ── Customers ───────────────────────────────────────────────────────────────

export const customersApi = {
  list: (params?: PaginationParams & { q?: string }) =>
    api.get<PaginatedResponse<any>>('/customers', params as any),

  get: (id: string) =>
    api.get<any>(`/customers/${id}`),

  create: (body: any) =>
    api.post<any>('/customers', body, crypto.randomUUID()),

  update: (id: string, body: any) =>
    api.put<any>(`/customers/${id}`, body),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/customers/${id}`),

  stats: () =>
    api.get<any>('/customers/stats'),
}

// ── Dashboard ───────────────────────────────────────────────────────────────

export const dashboardApi = {
  stats: () =>
    api.get<any>('/dashboard/stats'),

  activity: (params?: { limit?: number }) =>
    api.get<{ items: any[] }>('/dashboard/activity', params as any),
}

// ── Integrations ────────────────────────────────────────────────────────────

export const integrationsApi = {
  list: (params?: PaginationParams) =>
    api.get<PaginatedResponse<any>>('/integrations', params as any),

  get: (id: string) =>
    api.get<any>(`/integrations/${id}`),

  create: (body: any) =>
    api.post<any>('/integrations', body, crypto.randomUUID()),

  update: (id: string, body: any) =>
    api.put<any>(`/integrations/${id}`, body),

  delete: (id: string) =>
    api.delete<{ success: boolean }>(`/integrations/${id}`),

  stats: () =>
    api.get<any>('/integrations/stats'),

  sync: (id: string, body?: { sync_type?: string }) =>
    api.post<any>(`/integrations/${id}/sync`, body || {}),

  test: (id: string) =>
    api.post<any>(`/integrations/${id}/test`, {}),
}

// ── Suppliers ───────────────────────────────────────────────────────────────

export const suppliersApi = {
  list: (params?: PaginationParams & { category?: string; status?: string; q?: string }) =>
    api.get<PaginatedResponse<any>>('/suppliers', params as any),

  get: (id: string) =>
    api.get<any>(`/suppliers/${id}`),

  stats: () =>
    api.get<any>('/suppliers/stats'),
}

// ── Automation ──────────────────────────────────────────────────────────────

export const automationApi = {
  listTriggers: (params?: PaginationParams) =>
    api.get<{ items: any[] }>('/automation/triggers', params as any),

  createTrigger: (body: any) =>
    api.post<any>('/automation/triggers', body, crypto.randomUUID()),

  updateTrigger: (id: string, body: any) =>
    api.put<any>(`/automation/triggers/${id}`, body),

  deleteTrigger: (id: string) =>
    api.delete<{ success: boolean }>(`/automation/triggers/${id}`),

  listActions: (params?: PaginationParams) =>
    api.get<{ items: any[] }>('/automation/actions', params as any),

  createAction: (body: any) =>
    api.post<any>('/automation/actions', body, crypto.randomUUID()),

  listExecutions: (params?: { limit?: number; status?: string }) =>
    api.get<{ items: any[] }>('/automation/executions', params as any),

  execute: (triggerId: string, contextData?: any) =>
    api.post<any>('/automation/execute', { trigger_id: triggerId, context_data: contextData }),

  stats: () =>
    api.get<any>('/automation/stats'),

  // Workflows
  listWorkflows: () =>
    api.get<{ items: any[] }>('/automation/workflows'),

  createWorkflow: (body: any) =>
    api.post<any>('/automation/workflows', body, crypto.randomUUID()),

  updateWorkflow: (id: string, body: any) =>
    api.put<any>(`/automation/workflows/${id}`, body),

  deleteWorkflow: (id: string) =>
    api.delete<{ success: boolean }>(`/automation/workflows/${id}`),

  toggleWorkflow: (id: string, isActive: boolean) =>
    api.post<any>(`/automation/workflows/${id}/toggle`, { is_active: isActive }),

  runWorkflow: (id: string) =>
    api.post<any>(`/automation/workflows/${id}/run`, {}),
}

// ── Marketing ───────────────────────────────────────────────────────────────

export const marketingApi = {
  listCampaigns: (params?: PaginationParams) =>
    api.get<PaginatedResponse<any>>('/marketing/campaigns', params as any),

  createCampaign: (body: any) =>
    api.post<any>('/marketing/campaigns', body, crypto.randomUUID()),

  updateCampaign: (id: string, body: any) =>
    api.put<any>(`/marketing/campaigns/${id}`, body),

  deleteCampaign: (id: string) =>
    api.delete<{ success: boolean }>(`/marketing/campaigns/${id}`),

  stats: () =>
    api.get<any>('/marketing/stats'),

  dashboardStats: () =>
    api.get<any>('/marketing/dashboard-stats'),

  // Automations
  listAutomations: () =>
    api.get<{ items: any[] }>('/marketing/automations'),

  createAutomation: (body: any) =>
    api.post<any>('/marketing/automations', body, crypto.randomUUID()),

  updateAutomation: (id: string, body: any) =>
    api.put<any>(`/marketing/automations/${id}`, body),

  toggleAutomation: (id: string, is_active: boolean) =>
    api.post<any>(`/marketing/automations/${id}/toggle`, { is_active }),
}

// ── Ads ─────────────────────────────────────────────────────────────────────

export const adsApi = {
  listAccounts: () =>
    api.get<{ items: any[] }>('/ads/accounts'),

  createAccount: (body: any) =>
    api.post<any>('/ads/accounts', body, crypto.randomUUID()),

  updateAccount: (id: string, body: any) =>
    api.put<any>(`/ads/accounts/${id}`, body),

  listCampaigns: () =>
    api.get<{ items: any[] }>('/ads/campaigns'),

  createCampaign: (body: any) =>
    api.post<any>('/ads/campaigns', body, crypto.randomUUID()),

  updateCampaign: (id: string, body: any) =>
    api.put<any>(`/ads/campaigns/${id}`, body),

  deleteCampaign: (id: string) =>
    api.delete<{ success: boolean }>(`/ads/campaigns/${id}`),
}

// ── Business Intelligence / Insights ────────────────────────────────────────

export const insightsApi = {
  list: (params?: { limit?: number }) =>
    api.get<{ items: any[] }>('/insights', params as any),

  metrics: () =>
    api.get<any>('/insights/metrics'),

  acknowledge: (id: string) =>
    api.post<any>(`/insights/${id}/acknowledge`, {}),

  dismiss: (id: string) =>
    api.delete<{ success: boolean }>(`/insights/${id}`),
}

// ── CRM ─────────────────────────────────────────────────────────────────────

export const crmApi = {
  listTasks: () =>
    api.get<{ items: any[] }>('/crm/tasks'),

  createTask: (body: any) =>
    api.post<any>('/crm/tasks', body, crypto.randomUUID()),

  updateTask: (id: string, body: any) =>
    api.put<any>(`/crm/tasks/${id}`, body),

  deleteTask: (id: string) =>
    api.delete<{ success: boolean }>(`/crm/tasks/${id}`),

  listDeals: () =>
    api.get<{ items: any[] }>('/crm/deals'),

  createDeal: (body: any) =>
    api.post<any>('/crm/deals', body, crypto.randomUUID()),

  updateDeal: (id: string, body: any) =>
    api.put<any>(`/crm/deals/${id}`, body),

  deleteDeal: (id: string) =>
    api.delete<{ success: boolean }>(`/crm/deals/${id}`),
}

// ── Pricing ─────────────────────────────────────────────────────────────────

export const pricingApi = {
  listRules: () =>
    api.get<{ items: any[] }>('/pricing/rules'),

  createRule: (body: any) =>
    api.post<any>('/pricing/rules', body, crypto.randomUUID()),

  updateRule: (id: string, body: any) =>
    api.put<any>(`/pricing/rules/${id}`, body),

  deleteRule: (id: string) =>
    api.delete<{ success: boolean }>(`/pricing/rules/${id}`),
}

// ── Finance ─────────────────────────────────────────────────────────────────

export const financeApi = {
  stats: () =>
    api.get<any>('/finance/stats'),
}

// ── Conversion ──────────────────────────────────────────────────────────────

export const conversionApi = {
  listBundles: () => api.get<{ items: any[] }>('/conversion/bundles'),
  createBundle: (body: any) => api.post<any>('/conversion/bundles', body, crypto.randomUUID()),
  listUpsells: () => api.get<{ items: any[] }>('/conversion/upsells'),
  createUpsell: (body: any) => api.post<any>('/conversion/upsells', body, crypto.randomUUID()),
  listDiscounts: () => api.get<{ items: any[] }>('/conversion/discounts'),
  createDiscount: (body: any) => api.post<any>('/conversion/discounts', body, crypto.randomUUID()),
  listTimers: () => api.get<{ items: any[] }>('/conversion/timers'),
  createTimer: (body: any) => api.post<any>('/conversion/timers', body, crypto.randomUUID()),
  listSocialProof: () => api.get<{ items: any[] }>('/conversion/social-proof'),
  createSocialProof: (body: any) => api.post<any>('/conversion/social-proof', body, crypto.randomUUID()),
  trackEvent: (body: any) => api.post<any>('/conversion/track', body),
  analytics: () => api.get<any>('/conversion/analytics'),
}

// ── Advanced Analytics ──────────────────────────────────────────────────────

export const advancedAnalyticsApi = {
  performanceMetrics: () => api.get<{ items: any[] }>('/analytics/performance'),
  listReports: () => api.get<{ items: any[] }>('/analytics/reports'),
  generateReport: (body: any) => api.post<any>('/analytics/reports', body, crypto.randomUUID()),
  predictiveAnalytics: () => api.get<{ items: any[] }>('/analytics/predictive'),
  runPredictive: () => api.post<any>('/analytics/predictive', {}),
  listABTests: () => api.get<{ items: any[] }>('/analytics/ab-tests'),
  createABTest: (body: any) => api.post<any>('/analytics/ab-tests', body, crypto.randomUUID()),
}

// ── Promotions ──────────────────────────────────────────────────────────────

export const promotionsApi = {
  listCampaigns: (status?: string) => api.get<{ items: any[] }>('/promotions/campaigns', status ? { status } : undefined),
  createCampaign: (body: any) => api.post<any>('/promotions/campaigns', body, crypto.randomUUID()),
  updateCampaign: (id: string, body: any) => api.put<any>(`/promotions/campaigns/${id}`, body),
  deleteCampaign: (id: string) => api.delete<{ success: boolean }>(`/promotions/campaigns/${id}`),
  listRules: () => api.get<{ items: any[] }>('/promotions/rules'),
  createRule: (body: any) => api.post<any>('/promotions/rules', body, crypto.randomUUID()),
  toggleRule: (id: string, isActive: boolean) => api.put<{ success: boolean }>(`/promotions/rules/${id}`, { is_active: isActive }),
  deleteRule: (id: string) => api.delete<{ success: boolean }>(`/promotions/rules/${id}`),
  stats: () => api.get<any>('/promotions/stats'),
}

// ── Customer Behavior ───────────────────────────────────────────────────────

export const behaviorApi = {
  history: () => api.get<{ items: any[] }>('/behavior/history'),
  analyze: (body: any) => api.post<any>('/behavior/analyze', body),
  getById: (id: string) => api.get<any>(`/behavior/${id}`),
  delete: (id: string) => api.delete<{ success: boolean }>(`/behavior/${id}`),
}

// ── Product Tracking ────────────────────────────────────────────────────────

export const trackingApi = {
  trackView: (body: { productId: string; source?: string }) => api.post<any>('/tracking/product-view', body),
  compareSuppliers: (body: { productId: string }) => api.post<any>('/tracking/supplier-compare', body),
}

// ── Advanced AI ─────────────────────────────────────────────────────────────

export interface AIPricingSuggestion {
  product_id: string
  product_name: string
  current_price: number
  suggested_price: number
  reason: string
  confidence: number
  potential_revenue_change: number
}

export interface AITrendingProduct {
  product_id: string
  product_name: string
  trend_score: number
  velocity: 'rising' | 'stable' | 'declining'
  category: string
  sales_7d: number
  sales_30d: number
}

export interface AIPerformanceReport {
  summary: string
  score: number
  strengths: string[]
  weaknesses: string[]
  actions: { priority: 'high' | 'medium' | 'low'; action: string; impact: string }[]
}

export interface AIBusinessSummary {
  revenue_trend: { direction: string; percent: number }
  top_category: string
  risk_alerts: string[]
  ai_recommendations: string[]
  health_score: number
}

export const advancedAIApi = {
  pricingSuggestions: (body: { product_ids?: string[]; strategy?: string }) =>
    api.post<{ items: AIPricingSuggestion[] }>('/ai/pricing-suggestions', body),
  trendingProducts: (limit?: number) =>
    api.get<{ items: AITrendingProduct[] }>('/ai/trending-products', limit ? { limit } : undefined),
  performanceAnalysis: (body: { time_range?: string; focus?: string }) =>
    api.post<AIPerformanceReport>('/ai/performance-analysis', body),
  businessSummary: () =>
    api.get<AIBusinessSummary>('/ai/business-summary'),
}

// ── Monetization ────────────────────────────────────────────────────────────

export interface MonetizationPlan {
  current_plan: string
  limits: Record<string, number>
  is_unlimited: boolean
  stripe_customer_id: string | null
}

export interface MonetizationUsage {
  plan: string
  usage: Record<string, { current: number; limit: number; percentage: number }>
  alerts: string[]
}

export interface MonetizationCredits {
  credits: any[]
  total_remaining: number
  total_purchased: number
}

export interface MonetizationHistory {
  by_day: { date: string; actions: number; tokens: number; cost: number }[]
  by_source: Record<string, number>
  total_actions: number
}

export interface PlanGateResult {
  allowed: boolean
  current?: number
  limit?: number
  remaining?: number
  reason: string
  upgrade_needed?: boolean
}

export const monetizationApi = {
  getPlan: () => api.get<MonetizationPlan>('/monetization/plan'),
  getUsage: () => api.get<MonetizationUsage>('/monetization/usage'),
  getCredits: () => api.get<MonetizationCredits>('/monetization/credits'),
  getHistory: (days?: number) => api.get<MonetizationHistory>('/monetization/history', days ? { days } : undefined),
  checkGate: (resource: string, action?: string) => api.post<PlanGateResult>('/monetization/check-gate', { resource, action }),
}
