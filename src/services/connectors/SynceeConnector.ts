import { BaseConnector } from './BaseConnector';
import { SupplierProduct, SupplierCredentials } from '@/types/suppliers';

interface SynceeProduct {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  stock_quantity: number;
  images: Array<{
    src: string;
    alt?: string;
  }>;
  category: {
    name: string;
    id: string;
  };
  brand?: string;
  attributes: Record<string, any>;
  variants?: Array<{
    id: string;
    sku: string;
    name: string;
    price: number;
    stock: number;
    attributes: Record<string, string>;
  }>;
  weight?: number;
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  supplier_info: {
    name: string;
    country: string;
    shipping_cost?: number;
    processing_time?: string;
  };
}

export class SynceeConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    super(credentials, 'https://api.syncee.com/v1');
    this.rateLimitDelay = 1000; // 1 request per second
  }

  protected getSupplierName(): string {
    return 'Syncee';
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.apiKey}`,
    };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.makeRequest('/user/profile');
      return true;
    } catch (error) {
      console.error('Syncee credential validation failed:', error);
      return false;
    }
  }

  async fetchProducts(options?: {
    page?: number;
    limit?: number;
    lastSync?: Date;
    category?: string;
  }): Promise<SupplierProduct[]> {
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 50, 100);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: limit.toString(),
        ...(options?.category && { category: options.category }),
        ...(options?.lastSync && { modified_since: options.lastSync.toISOString() }),
      });

      const data = await this.makeRequest(`/products?${params}`);
      
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response format from Syncee API');
      }

      return data.data.map((product: SynceeProduct) => 
        this.transformProduct(product)
      );
    } catch (error) {
      console.error('Error fetching Syncee products:', error);
      throw error;
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const data = await this.makeRequest(`/products/${sku}`);
      
      if (!data.data) {
        return null;
      }

      return this.transformProduct(data.data);
    } catch (error) {
      console.error('Error fetching Syncee product:', error);
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<import('./BaseConnector').SyncResult> {
    try {
      const inventoryPromises = products.map(async (product) => {
        const data = await this.makeRequest(`/products/${product.sku}/inventory`);
        return {
          sku: product.sku,
          stock: data.data?.stock_quantity || 0,
        };
      });

      const results = await Promise.all(inventoryPromises);
      
      return {
        total: products.length,
        imported: results.length,
        duplicates: 0,
        errors: [],
      };
    } catch (error) {
      console.error('Error updating Syncee inventory:', error);
      return {
        total: products.length,
        imported: 0,
        duplicates: 0,
        errors: [error.message],
      };
    }
  }

  protected transformProduct(rawProduct: SynceeProduct): SupplierProduct {
    return {
      id: rawProduct.id,
      sku: rawProduct.sku,
      title: rawProduct.name,
      description: rawProduct.description,
      price: rawProduct.price,
      costPrice: rawProduct.price * 0.7, // Estimated cost price for Syncee
      currency: rawProduct.currency,
      stock: rawProduct.stock_quantity,
      images: rawProduct.images.map(img => img.src),
      category: rawProduct.category.name,
      brand: rawProduct.brand,
      weight: rawProduct.weight,
      dimensions: rawProduct.dimensions,
      variants: rawProduct.variants?.map(v => ({
        id: v.id,
        sku: v.sku,
        title: v.name,
        price: v.price,
        costPrice: v.price * 0.7,
        stock: v.stock,
        attributes: v.attributes,
      })),
      attributes: {
        ...rawProduct.attributes,
        supplier_country: rawProduct.supplier_info.country,
        shipping_cost: rawProduct.supplier_info.shipping_cost,
        processing_time: rawProduct.supplier_info.processing_time,
        category_id: rawProduct.category.id,
      },
      supplier: {
        id: 'syncee',
        name: 'Syncee',
        sku: rawProduct.sku,
      },
    };
  }
}