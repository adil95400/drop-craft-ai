/**
 * Extensions SDK for Lovable Platform
 * Version: 2.0.0
 * 
 * Official SDK for developing extensions for the Lovable e-commerce platform.
 * Provides TypeScript support, event handling, data access, and lifecycle management.
 */

export interface ExtensionConfig {
  name: string
  display_name: string
  description: string
  version: string
  category: ExtensionCategory
  provider: string
  permissions: ExtensionPermissions
  api_endpoints?: Record<string, string>
  webhooks?: WebhookConfig[]
  rate_limits?: RateLimitConfig
  metadata?: Record<string, any>
}

export type ExtensionCategory = 
  | 'integration' 
  | 'ai_enhancement' 
  | 'optimization' 
  | 'analytics' 
  | 'inventory' 
  | 'marketing'
  | 'media_optimization'
  | 'pricing'
  | 'quality_control'

export interface ExtensionPermissions {
  read_products?: boolean
  write_products?: boolean
  read_orders?: boolean
  write_orders?: boolean
  read_customers?: boolean
  write_customers?: boolean
  api_access?: boolean
  webhook_access?: boolean
  file_upload?: boolean
  ai_processing?: boolean
}

export interface WebhookConfig {
  event: string
  url: string
  secret?: string
}

export interface RateLimitConfig {
  requests_per_minute?: number
  requests_per_hour?: number
  burst_limit?: number
}

export interface ExtensionContext {
  userId: string
  extensionId: string
  config: Record<string, any>
  permissions: ExtensionPermissions
}

export interface Product {
  id: string
  name: string
  description?: string
  price: number
  cost_price?: number
  category?: string
  sub_category?: string
  brand?: string
  sku?: string
  image_urls?: string[]
  tags?: string[]
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
}

export interface ExtensionJob {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  input_data: Record<string, any>
  output_data?: Record<string, any>
  error_details?: string[]
  created_at: string
  started_at?: string
  completed_at?: string
}

export interface AIOptimizationResult {
  type: string
  confidence: number
  suggestions: string[]
  improvements: Record<string, any>
  processing_time_ms: number
  ai_model?: string
}

/**
 * Main SDK class for extension development
 */
export class LovableExtensionsSDK {
  private context: ExtensionContext
  private apiClient: ExtensionAPIClient
  private eventBus: ExtensionEventBus

  constructor(context: ExtensionContext) {
    this.context = context
    this.apiClient = new ExtensionAPIClient(context)
    this.eventBus = new ExtensionEventBus()
  }

  /**
   * Get extension context and configuration
   */
  getContext(): ExtensionContext {
    return this.context
  }

  /**
   * Product management methods
   */
  get products() {
    return {
      /**
       * Get products with optional filtering
       */
      list: async (filters?: {
        status?: string
        category?: string
        limit?: number
        offset?: number
      }): Promise<Product[]> => {
        return this.apiClient.get('/products', filters)
      },

      /**
       * Get a single product by ID
       */
      get: async (id: string): Promise<Product> => {
        return this.apiClient.get(`/products/${id}`)
      },

      /**
       * Create a new product
       */
      create: async (product: Partial<Product>): Promise<Product> => {
        this.checkPermission('write_products')
        return this.apiClient.post('/products', product)
      },

      /**
       * Update an existing product
       */
      update: async (id: string, updates: Partial<Product>): Promise<Product> => {
        this.checkPermission('write_products')
        return this.apiClient.put(`/products/${id}`, updates)
      },

      /**
       * Delete a product
       */
      delete: async (id: string): Promise<void> => {
        this.checkPermission('write_products')
        return this.apiClient.delete(`/products/${id}`)
      },

      /**
       * Bulk operations on products
       */
      bulk: {
        update: async (updates: Array<{ id: string; data: Partial<Product> }>): Promise<Product[]> => {
          this.checkPermission('write_products')
          return this.apiClient.post('/products/bulk/update', { updates })
        },
        delete: async (ids: string[]): Promise<void> => {
          this.checkPermission('write_products')
          return this.apiClient.post('/products/bulk/delete', { ids })
        }
      }
    }
  }

