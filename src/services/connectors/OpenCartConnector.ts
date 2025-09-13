import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class OpenCartConnector extends BaseConnector {
  constructor(credentials: any) {
    const baseUrl = credentials.domain?.replace(/\/$/, '') || credentials.shop_domain?.replace(/\/$/, '');
    super(credentials, `${baseUrl}/index.php?route=api`);
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.api_key}`,
    };
  }

  protected getSupplierName(): string {
    return 'OpenCart';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/product/product');
      return Array.isArray(response) || !!response.products;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const limit = options.limit || 50;
      const page = options.page || 1;
      const response = await this.makeRequest(`/product/product&limit=${limit}&page=${page}`);
      
      const products = Array.isArray(response) ? response : response.products || [];
      return products.map((product: any) => this.normalizeOpenCartProduct(product));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/product/product&filter_sku=${sku}`);
      const products = Array.isArray(response) ? response : response.products || [];
      
      if (products.length === 0) return null;
      
      return this.normalizeOpenCartProduct(products[0]);
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

        await this.createOpenCartProduct(product);
        result.imported++;
      } catch (error: any) {
        result.errors.push(`Erreur pour ${product.sku}: ${error.message}`);
      }
    }

    return result;
  }

  private normalizeOpenCartProduct(ocProduct: any): SupplierProduct {
    return {
      id: ocProduct.product_id?.toString() || ocProduct.id?.toString() || '',
      sku: ocProduct.sku || ocProduct.model || ocProduct.product_id?.toString() || '',
      title: ocProduct.name || 'Produit OpenCart',
      description: ocProduct.description || '',
      price: parseFloat(ocProduct.price) || 0,
      costPrice: parseFloat(ocProduct.cost) || undefined,
      currency: 'EUR',
      stock: parseInt(ocProduct.quantity) || 0,
      images: ocProduct.image ? [ocProduct.image] : [],
      category: ocProduct.category || 'General',
      brand: ocProduct.manufacturer || '',
      supplier: {
        id: 'opencart',
        name: 'OpenCart',
        sku: ocProduct.sku || ocProduct.model || ocProduct.product_id?.toString() || ''
      },
      attributes: {
        weight: ocProduct.weight,
        length: ocProduct.length,
        width: ocProduct.width,
        height: ocProduct.height,
        status: ocProduct.status === '1'
      }
    };
  }

  private async createOpenCartProduct(product: SupplierProduct): Promise<void> {
    const ocProduct = {
      model: product.sku,
      sku: product.sku,
      price: product.price,
      quantity: product.stock,
      status: '1',
      product_description: {
        1: {
          name: product.title,
          description: product.description,
          meta_title: product.title
        }
      }
    };

    await this.makeRequest('/product/product', {
      method: 'POST',
      body: JSON.stringify(ocProduct)
    });
  }
}