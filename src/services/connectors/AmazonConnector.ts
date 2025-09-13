import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class AmazonConnector extends BaseConnector {
  constructor(credentials: any) {
    super(credentials, 'https://sellingpartnerapi-na.amazon.com');
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.access_token}`,
      'x-amz-access-token': this.credentials.access_token,
    };
  }

  protected getSupplierName(): string {
    return 'Amazon Seller Central';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/sellers/v1/marketplaceParticipations');
      return !!response.payload;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const marketplaceId = 'ATVPDKIKX0DER'; // US marketplace
      const response = await this.makeRequest(`/catalog/v0/items?MarketplaceId=${marketplaceId}`);
      
      const items = response.payload?.Items || [];
      return items.map((item: any) => this.normalizeAmazonProduct(item));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const marketplaceId = 'ATVPDKIKX0DER';
      const response = await this.makeRequest(`/catalog/v0/items/${sku}?MarketplaceId=${marketplaceId}`);
      
      if (!response.payload) return null;
      
      return this.normalizeAmazonProduct(response.payload);
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
      errors: ['Amazon Seller Central requires complex listing process - use Amazon console']
    };

    // Amazon API is complex and requires multiple steps
    // This is a simplified placeholder
    return result;
  }

  private normalizeAmazonProduct(amazonProduct: any): SupplierProduct {
    const attributes = amazonProduct.AttributeSets?.[0] || {};
    
    return {
      id: amazonProduct.Identifiers?.MarketplaceASIN?.ASIN || '',
      sku: amazonProduct.Identifiers?.SKUIdentifier?.SellerSKU || '',
      title: attributes.Title || 'Produit Amazon',
      description: attributes.Feature?.join(' ') || '',
      price: parseFloat(attributes.ListPrice?.Amount) || 0,
      costPrice: undefined,
      currency: attributes.ListPrice?.CurrencyCode || 'USD',
      stock: 0, // Requires separate inventory API
      images: attributes.SmallImage ? [attributes.SmallImage.URL] : [],
      category: attributes.ProductGroup || 'General',
      brand: attributes.Brand || '',
      supplier: {
        id: 'amazon',
        name: 'Amazon Seller Central',
        sku: amazonProduct.Identifiers?.SKUIdentifier?.SellerSKU || ''
      },
      attributes: {
        asin: amazonProduct.Identifiers?.MarketplaceASIN?.ASIN,
        productGroup: attributes.ProductGroup,
        packageDimensions: attributes.PackageDimensions,
        itemDimensions: attributes.ItemDimensions
      }
    };
  }
}