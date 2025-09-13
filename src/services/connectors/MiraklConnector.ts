import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class MiraklConnector extends BaseConnector {
  constructor(credentials: any) {
    super(credentials, credentials.api_url || 'https://your-mirakl-instance.mirakl.net');
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': this.credentials.api_key,
      'Content-Type': 'application/json',
    };
  }

  protected getSupplierName(): string {
    return 'Mirakl Marketplace';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/api/offers');
      return !!response;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const response = await this.makeRequest('/api/offers');
      
      const items = response.offers || [];
      return items.map((item: any) => this.normalizeMiraklProduct(item));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/api/offers?product_sku=${sku}`);
      
      if (!response.offers || response.offers.length === 0) return null;
      
      return this.normalizeMiraklProduct(response.offers[0]);
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

    const offers = products.map(product => ({
      product_sku: product.sku,
      quantity: product.stock,
      price: product.price,
      currency_iso_code: product.currency
    }));

    try {
      await this.makeRequest('/api/offers', {
        method: 'PUT',
        body: JSON.stringify({ offers })
      });
      result.imported = products.length;
    } catch (error) {
      result.errors.push(`Failed to update offers: ${error}`);
    }

    return result;
  }

  private normalizeMiraklProduct(miraklProduct: any): SupplierProduct {
    return {
      id: miraklProduct.offer_id || miraklProduct.product_sku,
      sku: miraklProduct.product_sku,
      title: miraklProduct.product_title || 'Produit Mirakl',
      description: miraklProduct.description || '',
      price: parseFloat(miraklProduct.price) || 0,
      costPrice: undefined,
      currency: miraklProduct.currency_iso_code || 'EUR',
      stock: parseInt(miraklProduct.quantity) || 0,
      images: miraklProduct.product_images || [],
      category: miraklProduct.category_code || 'General',
      brand: miraklProduct.brand || '',
      supplier: {
        id: 'mirakl',
        name: 'Mirakl Marketplace',
        sku: miraklProduct.product_sku
      },
      attributes: {
        offerId: miraklProduct.offer_id,
        categoryCode: miraklProduct.category_code,
        leadtimeToShip: miraklProduct.leadtime_to_ship
      }
    };
  }
}