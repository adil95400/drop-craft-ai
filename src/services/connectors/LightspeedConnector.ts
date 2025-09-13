import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class LightspeedConnector extends BaseConnector {
  constructor(credentials: any) {
    const accountId = credentials.account_id;
    super(credentials, `https://api.lightspeedapp.com/API/Account/${accountId}`);
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Basic ${btoa(this.credentials.api_key + ':' + this.credentials.api_secret)}`,
    };
  }

  protected getSupplierName(): string {
    return 'Lightspeed';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/Account/current.json');
      return !!response.Account;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const limit = Math.min(options.limit || 50, 100);
      const offset = ((options.page || 1) - 1) * limit;
      
      const response = await this.makeRequest(`/Item.json?limit=${limit}&offset=${offset}`);
      
      const items = response.Item || [];
      const itemsArray = Array.isArray(items) ? items : [items];
      
      return itemsArray.map((item: any) => this.normalizeLightspeedProduct(item));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/Item.json?customSku=${sku}`);
      const items = response.Item || [];
      const item = Array.isArray(items) ? items[0] : items;
      
      if (!item) return null;
      
      return this.normalizeLightspeedProduct(item);
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

        await this.createLightspeedItem(product);
        result.imported++;
      } catch (error: any) {
        result.errors.push(`Erreur pour ${product.sku}: ${error.message}`);
      }
    }

    return result;
  }

  private normalizeLightspeedProduct(item: any): SupplierProduct {
    const prices = item.Prices?.ItemPrice || [];
    const defaultPrice = Array.isArray(prices) ? prices[0] : prices;
    
    return {
      id: item.itemID,
      sku: item.customSku || item.systemSku || item.itemID,
      title: item.description,
      description: item.longDescription || '',
      price: parseFloat(defaultPrice?.amount) || 0,
      costPrice: parseFloat(item.avgCost) || undefined,
      currency: 'USD',
      stock: parseInt(item.qtyOnHand) || 0,
      images: [], // Lightspeed images require separate API call
      category: item.categoryID || 'General',
      brand: item.manufacturerSku || '',
      supplier: {
        id: 'lightspeed',
        name: 'Lightspeed',
        sku: item.customSku || item.systemSku || item.itemID
      },
      attributes: {
        systemSku: item.systemSku,
        manufacturerSku: item.manufacturerSku,
        defaultCost: item.defaultCost,
        avgCost: item.avgCost,
        discountable: item.discountable,
        tax: item.tax
      }
    };
  }

  private async createLightspeedItem(product: SupplierProduct): Promise<void> {
    const item = {
      description: product.title,
      longDescription: product.description,
      customSku: product.sku,
      defaultCost: product.costPrice || 0,
      qtyOnHand: product.stock,
      Prices: {
        ItemPrice: [{
          useType: 'Default',
          amount: product.price,
          useTypeID: 1
        }]
      }
    };

    await this.makeRequest('/Item.json', {
      method: 'POST',
      body: JSON.stringify(item)
    });
  }
}