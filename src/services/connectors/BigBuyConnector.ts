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
  private baseUrl = 'https://api.bigbuy.eu';
  private version = 'v1';

  constructor(credentials: SupplierCredentials) {
    super(credentials);
    this.rateLimitDelay = 1500; // BigBuy rate limit: 40 requests/minute
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/${this.version}/user`, {
        headers: {
          'Authorization': `Bearer ${this.credentials.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
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

      const response = await this.makeRequest(
        `${this.baseUrl}/${this.version}/catalog/products?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${this.credentials.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      
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
      const response = await this.makeRequest(
        `${this.baseUrl}/${this.version}/catalog/products/${sku}`,
        {
          headers: {
            'Authorization': `Bearer ${this.credentials.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      
      if (data.status !== 'success') {
        return null;
      }

      return this.transformProduct(data.data);
    } catch (error) {
      console.error('BigBuy fetchProduct failed:', error);
      return null;
    }
  }

  async fetchInventory(skus: string[]): Promise<Array<{sku: string, stock: number}>> {
    try {
      const response = await this.makeRequest(
        `${this.baseUrl}/${this.version}/catalog/products/stock`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.credentials.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ skus }),
        }
      );

      const data = await response.json();
      
      if (data.status !== 'success') {
        throw new Error(`BigBuy API error: ${data.message}`);
      }

      return data.data.map((item: any) => ({
        sku: item.sku,
        stock: item.stock || 0,
      }));
    } catch (error) {
      console.error('BigBuy fetchInventory failed:', error);
      throw error;
    }
  }

  async createOrder(order: any): Promise<string> {
    try {
      const response = await this.makeRequest(
        `${this.baseUrl}/${this.version}/orders`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.credentials.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(order),
        }
      );

      const data = await response.json();
      
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
      const response = await this.makeRequest(
        `${this.baseUrl}/${this.version}/orders/${orderId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.credentials.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      
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