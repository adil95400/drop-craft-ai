import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class MagentoConnector extends BaseConnector {
  constructor(credentials: any) {
    const baseUrl = credentials.domain?.replace(/\/$/, '') || credentials.shop_domain?.replace(/\/$/, '');
    super(credentials, `${baseUrl}/rest/V1`);
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.access_token}`,
    };
  }

  protected getSupplierName(): string {
    return 'Magento';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/store/storeViews');
      return Array.isArray(response);
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const searchCriteria = {
        searchCriteria: {
          pageSize: options.limit || 50,
          currentPage: options.page || 1,
          ...(options.category && {
            filterGroups: [{
              filters: [{
                field: 'category_id',
                value: options.category,
                conditionType: 'eq'
              }]
            }]
          })
        }
      };

      const params = new URLSearchParams();
      Object.entries(searchCriteria.searchCriteria).forEach(([key, value]) => {
        params.append(`searchCriteria[${key}]`, value.toString());
      });

      const response = await this.makeRequest(`/products?${params}`);
      
      return response.items.map((product: any) => this.normalizeMagentoProduct(product));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/products/${encodeURIComponent(sku)}`);
      return this.normalizeMagentoProduct(response);
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

        await this.createMagentoProduct(product);
        result.imported++;
      } catch (error: any) {
        result.errors.push(`Erreur pour ${product.sku}: ${error.message}`);
      }
    }

    return result;
  }

  private normalizeMagentoProduct(magentoProduct: any): SupplierProduct {
    const getName = (attr: any[]) => {
      const nameAttr = attr.find(a => a.attribute_code === 'name');
      return nameAttr?.value || 'Produit';
    };

    const getDescription = (attr: any[]) => {
      const descAttr = attr.find(a => a.attribute_code === 'description');
      return descAttr?.value || '';
    };

    const getPrice = (attr: any[]) => {
      const priceAttr = attr.find(a => a.attribute_code === 'price');
      return parseFloat(priceAttr?.value) || 0;
    };

    const getBrand = (attr: any[]) => {
      const brandAttr = attr.find(a => a.attribute_code === 'manufacturer');
      return brandAttr?.value || '';
    };

    return {
      id: magentoProduct.id?.toString() || '',
      sku: magentoProduct.sku || '',
      title: getName(magentoProduct.custom_attributes || []),
      description: getDescription(magentoProduct.custom_attributes || []),
      price: getPrice(magentoProduct.custom_attributes || []),
      costPrice: undefined,
      currency: 'EUR',
      stock: magentoProduct.extension_attributes?.stock_item?.qty || 0,
      images: this.extractMagentoImages(magentoProduct),
      category: 'General',
      brand: getBrand(magentoProduct.custom_attributes || []),
      supplier: {
        id: 'magento',
        name: 'Magento',
        sku: magentoProduct.sku || ''
      },
      attributes: {
        weight: magentoProduct.weight,
        status: magentoProduct.status,
        visibility: magentoProduct.visibility,
        type_id: magentoProduct.type_id
      }
    };
  }

  private extractMagentoImages(product: any): string[] {
    if (!product.media_gallery_entries) return [];
    
    return product.media_gallery_entries
      .filter((entry: any) => entry.media_type === 'image')
      .map((entry: any) => `${this.baseUrl.replace('/rest/V1', '')}/media/catalog/product${entry.file}`);
  }

  private async createMagentoProduct(product: SupplierProduct): Promise<void> {
    const magentoProduct = {
      product: {
        sku: product.sku,
        name: product.title,
        price: product.price,
        status: 1,
        visibility: 4,
        type_id: 'simple',
        weight: product.attributes?.weight || 1,
        attribute_set_id: 4,
        custom_attributes: [
          {
            attribute_code: 'description',
            value: product.description
          },
          {
            attribute_code: 'short_description',
            value: product.description.substring(0, 120)
          }
        ],
        extension_attributes: {
          stock_item: {
            qty: product.stock,
            is_in_stock: product.stock > 0,
            manage_stock: true
          }
        }
      }
    };

    await this.makeRequest('/products', {
      method: 'POST',
      body: JSON.stringify(magentoProduct)
    });
  }
}