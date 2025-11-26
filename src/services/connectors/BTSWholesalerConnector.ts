import { BaseConnector, FetchOptions, SyncResult } from './BaseConnector';
import { 
  SupplierProduct, 
  SupplierCredentials
} from '@/types/suppliers';

interface BTSProduct {
  id: number;
  ean: number;
  categories: string;
  manufacturer: string;
  name: string;
  description: string;
  recommended_price: number;
  price: number;
  stock: number;
  image: string;
  delivery: number; // 24/48 or 48/72 hours
  gender: string; // male, female, unisex
}

interface BTSShippingPrice {
  id: string;
  delivery_time: string;
  company_name: string;
  shipping_cost: number;
  free_shipping: number;
}

interface BTSOrderResponse {
  order_number: string;
}

export class BTSWholesalerConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    super(credentials, 'https://api.btswholesaler.com');
    this.rateLimitDelay = 1000;
  }

  protected getSupplierName(): string {
    return 'BTS Wholesaler';
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.apiKey || ''}`,
      'Accept': 'application/json'
    };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/api/getListProducts`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      return response.ok;
    } catch (error) {
      this.handleError(error, 'validateCredentials');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/api/getListProducts`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const products: BTSProduct[] = await response.json();
      
      // Apply filtering if category is specified
      let filteredProducts = products;
      if (options?.category) {
        filteredProducts = products.filter(p => 
          p.categories.includes(options.category!)
        );
      }

      // Apply pagination
      const page = options?.page || 1;
      const limit = options?.limit || 100;
      const start = (page - 1) * limit;
      const paginatedProducts = filteredProducts.slice(start, start + limit);

      return paginatedProducts.map(product => this.normalizeBTSProduct(product));
    } catch (error) {
      this.handleError(error, 'fetchProducts');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/api/getProducts?product_sku[0]=${sku}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }

      const products: BTSProduct[] = await response.json();
      
      if (!products || products.length === 0) {
        return null;
      }

      return this.normalizeBTSProduct(products[0]);
    } catch (error) {
      this.handleError(error, 'fetchProduct');
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<SyncResult> {
    return {
      total: products.length,
      imported: 0,
      duplicates: 0,
      errors: ['Inventory updates not supported for BTS Wholesaler'],
    };
  }

  private normalizeBTSProduct(product: BTSProduct): SupplierProduct {
    return {
      id: product.id.toString(),
      sku: product.ean.toString(),
      title: product.name,
      description: product.description || '',
      price: product.price,
      costPrice: product.price,
      currency: 'EUR',
      stock: product.stock,
      images: product.image ? [product.image] : [],
      category: product.categories || '',
      brand: product.manufacturer || '',
      attributes: {
        gender: product.gender,
        delivery_time: product.delivery === 24 ? '24-48h' : '48-72h',
        recommended_price: product.recommended_price,
        categories_path: product.categories
      },
      supplier: {
        id: 'btswholesaler',
        name: 'BTSWholesaler',
        sku: product.ean.toString()
      },
      supplierProductId: product.id.toString()
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

  async placeOrder(orderData: {
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
    };
    shippingMethodId?: string;
  }): Promise<any> {
    try {
      // First, get shipping prices
      const productsParam = orderData.items.map((item, i) => 
        `products[${i}][sku]=${item.sku}&products[${i}][quantity]=${item.quantity}`
      ).join('&');

      const shippingResponse = await fetch(
        `${this.baseUrl}/v1/api/getShippingPrices?` +
        `address[country_code]=${orderData.shippingAddress.countryCode}&` +
        `address[postal_code]=${orderData.shippingAddress.postalCode}&` +
        productsParam,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      if (!shippingResponse.ok) {
        throw new Error('Failed to get shipping prices');
      }

      const shippingOptions: BTSShippingPrice[] = await shippingResponse.json();
      const shippingMethodId = orderData.shippingMethodId || shippingOptions[0]?.id;

      if (!shippingMethodId) {
        throw new Error('No shipping method available');
      }

      // Prepare order data as form-encoded
      const formData = new URLSearchParams();
      formData.append('payment_method', 'wallet');
      formData.append('shipping_id', shippingMethodId);
      formData.append('client_name', `${orderData.shippingAddress.firstName} ${orderData.shippingAddress.lastName}`);
      formData.append('address', orderData.shippingAddress.address);
      formData.append('postal_code', orderData.shippingAddress.postalCode);
      formData.append('city', orderData.shippingAddress.city);
      formData.append('country_code', orderData.shippingAddress.countryCode);
      formData.append('telephone', orderData.shippingAddress.phone);
      formData.append('dropshipping', '1');

      if (orderData.shippingAddress.stateCode) {
        formData.append('state_code', orderData.shippingAddress.stateCode);
      }

      // Add products
      orderData.items.forEach((item, i) => {
        formData.append(`products[${i}][sku]`, item.sku);
        formData.append(`products[${i}][quantity]`, item.quantity.toString());
      });

      // Place the order
      const orderResponse = await fetch(`${this.baseUrl}/v1/api/setCreateOrder`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      if (!orderResponse.ok) {
        throw new Error(`Failed to place order: ${orderResponse.statusText}`);
      }

      const result: BTSOrderResponse = await orderResponse.json();

      return {
        orderId: result.order_number,
        status: 'pending',
        items: orderData.items,
        shippingAddress: orderData.shippingAddress,
        createdAt: new Date().toISOString()
      };
    } catch (error) {
      this.handleError(error, 'placeOrder');
      throw error;
    }
  }

  async getOrderStatus(orderId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/api/getOrder?order_number=${orderId}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch order: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      this.handleError(error, 'getOrderStatus');
      throw error;
    }
  }

  async getTracking(orderId: string): Promise<string | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/v1/api/getTrackings?order_number[0]=${orderId}`,
        {
          method: 'GET',
          headers: this.getAuthHeaders()
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch tracking: ${response.statusText}`);
      }

      const trackings = await response.json();
      return trackings[0]?.tracking || null;
    } catch (error) {
      this.handleError(error, 'getTracking');
      return null;
    }
  }

  async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const formData = new URLSearchParams();
      formData.append('order_number', orderId);

      const response = await fetch(`${this.baseUrl}/v1/api/setCancelOrder`, {
        method: 'POST',
        headers: {
          ...this.getAuthHeaders(),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString()
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.text();
      return result === 'true';
    } catch (error) {
      this.handleError(error, 'cancelOrder');
      return false;
    }
  }
}
