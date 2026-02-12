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
