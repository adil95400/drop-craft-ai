import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class WooCommerceConnector extends BaseConnector {
  constructor(credentials: any) {
    const baseUrl = credentials.domain?.replace(/\/$/, '') || credentials.shop_domain?.replace(/\/$/, '');
    super(credentials, `${baseUrl}/wp-json/wc/v3`);
  }

  protected getAuthHeaders(): Record<string, string> {
    const auth = btoa(`${this.credentials.consumer_key}:${this.credentials.consumer_secret}`);
    return {
      'Authorization': `Basic ${auth}`,
    };
  }

  protected getSupplierName(): string {
    return 'WooCommerce';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/system_status');
      return !!response.environment;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const params = new URLSearchParams({
        per_page: (options.limit || 50).toString(),
        page: (options.page || 1).toString(),
        status: 'publish',
        ...(options.category && { category: options.category }),
      });

      const response = await this.makeRequest(`/products?${params}`);
      
      return response.map((product: any) => this.normalizeWooProduct(product));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/products?sku=${sku}`);
      const product = response[0];
      
      if (!product) return null;
      
      return this.normalizeWooProduct(product);
    } catch (error) {
      this.handleError(error, 'single product fetching');
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<SyncResult> {
    const result: SyncResult = {
      total: products.length,
      imported: 0,
      duplicates: 0,
      errors: []
    };

    for (const product of products) {
      try {
        await this.delay();
        
        const existingProduct = await this.fetchProduct(product.sku);
        
        if (existingProduct) {
          result.duplicates++;
          continue;
        }

        await this.createWooProduct(product);
        result.imported++;
      } catch (error: any) {
        result.errors.push(`Erreur pour ${product.sku}: ${error.message}`);
      }
    }

    return result;
  }

  private normalizeWooProduct(wooProduct: any): SupplierProduct {
    return {
      id: wooProduct.id.toString(),
      sku: wooProduct.sku || wooProduct.slug,
      title: wooProduct.name,
      description: wooProduct.description || wooProduct.short_description || '',
      price: parseFloat(wooProduct.price) || 0,
      costPrice: parseFloat(wooProduct.regular_price) || undefined,
      currency: 'EUR',
      stock: wooProduct.stock_quantity || 0,
      images: wooProduct.images?.map((img: any) => img.src) || [],
      category: wooProduct.categories?.[0]?.name || 'General',
      brand: wooProduct.attributes?.find((attr: any) => attr.name === 'Brand')?.options?.[0] || '',
      supplier: {
        id: 'woocommerce',
        name: 'WooCommerce',
        sku: wooProduct.sku || wooProduct.slug
      },
      attributes: {
        weight: wooProduct.weight,
        dimensions: wooProduct.dimensions,
        categories: wooProduct.categories?.map((cat: any) => cat.name) || [],
        tags: wooProduct.tags?.map((tag: any) => tag.name) || []
      }
    };
  }

  private async createWooProduct(product: SupplierProduct): Promise<void> {
    const wooProduct = {
      name: product.title,
      description: product.description,
      short_description: product.description.substring(0, 120),
      sku: product.sku,
      regular_price: product.price.toString(),
      manage_stock: true,
      stock_quantity: product.stock,
      images: product.images.map(src => ({ src })),
      categories: [{ name: product.category }],
      attributes: product.brand ? [{
        name: 'Brand',
        options: [product.brand],
        visible: true
      }] : []
    };

    await this.makeRequest('/products', {
      method: 'POST',
      body: JSON.stringify(wooProduct)
    });
  }
}