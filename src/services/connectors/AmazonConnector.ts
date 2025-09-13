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

  // Amazon marketplace IDs for different regions
  private getMarketplaceIds(): Record<string, string> {
    return {
      'US': 'ATVPDKIKX0DER',
      'CA': 'A2EUQ1WTGCTBG2',
      'MX': 'A1AM78C64UM0Y8',
      'BR': 'A2Q3Y263D00KWC',
      'UK': 'A1F83G8C2ARO7P',
      'DE': 'A1PA6795UKMFR9',
      'FR': 'A13V1IB3VIYZZH',
      'IT': 'APJ6JRA9NG5V4',
      'ES': 'A1RKKUPIHCS9HS',
      'NL': 'A1805IZSGTT6HS',
      'SE': 'A2NODRKZP88ZB9',
      'PL': 'A1C3SOZRARQ6R3',
      'BE': 'AMEN7PMS3EDWL',
      'TR': 'A33AVAJ2PDY3EV',
      'AE': 'A2VIGQ35RCS4UG',
      'SA': 'A17E79C6D8DWNP',
      'IN': 'A21TJRUUN4KGV',
      'JP': 'A1VC38T7YXB528',
      'AU': 'A39IBJ37TRP1C6',
      'SG': 'A19VAU5U5O7RUS'
    };
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const marketplaces = this.getMarketplaceIds();
      const marketplace = this.credentials.marketplace || 'FR';
      const marketplaceId = marketplaces[marketplace] || marketplaces['FR'];
      
      const response = await this.makeRequest(`/catalog/v0/items?MarketplaceId=${marketplaceId}`);
      
      const items = response.payload?.Items || [];
      return items.map((item: any) => this.normalizeAmazonProduct(item, marketplace));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const marketplaces = this.getMarketplaceIds();
      const marketplace = this.credentials.marketplace || 'FR';
      const marketplaceId = marketplaces[marketplace] || marketplaces['FR'];
      
      const response = await this.makeRequest(`/catalog/v0/items/${sku}?MarketplaceId=${marketplaceId}`);
      
      if (!response.payload) return null;
      
      return this.normalizeAmazonProduct(response.payload, marketplace);
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

  private normalizeAmazonProduct(amazonProduct: any, marketplace: string = 'FR'): SupplierProduct {
    const attributes = amazonProduct.AttributeSets?.[0] || {};
    
    return {
      id: amazonProduct.Identifiers?.MarketplaceASIN?.ASIN || '',
      sku: amazonProduct.Identifiers?.SKUIdentifier?.SellerSKU || '',
      title: attributes.Title || 'Produit Amazon',
      description: attributes.Feature?.join(' ') || '',
      price: parseFloat(attributes.ListPrice?.Amount) || 0,
      costPrice: undefined,
      currency: attributes.ListPrice?.CurrencyCode || this.getMarketplaceCurrency(marketplace),
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
        itemDimensions: attributes.ItemDimensions,
        marketplace: marketplace
      }
    };
  }

  private getMarketplaceCurrency(marketplace: string): string {
    const currencies: Record<string, string> = {
      'US': 'USD', 'CA': 'CAD', 'MX': 'MXN', 'BR': 'BRL',
      'UK': 'GBP', 'DE': 'EUR', 'FR': 'EUR', 'IT': 'EUR', 
      'ES': 'EUR', 'NL': 'EUR', 'SE': 'SEK', 'PL': 'PLN',
      'BE': 'EUR', 'TR': 'TRY', 'AE': 'AED', 'SA': 'SAR',
      'IN': 'INR', 'JP': 'JPY', 'AU': 'AUD', 'SG': 'SGD'
    };
    return currencies[marketplace] || 'EUR';
  }
}