import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class EcwidConnector extends BaseConnector {
  private storeId: string;

  constructor(credentials: any) {
    super(credentials, 'https://app.ecwid.com/api/v3');
    this.storeId = credentials.store_id;
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.access_token}`,
    };
  }

  protected getSupplierName(): string {
    return 'Ecwid';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/${this.storeId}/profile`);
      return !!response.generalInfo;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const limit = Math.min(options.limit || 50, 100);
      const offset = ((options.page || 1) - 1) * limit;
      
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
        enabled: 'true'
      });

      const response = await this.makeRequest(`/${this.storeId}/products?${params}`);
      
      return response.items.map((product: any) => this.normalizeEcwidProduct(product));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/${this.storeId}/products?keyword=${sku}&enabled=true`);
      const product = response.items.find((p: any) => p.sku === sku);
      
      if (!product) return null;
      
      return this.normalizeEcwidProduct(product);
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

        await this.createEcwidProduct(product);
        result.imported++;
      } catch (error: any) {
        result.errors.push(`Erreur pour ${product.sku}: ${error.message}`);
      }
    }

    return result;
  }

  private normalizeEcwidProduct(ecwidProduct: any): SupplierProduct {
    const defaultVariation = ecwidProduct.combinations?.[0] || {};
    
    return {
      id: ecwidProduct.id.toString(),
      sku: ecwidProduct.sku || ecwidProduct.id.toString(),
      title: ecwidProduct.name,
      description: ecwidProduct.description || '',
      price: parseFloat(ecwidProduct.price) || 0,
      costPrice: parseFloat(ecwidProduct.costPrice) || undefined,
      currency: 'USD', // Ecwid uses store's default currency
      stock: ecwidProduct.quantity || 0,
      images: ecwidProduct.galleryImages?.map((img: any) => img.url) || [],
      category: ecwidProduct.categoryIds?.[0]?.toString() || 'General',
      brand: ecwidProduct.attributes?.find((attr: any) => attr.name.toLowerCase() === 'brand')?.value || '',
      supplier: {
        id: 'ecwid',
        name: 'Ecwid',
        sku: ecwidProduct.sku || ecwidProduct.id.toString()
      },
      attributes: {
        weight: ecwidProduct.weight,
        dimensions: {
          length: ecwidProduct.dimensions?.length,
          width: ecwidProduct.dimensions?.width,
          height: ecwidProduct.dimensions?.height
        },
        enabled: ecwidProduct.enabled,
        categories: ecwidProduct.categoryIds || []
      }
    };
  }

  private async createEcwidProduct(product: SupplierProduct): Promise<void> {
    const ecwidProduct = {
      name: product.title,
      description: product.description,
      sku: product.sku,
      price: product.price,
      quantity: product.stock,
      enabled: true,
      weight: product.attributes?.weight || 0,
      galleryImages: product.images.map(url => ({ url }))
    };

    await this.makeRequest(`/${this.storeId}/products`, {
      method: 'POST',
      body: JSON.stringify(ecwidProduct)
    });
  }
}