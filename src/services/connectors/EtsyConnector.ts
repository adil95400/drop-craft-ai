import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class EtsyConnector extends BaseConnector {
  constructor(credentials: any) {
    super(credentials, 'https://openapi.etsy.com/v3/application');
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.access_token}`,
      'x-api-key': this.credentials.api_key,
    };
  }

  protected getSupplierName(): string {
    return 'Etsy';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/shops/me');
      return !!response.shop_id;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const limit = Math.min(options.limit || 50, 100);
      const offset = ((options.page || 1) - 1) * limit;
      
      const shopResponse = await this.makeRequest('/shops/me');
      const shopId = shopResponse.shop_id;
      
      const response = await this.makeRequest(`/shops/${shopId}/listings/active?limit=${limit}&offset=${offset}`);
      
      return response.results.map((listing: any) => this.normalizeEtsyProduct(listing));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const shopResponse = await this.makeRequest('/shops/me');
      const shopId = shopResponse.shop_id;
      
      const response = await this.makeRequest(`/shops/${shopId}/listings/active`);
      const listing = response.results.find((l: any) => l.sku === sku || l.listing_id.toString() === sku);
      
      if (!listing) return null;
      
      return this.normalizeEtsyProduct(listing);
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
        await this.delay();
        
        const existingProduct = await this.fetchProduct(product.sku);
        
        if (existingProduct) {
          result.duplicates++;
          continue;
        }

        await this.createEtsyListing(product);
        result.imported++;
      } catch (error: any) {
        result.errors.push(`Erreur pour ${product.sku}: ${error.message}`);
      }
    }

    return result;
  }

  private normalizeEtsyProduct(listing: any): SupplierProduct {
    return {
      id: listing.listing_id.toString(),
      sku: listing.sku || listing.listing_id.toString(),
      title: listing.title,
      description: listing.description || '',
      price: parseFloat(listing.price.amount) || 0,
      costPrice: undefined,
      currency: listing.price.currency_code || 'USD',
      stock: listing.quantity || 0,
      images: listing.images?.map((img: any) => img.url_570xN) || [],
      category: listing.taxonomy_path?.[0] || 'Handmade',
      brand: listing.shop_name || '',
      supplier: {
        id: 'etsy',
        name: 'Etsy',
        sku: listing.sku || listing.listing_id.toString()
      },
      attributes: {
        tags: listing.tags || [],
        materials: listing.materials || [],
        state: listing.state,
        style: listing.style || []
      }
    };
  }

  private async createEtsyListing(product: SupplierProduct): Promise<void> {
    const listing = {
      quantity: product.stock,
      title: product.title,
      description: product.description,
      price: product.price,
      who_made: 'i_did',
      when_made: '2020_2023',
      taxonomy_id: 1, // Default category
      shipping_template_id: null,
      materials: product.attributes?.materials || [],
      tags: product.attributes?.tags?.slice(0, 13) || [] // Etsy allows max 13 tags
    };

    await this.makeRequest('/shops/me/listings', {
      method: 'POST',
      body: JSON.stringify(listing)
    });
  }
}