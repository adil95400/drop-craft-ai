import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class ShopeeConnector extends BaseConnector {
  constructor(credentials: any) {
    super(credentials, 'https://partner.shopeemobile.com');
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  protected getSupplierName(): string {
    return 'Shopee';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest(`/api/v2/shop/get_shop_info?shop_id=${this.credentials.shop_id}`);
      return !!response.shop_name;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const response = await this.makeRequest(`/api/v2/product/get_item_list?shop_id=${this.credentials.shop_id}`);
      
      const items = response.response?.item || [];
      const products = await Promise.all(
        items.map(async (item: any) => {
          const detailResponse = await this.makeRequest(`/api/v2/product/get_item_base_info?item_id_list=${item.item_id}&shop_id=${this.credentials.shop_id}`);
          return this.normalizeShopeeProduct(detailResponse.response?.item_list[0]);
        })
      );
      
      return products;
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/api/v2/product/get_item_base_info?item_id_list=${sku}&shop_id=${this.credentials.shop_id}`);
      
      if (!response.response?.item_list?.[0]) return null;
      
      return this.normalizeShopeeProduct(response.response.item_list[0]);
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
        await this.makeRequest('/api/v2/product/update_stock', {
          method: 'POST',
          body: JSON.stringify({
            shop_id: this.credentials.shop_id,
            item_id: product.id,
            stock_list: [{
              model_id: 0,
              normal_stock: product.stock
            }]
          })
        });
        result.imported++;
      } catch (error) {
        result.errors.push(`Failed to update ${product.sku}: ${error}`);
      }
    }

    return result;
  }

  private normalizeShopeeProduct(shopeeProduct: any): SupplierProduct {
    return {
      id: shopeeProduct.item_id?.toString() || '',
      sku: shopeeProduct.item_sku || shopeeProduct.item_id?.toString() || '',
      title: shopeeProduct.item_name || 'Produit Shopee',
      description: shopeeProduct.description || '',
      price: parseFloat(shopeeProduct.price_info?.[0]?.current_price) || 0,
      costPrice: undefined,
      currency: shopeeProduct.currency || 'SGD',
      stock: parseInt(shopeeProduct.stock_info?.[0]?.current_stock) || 0,
      images: shopeeProduct.image?.image_url_list || [],
      category: shopeeProduct.category_id?.toString() || 'General',
      brand: shopeeProduct.brand?.original_brand_name || '',
      supplier: {
        id: 'shopee',
        name: 'Shopee',
        sku: shopeeProduct.item_sku || shopeeProduct.item_id?.toString() || ''
      },
      attributes: {
        shopeeId: shopeeProduct.item_id,
        categoryId: shopeeProduct.category_id,
        weight: shopeeProduct.weight,
        dimensions: shopeeProduct.dimension
      }
    };
  }
}