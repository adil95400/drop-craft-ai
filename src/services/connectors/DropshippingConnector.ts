import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class DropshippingConnector extends BaseConnector {
  constructor(credentials: any) {
    super(credentials, credentials.api_url || 'https://api.dropshipping-provider.com');
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.access_token}`,
      'X-API-Key': this.credentials.api_key,
      'Content-Type': 'application/json',
    };
  }

  protected getSupplierName(): string {
    return this.credentials.provider_name || 'Dropshipping Provider';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/v1/account/info');
      return !!response.account_id;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const params = new URLSearchParams({
        page: (options.page || 1).toString(),
        limit: (options.limit || 50).toString(),
        ...(options.category && { category: options.category }),
        ...(options.lastSync && { updated_since: options.lastSync.toISOString() })
      });

      const response = await this.makeRequest(`/api/v1/products?${params}`);
      
      const items = response.products || [];
      return items.map((item: any) => this.normalizeDropshippingProduct(item));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/api/v1/products/${sku}`);
      
      if (!response.product) return null;
      
      return this.normalizeDropshippingProduct(response.product);
    } catch (error) {
      this.handleError(error, 'single product fetching');
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<SyncResult> {
    const result: SyncResult = {
      total: products.length,
      imported: 0,
      duplicates: 0,
      errors: []
    };

    // Dropshipping inventory is managed by the supplier
    // We can only sync pricing and availability status
    for (const product of products) {
      try {
        await this.makeRequest(`/api/v1/products/${product.id}/sync`, {
          method: 'POST',
          body: JSON.stringify({
            price: product.price,
            availability: product.stock > 0
          })
        });
        result.imported++;
      } catch (error) {
        result.errors.push(`Failed to sync ${product.sku}: ${error}`);
      }
    }

    return result;
  }

  private normalizeDropshippingProduct(dropProduct: any): SupplierProduct {
    return {
      id: dropProduct.id || dropProduct.sku,
      sku: dropProduct.sku || dropProduct.id,
      title: dropProduct.name || 'Produit Dropshipping',
      description: dropProduct.description || '',
      price: parseFloat(dropProduct.retail_price) || 0,
      costPrice: parseFloat(dropProduct.wholesale_price) || undefined,
      currency: dropProduct.currency || 'USD',
      stock: parseInt(dropProduct.stock_quantity) || 0,
      images: dropProduct.images || [dropProduct.main_image].filter(Boolean),
      category: dropProduct.category_name || 'General',
      brand: dropProduct.brand || '',
      supplier: {
        id: 'dropshipping',
        name: this.getSupplierName(),
        sku: dropProduct.supplier_sku || dropProduct.sku
      },
      attributes: {
        supplierId: dropProduct.supplier_id,
        supplierSku: dropProduct.supplier_sku,
        shippingTime: dropProduct.shipping_time,
        shippingCost: dropProduct.shipping_cost,
        minimumOrderQuantity: dropProduct.min_order_qty,
        countryOfOrigin: dropProduct.country_of_origin,
        weight: dropProduct.weight,
        dimensions: dropProduct.dimensions
      }
    };
  }
}