import { BaseConnector, SupplierProduct, SupplierCredentials, SyncResult, FetchOptions } from './BaseConnector';

export class AmazonConnector extends BaseConnector {
  constructor(credentials: SupplierCredentials) {
    const region = credentials.region || 'us-east-1';
    super(credentials, `https://sellingpartnerapi-${region}.amazon.com`);
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'x-amz-access-token': this.credentials.accessToken || '',
    };
  }

  protected getSupplierName(): string {
    return 'Amazon SP-API';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      await this.makeRequest('/catalog/2022-04-01/items?marketplaceIds=' + this.credentials.marketplace_id + '&pageSize=1');
      return true;
    } catch (error) {
      this.handleError(error, 'Credential validation');
      return false;
    }
  }

  async fetchProducts(options?: FetchOptions): Promise<SupplierProduct[]> {
    try {
      const params = new URLSearchParams({
        marketplaceIds: this.credentials.marketplace_id || '',
        pageSize: String(options?.limit || 20),
      });

      const response = await this.makeRequest(`/catalog/2022-04-01/items?${params}`);
      return response.items?.map((item: any) => this.normalizeAmazonProduct(item)) || [];
    } catch (error) {
      this.handleError(error, 'Fetch products');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(
        `/catalog/2022-04-01/items?marketplaceIds=${this.credentials.marketplace_id}&identifiers=${sku}`
      );
      if (response.items?.length > 0) {
        return this.normalizeAmazonProduct(response.items[0]);
      }
      return null;
    } catch (error) {
      this.handleError(error, 'Fetch product');
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<SyncResult> {
    const result: SyncResult = { total: products.length, imported: 0, duplicates: 0, errors: [] };

    for (const product of products) {
      try {
        await this.makeRequest('/fba/inventory/v1/summaries', {
          method: 'POST',
          body: JSON.stringify({
            sku: product.sku,
            quantity: product.stock,
          }),
        });
        result.imported++;
      } catch (error: any) {
        result.errors.push(`${product.sku}: ${error.message}`);
      }
      await this.delay();
    }

    return result;
  }

  private normalizeAmazonProduct(item: any): SupplierProduct {
    const attributes = item.attributes || {};
    return {
      id: item.asin,
      sku: item.identifiers?.[0]?.identifier || item.asin,
      title: attributes.item_name?.[0]?.value || 'Unknown',
      description: attributes.bullet_point?.map((bp: any) => bp.value).join('\n') || '',
      price: parseFloat(attributes.list_price?.[0]?.value || 0),
      currency: attributes.list_price?.[0]?.currency || 'USD',
      stock: 0,
      images: attributes.main_product_image_locator?.map((img: any) => img.value) || [],
      category: attributes.product_type?.[0]?.value || 'General',
      brand: attributes.brand?.[0]?.value || '',
      attributes: attributes,
      supplier: {
        id: 'amazon',
        name: 'Amazon',
        sku: item.asin,
      },
    };
  }
}
