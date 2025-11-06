import { SupplierCredentials, SupplierProduct } from '@/types/suppliers';

export type { SupplierCredentials, SupplierProduct } from '@/types/suppliers';

export interface FetchOptions {
  page?: number;
  limit?: number;
  category?: string;
  lastSync?: Date;
}

export interface SyncResult {
  total: number;
  imported: number;
  updated?: number;
  duplicates: number;
  errors: string[];
}

export interface ConnectorOrder {
  external_id: string;
  order_number: string;
  status: string;
  total_amount: number;
  currency: string;
  customer_name: string;
  customer_email: string;
  line_items: any[];
}

export abstract class BaseConnector {
  protected credentials: SupplierCredentials;
  protected baseUrl: string;
  protected rateLimitDelay: number = 500;
  protected config: any;

  constructor(credentials: SupplierCredentials, baseUrl: string) {
    this.credentials = credentials;
    this.baseUrl = baseUrl;
    this.config = {};
  }

  protected abstract getAuthHeaders(): Record<string, string>;
  protected abstract getSupplierName(): string;
  abstract validateCredentials(): Promise<boolean>;
  abstract fetchProducts(options?: FetchOptions): Promise<SupplierProduct[]>;
  abstract fetchProduct(sku: string): Promise<SupplierProduct | null>;
  abstract updateInventory(products: any[]): Promise<SyncResult>;
  
  // Optional methods with default implementations
  async fetchOrders(options?: any): Promise<ConnectorOrder[]> {
    console.warn(`fetchOrders not implemented for ${this.getSupplierName()}`);
    return [];
  }
  
  async updatePrices(products: { sku: string; price: number }[]): Promise<SyncResult> {
    console.warn(`updatePrices not implemented for ${this.getSupplierName()}`);
    return { total: products.length, imported: 0, updated: 0, duplicates: 0, errors: ['Not implemented'] };
  }
  
  async createOrder(order: any): Promise<string> {
    throw new Error(`createOrder not supported by ${this.getSupplierName()}`);
  }
  
  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    console.warn(`updateOrderStatus not implemented for ${this.getSupplierName()}`);
    return false;
  }

  protected async makeRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  protected normalizeProduct(rawProduct: any): Partial<SupplierProduct> {
    return {
      id: rawProduct.id || rawProduct.sku || rawProduct.external_id,
      sku: rawProduct.sku || rawProduct.id,
      title: rawProduct.name || rawProduct.title,
      description: rawProduct.description || '',
      price: parseFloat(rawProduct.price) || 0,
      costPrice: parseFloat(rawProduct.cost_price || rawProduct.wholesale_price) || undefined,
      currency: rawProduct.currency || 'EUR',
      stock: parseInt(rawProduct.stock || rawProduct.quantity) || 0,
      images: Array.isArray(rawProduct.images) ? rawProduct.images : [rawProduct.image].filter(Boolean),
      category: rawProduct.category || 'General',
      brand: rawProduct.brand || '',
      attributes: rawProduct.attributes || {},
    };
  }

  protected handleError(error: any, context: string): void {
    console.error(`${this.getSupplierName()} ${context} error:`, error);
  }

  protected async delay(ms: number = this.rateLimitDelay): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}