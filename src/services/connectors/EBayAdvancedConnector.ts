import { BaseConnector, FetchOptions, SyncResult } from './BaseConnector';
import { SupplierCredentials, SupplierProduct } from '@/types/suppliers';

interface EBayCredentials extends SupplierCredentials {
  clientId: string;
  clientSecret: string;
  accessToken: string;
  refreshToken: string;
  environment: 'sandbox' | 'production';
  marketplaceId?: string;
}

interface EBayListing {
  listingId: string;
  sku: string;
  title: string;
  description: string;
  categoryId: string;
  condition: string;
  price: {
    value: string;
    currency: string;
  };
  quantity: number;
  listingDuration: string;
  listingType: string;
  itemSpecifics: EBayItemSpecific[];
  pictureDetails: {
    pictureURL: string[];
  };
  shippingDetails: EBayShippingDetails;
  returnPolicy: EBayReturnPolicy;
  paymentDetails: EBayPaymentDetails;
}

interface EBayItemSpecific {
  name: string;
  value: string[];
}

interface EBayShippingDetails {
  shippingServiceOptions: {
    shippingService: string;
    shippingServiceCost: {
      value: string;
      currency: string;
    };
  }[];
}

interface EBayReturnPolicy {
  returnsAccepted: boolean;
  returnPeriod: string;
  refundMethod: string;
}

interface EBayPaymentDetails {
  paymentMethods: string[];
  immediatePayRequired: boolean;
}

export class EBayAdvancedConnector extends BaseConnector {
  private clientId: string;
  private clientSecret: string;
  private accessToken: string;
  private refreshToken: string;
  private environment: 'sandbox' | 'production';
  private marketplaceId: string;

