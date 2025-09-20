/**
 * Common types used across the application
 */

export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

export interface UserEntity extends BaseEntity {
  user_id: string
}

export type Status = 'active' | 'inactive' | 'pending' | 'suspended' | 'archived'

export type Priority = 'low' | 'medium' | 'high' | 'critical'

export type Severity = 'info' | 'warning' | 'error' | 'critical'

export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ExportOptions {
  format: 'csv' | 'xlsx' | 'json'
  columns?: string[]
  filename?: string
}

export interface BulkOperation {
  action: 'update' | 'delete' | 'archive'
  items: string[]
  data?: Record<string, any>
}

export interface FilterOption {
  value: string
  label: string
  count?: number
}

export interface SortOption {
  value: string
  label: string
  field: string
  direction: 'asc' | 'desc'
}

export interface SearchParams {
  query?: string
  filters?: Record<string, any>
  sort?: {
    field: string
    direction: 'asc' | 'desc'
  }
  page?: number
  limit?: number
}

export interface ActivityLog extends BaseEntity {
  user_id: string
  action: string
  description: string
  entity_type?: string
  entity_id?: string
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  severity?: Severity
  source?: string
}

export interface Notification extends BaseEntity {
  user_id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error' | 'system'
  priority?: Priority
  read: boolean
  read_at?: string
  action?: {
    label: string
    url?: string
    callback?: string
  }
  expires_at?: string
  category?: string
  data?: Record<string, any>
}

export interface QuotaInfo {
  name: string
  description: string
  icon: React.ComponentType<any>
}

export interface QuotaDisplayNames {
  [key: string]: QuotaInfo
}