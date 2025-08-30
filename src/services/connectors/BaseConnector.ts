import { SupplierProduct, SupplierCredentials, ImportJob } from '@/types/suppliers';

export abstract class BaseConnector {
  protected credentials: SupplierCredentials;
  protected rateLimitDelay: number = 1000; // ms between requests
  protected maxRetries: number = 3;

  constructor(credentials: SupplierCredentials) {
    this.credentials = credentials;
  }

  // Authentication
  abstract validateCredentials(): Promise<boolean>;
  abstract refreshCredentials?(): Promise<SupplierCredentials>;

  // Products
  abstract fetchProducts(options?: {
    page?: number;
    limit?: number;
    lastSync?: Date;
    category?: string;
  }): Promise<SupplierProduct[]>;

  abstract fetchProduct(sku: string): Promise<SupplierProduct | null>;

  // Inventory
  abstract updateInventory?(products: Array<{sku: string, stock: number}>): Promise<boolean>;
  abstract fetchInventory?(skus: string[]): Promise<Array<{sku: string, stock: number}>>;

  // Orders
  abstract createOrder?(order: any): Promise<string>; // returns order ID
  abstract getOrderStatus?(orderId: string): Promise<string>;

  // Webhooks
  abstract setupWebhooks?(webhookUrl: string): Promise<boolean>;

  // Rate limiting helper
  protected async rateLimit(): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));
  }

  // Retry mechanism
  protected async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = this.maxRetries
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          await this.rateLimit();
        }
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt === maxRetries) {
          throw lastError;
        }
        console.warn(`Attempt ${attempt + 1} failed:`, error);
      }
    }
    
    throw lastError!;
  }

  // Generic HTTP helper with rate limiting
  protected async makeRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    await this.rateLimit();
    
    return this.retry(async () => {
      const response = await fetch(url, {
        ...options,
        headers: {
          'User-Agent': 'DropshipPlatform/1.0',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    });
  }

  // Transform product data from supplier format to our format
  protected abstract transformProduct(rawProduct: any): SupplierProduct;

  // Validate product data
  protected validateProduct(product: SupplierProduct): boolean {
    return !!(
      product.id &&
      product.sku &&
      product.title &&
      product.price > 0 &&
      product.currency
    );
  }
}