  /**
   * AI optimization methods
   */
  get ai() {
    return {
      /**
       * Optimize product SEO
       */
      optimizeSEO: async (productId: string, preferences?: Record<string, any>): Promise<AIOptimizationResult> => {
        this.checkPermission('ai_processing')
        return this.apiClient.post('/ai/optimize-seo', { productId, preferences })
      },

      /**
       * Optimize pricing
       */
      optimizePricing: async (productId: string, marketData?: Record<string, any>): Promise<AIOptimizationResult> => {
        this.checkPermission('ai_processing')
        return this.apiClient.post('/ai/optimize-pricing', { productId, marketData })
      },

      /**
       * Check product quality
       */
      checkQuality: async (productId: string): Promise<AIOptimizationResult> => {
        this.checkPermission('ai_processing')
        return this.apiClient.post('/ai/check-quality', { productId })
      },

      /**
       * Auto-categorize product
       */
      categorize: async (productId: string): Promise<AIOptimizationResult> => {
        this.checkPermission('ai_processing')
        return this.apiClient.post('/ai/categorize', { productId })
      },

      /**
       * Enhance product images
       */
      enhanceImages: async (productId: string): Promise<AIOptimizationResult> => {
        this.checkPermission('ai_processing')
        return this.apiClient.post('/ai/enhance-images', { productId })
      }
    }
  }

  /**
   * Job management methods
   */
  get jobs() {
    return {
      /**
       * Create a new job
       */
      create: async (jobType: string, inputData: Record<string, any>): Promise<ExtensionJob> => {
        return this.apiClient.post('/jobs', {
          job_type: jobType,
          input_data: inputData,
          extension_id: this.context.extensionId
        })
      },

      /**
       * Get job status
       */
      get: async (jobId: string): Promise<ExtensionJob> => {
        return this.apiClient.get(`/jobs/${jobId}`)
      },

      /**
       * Update job progress
       */
      updateProgress: async (jobId: string, progress: number, data?: Record<string, any>): Promise<void> => {
        return this.apiClient.put(`/jobs/${jobId}/progress`, { progress, data })
      },

      /**
       * Complete a job
       */
      complete: async (jobId: string, outputData: Record<string, any>): Promise<void> => {
        return this.apiClient.put(`/jobs/${jobId}/complete`, { output_data: outputData })
      },

      /**
       * Fail a job
       */
      fail: async (jobId: string, error: string): Promise<void> => {
        return this.apiClient.put(`/jobs/${jobId}/fail`, { error })
      }
    }
  }

  /**
   * Event handling methods
   */
  get events() {
    return {
      /**
       * Subscribe to events
       */
      on: (event: string, callback: (data: any) => void): void => {
        this.eventBus.on(event, callback)
      },

      /**
       * Emit an event
       */
      emit: (event: string, data: any): void => {
        this.eventBus.emit(event, data)
      },

      /**
       * Unsubscribe from events
       */
      off: (event: string, callback: (data: any) => void): void => {
        this.eventBus.off(event, callback)
      }
    }
  }

  /**
   * Storage methods for extension data
   */
  get storage() {
    return {
      /**
       * Get stored data
       */
      get: async (key: string): Promise<any> => {
        return this.apiClient.get(`/storage/${key}`)
      },

      /**
       * Store data
       */
      set: async (key: string, value: any): Promise<void> => {
        return this.apiClient.put(`/storage/${key}`, { value })
      },

      /**
       * Delete stored data
       */
      delete: async (key: string): Promise<void> => {
        return this.apiClient.delete(`/storage/${key}`)
      },

      /**
       * List all stored keys
       */
      keys: async (): Promise<string[]> => {
        return this.apiClient.get('/storage/keys')
      }
    }
  }

  /**
   * Utilities and helpers
   */
  get utils() {
    return {
      /**
       * Log messages (visible in extension logs)
       */
      log: (level: 'info' | 'warn' | 'error', message: string, data?: any): void => {
        console.log(`[${this.context.extensionId}] ${level.toUpperCase()}: ${message}`, data)
      },

      /**
       * Generate unique IDs
       */
      generateId: (): string => {
        return Math.random().toString(36).substring(2) + Date.now().toString(36)
      },

      /**
       * Validate email format
       */
      validateEmail: (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
      },

      /**
       * Format price
       */
      formatPrice: (price: number, currency = 'EUR'): string => {
        return new Intl.NumberFormat('fr-FR', {
          style: 'currency',
          currency: currency
        }).format(price)
      },

      /**
       * Debounce function calls
       */
      debounce: <T extends (...args: any[]) => any>(
        func: T,
        wait: number
      ): (...args: Parameters<T>) => void => {
        let timeout: NodeJS.Timeout
        return (...args: Parameters<T>) => {
          clearTimeout(timeout)
          timeout = setTimeout(() => func(...args), wait)
        }
      }
    }
  }

