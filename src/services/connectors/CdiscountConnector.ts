import { BaseConnector, FetchOptions, SyncResult } from './BaseConnector';
import { SupplierCredentials, SupplierProduct } from '@/types/suppliers';

export class CdiscountConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    super(credentials, 'https://ope-api.cdiscount.com');
    this.rateLimitDelay = 1000; // 1 second between requests for Cdiscount
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.apiKey}`,
      'X-Cdiscount-ApiKey': this.credentials.apiKey || '',
    };
  }

  protected getSupplierName(): string {
    return 'Cdiscount Pro';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/v1/ping');
      return response.success === true;
    } catch (error) {
      console.error('Cdiscount credential validation failed:', error);
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const params = new URLSearchParams({
        limit: (options.limit || 100).toString(),
        page: (options.page || 1).toString(),
      });

      if (options.category) {
        params.append('category', options.category);
      }

      const response = await this.makeRequest(`/v1/products?${params}`);
      
      if (!response.products || !Array.isArray(response.products)) {
        throw new Error('Invalid response format from Cdiscount API');
      }

      return response.products.map((product: any) => this.transformCdiscountProduct(product));
    } catch (error) {
      this.handleError(error, 'fetchProducts');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/v1/products/${encodeURIComponent(sku)}`);
      
      if (!response.product) {
        return null;
      }

      return this.transformCdiscountProduct(response.product);
    } catch (error) {
      console.error(`Failed to fetch product ${sku}:`, error);
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<SyncResult> {
    // Cdiscount doesn't allow inventory updates through their API
    // This would typically be read-only for marketplace products
    return {
      total: products.length,
      imported: 0,
      duplicates: 0,
      errors: ['Inventory updates not supported for Cdiscount marketplace products'],
    };
  }

  private transformCdiscountProduct(cdiscountProduct: any): SupplierProduct {
    const baseProduct = this.normalizeProduct(cdiscountProduct);
    
    // Cdiscount-specific transformations
    return {
      ...baseProduct,
      id: cdiscountProduct.ProductId || cdiscountProduct.Ean,
      sku: cdiscountProduct.Ean || cdiscountProduct.ProductId,
      title: cdiscountProduct.Name || cdiscountProduct.BrandName,
      description: cdiscountProduct.Description || cdiscountProduct.MarketingDescription,
      price: parseFloat(cdiscountProduct.SalePrice) || 0,
      costPrice: parseFloat(cdiscountProduct.BestOffer?.Price) || undefined,
      currency: 'EUR',
      stock: cdiscountProduct.AvailableOfferCount || 0,
      images: cdiscountProduct.ImageList ? 
        cdiscountProduct.ImageList.map((img: any) => img.ImageUrl) : [],
      category: cdiscountProduct.Category?.Name || 'General',
      brand: cdiscountProduct.BrandName || '',
      attributes: {
        ean: cdiscountProduct.Ean,
        model: cdiscountProduct.Model,
        isEligibleForCDiscount: cdiscountProduct.IsEligibleForCDiscount,
        deliveryInformation: cdiscountProduct.DeliveryInformation,
        offerCount: cdiscountProduct.AvailableOfferCount,
      },
      supplier: {
        id: 'cdiscount',
        name: 'Cdiscount Pro',
        sku: cdiscountProduct.Ean || cdiscountProduct.ProductId,
      },
    };
  }
}