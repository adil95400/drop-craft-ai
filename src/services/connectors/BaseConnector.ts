import { SupplierCredentials, SupplierProduct } from '@/types/suppliers';

export interface FetchOptions {
  limit?: number;
  category?: string;
  lastSync?: Date;
  page?: number;
}

export interface SyncResult {
  total: number;
  imported: number;
  duplicates: number;
  errors: string[];
}

export abstract class BaseConnector {
  protected credentials: SupplierCredentials;
  protected baseURL: string;
  protected rateLimitDelay: number = 1000; // 1 second between requests

  constructor(credentials: SupplierCredentials, baseURL: string) {
    this.credentials = credentials;
    this.baseURL = baseURL;
  }

  // Abstract methods that each connector must implement
  abstract validateCredentials(): Promise<boolean>;
  abstract fetchProducts(options?: FetchOptions): Promise<SupplierProduct[]>;
  abstract fetchProduct(sku: string): Promise<SupplierProduct | null>;
  abstract updateInventory(products: SupplierProduct[]): Promise<SyncResult>;

  // Common helper methods
  protected async makeRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'SupplierHub/1.0',
    };

    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...this.getAuthHeaders(),
        ...options.headers,
      },
    });

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  protected abstract getAuthHeaders(): Record<string, string>;

  // Common data transformation methods
  protected normalizeProduct(rawProduct: any): SupplierProduct {
    return {
      id: rawProduct.id || rawProduct.sku,
      sku: rawProduct.sku || rawProduct.id,
      title: rawProduct.title || rawProduct.name,
      description: rawProduct.description || '',
      price: parseFloat(rawProduct.price) || 0,
      costPrice: parseFloat(rawProduct.cost_price || rawProduct.wholesale_price) || undefined,
      currency: rawProduct.currency || 'EUR',
      stock: parseInt(rawProduct.stock) || 0,
      images: Array.isArray(rawProduct.images) 
        ? rawProduct.images 
        : rawProduct.image_url 
          ? [rawProduct.image_url] 
          : [],
      category: rawProduct.category || 'Uncategorized',
      brand: rawProduct.brand || '',
      weight: parseFloat(rawProduct.weight) || undefined,
      dimensions: rawProduct.dimensions || undefined,
      variants: rawProduct.variants || [],
      attributes: rawProduct.attributes || {},
      supplier: {
        id: rawProduct.supplier_id || this.credentials.supplierId || '',
        name: rawProduct.supplier_name || this.getSupplierName(),
        sku: rawProduct.supplier_sku || rawProduct.sku,
      },
    };
  }

  protected abstract getSupplierName(): string;

  // Error handling
  protected handleError(error: any, context: string): void {
    console.error(`${this.getSupplierName()} ${context}:`, error);
    throw new Error(`${this.getSupplierName()} API Error: ${error.message}`);
  }
}