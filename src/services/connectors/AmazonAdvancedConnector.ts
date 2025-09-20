import { BaseConnector, FetchOptions, SyncResult } from './BaseConnector';
import { SupplierCredentials, SupplierProduct } from '@/types/suppliers';

interface AmazonCredentials extends SupplierCredentials {
  sellerId: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  marketplaceId: string;
  refreshToken: string;
}

interface AmazonProduct {
  ASIN: string;
  SellerSKU: string;
  Title: string;
  Description: string;
  Brand: string;
  Category: string;
  Price: number;
  Currency: string;
  Quantity: number;
  Images: string[];
  Variations?: AmazonVariation[];
  Dimensions?: {
    Length: number;
    Width: number;
    Height: number;
    Weight: number;
  };
  Keywords: string[];
  BulletPoints: string[];
}

interface AmazonVariation {
  SKU: string;
  ASIN: string;
  Price: number;
  Quantity: number;
  Attributes: Record<string, string>;
}

export class AmazonAdvancedConnector extends BaseConnector {
  private sellerId: string;
  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string;
  private marketplaceId: string;
  private refreshToken: string;

  constructor(credentials: AmazonCredentials) {
    super(credentials, 'https://sellingpartnerapi-na.amazon.com');
    this.sellerId = credentials.sellerId;
    this.accessKeyId = credentials.accessKeyId;
    this.secretAccessKey = credentials.secretAccessKey;
    this.region = credentials.region;
    this.marketplaceId = credentials.marketplaceId;
    this.refreshToken = credentials.refreshToken;
    this.rateLimitDelay = 2000; // Amazon SP-API: strict rate limits
  }

  protected getAuthHeaders(): Record<string, string> {
    // Amazon SP-API requires AWS Signature v4 - simplified for demo
    return {
      'Authorization': `Bearer ${this.refreshToken}`, // In real implementation, use LWA tokens
      'x-amz-access-token': this.refreshToken,
      'x-amzn-marketplace-id': this.marketplaceId,
    };
  }

  protected getSupplierName(): string {
    return 'Amazon Seller Central';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/sellers/v1/marketplaceParticipations');
      return response.payload && response.payload.length > 0;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const { page = 1, limit = 50, lastSync } = options;
      
      // Step 1: Get catalog items
      const catalogResponse = await this.makeRequest('/catalog/2022-04-01/items', {
        method: 'GET',
        headers: {
          ...this.getAuthHeaders(),
        }
      });

      // Step 2: Get inventory for each item
      const products: SupplierProduct[] = [];
      
      for (const item of catalogResponse.items.slice(0, limit)) {
        await this.delay(); // Rate limiting
        
        try {
          const inventoryResponse = await this.makeRequest(`/fba/inventory/v1/summaries?details=true&granularityType=Marketplace&granularityId=${this.marketplaceId}&marketplaceIds=${this.marketplaceId}&sellerSkus=${item.sku}`);
          
          const product = this.convertToSupplierProduct(item, inventoryResponse.inventorySummaries[0]);
          if (product) {
            products.push(product);
          }
        } catch (inventoryError) {
          console.warn(`Failed to fetch inventory for SKU ${item.sku}:`, inventoryError);
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
      const catalogResponse = await this.makeRequest(`/catalog/2022-04-01/items?keywords=${sku}&marketplaceIds=${this.marketplaceId}`);
      
      if (catalogResponse.items && catalogResponse.items.length > 0) {
        const item = catalogResponse.items[0];
        const inventoryResponse = await this.makeRequest(`/fba/inventory/v1/summaries?sellerSkus=${sku}&marketplaceIds=${this.marketplaceId}`);
        
        return this.convertToSupplierProduct(item, inventoryResponse.inventorySummaries[0]);
      }
      
      return null;
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

        // Amazon uses feeds for bulk updates
        const feedDocument = {
          messageType: 'Inventory',
          messages: [{
            messageId: 1,
            sku: product.sku,
            operationType: 'Update',
            inventory: {
              quantity: product.stock,
              fulfillmentLatency: 1
            }
          }]
        };

        // Submit feed (simplified - real implementation would use proper XML format)
        const feedResponse = await this.makeRequest('/feeds/2021-06-30/feeds', {
          method: 'POST',
          body: JSON.stringify(feedDocument)
        });

        if (feedResponse.feedId) {
          result.imported++;
        }
      } catch (error) {
        result.errors.push(`Failed to update inventory for ${product.sku}: ${error}`);
      }
    }

    return result;
  }

