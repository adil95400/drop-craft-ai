/**
 * SEO API V1 Client — All SEO operations go through /v1/seo/*
 * Zero direct DB access. API = source of truth.
 */
import { api, type PaginationParams, type PaginatedResponse } from './client'

// ── Types ────────────────────────────────────────────────────────────────────

export interface SeoAuditIssue {
  id: string
  check_type: string
  category: string
  status: 'pass' | 'warning' | 'fail'
  impact: 'critical' | 'high' | 'medium' | 'low'
  current_value?: string
  expected_value?: string
  recommendation?: string
}

export interface SeoAuditSummary {
  audit_id: string
  target_type: string
  target_id?: string
  url: string
  score: number | null
  status: 'pending' | 'running' | 'completed' | 'failed'
  provider: string
  language: string
  summary?: Record<string, any>
  created_at: string
  completed_at?: string
}

export interface SeoAuditDetail extends SeoAuditSummary {
  error_message?: string
  issues: SeoAuditIssue[]
}

export interface SeoGenerationResult {
  job_id: string
  target_type: string
  target_id?: string
  actions: string[]
  tone: string
  language: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  input?: Record<string, any>
  result?: Record<string, any>
  applied_at?: string
  error_message?: string
  tokens_used?: number
  duration_ms?: number
  created_at: string
}

export interface SeoApplyResult {
  success: boolean
  target_id: string
  applied_fields: string[]
}

// ── API methods ──────────────────────────────────────────────────────────────

export const seoApi = {
  /** Launch a new SEO audit */
  audit: (params: {
    url: string
    scope?: 'site' | 'category' | 'product' | 'blog' | 'url'
    target_id?: string
    language?: string
    provider?: 'internal' | 'ahrefs' | 'semrush'
    options?: { meta?: boolean; content?: boolean; structure?: boolean }
  }) =>
    api.post<{ audit_id: string; status: string }>('/seo/audit', params, crypto.randomUUID()),

  /** List all audits */
  listAudits: (params?: PaginationParams & { target_type?: string; status?: string }) =>
    api.get<PaginatedResponse<SeoAuditSummary>>('/seo/audits', params as any),

  /** Get a single audit with issues */
  getAudit: (auditId: string) =>
    api.get<SeoAuditDetail>(`/seo/audits/${auditId}`),

  /** Launch AI content generation */
  generate: (params: {
    target_type?: string
    target_id: string
    actions?: string[]
    tone?: string
    language?: string
  }) =>
    api.post<{ job_id: string; status: string }>('/seo/generate', params, crypto.randomUUID()),

  /** Get generation job result */
  getGeneration: (jobId: string) =>
    api.get<SeoGenerationResult>(`/seo/generate/${jobId}`),

  /** Apply generated content to the catalogue */
  apply: (params: {
    target_type?: string
    target_id: string
    fields: Record<string, any>
    job_id?: string
  }) =>
    api.post<SeoApplyResult>('/seo/apply', params),
}
