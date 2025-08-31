import { BaseConnector } from './BaseConnector';
import { SupplierProduct, SupplierCredentials } from '@/types/suppliers';

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
  private version = 'v1';

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
      const data = await this.makeRequest(`/${this.version}/user`);
      return data.status === 'success';
    } catch (error) {
      console.error('BigBuy credential validation failed:', error);
      return false;
    }
  }

  async fetchProducts(options: {
    page?: number;
    limit?: number;
    lastSync?: Date;
    category?: string;
  } = {}): Promise<SupplierProduct[]> {
    const { page = 1, limit = 100, category } = options;
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: Math.min(limit, 100).toString(), // BigBuy max 100 per page
      });

      if (category) {
        params.append('categoryId', category);
      }

      if (options.lastSync) {
        params.append('updatedAfter', options.lastSync.toISOString());
      }

      const data = await this.makeRequest(`/${this.version}/catalog/products?${params}`);
      
      if (data.status !== 'success') {
        throw new Error(`BigBuy API error: ${data.message}`);
      }

      return data.data.map((product: BigBuyProduct) => this.transformProduct(product));
    } catch (error) {
      console.error('BigBuy fetchProducts failed:', error);
      throw error;
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const data = await this.makeRequest(`/${this.version}/catalog/products/${sku}`);
      
      if (data.status !== 'success') {
        return null;
      }

      return this.transformProduct(data.data);
    } catch (error) {
      console.error('BigBuy fetchProduct failed:', error);
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<import('./BaseConnector').SyncResult> {
    try {
      const skus = products.map(p => p.sku);
      const data = await this.makeRequest(`/${this.version}/catalog/products/stock`, {
        method: 'POST',
        body: JSON.stringify({ skus }),
      });
      
      if (data.status !== 'success') {
        throw new Error(`BigBuy API error: ${data.message}`);
      }

      return {
        total: products.length,
        imported: data.data?.length || 0,
        duplicates: 0,
        errors: [],
      };
    } catch (error) {
      console.error('BigBuy updateInventory failed:', error);
      return {
        total: products.length,
        imported: 0,
        duplicates: 0,
        errors: [error.message],
      };
    }
  }

  async createOrder(order: any): Promise<string> {
    try {
      const data = await this.makeRequest(`/${this.version}/orders`, {
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
      const data = await this.makeRequest(`/${this.version}/orders/${orderId}`);
      
      if (data.status !== 'success') {
        throw new Error(`BigBuy API error: ${data.message}`);
      }

      return data.data.status;
    } catch (error) {
      console.error('BigBuy getOrderStatus failed:', error);
      throw error;
    }
  }

  protected transformProduct(rawProduct: BigBuyProduct): SupplierProduct {
    return {
      id: rawProduct.id.toString(),
      sku: rawProduct.sku,
      title: rawProduct.name,
      description: rawProduct.description || '',
      price: rawProduct.price,
      costPrice: rawProduct.wholesalePrice,
      currency: rawProduct.currency || 'EUR',
      stock: rawProduct.stock || 0,
      images: rawProduct.images?.map(img => img.url) || [],
      category: rawProduct.category?.name || 'Uncategorized',
      brand: rawProduct.brand?.name,
      weight: rawProduct.weight,
      dimensions: rawProduct.dimensions,
      variants: rawProduct.variations?.map(variation => ({
        id: variation.id.toString(),
        sku: variation.sku,
        title: variation.name,
        price: variation.price,
        costPrice: rawProduct.wholesalePrice,
        stock: variation.stock,
        attributes: variation.attributes,
      })) || [],
      attributes: {
        brandId: rawProduct.brand?.id,
        categoryId: rawProduct.category?.id,
        weight: rawProduct.weight,
        dimensions: rawProduct.dimensions,
      },
      supplier: {
        id: 'bigbuy',
        name: 'BigBuy',
        sku: rawProduct.sku,
      },
    };
  }
}