import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class ShopifyConnector extends BaseConnector {
  constructor(credentials: any) {
    const shopDomain = credentials.shop_domain || credentials.domain;
    const baseUrl = shopDomain.includes('myshopify.com') 
      ? `https://${shopDomain}`
      : `https://${shopDomain}.myshopify.com`;
    
    super(credentials, baseUrl);
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'X-Shopify-Access-Token': this.credentials.access_token,
    };
  }

  protected getSupplierName(): string {
    return 'Shopify';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/admin/api/2023-10/shop.json');
      return !!response.shop;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const params = new URLSearchParams({
        limit: (options.limit || 50).toString(),
        ...(options.page && { page: options.page.toString() }),
        ...(options.category && { product_type: options.category }),
      });

      const response = await this.makeRequest(`/admin/api/2023-10/products.json?${params}`);
      
      return response.products.map((product: any) => this.normalizeShopifyProduct(product));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/admin/api/2023-10/products.json?handle=${sku}`);
      const product = response.products[0];
      
      if (!product) return null;
      
      return this.normalizeShopifyProduct(product);
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
        
        // Vérifier si le produit existe déjà
        const existingProduct = await this.fetchProduct(product.sku);
        
        if (existingProduct) {
          result.duplicates++;
          continue;
        }

        // Créer le produit via l'API Shopify
        await this.createShopifyProduct(product);
        result.imported++;
      } catch (error: any) {
        result.errors.push(`Erreur pour ${product.sku}: ${error.message}`);
      }
    }

    return result;
  }

  private normalizeShopifyProduct(shopifyProduct: any): SupplierProduct {
    const variant = shopifyProduct.variants?.[0] || {};
    
    return {
      id: shopifyProduct.id.toString(),
      sku: variant.sku || shopifyProduct.handle,
      title: shopifyProduct.title,
      description: shopifyProduct.body_html || '',
      price: parseFloat(variant.price) || 0,
      costPrice: parseFloat(variant.compare_at_price) || undefined,
      currency: 'EUR', // À adapter selon la boutique
      stock: variant.inventory_quantity || 0,
      images: shopifyProduct.images?.map((img: any) => img.src) || [],
      category: shopifyProduct.product_type || 'General',
      brand: shopifyProduct.vendor || '',
      supplier: {
        id: 'shopify',
        name: 'Shopify',
        sku: variant.sku || shopifyProduct.handle
      },
      attributes: {
        weight: variant.weight,
        weight_unit: variant.weight_unit,
        requires_shipping: variant.requires_shipping,
        tags: shopifyProduct.tags?.split(',') || []
      }
    };
  }

  private async createShopifyProduct(product: SupplierProduct): Promise<void> {
    const shopifyProduct = {
      product: {
        title: product.title,
        body_html: product.description,
        vendor: product.brand,
        product_type: product.category,
        tags: product.attributes?.tags?.join(',') || '',
        variants: [{
          price: product.price.toString(),
          sku: product.sku,
          inventory_quantity: product.stock,
          requires_shipping: true,
          weight: product.attributes?.weight || 0,
          weight_unit: product.attributes?.weight_unit || 'kg'
        }],
        images: product.images.map(url => ({ src: url }))
      }
    };

    await this.makeRequest('/admin/api/2023-10/products.json', {
      method: 'POST',
      body: JSON.stringify(shopifyProduct)
    });
  }
}