import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';
import { logError, logAction } from '@/utils/consoleCleanup';

export class AlibabaConnector extends BaseConnector {
  private language: string;

  constructor(credentials: any) {
    super(credentials, 'https://gw.open.1688.com/openapi');
    this.language = credentials.language || 'en';
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'access_token': this.credentials.access_token,
      'Content-Type': 'application/json',
    };
  }

  protected getSupplierName(): string {
    return 'Alibaba';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // Test avec l'API de profil utilisateur
      const response = await this.makeRequest('/param2/1/system.oauth2/getToken', {
        method: 'POST'
      });
      return !!response;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const params = {
        pageSize: options.limit || 50,
        pageNo: options.page || 1,
        ...(options.category && { categoryId: options.category }),
        language: this.language
      };

      // Utilisation de l'API de recherche de produits Alibaba
      const response = await this.makeRequest('/param2/1/com.alibaba.product/alibaba.product.search', {
        method: 'POST',
        body: JSON.stringify(params)
      });
      
      if (!response.result?.products) return [];

      return response.result.products.map((product: any) => this.normalizeAlibabaProduct(product));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(productId: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest('/param2/1/com.alibaba.product/alibaba.product.get', {
        method: 'POST',
        body: JSON.stringify({
          productId: productId,
          language: this.language
        })
      });
      
      if (!response.result) return null;
      
      return this.normalizeAlibabaProduct(response.result);
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

    logAction('Starting Alibaba inventory sync', { count: products.length });

    // Note: Alibaba est principalement une plateforme de sourcing B2B
    // L'inventaire est généralement géré par les fournisseurs
    for (const product of products) {
      try {
        await this.delay();
        
        // Synchroniser les informations du produit pour notre base de données
        const productDetails = await this.fetchProduct(product.id);
        
        if (productDetails) {
          logAction('Alibaba product synchronized', { id: product.id });
          result.imported++;
        } else {
          result.duplicates++;
        }
      } catch (error: any) {
        result.errors.push(`Erreur pour ${product.id}: ${error.message}`);
        logError(error, `Alibaba sync for ${product.id}`);
      }
    }

    return result;
  }

  private normalizeAlibabaProduct(alibabaProduct: any): SupplierProduct {
    const mainImage = alibabaProduct.mainImage || alibabaProduct.images?.[0];
    const price = this.parseAlibabaPrice(alibabaProduct.priceInfo);
    
    return {
      id: alibabaProduct.productId?.toString() || alibabaProduct.id?.toString(),
      sku: alibabaProduct.productId?.toString() || `alibaba-${alibabaProduct.id}`,
      title: alibabaProduct.subject || alibabaProduct.productName || '',
      description: alibabaProduct.description || alibabaProduct.productDesc || '',
      price: price.min || 0,
      costPrice: price.max || undefined,
      currency: price.currency || 'USD',
      stock: alibabaProduct.saledQuantity || 999, // Alibaba ne fournit pas toujours le stock exact
      images: this.extractAlibabaImages(alibabaProduct),
      category: alibabaProduct.categoryName || 'General',
      brand: alibabaProduct.company?.companyName || '',
      supplier: {
        id: 'alibaba',
        name: 'Alibaba',
        sku: alibabaProduct.productId?.toString() || `alibaba-${alibabaProduct.id}`
      },
      attributes: {
        product_id: alibabaProduct.productId,
        company: {
          id: alibabaProduct.company?.companyId,
          name: alibabaProduct.company?.companyName,
          type: alibabaProduct.company?.companyType
        },
        min_order_quantity: alibabaProduct.saledQuantity || 1,
        payment_methods: alibabaProduct.paymentMethods || [],
        shipping_info: alibabaProduct.shippingInfo || {},
        certifications: alibabaProduct.certifications || [],
        trade_capacity: alibabaProduct.tradeCapacity || {}
      }
    };
  }

  private parseAlibabaPrice(priceInfo: any): { min: number; max: number; currency: string } {
    if (!priceInfo) return { min: 0, max: 0, currency: 'USD' };

    // Les prix Alibaba sont souvent des fourchettes
    const ranges = priceInfo.priceRanges || [];
    if (ranges.length > 0) {
      return {
        min: parseFloat(ranges[0].price) || 0,
        max: parseFloat(ranges[ranges.length - 1].price) || 0,
        currency: priceInfo.currency || 'USD'
      };
    }

    return {
      min: parseFloat(priceInfo.price) || 0,
      max: parseFloat(priceInfo.price) || 0,
      currency: priceInfo.currency || 'USD'
    };
  }

  private extractAlibabaImages(product: any): string[] {
    const images: string[] = [];
    
    if (product.mainImage) {
      images.push(product.mainImage);
    }
    
    if (product.images && Array.isArray(product.images)) {
      images.push(...product.images);
    }
    
    if (product.imageList && Array.isArray(product.imageList)) {
      images.push(...product.imageList);
    }

    // Nettoyer les URLs (Alibaba utilise parfois des URLs relatives)
    return images
      .map(img => img.startsWith('http') ? img : `https:${img}`)
      .filter((img, index, arr) => arr.indexOf(img) === index); // Supprimer les doublons
  }

  async searchProducts(keyword: string, options: any = {}): Promise<SupplierProduct[]> {
    try {
      const params = {
        keywords: keyword,
        pageSize: options.limit || 50,
        pageNo: options.page || 1,
        language: this.language,
        ...options
      };

      const response = await this.makeRequest('/param2/1/com.alibaba.product/alibaba.product.search', {
        method: 'POST',
        body: JSON.stringify(params)
      });
      
      if (!response.result?.products) return [];

      return response.result.products.map((product: any) => this.normalizeAlibabaProduct(product));
    } catch (error) {
      this.handleError(error, 'product search');
      return [];
    }
  }

  async getCategories(): Promise<any[]> {
    try {
      const response = await this.makeRequest('/param2/1/com.alibaba.product/alibaba.category.get', {
        method: 'POST',
        body: JSON.stringify({
          language: this.language
        })
      });
      
      return response.result?.categories || [];
    } catch (error) {
      this.handleError(error, 'categories fetching');
      return [];
    }
  }

  async getSupplierInfo(companyId: string): Promise<any> {
    try {
      const response = await this.makeRequest('/param2/1/com.alibaba.company/alibaba.company.get', {
        method: 'POST',
        body: JSON.stringify({
          companyId: companyId,
          language: this.language
        })
      });
      
      return response.result || null;
    } catch (error) {
      this.handleError(error, 'supplier info fetching');
      return null;
    }
  }

  async getQuotation(productId: string, quantity: number): Promise<any> {
    try {
      const response = await this.makeRequest('/param2/1/com.alibaba.trade/alibaba.trade.getBuyerView', {
        method: 'POST',
        body: JSON.stringify({
          productId: productId,
          quantity: quantity,
          language: this.language
        })
      });
      
      return response.result || null;
    } catch (error) {
      this.handleError(error, 'quotation fetching');
      return null;
    }
  }
}