import { BaseConnector } from './BaseConnector';
import { SupplierProduct, SupplierCredentials } from '@/types/suppliers';

interface CdiscountProduct {
  Id: string;
  Sku: string;
  Name: string;
  Description: string;
  Price: number;
  Currency: string;
  StockQuantity: number;
  Images: string[];
  Category: string;
  Brand: string;
  Weight: number;
  Variants: Array<{
    Id: string;
    Sku: string;
    Name: string;
    Price: number;
    StockQuantity: number;
    Attributes: Record<string, string>;
  }>;
}

export class CdiscountConnector extends BaseConnector {
  private baseUrl = 'https://ws.cdiscount.com/MarketplaceAPI';
  
  constructor(credentials: SupplierCredentials) {
    super(credentials);
    this.rateLimitDelay = 2000; // Cdiscount rate limit: 30 requests/minute
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/GetSellerInformation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.credentials.accessToken}`,
        },
        body: JSON.stringify({
          ApiKey: this.credentials.apiKey,
        }),
      });

      const data = await response.json();
      return data.OperationSuccess === true;
    } catch (error) {
      console.error('Cdiscount credential validation failed:', error);
      return false;
    }
  }

  async fetchProducts(options: {
    page?: number;
    limit?: number;
    lastSync?: Date;
    category?: string;
  } = {}): Promise<SupplierProduct[]> {
    const { page = 1, limit = 50 } = options;
    
    try {
      const response = await this.makeRequest(`${this.baseUrl}/GetProductList`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.credentials.accessToken}`,
        },
        body: JSON.stringify({
          ApiKey: this.credentials.apiKey,
          PageNumber: page,
          PageSize: Math.min(limit, 100),
          ProductStateFilter: 'Active',
        }),
      });

      const data = await response.json();
      
      if (!data.OperationSuccess) {
        throw new Error(`Cdiscount API error: ${data.ErrorMessage}`);
      }

      return data.ProductList.map((product: CdiscountProduct) => this.transformProduct(product));
    } catch (error) {
      console.error('Cdiscount fetchProducts failed:', error);
      throw error;
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/GetProduct`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.credentials.accessToken}`,
        },
        body: JSON.stringify({
          ApiKey: this.credentials.apiKey,
          Sku: sku,
        }),
      });

      const data = await response.json();
      
      if (!data.OperationSuccess) {
        return null;
      }

      return this.transformProduct(data.Product);
    } catch (error) {
      console.error('Cdiscount fetchProduct failed:', error);
      return null;
    }
  }

  async fetchInventory(skus: string[]): Promise<Array<{sku: string, stock: number}>> {
    try {
      const response = await this.makeRequest(`${this.baseUrl}/GetStockQuantityList`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.credentials.accessToken}`,
        },
        body: JSON.stringify({
          ApiKey: this.credentials.apiKey,
          SkuList: skus,
        }),
      });

      const data = await response.json();
      
      if (!data.OperationSuccess) {
        throw new Error(`Cdiscount API error: ${data.ErrorMessage}`);
      }

      return data.StockQuantityList.map((item: any) => ({
        sku: item.Sku,
        stock: item.StockQuantity || 0,
      }));
    } catch (error) {
      console.error('Cdiscount fetchInventory failed:', error);
      throw error;
    }
  }

  protected transformProduct(rawProduct: CdiscountProduct): SupplierProduct {
    return {
      id: rawProduct.Id,
      sku: rawProduct.Sku,
      title: rawProduct.Name,
      description: rawProduct.Description || '',
      price: rawProduct.Price,
      currency: rawProduct.Currency || 'EUR',
      stock: rawProduct.StockQuantity || 0,
      images: rawProduct.Images || [],
      category: rawProduct.Category || 'Uncategorized',
      brand: rawProduct.Brand,
      weight: rawProduct.Weight,
      variants: rawProduct.Variants?.map(variant => ({
        id: variant.Id,
        sku: variant.Sku,
        title: variant.Name,
        price: variant.Price,
        stock: variant.StockQuantity,
        attributes: variant.Attributes,
      })) || [],
      attributes: {
        brand: rawProduct.Brand,
        category: rawProduct.Category,
        weight: rawProduct.Weight,
      },
      supplier: {
        id: 'cdiscount',
        name: 'Cdiscount Pro',
        sku: rawProduct.Sku,
      },
    };
  }
}