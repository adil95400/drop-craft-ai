import { BaseConnector, SupplierProduct, SupplierCredentials, SyncResult, FetchOptions } from './BaseConnector';

export class WooCommerceConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    const siteUrl = credentials.endpoint || credentials.site_url;
    super(credentials, `${siteUrl}/wp-json/wc/v3`);
  }

  protected getAuthHeaders(): Record<string, string> {
    const auth = btoa(`${this.credentials.apiKey}:${this.credentials.apiSecret}`);
    return {
      'Authorization': `Basic ${auth}`,
    };
  }

  protected getSupplierName(): string {
    return 'WooCommerce';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.makeRequest('/products?per_page=1');
      return true;
    } catch (error) {
      this.handleError(error, 'Credential validation');
      return false;
    }
  }

  async fetchProducts(options?: FetchOptions): Promise<SupplierProduct[]> {
    try {
      const params = new URLSearchParams({
        per_page: String(options?.limit || 50),
        page: String(options?.page || 1),
      });

      const products = await this.makeRequest(`/products?${params}`);
      return products.map((product: any) => this.normalizeWooProduct(product));
    } catch (error) {
      this.handleError(error, 'Fetch products');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const products = await this.makeRequest(`/products?sku=${sku}`);
      if (products.length > 0) {
        return this.normalizeWooProduct(products[0]);
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
        await this.makeRequest(`/products/${product.id || product.sku}`, {
          method: 'PUT',
          body: JSON.stringify({
            stock_quantity: quantity,
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
        per_page: String(options?.limit || 50),
        page: String(options?.page || 1),
        status: options?.status || 'any',
      });

      const orders = await this.makeRequest(`/orders?${params}`);
      return orders || [];
    } catch (error) {
      this.handleError(error, 'Fetch orders');
      return [];
    }
  }

  async updatePrices(products: { sku: string; price: number }[]): Promise<SyncResult> {
    const result: SyncResult = { total: products.length, imported: 0, duplicates: 0, errors: [] };

    for (const product of products) {
      try {
        await this.makeRequest(`/products/${product.sku}`, {
          method: 'PUT',
          body: JSON.stringify({
            regular_price: String(product.price),
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
      const response = await this.makeRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(order),
      });
      return response.id;
    } catch (error) {
      this.handleError(error, 'Create order');
      throw error;
    }
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      await this.makeRequest(`/orders/${orderId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      return true;
    } catch (error) {
      this.handleError(error, 'Update order status');
      return false;
    }
  }

  private normalizeWooProduct(product: any): SupplierProduct {
    return {
      id: String(product.id),
      sku: product.sku,
      title: product.name,
      description: product.description || '',
      price: parseFloat(product.price),
      costPrice: parseFloat(product.regular_price) || undefined,
      currency: 'EUR',
      stock: product.stock_quantity || 0,
      images: product.images?.map((img: any) => img.src) || [],
      category: product.categories?.[0]?.name || 'General',
      brand: product.brands?.[0]?.name || '',
      attributes: product.attributes || {},
      supplier: {
        id: 'woocommerce',
        name: 'WooCommerce',
        sku: product.sku,
      },
    };
  }
}
