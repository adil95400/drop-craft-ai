import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class PrestaShopConnector extends BaseConnector {
  constructor(credentials: any) {
    const baseUrl = credentials.domain?.replace(/\/$/, '') || credentials.shop_domain?.replace(/\/$/, '');
    super(credentials, `${baseUrl}/api`);
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Basic ${btoa(this.credentials.webservice_key + ':')}`,
    };
  }

  protected getSupplierName(): string {
    return 'PrestaShop';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/categories?display=full&limit=1');
      return !!response.categories;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const limit = options.limit || 50;
      const response = await this.makeRequest(`/products?display=full&limit=${limit}`);
      
      if (!response.products?.product) return [];
      
      const products = Array.isArray(response.products.product) 
        ? response.products.product 
        : [response.products.product];
      
      return products.map((product: any) => this.normalizePrestaProduct(product));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/products?display=full&filter[reference]=${sku}`);
      const products = response.products?.product;
      
      if (!products) return null;
      
      const product = Array.isArray(products) ? products[0] : products;
      return this.normalizePrestaProduct(product);
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

        await this.createPrestaProduct(product);
        result.imported++;
      } catch (error: any) {
        result.errors.push(`Erreur pour ${product.sku}: ${error.message}`);
      }
    }

    return result;
  }

  private normalizePrestaProduct(prestaProduct: any): SupplierProduct {
    const name = prestaProduct.name?.language || prestaProduct.name || '';
    const description = prestaProduct.description?.language || prestaProduct.description || '';
    
    return {
      id: prestaProduct.id?.toString() || '',
      sku: prestaProduct.reference || prestaProduct.id?.toString() || '',
      title: typeof name === 'string' ? name : name[0] || 'Produit',
      description: typeof description === 'string' ? description : description[0] || '',
      price: parseFloat(prestaProduct.price) || 0,
      costPrice: parseFloat(prestaProduct.wholesale_price) || undefined,
      currency: 'EUR',
      stock: parseInt(prestaProduct.quantity) || 0,
      images: this.extractPrestaImages(prestaProduct),
      category: 'General',
      brand: prestaProduct.manufacturer_name || '',
      supplier: {
        id: 'prestashop',
        name: 'PrestaShop',
        sku: prestaProduct.reference || prestaProduct.id?.toString() || ''
      },
      attributes: {
        weight: prestaProduct.weight,
        ean13: prestaProduct.ean13,
        active: prestaProduct.active === '1'
      }
    };
  }

  private extractPrestaImages(product: any): string[] {
    if (!product.associations?.images?.image) return [];
    
    const images = Array.isArray(product.associations.images.image) 
      ? product.associations.images.image 
      : [product.associations.images.image];
    
    return images.map((img: any) => 
      `${this.baseUrl}/images/products/${product.id}/${img.id}`
    );
  }

  private async createPrestaProduct(product: SupplierProduct): Promise<void> {
    const prestaProduct = {
      product: {
        reference: product.sku,
        price: product.price,
        wholesale_price: product.costPrice || 0,
        quantity: product.stock,
        name: {
          language: {
            '@attributes': { id: '1' },
            '#text': product.title
          }
        },
        description: {
          language: {
            '@attributes': { id: '1' },
            '#text': product.description
          }
        },
        active: '1',
        available_for_order: '1',
        show_price: '1',
        state: '1'
      }
    };

    await this.makeRequest('/products', {
      method: 'POST',
      headers: {
        ...this.getAuthHeaders(),
        'Content-Type': 'application/xml'
      },
      body: this.objectToXml(prestaProduct)
    });
  }

  private objectToXml(obj: any): string {
    // Simple XML conversion pour PrestaShop
    return `<?xml version="1.0" encoding="UTF-8"?>
      <prestashop xmlns:xlink="http://www.w3.org/1999/xlink">
        ${JSON.stringify(obj)}
      </prestashop>`;
  }
}