import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class BigCommerceConnector extends BaseConnector {
  constructor(credentials: any) {
    const storeHash = credentials.store_hash || credentials.domain?.split('.')[0];
    super(credentials, `https://api.bigcommerce.com/stores/${storeHash}/v3`);
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'X-Auth-Token': this.credentials.access_token,
      'Accept': 'application/json',
    };
  }

  protected getSupplierName(): string {
    return 'BigCommerce';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/store');
      return !!response.data;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const params = new URLSearchParams({
        limit: (options.limit || 50).toString(),
        page: (options.page || 1).toString(),
        include: 'images,variants',
        ...(options.category && { 'categories:in': options.category }),
      });

      const response = await this.makeRequest(`/catalog/products?${params}`);
      
      return response.data.map((product: any) => this.normalizeBigCommerceProduct(product));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/catalog/products?sku=${sku}&include=images,variants`);
      const product = response.data[0];
      
      if (!product) return null;
      
      return this.normalizeBigCommerceProduct(product);
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

        await this.createBigCommerceProduct(product);
        result.imported++;
      } catch (error: any) {
        result.errors.push(`Erreur pour ${product.sku}: ${error.message}`);
      }
    }

    return result;
  }

  private normalizeBigCommerceProduct(bcProduct: any): SupplierProduct {
    const variant = bcProduct.variants?.[0] || {};
    const image = bcProduct.images?.[0];
    
    return {
      id: bcProduct.id.toString(),
      sku: variant.sku || bcProduct.sku || bcProduct.id.toString(),
      title: bcProduct.name,
      description: bcProduct.description || '',
      price: parseFloat(variant.price || bcProduct.price) || 0,
      costPrice: parseFloat(variant.cost_price || bcProduct.cost_price) || undefined,
      currency: 'EUR',
      stock: variant.inventory_level || bcProduct.inventory_level || 0,
      images: bcProduct.images?.map((img: any) => img.url_standard) || [],
      category: bcProduct.categories?.[0] || 'General',
      brand: bcProduct.brand || '',
      supplier: {
        id: 'bigcommerce',
        name: 'BigCommerce',
        sku: variant.sku || bcProduct.sku || bcProduct.id.toString()
      },
      attributes: {
        weight: bcProduct.weight,
        width: bcProduct.width,
        height: bcProduct.height,
        depth: bcProduct.depth,
        condition: bcProduct.condition,
        availability: bcProduct.availability
      }
    };
  }

  private async createBigCommerceProduct(product: SupplierProduct): Promise<void> {
    const bcProduct = {
      name: product.title,
      description: product.description,
      type: 'physical',
      sku: product.sku,
      price: product.price,
      cost_price: product.costPrice || 0,
      inventory_level: product.stock,
      inventory_tracking: 'product',
      weight: product.attributes?.weight || 1,
      brand_name: product.brand,
      categories: product.category ? [product.category] : [],
      images: product.images.map(url => ({ image_url: url }))
    };

    await this.makeRequest('/catalog/products', {
      method: 'POST',
      body: JSON.stringify(bcProduct)
    });
  }
}