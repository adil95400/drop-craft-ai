import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';

export class CdiscountConnector extends BaseConnector {
  constructor(credentials: any) {
    super(credentials, 'https://ws.cdiscount.com');
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  protected getSupplierName(): string {
    return 'Cdiscount Pro';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      // Test avec l'API de récupération des catégories
      const response = await this.makeRequest('/FrontMarketPlace.svc/GetAllowedCategoryTree', {
        method: 'POST',
        body: JSON.stringify({
          ApiKey: this.credentials.api_key,
          Token: this.credentials.access_token
        })
      });
      return !!response.OperationSuccess;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const limit = Math.min(options.limit || 50, 1000);
      const response = await this.makeRequest('/FrontMarketPlace.svc/GetProductList', {
        method: 'POST',
        body: JSON.stringify({
          ApiKey: this.credentials.api_key,
          Token: this.credentials.access_token,
          ProductFilter: {
            Pagination: {
              ItemsPerPage: limit,
              PageNumber: options.page || 1
            }
          }
        })
      });
      
      const products = response.ProductList || [];
      return products.map((product: any) => this.normalizeCdiscountProduct(product));
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest('/FrontMarketPlace.svc/GetProductList', {
        method: 'POST',
        body: JSON.stringify({
          ApiKey: this.credentials.api_key,
          Token: this.credentials.access_token,
          ProductFilter: {
            SellerProductId: sku
          }
        })
      });
      
      const products = response.ProductList || [];
      if (products.length === 0) return null;
      
      return this.normalizeCdiscountProduct(products[0]);
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

        await this.createCdiscountOffer(product);
        result.imported++;
      } catch (error: any) {
        result.errors.push(`Erreur pour ${product.sku}: ${error.message}`);
      }
    }

    return result;
  }

  private normalizeCdiscountProduct(cdiscountProduct: any): SupplierProduct {
    return {
      id: cdiscountProduct.Id || cdiscountProduct.SellerProductId,
      sku: cdiscountProduct.SellerProductId || cdiscountProduct.Id,
      title: cdiscountProduct.Name || 'Produit Cdiscount',
      description: cdiscountProduct.ShortDescription || cdiscountProduct.LongDescription || '',
      price: parseFloat(cdiscountProduct.SalePrice) || 0,
      costPrice: parseFloat(cdiscountProduct.BuyingPrice) || undefined,
      currency: 'EUR',
      stock: cdiscountProduct.ProductCondition?.StockQuantity || 0,
      images: cdiscountProduct.MainImageUrl ? [cdiscountProduct.MainImageUrl] : [],
      category: cdiscountProduct.CategoryCode || 'General',
      brand: cdiscountProduct.Brand || '',
      supplier: {
        id: 'cdiscount',
        name: 'Cdiscount Pro',
        sku: cdiscountProduct.SellerProductId || cdiscountProduct.Id
      },
      attributes: {
        ean: cdiscountProduct.Ean,
        weight: cdiscountProduct.Size?.Weight,
        preparationTime: cdiscountProduct.PreparationTime,
        categoryCode: cdiscountProduct.CategoryCode,
        condition: cdiscountProduct.ProductCondition?.Condition
      }
    };
  }

  private async createCdiscountOffer(product: SupplierProduct): Promise<void> {
    const cdiscountOffer = {
      ApiKey: this.credentials.api_key,
      Token: this.credentials.access_token,
      OfferIntegration: {
        ProductPackage: {
          RefPackage: `package-${product.sku}`,
          Products: [{
            SellerProductId: product.sku,
            Name: product.title,
            ShortDescription: product.description.substring(0, 200),
            LongDescription: product.description,
            Brand: product.brand,
            Size: {
              Weight: product.attributes?.weight || 100
            },
            Navigation: {
              CategoryCode: product.attributes?.categoryCode || '10101'
            },
            Ean: product.attributes?.ean || ''
          }]
        },
        OfferPackage: {
          RefPackage: `offer-${product.sku}`,
          Offers: [{
            SellerProductId: product.sku,
            ProductCondition: {
              Condition: 'NewProduct',
              StockQuantity: product.stock
            },
            Price: product.price,
            EcoPart: 0,
            DeliveryInformation: {
              DeliveryMode: 'Standard',
              PreparationTime: 5
            }
          }]
        }
      }
    };

    await this.makeRequest('/FrontMarketPlace.svc/SubmitOfferPackage', {
      method: 'POST',
      body: JSON.stringify(cdiscountOffer)
    });
  }
}