import { BaseConnector, SyncResult, FetchOptions } from './BaseConnector';
import { SupplierCredentials, SupplierProduct } from '@/types/suppliers';

interface BigBuyProduct {
  id: number;
  sku: string;
  name: string;
  description: string;
  price: number;
  wholesalePrice: number;
  currency: string;
  stock: number;
  images: Array<{
    url: string;
    alt: string;
  }>;
  category: {
    id: number;
    name: string;
  };
  brand: {
    id: number;
    name: string;
  };
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  variations: Array<{
    id: number;
    sku: string;
    name: string;
    price: number;
    stock: number;
    attributes: Record<string, string>;
  }>;
}

export class BigBuyConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    super(credentials, 'https://api.bigbuy.eu');
    this.rateLimitDelay = 1500; // BigBuy rate limit: 40 requests/minute
  }

  protected getSupplierName(): string {
    return 'BigBuy';
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.apiKey}`,
    };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const data = await this.makeRequest('/rest/user/profile.json');
      return data.status === 'success';
    } catch (error) {
      console.error('BigBuy credential validation failed:', error);
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const params = new URLSearchParams({
        page: (options.page || 1).toString(),
        limit: Math.min(options.limit || 100, 100).toString(), // BigBuy max 100 per page
      });

      if (options.category) {
        params.append('categoryId', options.category);
      }

      if (options.lastSync) {
        params.append('updatedAfter', options.lastSync.toISOString());
      }

      const data = await this.makeRequest(`/rest/catalog/products.json?${params}`);
      
      if (!data.products || !Array.isArray(data.products)) {
        throw new Error('Invalid response format from BigBuy API');
      }

      return data.products.map((product: BigBuyProduct) => this.transformBigBuyProduct(product));
    } catch (error) {
      this.handleError(error, 'fetchProducts');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const data = await this.makeRequest(`/rest/catalog/products/${encodeURIComponent(sku)}.json`);
      
      if (!data.product) {
        return null;
      }

      return this.transformBigBuyProduct(data.product);
    } catch (error) {
      console.error(`Failed to fetch product ${sku}:`, error);
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<SyncResult> {
    // BigBuy doesn't allow inventory updates through their API
    // This would typically be read-only for dropshipping products
    return {
      total: products.length,
      imported: 0,
      duplicates: 0,
      errors: ['Inventory updates not supported for BigBuy dropshipping products'],
    };
  }

  async createOrder(order: any): Promise<string> {
    try {
      const data = await this.makeRequest('/rest/orders.json', {
        method: 'POST',
        body: JSON.stringify(order),
      });
      
      if (data.status !== 'success') {
        throw new Error(`BigBuy order creation failed: ${data.message}`);
      }

      return data.data.orderId;
    } catch (error) {
      console.error('BigBuy createOrder failed:', error);
      throw error;
    }
  }

  async getOrderStatus(orderId: string): Promise<string> {
    try {
      const data = await this.makeRequest(`/rest/orders/${orderId}.json`);
      
      if (data.status !== 'success') {
        throw new Error(`BigBuy API error: ${data.message}`);
      }

      return data.data.status;
    } catch (error) {
      console.error('BigBuy getOrderStatus failed:', error);
      throw error;
    }
  }

  private transformBigBuyProduct(bigBuyProduct: any): SupplierProduct {
    const baseProduct = this.normalizeProduct(bigBuyProduct);
    
    // BigBuy-specific transformations
    return {
      ...baseProduct,
      id: bigBuyProduct.id || bigBuyProduct.sku,
      sku: bigBuyProduct.sku || bigBuyProduct.id,
      title: bigBuyProduct.name || bigBuyProduct.title,
      description: bigBuyProduct.description || '',
      price: parseFloat(bigBuyProduct.retailPrice) || parseFloat(bigBuyProduct.price) || 0,
      costPrice: parseFloat(bigBuyProduct.wholesalePrice) || undefined,
      currency: bigBuyProduct.currency || 'EUR',
      stock: bigBuyProduct.inShopsStock || bigBuyProduct.stock || 0,
      images: bigBuyProduct.images ? 
        bigBuyProduct.images.map((img: any) => img.url || img) : [],
      category: bigBuyProduct.category?.name || 'General',
      brand: bigBuyProduct.brand?.name || '',
      weight: bigBuyProduct.weight,
      dimensions: bigBuyProduct.dimensions,
      variants: bigBuyProduct.variations?.map((variation: any) => ({
        id: variation.id?.toString(),
        sku: variation.sku,
        title: variation.name,
        price: variation.price,
        costPrice: variation.wholesalePrice,
        stock: variation.stock,
        attributes: variation.attributes || {},
      })) || [],
      attributes: {
        brandId: bigBuyProduct.brand?.id,
        categoryId: bigBuyProduct.category?.id,
        weight: bigBuyProduct.weight,
        dimensions: bigBuyProduct.dimensions,
        inShopsStock: bigBuyProduct.inShopsStock,
        retailPrice: bigBuyProduct.retailPrice,
      },
      supplier: {
        id: 'bigbuy',
        name: 'BigBuy',
        sku: bigBuyProduct.sku || bigBuyProduct.id,
      },
    };
  }
}