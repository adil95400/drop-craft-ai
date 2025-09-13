import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class WishConnector extends BaseConnector {
  constructor(credentials: any) {
    super(credentials, 'https://merchant.wish.com');
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  protected getSupplierName(): string {
    return 'Wish Merchant';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/v2/product');
      return !!response;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const response = await this.makeRequest('/api/v2/product');
      
      const items = response.data || [];
      return items.map((item: any) => this.normalizeWishProduct(item));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/api/v2/product/${sku}`);
      
      if (!response.data) return null;
      
      return this.normalizeWishProduct(response.data);
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

    for (const product of products) {
      try {
        await this.makeRequest(`/api/v2/variant/update-inventory`, {
          method: 'POST',
          body: JSON.stringify({
            id: product.id,
            inventory: product.stock
          })
        });
        result.imported++;
      } catch (error) {
        result.errors.push(`Failed to update ${product.sku}: ${error}`);
      }
    }

    return result;
  }

  private normalizeWishProduct(wishProduct: any): SupplierProduct {
    return {
      id: wishProduct.id || wishProduct.parent_sku,
      sku: wishProduct.parent_sku || wishProduct.id,
      title: wishProduct.name || 'Produit Wish',
      description: wishProduct.description || '',
      price: parseFloat(wishProduct.msrp) || 0,
      costPrice: parseFloat(wishProduct.price) || undefined,
      currency: 'USD',
      stock: parseInt(wishProduct.inventory) || 0,
      images: wishProduct.main_image ? [wishProduct.main_image] : [],
      category: wishProduct.tags?.[0] || 'General',
      brand: wishProduct.brand || '',
      supplier: {
        id: 'wish',
        name: 'Wish Merchant',
        sku: wishProduct.parent_sku || wishProduct.id
      },
      attributes: {
        wishId: wishProduct.id,
        msrp: wishProduct.msrp,
        tags: wishProduct.tags,
        shipping: wishProduct.shipping
      }
    };
  }
}