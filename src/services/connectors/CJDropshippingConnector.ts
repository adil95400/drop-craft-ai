import { BaseConnector, FetchOptions, SyncResult } from './BaseConnector';
import { SupplierCredentials, SupplierProduct } from '@/types/suppliers';

interface CJProduct {
  pid: string;
  productNameEn: string;
  productSku: string;
  sellPrice: number;
  productWeight: number;
  productType: number;
  categoryId: number;
  categoryName: string;
  productImage: string;
  productVideos: string[];
  variants: Array<{
    vid: string;
    variantSku: string;
    variantNameEn: string;
    variantSellPrice: number;
    variantImage: string;
  }>;
}

export class CJDropshippingConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    super(credentials, 'https://developers.cjdropshipping.com/api2.0/v1');
    this.rateLimitDelay = 1000; // CJ rate limit: 60 requests/minute
  }

  protected getSupplierName(): string {
    return 'CJ Dropshipping';
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'CJ-Access-Token': this.credentials.accessToken || '',
    };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/authentication/getAccessToken', {
        method: 'POST',
        body: JSON.stringify({
          email: this.credentials.username || this.credentials.email,
          password: this.credentials.password
        })
      });
      
      return response.code === 200 && !!response.data?.accessToken;
    } catch (error) {
      console.error('CJ Dropshipping credential validation failed:', error);
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const params = {
        pageNum: options.page || 1,
        pageSize: Math.min(options.limit || 50, 100),
        categoryId: options.category || ''
      };

      const response = await this.makeRequest('/product/list', {
        method: 'POST',
        body: JSON.stringify(params)
      });
      
      if (response.code !== 200 || !response.data?.list) {
        throw new Error('Invalid response from CJ Dropshipping API');
      }

      return response.data.list.map((product: CJProduct) => this.transformProduct(product));
    } catch (error) {
      this.handleError(error, 'fetchProducts');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest('/product/query', {
        method: 'POST',
        body: JSON.stringify({ pid: sku })
      });
      
      if (response.code !== 200 || !response.data) {
        return null;
      }

      return this.transformProduct(response.data);
    } catch (error) {
      console.error(`Failed to fetch product ${sku}:`, error);
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<SyncResult> {
    // CJ Dropshipping provides real-time inventory through their API
    // No manual inventory updates needed
    return {
      total: products.length,
      imported: 0,
      duplicates: 0,
      errors: ['CJ Dropshipping provides real-time inventory'],
    };
  }

  async createOrder(orderData: {
    items: Array<{ sku: string; quantity: number; variant?: string }>;
    shippingAddress: {
      firstName: string;
      lastName: string;
      address: string;
      city: string;
      postalCode: string;
      countryCode: string;
      stateCode?: string;
      phone: string;
      email?: string;
    };
    shippingMethodId?: string;
  }): Promise<string> {
    try {
      const response = await this.makeRequest('/shopping/order/createOrder', {
        method: 'POST',
        body: JSON.stringify({
          products: orderData.items.map(item => ({
            vid: item.variant || item.sku,
            quantity: item.quantity
          })),
          shippingAddress: {
            firstName: orderData.shippingAddress.firstName,
            lastName: orderData.shippingAddress.lastName,
            address: orderData.shippingAddress.address,
            city: orderData.shippingAddress.city,
            zip: orderData.shippingAddress.postalCode,
            countryCode: orderData.shippingAddress.countryCode,
            province: orderData.shippingAddress.stateCode,
            phone: orderData.shippingAddress.phone,
            email: orderData.shippingAddress.email
          },
          shippingMethodId: orderData.shippingMethodId || 'CJ_PACKET_B'
        })
      });
      
      if (response.code !== 200) {
        throw new Error(`CJ Dropshipping order creation failed: ${response.message}`);
      }

      return response.data.orderId;
    } catch (error) {
      console.error('CJ Dropshipping createOrder failed:', error);
      throw error;
    }
  }

  async getOrderStatus(orderId: string): Promise<any> {
    try {
      const response = await this.makeRequest('/shopping/order/getOrderDetail', {
        method: 'POST',
        body: JSON.stringify({ orderId })
      });
      
      if (response.code !== 200) {
        throw new Error(`CJ Dropshipping API error: ${response.message}`);
      }

      return {
        orderId,
        status: response.data.orderStatus,
        trackingNumber: response.data.trackingNumber,
        carrier: response.data.shippingProvider,
        items: response.data.orderProducts
      };
    } catch (error) {
      console.error('CJ Dropshipping getOrderStatus failed:', error);
      throw error;
    }
  }

  async getTracking(orderId: string): Promise<string | null> {
    try {
      const orderStatus = await this.getOrderStatus(orderId);
      return orderStatus.trackingNumber || null;
    } catch (error) {
      console.error('CJ Dropshipping getTracking failed:', error);
      return null;
    }
  }

  protected transformProduct(cjProduct: CJProduct): SupplierProduct {
    return {
      id: cjProduct.pid,
      sku: cjProduct.productSku,
      title: cjProduct.productNameEn,
      description: cjProduct.productNameEn,
      price: cjProduct.sellPrice,
      costPrice: cjProduct.sellPrice * 0.8, // Estimated cost
      currency: 'USD',
      stock: 999, // CJ typically has high stock
      images: [cjProduct.productImage, ...(cjProduct.productVideos || [])],
      category: cjProduct.categoryName || 'General',
      weight: cjProduct.productWeight,
      variants: cjProduct.variants?.map(v => ({
        id: v.vid,
        sku: v.variantSku,
        title: v.variantNameEn,
        price: v.variantSellPrice,
        costPrice: v.variantSellPrice * 0.8,
        stock: 999,
        attributes: {},
        image: v.variantImage
      })) || [],
      attributes: {
        productType: cjProduct.productType,
        categoryId: cjProduct.categoryId
      },
      supplier: {
        id: 'cjdropshipping',
        name: 'CJ Dropshipping',
        sku: cjProduct.productSku
      },
      supplierProductId: cjProduct.pid
    };
  }

  async getInventory(sku: string): Promise<number> {
    try {
      const product = await this.fetchProduct(sku);
      return product?.stock || 0;
    } catch (error) {
      this.handleError(error, 'getInventory');
      return 0;
    }
  }
}
