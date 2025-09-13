import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class FnacConnector extends BaseConnector {
  constructor(credentials: any) {
    super(credentials, 'https://sandbox.fnacmarketplace.com');
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.access_token}`,
      'Content-Type': 'application/xml',
    };
  }

  protected getSupplierName(): string {
    return 'Fnac Marketplace';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/offers');
      return !!response;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const response = await this.makeRequest('/offers');
      
      // Fnac uses XML, this is a simplified version
      const items = response.offers || [];
      return items.map((item: any) => this.normalizeFnacProduct(item));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/offers/${sku}`);
      
      if (!response.offer) return null;
      
      return this.normalizeFnacProduct(response.offer);
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
      errors: ['Fnac requires complex XML integration - use Fnac seller center']
    };

    return result;
  }

  private normalizeFnacProduct(fnacProduct: any): SupplierProduct {
    return {
      id: fnacProduct.offer_reference || fnacProduct.sku,
      sku: fnacProduct.sku || fnacProduct.offer_reference,
      title: fnacProduct.product_name || 'Produit Fnac',
      description: fnacProduct.description || '',
      price: parseFloat(fnacProduct.price) || 0,
      costPrice: undefined,
      currency: 'EUR',
      stock: parseInt(fnacProduct.quantity) || 0,
      images: fnacProduct.images || [],
      category: fnacProduct.product_type || 'General',
      brand: fnacProduct.brand || '',
      supplier: {
        id: 'fnac',
        name: 'Fnac Marketplace',
        sku: fnacProduct.sku || fnacProduct.offer_reference
      },
      attributes: {
        fnacId: fnacProduct.offer_reference,
        ean: fnacProduct.ean,
        productType: fnacProduct.product_type
      }
    };
  }
}