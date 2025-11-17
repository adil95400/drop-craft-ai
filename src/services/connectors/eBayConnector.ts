import { BaseConnector, SupplierProduct, SupplierCredentials, SyncResult, FetchOptions } from './BaseConnector';

export class EBayConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    const sandbox = credentials.sandbox ? '-sandbox' : '';
    super(credentials, `https://api${sandbox}.ebay.com`);
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.accessToken || ''}`,
      'Content-Type': 'application/json',
      'X-EBAY-C-MARKETPLACE-ID': this.credentials.marketplace_id || 'EBAY_US',
    };
  }

  protected getSupplierName(): string {
    return 'eBay Trading API';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.makeRequest('/sell/inventory/v1/inventory_item?limit=1');
      return true;
    } catch (error) {
      this.handleError(error, 'Credential validation');
      return false;
    }
  }

  async fetchProducts(options?: FetchOptions): Promise<SupplierProduct[]> {
    try {
      const params = new URLSearchParams({
        limit: String(options?.limit || 50),
        offset: String((options?.page || 0) * (options?.limit || 50)),
      });

      const response = await this.makeRequest(`/sell/inventory/v1/inventory_item?${params}`);
      return response.inventoryItems?.map((item: any) => this.normalizeEBayProduct(item)) || [];
    } catch (error) {
      this.handleError(error, 'Fetch products');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/sell/inventory/v1/inventory_item/${sku}`);
      return this.normalizeEBayProduct(response);
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
        await this.makeRequest(`/sell/inventory/v1/inventory_item/${product.sku}`, {
          method: 'PUT',
          body: JSON.stringify({
            availability: {
              shipToLocationAvailability: {
                quantity: quantity
              }
            }
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
        offset: String((options?.page || 0) * (options?.limit || 50)),
      });

      const response = await this.makeRequest(`/sell/fulfillment/v1/order?${params}`);
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
        await this.makeRequest(`/sell/inventory/v1/offer`, {
          method: 'POST',
          body: JSON.stringify({
            sku: product.sku,
            pricingSummary: {
              price: {
                value: product.price,
                currency: 'USD'
              }
            }
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

  async createOrder(): Promise<string> {
    throw new Error('eBay does not support direct order creation via API');
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      await this.makeRequest(`/sell/fulfillment/v1/order/${orderId}/shipping_fulfillment`, {
        method: 'POST',
        body: JSON.stringify({ lineItems: [] }),
      });
      return true;
    } catch (error) {
      this.handleError(error, 'Update order status');
      return false;
    }
  }

  private normalizeEBayProduct(ebayProduct: any): SupplierProduct {
    const product = ebayProduct.product || {};
    const availability = ebayProduct.availability?.shipToLocationAvailability || {};
    
    return {
      id: ebayProduct.sku,
      sku: ebayProduct.sku,
      title: product.title || 'Produit eBay',
      description: product.description || '',
      price: parseFloat(ebayProduct.pricingSummary?.price?.value) || 0,
      costPrice: undefined,
      currency: ebayProduct.pricingSummary?.price?.currency || 'USD',
      stock: parseInt(availability.quantity) || 0,
      images: product.imageUrls || [],
      category: product.aspects?.Category?.[0] || 'General',
      brand: product.aspects?.Brand?.[0] || '',
      supplier: {
        id: 'ebay',
        name: 'eBay Trading API',
        sku: ebayProduct.sku
      },
      attributes: {
        condition: ebayProduct.condition,
        aspects: product.aspects,
        ean: product.ean
      }
    };
  }
}