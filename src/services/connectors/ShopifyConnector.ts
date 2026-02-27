import { BaseConnector, SupplierProduct, SupplierCredentials, SyncResult, FetchOptions } from './BaseConnector';
import { logger } from '@/utils/logger';

export class ShopifyConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    const shopDomain = credentials.endpoint || credentials.shop_domain;
    super(credentials, `https://${shopDomain}/admin/api/2024-01`);
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'X-Shopify-Access-Token': this.credentials.accessToken || '',
    };
  }

  protected getSupplierName(): string {
    return 'Shopify';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.makeRequest('/shop.json');
      return true;
    } catch (error) {
      this.handleError(error, 'Credential validation');
      return false;
    }
  }

  async fetchProducts(options?: FetchOptions): Promise<SupplierProduct[]> {
    try {
      let allProducts: any[] = [];
      let nextPageInfo: string | null = null;
      let hasNextPage = true;
      const limit = options?.limit || 250; // Use 250 as max per page

      logger.info('Starting Shopify product fetch with pagination', { component: 'ShopifyConnector' });

      // Paginate through all products
      while (hasNextPage) {
        const url = `/products.json?limit=${limit}${nextPageInfo ? `&page_info=${nextPageInfo}` : ''}`;
        const response = await this.makeRequest(url);
        
        const products = response.products || [];
        allProducts = allProducts.concat(products);
        
        logger.debug(`Fetched ${products.length} products, total: ${allProducts.length}`, { component: 'ShopifyConnector' });

        // Check for next page using Link header
        const linkHeader = response.headers?.get?.('Link');
        if (linkHeader && linkHeader.includes('rel="next"')) {
          const nextMatch = linkHeader.match(/<[^>]*[?&]page_info=([^&>]*).*?>;\s*rel="next"/);
          nextPageInfo = nextMatch ? nextMatch[1] : null;
          hasNextPage = !!nextPageInfo;
        } else {
          hasNextPage = false;
        }
        
        // Respect rate limits
        if (hasNextPage) {
          await this.delay();
        }
      }

      logger.info(`Completed fetching ${allProducts.length} products from Shopify`, { component: 'ShopifyConnector' });
      return allProducts.map((product: any) => this.normalizeShopifyProduct(product));
    } catch (error) {
      this.handleError(error, 'Fetch products');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/products.json?handle=${sku}`);
      if (response.products.length > 0) {
        return this.normalizeShopifyProduct(response.products[0]);
      }
      return null;
    } catch (error) {
      this.handleError(error, 'Fetch product');
      return null;
    }
  }

  async updateInventory(products: any[]): Promise<SyncResult> {
    const result: SyncResult = { total: products.length, imported: 0, duplicates: 0, errors: [] };

    for (const product of products) {
      try {
        const quantity = product.quantity || product.stock;
        await this.makeRequest(`/inventory_levels/set.json`, {
          method: 'POST',
          body: JSON.stringify({
            inventory_item_id: product.id || product.sku,
            available: quantity,
          }),
        });
        result.imported++;
      } catch (error: any) {
        result.errors.push(`${product.sku}: ${error.message}`);
      }
      await this.delay();
    }

    return result;
  }

  async fetchOrders(options?: any): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        limit: String(options?.limit || 50),
        status: options?.status || 'any',
      });

      const response = await this.makeRequest(`/orders.json?${params}`);
      return response.orders || [];
    } catch (error) {
      this.handleError(error, 'Fetch orders');
      return [];
    }
  }

  async updatePrices(products: { sku: string; price: number }[]): Promise<SyncResult> {
    const result: SyncResult = { total: products.length, imported: 0, duplicates: 0, errors: [] };

    for (const product of products) {
      try {
        await this.makeRequest(`/variants/${product.sku}.json`, {
          method: 'PUT',
          body: JSON.stringify({
            variant: { price: product.price },
          }),
        });
        result.imported++;
      } catch (error: any) {
        result.errors.push(`${product.sku}: ${error.message}`);
      }
      await this.delay();
    }

    return result;
  }

  async createOrder(order: any): Promise<string> {
    try {
      const response = await this.makeRequest('/orders.json', {
        method: 'POST',
        body: JSON.stringify({ order }),
      });
      return response.order.id;
    } catch (error) {
      this.handleError(error, 'Create order');
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      await this.makeRequest(`/orders/${orderId}.json`, {
        method: 'PUT',
        body: JSON.stringify({
          order: { status },
        }),
      });
      return true;
    } catch (error) {
      this.handleError(error, 'Update order status');
      return false;
    }
  }

  // Override makeRequest to include headers for pagination
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

    const data = await response.json();
    
    // Return data with headers attached for pagination support
    return {
      ...data,
      headers: response.headers
    };
  }

  private normalizeShopifyProduct(product: any): SupplierProduct {
    return {
      id: String(product.id),
      sku: product.variants[0]?.sku || product.handle,
      title: product.title,
      description: product.body_html || '',
      price: parseFloat(product.variants[0]?.price || 0),
      costPrice: parseFloat(product.variants[0]?.compare_at_price || 0) || undefined,
      currency: 'USD',
      stock: product.variants[0]?.inventory_quantity || 0,
      images: product.images?.map((img: any) => img.src) || [],
      category: product.product_type || 'General',
      brand: product.vendor || '',
      attributes: {
        tags: product.tags?.split(',') || [],
        handle: product.handle,
      },
      supplier: {
        id: 'shopify',
        name: 'Shopify',
        sku: product.handle,
      },
    };
  }
}