  /**
   * Check if extension has required permission
   */
  private checkPermission(permission: keyof ExtensionPermissions): void {
    if (!this.context.permissions[permission]) {
      throw new Error(`Extension does not have permission: ${permission}`)
    }
  }
}

/**
 * API Client for making requests to the Lovable platform
 */
class ExtensionAPIClient {
  private baseUrl: string
  private context: ExtensionContext

  constructor(context: ExtensionContext) {
    this.context = context
    this.baseUrl = '/api/extensions'
  }

  async get(endpoint: string, params?: Record<string, any>): Promise<any> {
    const url = new URL(endpoint, this.baseUrl)
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          url.searchParams.append(key, String(value))
        }
      })
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: this.getHeaders()
    })

    return this.handleResponse(response)
  }

  async post(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'POST',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    return this.handleResponse(response)
  }

  async put(endpoint: string, data: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: {
        ...this.getHeaders(),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })

    return this.handleResponse(response)
  }

  async delete(endpoint: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    })

    return this.handleResponse(response)
  }

  private getHeaders(): Record<string, string> {
    return {
      'X-Extension-ID': this.context.extensionId,
      'X-User-ID': this.context.userId,
      'Authorization': `Bearer ${this.getAuthToken()}`
    }
  }

  private getAuthToken(): string {
    // In a real implementation, this would get the auth token from the platform
    return 'extension-auth-token'
  }

  private async handleResponse(response: Response): Promise<any> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }))
      throw new Error(`API Error: ${error.message}`)
    }

    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      return response.json()
    }

    return response.text()
  }
}

/**
 * Event Bus for handling extension events
 */
class ExtensionEventBus {
  private events: Map<string, Array<(data: any) => void>> = new Map()

  on(event: string, callback: (data: any) => void): void {
    if (!this.events.has(event)) {
      this.events.set(event, [])
    }
    this.events.get(event)!.push(callback)
  }

  emit(event: string, data: any): void {
    const callbacks = this.events.get(event)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in event callback for ${event}:`, error)
        }
      })
    }
  }

  off(event: string, callback: (data: any) => void): void {
    const callbacks = this.events.get(event)
    if (callbacks) {
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }
}

/**
 * Extension lifecycle hooks
 */
export interface ExtensionLifecycle {
  onInstall?(): Promise<void>
  onUninstall?(): Promise<void>
  onActivate?(): Promise<void>
  onDeactivate?(): Promise<void>
  onUpdate?(oldVersion: string, newVersion: string): Promise<void>
}

/**
 * Create a new extension instance
 */
export function createExtension(
  config: ExtensionConfig,
  lifecycle: ExtensionLifecycle = {}
): {
  config: ExtensionConfig
  lifecycle: ExtensionLifecycle
  sdk?: LovableExtensionsSDK
} {
  return {
    config,
    lifecycle,
    // SDK will be injected by the platform when the extension is loaded
    sdk: undefined
  }
}

/**
 * Extension development utilities
 */
export const ExtensionDev = {
  /**
   * Validate extension configuration
   */
  validateConfig: (config: ExtensionConfig): string[] => {
    const errors: string[] = []

    if (!config.name || config.name.length < 3) {
      errors.push('Extension name must be at least 3 characters')
    }

    if (!config.display_name || config.display_name.length < 5) {
      errors.push('Display name must be at least 5 characters')
    }

    if (!config.description || config.description.length < 20) {
      errors.push('Description must be at least 20 characters')
    }

    if (!config.version || !/^\d+\.\d+\.\d+$/.test(config.version)) {
      errors.push('Version must follow semver format (x.y.z)')
    }

    return errors
  },

  /**
   * Mock SDK for development/testing
   */
  createMockSDK: (context: Partial<ExtensionContext> = {}): LovableExtensionsSDK => {
    const mockContext: ExtensionContext = {
      userId: 'dev-user-123',
      extensionId: 'dev-extension-123',
      config: {},
      permissions: {
        read_products: true,
        write_products: true,
        ai_processing: true,
        ...context.permissions
      },
      ...context
    }

    return new LovableExtensionsSDK(mockContext)
  }
}

// All types are already exported above in their interface declarations