  constructor(credentials: EBayCredentials) {
    const baseUrl = credentials.environment === 'sandbox' 
      ? 'https://api.sandbox.ebay.com'
      : 'https://api.ebay.com';
    
    super(credentials, baseUrl);
    this.clientId = credentials.clientId;
    this.clientSecret = credentials.clientSecret;
    this.accessToken = credentials.accessToken;
    this.refreshToken = credentials.refreshToken;
    this.environment = credentials.environment;
    this.marketplaceId = credentials.marketplaceId || 'EBAY_US';
    this.rateLimitDelay = 1000; // eBay has strict rate limits
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.accessToken}`,
      'X-EBAY-API-MARKETPLACE-ID': this.marketplaceId,
      'X-EBAY-API-CALL-LEVEL': '119',
    };
  }

  protected getSupplierName(): string {
    return 'eBay';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/sell/account/v1/fulfillment_policy');
      return !!response;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const { page = 1, limit = 50, lastSync } = options;
      
      const offset = (page - 1) * limit;
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: offset.toString(),
      });

      if (lastSync) {
        params.append('modification_date.range_start', lastSync.toISOString());
      }

      // Use Inventory API to get active listings
      const response = await this.makeRequest(`/sell/inventory/v1/inventory_item?${params}`);
      
      const products: SupplierProduct[] = [];
      
      for (const inventoryItem of response.inventoryItems || []) {
        try {
          // Get offer details for each inventory item
          const offerResponse = await this.makeRequest(`/sell/inventory/v1/inventory_item/${inventoryItem.sku}/offer`);
          
          const product = this.convertToSupplierProduct(inventoryItem, offerResponse.offers?.[0]);
          if (product) {
            products.push(product);
          }
          
          await this.delay(); // Rate limiting
        } catch (offerError) {
          console.warn(`Failed to fetch offer for SKU ${inventoryItem.sku}:`, offerError);
        }
      }
      
      return products;
    } catch (error) {
      this.handleError(error, 'product fetch');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const inventoryResponse = await this.makeRequest(`/sell/inventory/v1/inventory_item/${sku}`);
      const offerResponse = await this.makeRequest(`/sell/inventory/v1/inventory_item/${sku}/offer`);
      
      return this.convertToSupplierProduct(inventoryResponse, offerResponse.offers?.[0]);
    } catch (error) {
      this.handleError(error, 'single product fetch');
      return null;
    }
  }

  async updateInventory(products: SupplierProduct[]): Promise<SyncResult> {
    const result: SyncResult = { total: products.length, imported: 0, duplicates: 0, errors: [] };

    for (const product of products) {
      try {
        await this.delay();

        // Update inventory item
        const inventoryUpdate = {
          availability: {
            shipToLocationAvailability: {
              quantity: product.stock
            }
          }
        };

        await this.makeRequest(`/sell/inventory/v1/inventory_item/${product.sku}`, {
          method: 'PUT',
          body: JSON.stringify(inventoryUpdate)
        });

        // If product has variants, update each variant
        if (product.variants && product.variants.length > 0) {
          for (const variant of product.variants) {
            const variantUpdate = {
              availability: {
                shipToLocationAvailability: {
                  quantity: variant.stock
                }
              }
            };

            await this.makeRequest(`/sell/inventory/v1/inventory_item/${variant.sku}`, {
              method: 'PUT',
              body: JSON.stringify(variantUpdate)
            });

            await this.delay(200); // Extra delay for variants
          }
        }

        result.imported++;
      } catch (error) {
        result.errors.push(`Failed to update inventory for ${product.sku}: ${error}`);
      }
    }

    return result;
  }

  async updatePrices(products: SupplierProduct[]): Promise<SyncResult> {
    const result: SyncResult = { total: products.length, imported: 0, duplicates: 0, errors: [] };

    for (const product of products) {
      try {
        await this.delay();

        // Get existing offers for this inventory item
        const offersResponse = await this.makeRequest(`/sell/inventory/v1/inventory_item/${product.sku}/offer`);
        
        for (const offer of offersResponse.offers || []) {
          const priceUpdate = {
            pricingSummary: {
              price: {
                value: product.price.toString(),
                currency: product.currency
              }
            }
          };

          await this.makeRequest(`/sell/inventory/v1/offer/${offer.offerId}`, {
            method: 'PUT',
            body: JSON.stringify(priceUpdate)
          });
        }

        result.imported++;
      } catch (error) {
        result.errors.push(`Failed to update price for ${product.sku}: ${error}`);
      }
    }

    return result;
  }

  private convertToSupplierProduct(inventoryItem: any, offer?: any): SupplierProduct | null {
    try {
      const product = inventoryItem.product || {};
      const availability = inventoryItem.availability?.shipToLocationAvailability || {};
      
      return {
        id: inventoryItem.sku,
        sku: inventoryItem.sku,
        title: product.title || 'Unknown Product',
        description: product.description || '',
        price: offer?.pricingSummary?.price ? parseFloat(offer.pricingSummary.price.value) : 0,
        currency: offer?.pricingSummary?.price?.currency || 'USD',
        stock: availability.quantity || 0,
        images: product.imageUrls || [],
        category: this.mapEBayCategoryToGeneral(offer?.categoryId),
        brand: this.extractBrandFromAspects(product.aspects),
        weight: this.extractWeightFromAspects(product.aspects),
        dimensions: this.extractDimensionsFromPackage(inventoryItem.packageWeightAndSize),
        attributes: {
          condition: inventoryItem.condition,
          conditionDescription: inventoryItem.conditionDescription,
          categoryId: offer?.categoryId,
          aspects: product.aspects,
          upc: product.upc,
          ean: product.ean,
          isbn: product.isbn,
          mpn: product.mpn,
          brand: product.brand,
          packageWeightAndSize: inventoryItem.packageWeightAndSize
        },
        supplier: {
          id: 'ebay',
          name: 'eBay',
          sku: inventoryItem.sku
        },
        supplierProductId: inventoryItem.sku
      };
    } catch (error) {
      console.error('Error converting eBay product:', error);
      return null;
    }
  }

  private mapEBayCategoryToGeneral(categoryId?: string): string {
    // Simplified category mapping - in real implementation, use eBay category API
    const categoryMap: Record<string, string> = {
      '267': 'Books',
      '11450': 'Clothing',
      '58058': 'Electronics',
      '14339': 'Crafts',
      '888': 'Collectibles'
    };

    return categoryMap[categoryId || ''] || 'General';
  }

  private extractBrandFromAspects(aspects?: Record<string, string[]>): string | undefined {
    if (!aspects) return undefined;
    
    const brandKeys = ['Brand', 'Manufacturer', 'MPN'];
    for (const key of brandKeys) {
      if (aspects[key] && aspects[key].length > 0) {
        return aspects[key][0];
      }
    }
    return undefined;
  }

  private extractWeightFromAspects(aspects?: Record<string, string[]>): number | undefined {
    if (!aspects) return undefined;
    
    const weightKeys = ['Weight', 'Shipping Weight', 'Item Weight'];
    for (const key of weightKeys) {
      if (aspects[key] && aspects[key].length > 0) {
        const weight = parseFloat(aspects[key][0]);
        if (!isNaN(weight)) return weight;
      }
    }
    return undefined;
  }

  private extractDimensionsFromPackage(packageInfo?: any) {
    if (!packageInfo?.dimensions) return undefined;
    
    return {
      length: parseFloat(packageInfo.dimensions.length) || 0,
      width: parseFloat(packageInfo.dimensions.width) || 0,
      height: parseFloat(packageInfo.dimensions.height) || 0
    };
  }

  // eBay-specific methods
  async createListing(product: SupplierProduct): Promise<string | null> {
    try {
      // Step 1: Create inventory item
      const inventoryData = {
        availability: {
          shipToLocationAvailability: {
            quantity: product.stock
          }
        },
        condition: 'NEW',
        product: {
          title: product.title,
          description: product.description,
          imageUrls: product.images.slice(0, 12), // eBay allows max 12 images
          aspects: this.convertToEBayAspects(product)
        }
      };

      await this.makeRequest(`/sell/inventory/v1/inventory_item/${product.sku}`, {
        method: 'PUT',
        body: JSON.stringify(inventoryData)
      });

      // Step 2: Create offer
      const offerData = {
        sku: product.sku,
        marketplaceId: this.marketplaceId,
        format: 'FIXED_PRICE',
        categoryId: '267', // Default category - should be configurable
        pricingSummary: {
          price: {
            value: product.price.toString(),
            currency: product.currency
          }
        },
        listingDescription: product.description,
        merchantLocationKey: 'default_location' // Should be configurable
      };

      const offerResponse = await this.makeRequest('/sell/inventory/v1/offer', {
        method: 'POST',
        body: JSON.stringify(offerData)
      });

      // Step 3: Publish offer
      if (offerResponse.offerId) {
        await this.makeRequest(`/sell/inventory/v1/offer/${offerResponse.offerId}/publish`, {
          method: 'POST',
          body: JSON.stringify({})
        });

        return offerResponse.offerId;
      }

      return null;
    } catch (error) {
      this.handleError(error, 'listing creation');
      return null;
    }
  }

  private convertToEBayAspects(product: SupplierProduct): Record<string, string[]> {
    const aspects: Record<string, string[]> = {};

    if (product.brand) {
      aspects['Brand'] = [product.brand];
    }

    if (product.attributes?.color) {
      aspects['Color'] = [product.attributes.color];
    }

    if (product.attributes?.size) {
      aspects['Size'] = [product.attributes.size];
    }

    if (product.attributes?.material) {
      aspects['Material'] = [product.attributes.material];
    }

    return aspects;
  }

  async getOrders(status?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        limit: '50'
      });

      if (status) {
        params.append('orderfulfillmentstatus', status);
      }

      const response = await this.makeRequest(`/sell/fulfillment/v1/order?${params}`);
      return response.orders || [];
    } catch (error) {
      this.handleError(error, 'orders fetch');
      return [];
    }
  }

  async refreshAccessToken(): Promise<boolean> {
    try {
      const authHeader = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
      
      const response = await fetch(`${this.baseUrl}/identity/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authHeader}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: this.refreshToken
        })
      });

      if (response.ok) {
        const tokenData = await response.json();
        this.accessToken = tokenData.access_token;
        return true;
      }

      return false;
    } catch (error) {
      this.handleError(error, 'token refresh');
      return false;
    }
  }
}