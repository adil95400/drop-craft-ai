/**
 * ShopOpti API Client
 * Routes business logic calls to FastAPI backend
 * Supabase is used only for auth, storage, and realtime
 */

import { supabase } from '@/integrations/supabase/client';

// API Configuration
const getApiBaseUrl = (): string => {
  const hostname = window.location.hostname;
  
  // Production
  if (hostname === 'shopopti.io' || hostname === 'www.shopopti.io') {
    return 'https://api.shopopti.io';
  }
  
  // Staging
  if (hostname.includes('lovable.app')) {
    return 'https://shopopti-api.fly.dev';
  }
  
  // Local development
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  job_id?: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  timeout?: number;
}

class ShopOptiApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Get authentication token from Supabase session
   */
  private async getAuthToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  /**
   * Make authenticated API request to FastAPI backend
   */
  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { method = 'GET', body, headers = {}, timeout = 30000 } = options;

    const token = await this.getAuthToken();
    if (!token) {
      return { success: false, error: 'Not authenticated' };
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}/api/v1${endpoint}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.detail || data.error || `HTTP ${response.status}`,
        };
      }

      return { success: true, data, ...data };
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          return { success: false, error: 'Request timeout' };
        }
        return { success: false, error: error.message };
      }

      return { success: false, error: 'Unknown error' };
    }
  }

  // ==========================================
  // SUPPLIER ENDPOINTS
  // ==========================================

  async connectSupplier(supplierType: string, apiKey: string, config?: Record<string, any>) {
    return this.request('/suppliers/connect', {
      method: 'POST',
      body: {
        supplier_type: supplierType,
        api_key: apiKey,
        additional_config: config,
      },
    });
  }

  async syncSupplier(supplierId: string, syncType: string = 'products', options?: {
    limit?: number;
    categoryFilter?: string;
  }) {
    return this.request('/suppliers/sync', {
      method: 'POST',
      body: {
        supplier_id: supplierId,
        sync_type: syncType,
        limit: options?.limit,
        category_filter: options?.categoryFilter,
      },
    });
  }

  async listSuppliers() {
    return this.request('/suppliers/list');
  }

  async getSupplierStatus(supplierId: string) {
    return this.request(`/suppliers/${supplierId}/status`);
  }

  // ==========================================
  // PRODUCT ENDPOINTS
  // ==========================================

  async getProducts(params?: {
    page?: number;
    limit?: number;
    status?: string;
    categoryId?: string;
    supplierId?: string;
    search?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.status) queryParams.set('status', params.status);
    if (params?.categoryId) queryParams.set('category_id', params.categoryId);
    if (params?.supplierId) queryParams.set('supplier_id', params.supplierId);
    if (params?.search) queryParams.set('search', params.search);

    return this.request(`/products?${queryParams.toString()}`);
  }

  async createProduct(product: {
    title: string;
    description?: string;
    sku?: string;
    costPrice?: number;
    salePrice: number;
    currency?: string;
    stock?: number;
    categoryId?: string;
    supplierId?: string;
    images?: string[];
    attributes?: Record<string, any>;
  }) {
    return this.request('/products', {
      method: 'POST',
      body: {
        title: product.title,
        description: product.description,
        sku: product.sku,
        cost_price: product.costPrice,
        sale_price: product.salePrice,
        currency: product.currency || 'EUR',
        stock: product.stock || 0,
        category_id: product.categoryId,
        supplier_id: product.supplierId,
        images: product.images || [],
        attributes: product.attributes || {},
      },
    });
  }

  async updateProduct(productId: string, updates: Partial<{
    title: string;
    description: string;
    costPrice: number;
    salePrice: number;
    stock: number;
    status: string;
    images: string[];
    attributes: Record<string, any>;
  }>) {
    return this.request(`/products/${productId}`, {
      method: 'PATCH',
      body: {
        title: updates.title,
        description: updates.description,
        cost_price: updates.costPrice,
        sale_price: updates.salePrice,
        stock: updates.stock,
        status: updates.status,
        images: updates.images,
        attributes: updates.attributes,
      },
    });
  }

  async bulkUpdatePrices(productIds: string[], adjustmentType: 'percentage' | 'fixed', adjustmentValue: number) {
    return this.request('/products/bulk-price-update', {
      method: 'POST',
      body: {
        product_ids: productIds,
        adjustment_type: adjustmentType,
        adjustment_value: adjustmentValue,
      },
    });
  }

  async deleteProduct(productId: string) {
    return this.request(`/products/${productId}`, {
      method: 'DELETE',
    });
  }

  // ==========================================
  // ORDER ENDPOINTS
  // ==========================================

  async getOrders(params?: {
    page?: number;
    limit?: number;
    status?: string;
    platform?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', String(params.page));
    if (params?.limit) queryParams.set('limit', String(params.limit));
    if (params?.status) queryParams.set('status', params.status);
    if (params?.platform) queryParams.set('platform', params.platform);

    return this.request(`/orders?${queryParams.toString()}`);
  }

  async getOrder(orderId: string) {
    return this.request(`/orders/${orderId}`);
  }

  async fulfillOrder(orderId: string, supplierId?: string) {
    return this.request('/orders/fulfill', {
      method: 'POST',
      body: {
        order_id: orderId,
        supplier_id: supplierId,
        auto_select_supplier: !supplierId,
      },
    });
  }

  async bulkFulfillOrders(orderIds: string[], supplierPreference?: string) {
    return this.request('/orders/bulk-fulfill', {
      method: 'POST',
      body: {
        order_ids: orderIds,
        supplier_preference: supplierPreference,
      },
    });
  }

  async updateOrderStatus(orderId: string, status: string) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PATCH',
      body: { status },
    });
  }

  // ==========================================
  // SYNC ENDPOINTS
  // ==========================================

  async triggerSync(syncType: 'products' | 'stock' | 'orders' | 'full', options?: {
    supplierId?: string;
    platformId?: string;
    additionalOptions?: Record<string, any>;
  }) {
    return this.request('/sync/trigger', {
      method: 'POST',
      body: {
        sync_type: syncType,
        supplier_id: options?.supplierId,
        platform_id: options?.platformId,
        options: options?.additionalOptions || {},
      },
    });
  }

  async createSyncSchedule(config: {
    syncType: string;
    supplierId: string;
    frequency: 'hourly' | 'daily' | 'weekly';
    enabled?: boolean;
  }) {
    return this.request('/sync/schedule', {
      method: 'POST',
      body: {
        sync_type: config.syncType,
        supplier_id: config.supplierId,
        frequency: config.frequency,
        enabled: config.enabled ?? true,
      },
    });
  }

  async getSyncSchedules() {
    return this.request('/sync/schedules');
  }

  async deleteSyncSchedule(scheduleId: string) {
    return this.request(`/sync/schedule/${scheduleId}`, {
      method: 'DELETE',
    });
  }

  async getSyncHistory(syncType?: string, limit: number = 50) {
    const queryParams = new URLSearchParams();
    if (syncType) queryParams.set('sync_type', syncType);
    queryParams.set('limit', String(limit));

    return this.request(`/sync/history?${queryParams.toString()}`);
  }

  // ==========================================
  // SCRAPING ENDPOINTS
  // ==========================================

  async scrapeUrl(url: string, options?: {
    extractVariants?: boolean;
    extractReviews?: boolean;
    enrichWithAi?: boolean;
  }) {
    return this.request('/scraping/url', {
      method: 'POST',
      body: {
        url,
        extract_variants: options?.extractVariants ?? true,
        extract_reviews: options?.extractReviews ?? false,
        enrich_with_ai: options?.enrichWithAi ?? true,
      },
    });
  }

  async scrapeStore(storeUrl: string, options?: {
    maxProducts?: number;
    categoryFilter?: string;
  }) {
    return this.request('/scraping/store', {
      method: 'POST',
      body: {
        store_url: storeUrl,
        max_products: options?.maxProducts ?? 100,
        category_filter: options?.categoryFilter,
      },
    });
  }

  async importFeed(feedUrl: string, feedType: 'xml' | 'csv' | 'json', mappingConfig?: Record<string, string>) {
    return this.request('/scraping/feed', {
      method: 'POST',
      body: {
        feed_url: feedUrl,
        feed_type: feedType,
        mapping_config: mappingConfig || {},
        update_existing: true,
      },
    });
  }

  // ==========================================
  // AI ENDPOINTS
  // ==========================================

  async generateContent(productId: string, contentTypes: string[], options?: {
    language?: string;
    tone?: string;
  }) {
    return this.request('/ai/generate-content', {
      method: 'POST',
      body: {
        product_id: productId,
        content_types: contentTypes,
        language: options?.language || 'fr',
        tone: options?.tone || 'professional',
      },
    });
  }

  async optimizeSeo(productIds: string[], options?: {
    targetKeywords?: string[];
    language?: string;
  }) {
    return this.request('/ai/optimize-seo', {
      method: 'POST',
      body: {
        product_ids: productIds,
        target_keywords: options?.targetKeywords,
        language: options?.language || 'fr',
      },
    });
  }

  async analyzePricing(productIds: string[], options?: {
    competitorAnalysis?: boolean;
    marketPositioning?: 'budget' | 'competitive' | 'premium';
  }) {
    return this.request('/ai/analyze-pricing', {
      method: 'POST',
      body: {
        product_ids: productIds,
        competitor_analysis: options?.competitorAnalysis ?? true,
        market_positioning: options?.marketPositioning || 'competitive',
      },
    });
  }

  async bulkEnrich(filterCriteria: Record<string, any>, enrichmentTypes: string[], limit: number = 100) {
    return this.request('/ai/bulk-enrich', {
      method: 'POST',
      body: {
        filter_criteria: filterCriteria,
        enrichment_types: enrichmentTypes,
        limit,
      },
    });
  }

  async getAiUsage() {
    return this.request('/ai/usage');
  }

  // ==========================================
  // JOBS ENDPOINTS
  // ==========================================

  async getJobs(params?: {
    status?: string;
    jobType?: string;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.jobType) queryParams.set('job_type', params.jobType);
    if (params?.limit) queryParams.set('limit', String(params.limit));

    return this.request(`/jobs?${queryParams.toString()}`);
  }

  async getJob(jobId: string) {
    return this.request(`/jobs/${jobId}`);
  }

  async cancelJob(jobId: string) {
    return this.request(`/jobs/${jobId}/cancel`, {
      method: 'POST',
    });
  }

  async retryJob(jobId: string) {
    return this.request(`/jobs/${jobId}/retry`, {
      method: 'POST',
    });
  }

  async getJobStats() {
    return this.request('/jobs/stats/summary');
  }

  // ==========================================
  // HEALTH CHECK
  // ==========================================

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      return { success: response.ok, data };
    } catch (error) {
      return { success: false, error: 'API unreachable' };
    }
  }
}

// Export singleton instance
export const shopOptiApi = new ShopOptiApiClient();

// Export class for testing/custom instances
export { ShopOptiApiClient };
