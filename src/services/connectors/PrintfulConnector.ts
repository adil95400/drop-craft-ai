import { BaseConnector } from './BaseConnector';
import { SupplierProduct, SupplierCredentials } from '@/types/suppliers';

interface PrintfulProduct {
  id: number;
  title: string;
  description: string;
  brand: string;
  model: string;
  image: string;
  variant_count: number;
  currency: string;
  product: {
    variant_id: number;
    product_id: number;
    image: string;
    name: string;
  };
  variants: Array<{
    id: number;
    product_id: number;
    name: string;
    size: string;
    color: string;
    color_code?: string;
    image: string;
    price: string;
    in_stock: boolean;
    availability_regions: Record<string, string>;
    availability_status: Array<{
      region: string;
      status: string;
    }>;
  }>;
  files: Array<{
    id: number;
    type: string;
    title: string;
    additional_price?: string;
  }>;
  options: Array<{
    id: string;
    title: string;
    type: string;
    values: Record<string, any>;
    additional_price?: number;
    additional_price_breakdown?: Record<string, number>;
  }>;
  dimensions?: {
    weight: number;
  };
}

export class PrintfulConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    super(credentials, 'https://api.printful.com');
    this.rateLimitDelay = 500; // 2 requests per second max
  }

  protected getSupplierName(): string {
    return 'Printful';
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.apiKey}`,
    };
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.makeRequest('/oauth/scopes');
      return true;
    } catch (error) {
      console.error('Printful credential validation failed:', error);
      return false;
    }
  }

  async fetchProducts(options?: {
    page?: number;
    limit?: number;
    lastSync?: Date;
    category?: string;
  }): Promise<SupplierProduct[]> {
    try {
      // First get all product categories
      const data = await this.makeRequest('/products');
      
      if (!data.result || !Array.isArray(data.result)) {
        throw new Error('Invalid response format from Printful API');
      }

      // Filter by category if specified
      let products = data.result;
      if (options?.category) {
        products = products.filter((p: any) => 
          p.type?.toLowerCase().includes(options.category?.toLowerCase())
        );
      }

      // Apply pagination
      const startIndex = ((options?.page || 1) - 1) * (options?.limit || 50);
      const endIndex = startIndex + (options?.limit || 50);
      products = products.slice(startIndex, endIndex);

      // Fetch detailed info for each product
      const detailedProducts = await Promise.all(
        products.map(async (product: any) => {
          try {
            const detailData = await this.makeRequest(`/products/${product.id}`);
            return detailData.result;
          } catch (error) {
            console.warn(`Failed to fetch details for product ${product.id}:`, error);
            return product;
          }
        })
      );

      return detailedProducts
        .filter(product => product)
        .map((product: PrintfulProduct) => this.transformProduct(product));
    } catch (error) {
      console.error('Error fetching Printful products:', error);
      throw error;
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const data = await this.makeRequest(`/products/${sku}`);
      
      if (!data.result) {
        return null;
      }

      return this.transformProduct(data.result);
    } catch (error) {
      console.error('Error fetching Printful product:', error);
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<import('./BaseConnector').SyncResult> {
    // Printful is print-on-demand, inventory is always available
    return {
      total: products.length,
      imported: products.length,
      duplicates: 0,
      errors: [],
    };
  }

  async createOrder(order: any): Promise<string> {
    try {
      const data = await this.makeRequest('/orders', {
        method: 'POST',
        body: JSON.stringify({
          recipient: order.shipping_address,
          items: order.line_items.map((item: any) => ({
            variant_id: item.variant_id,
            quantity: item.quantity,
            files: item.files || [],
          })),
          retail_costs: {
            currency: order.currency || 'USD',
            subtotal: order.subtotal,
            discount: order.discount || 0,
            shipping: order.shipping_cost || 0,
            tax: order.tax || 0,
          },
        }),
      });
      
      if (!data.result?.id) {
        throw new Error('Failed to create order with Printful');
      }

      return data.result.id.toString();
    } catch (error) {
      console.error('Error creating Printful order:', error);
      throw error;
    }
  }

  async getOrderStatus(orderId: string): Promise<string> {
    try {
      const data = await this.makeRequest(`/orders/${orderId}`);
      
      if (!data.result) {
        throw new Error('Failed to get order status from Printful');
      }

      return data.result.status || 'unknown';
    } catch (error) {
      console.error('Error getting Printful order status:', error);
      throw error;
    }
  }

  protected transformProduct(rawProduct: PrintfulProduct): SupplierProduct {
    const basePrice = rawProduct.variants?.[0] ? parseFloat(rawProduct.variants[0].price) : 0;
    
    return {
      id: rawProduct.id.toString(),
      sku: rawProduct.id.toString(),
      title: rawProduct.title,
      description: rawProduct.description,
      price: basePrice,
      costPrice: basePrice * 0.6, // Print-on-demand typical margin
      currency: rawProduct.currency || 'USD',
      stock: 999, // Print-on-demand, always available
      images: [rawProduct.image, ...(rawProduct.variants?.map(v => v.image) || [])],
      category: 'Print-on-Demand',
      brand: rawProduct.brand,
      weight: rawProduct.dimensions?.weight,
      variants: rawProduct.variants?.map(v => ({
        id: v.id.toString(),
        sku: v.id.toString(),
        title: `${v.name} - ${v.color} - ${v.size}`,
        price: parseFloat(v.price),
        costPrice: parseFloat(v.price) * 0.6,
        stock: v.in_stock ? 999 : 0,
        attributes: {
          size: v.size,
          color: v.color,
          color_code: v.color_code,
        },
        image: v.image,
      })),
      attributes: {
        model: rawProduct.model,
        variant_count: rawProduct.variant_count,
        files: rawProduct.files,
        options: rawProduct.options,
        print_on_demand: true,
      },
      supplier: {
        id: 'printful',
        name: 'Printful',
        sku: rawProduct.id.toString(),
      },
    };
  }
}