  private convertToSupplierProduct(catalogItem: any, inventoryItem?: any): SupplierProduct | null {
    try {
      const attributes = catalogItem.attributes || {};
      const images = attributes.item_package_dimensions?.length > 0 
        ? [attributes.item_package_dimensions[0].value] 
        : [];

      return {
        id: catalogItem.asin || catalogItem.sku,
        sku: catalogItem.sku,
        title: attributes.item_name?.[0]?.value || 'Unknown Product',
        description: attributes.bullet_point?.map((bp: any) => bp.value).join('\n') || '',
        price: this.extractPrice(catalogItem),
        currency: 'USD', // Default for Amazon US
        stock: inventoryItem?.totalQuantity || 0,
        images,
        category: attributes.item_type_name?.[0]?.value || 'General',
        brand: attributes.brand?.[0]?.value || 'Unknown',
        weight: this.extractWeight(attributes),
        dimensions: this.extractDimensions(attributes),
        attributes: {
          asin: catalogItem.asin,
          bulletPoints: attributes.bullet_point?.map((bp: any) => bp.value) || [],
          keywords: attributes.generic_keyword?.map((kw: any) => kw.value) || [],
          category: attributes.item_type_name?.[0]?.value,
          subcategory: attributes.product_category?.[0]?.value
        },
        supplier: {
          id: 'amazon',
          name: 'Amazon Seller Central',
          sku: catalogItem.sku
        },
        supplierProductId: catalogItem.asin
      };
    } catch (error) {
      console.error('Error converting Amazon product:', error);
      return null;
    }
  }

  private extractPrice(catalogItem: any): number {
    // Amazon pricing is complex - simplified extraction
    const priceInfo = catalogItem.salesRanks || catalogItem.relationships || {};
    return 0; // In real implementation, use pricing APIs
  }

  private extractWeight(attributes: any): number | undefined {
    const weightInfo = attributes.item_weight || attributes.package_weight;
    if (weightInfo && weightInfo[0]) {
      return parseFloat(weightInfo[0].value) || undefined;
    }
    return undefined;
  }

  private extractDimensions(attributes: any) {
    const dimensionInfo = attributes.item_dimensions || attributes.package_dimensions;
    if (dimensionInfo && dimensionInfo[0]) {
      return {
        length: parseFloat(dimensionInfo[0].length?.value) || 0,
        width: parseFloat(dimensionInfo[0].width?.value) || 0,
        height: parseFloat(dimensionInfo[0].height?.value) || 0
      };
    }
    return undefined;
  }

  // Amazon-specific methods
  async getOrdersByStatus(status: 'Pending' | 'Unshipped' | 'Shipped' = 'Pending'): Promise<any[]> {
    try {
      const response = await this.makeRequest(`/orders/v0/orders?MarketplaceIds=${this.marketplaceId}&OrderStatuses=${status}`);
      return response.Orders || [];
    } catch (error) {
      this.handleError(error, 'orders fetch');
      return [];
    }
  }

  async submitFeed(feedType: string, content: string): Promise<string | null> {
    try {
      const feedResponse = await this.makeRequest('/feeds/2021-06-30/feeds', {
        method: 'POST',
        body: JSON.stringify({
          feedType,
          marketplaceIds: [this.marketplaceId],
          inputFeedDocumentId: content
        })
      });

      return feedResponse.feedId || null;
    } catch (error) {
      this.handleError(error, 'feed submission');
      return null;
    }
  }
}