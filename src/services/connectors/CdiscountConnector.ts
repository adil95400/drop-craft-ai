import { BaseConnector, SupplierProduct, SupplierCredentials, SyncResult, FetchOptions } from './BaseConnector';

export class CdiscountConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    super(credentials, 'https://ws.cdiscount.com/MarketplaceAPIService.svc');
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  protected getSupplierName(): string {
    return 'Cdiscount';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.makeRequest('/GetOfferList', {
        method: 'POST',
        body: JSON.stringify({ PageSize: 1 }),
      });
      return true;
    } catch (error) {
      this.handleError(error, 'Credential validation');
      return false;
    }
  }

  async fetchProducts(options?: FetchOptions): Promise<SupplierProduct[]> {
    try {
      const response = await this.makeRequest('/GetOfferList', {
        method: 'POST',
        body: JSON.stringify({
          PageSize: options?.limit || 50,
          PageNumber: options?.page || 1,
        }),
      });
      
      return response.OfferList?.map((offer: any) => this.normalizeCdiscountProduct(offer)) || [];
    } catch (error) {
      this.handleError(error, 'Fetch products');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest('/GetOfferList', {
        method: 'POST',
        body: JSON.stringify({
          SellerProductId: sku,
        }),
      });
      
      if (response.OfferList?.length > 0) {
        return this.normalizeCdiscountProduct(response.OfferList[0]);
      }
      return null;
    } catch (error) {
      this.handleError(error, 'Fetch product');
      return null;
    }
  }

  async updateInventory(products: any[]): Promise<SyncResult> {
    const result: SyncResult = { total: products.length, imported: 0, duplicates: 0, errors: [] };

    for (const product of products) {
      try {
        const quantity = product.quantity || product.stock;
        await this.makeRequest('/UpdateOfferQuantity', {
          method: 'POST',
          body: JSON.stringify({
            SellerProductId: product.sku,
            Quantity: quantity,
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

  async fetchOrders(options?: any): Promise<any[]> {
    try {
      const response = await this.makeRequest('/GetOrderList', {
        method: 'POST',
        body: JSON.stringify({
          PageSize: options?.limit || 50,
          PageNumber: options?.page || 1,
        }),
      });
      
      return response.OrderList || [];
    } catch (error) {
      this.handleError(error, 'Fetch orders');
      return [];
    }
  }

  async updatePrices(products: { sku: string; price: number }[]): Promise<SyncResult> {
    const result: SyncResult = { total: products.length, imported: 0, duplicates: 0, errors: [] };

    for (const product of products) {
      try {
        await this.makeRequest('/UpdateOfferPrice', {
          method: 'POST',
          body: JSON.stringify({
            SellerProductId: product.sku,
            Price: product.price,
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

  async createOrder(order: any): Promise<string> {
    throw new Error('Cdiscount does not support order creation via API');
  }

  async updateOrderStatus(orderId: string, status: string): Promise<boolean> {
    try {
      await this.makeRequest('/UpdateOrderStatus', {
        method: 'POST',
        body: JSON.stringify({
          OrderNumber: orderId,
          Status: status,
        }),
      });
      return true;
    } catch (error) {
      this.handleError(error, 'Update order status');
      return false;
    }
  }

  private normalizeCdiscountProduct(offer: any): SupplierProduct {
    return {
      id: offer.ProductId,
      sku: offer.SellerProductId,
      title: offer.ProductName,
      description: offer.Description || '',
      price: parseFloat(offer.SalePrice),
      currency: 'EUR',
      stock: offer.AvailableQuantity || 0,
      images: offer.Images?.map((img: any) => img.Uri) || [],
      category: offer.CategoryCode || 'General',
      brand: offer.BrandName || '',
      attributes: {
        ean: offer.Ean,
      },
      supplier: {
        id: 'cdiscount',
        name: 'Cdiscount',
        sku: offer.SellerProductId,
      },
    };
  }
}
