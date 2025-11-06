import { BaseConnector, SupplierProduct, SupplierCredentials, SyncResult, FetchOptions } from './BaseConnector';

export class EtsyConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    super(credentials, 'https://openapi.etsy.com/v3/application');
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'x-api-key': this.credentials.apiKey || '',
      'Authorization': `Bearer ${this.credentials.accessToken || ''}`,
    };
  }

  protected getSupplierName(): string {
    return 'Etsy';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.makeRequest(`/shops/${this.credentials.shop_id}`);
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

      const response = await this.makeRequest(
        `/shops/${this.credentials.shop_id}/listings/active?${params}`
      );
      
      return response.results?.map((listing: any) => this.normalizeEtsyProduct(listing)) || [];
    } catch (error) {
      this.handleError(error, 'Fetch products');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const listing = await this.makeRequest(`/listings/${sku}`);
      return this.normalizeEtsyProduct(listing);
    } catch (error) {
      this.handleError(error, 'Fetch product');
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<SyncResult> {
    const result: SyncResult = { total: products.length, imported: 0, duplicates: 0, errors: [] };

    for (const product of products) {
      try {
        await this.makeRequest(`/listings/${product.id}/inventory`, {
          method: 'PUT',
          body: JSON.stringify({
            products: [{
              sku: product.sku,
              offerings: [{
                quantity: product.stock,
              }],
            }],
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

  private normalizeEtsyProduct(listing: any): SupplierProduct {
    return {
      id: String(listing.listing_id),
      sku: String(listing.listing_id),
      title: listing.title,
      description: listing.description || '',
      price: parseFloat(listing.price?.amount || 0),
      currency: listing.price?.currency_code || 'USD',
      stock: listing.quantity || 0,
      images: listing.images?.map((img: any) => img.url_fullxfull) || [],
      category: listing.taxonomy_path?.[0] || 'General',
      brand: listing.shop_name || '',
      attributes: {
        tags: listing.tags || [],
        materials: listing.materials || [],
      },
      supplier: {
        id: 'etsy',
        name: 'Etsy',
        sku: String(listing.listing_id),
      },
    };
  }
}
