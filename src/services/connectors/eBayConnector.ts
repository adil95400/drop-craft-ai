import { BaseConnector, FetchOptions, SupplierProduct, SyncResult } from './BaseConnector';
import { logError, logAction } from '@/utils/consoleCleanup';

export class eBayConnector extends BaseConnector {
  private marketplace: string;

  constructor(credentials: any) {
    // eBay API endpoints
    const sandbox = credentials.sandbox || false;
    const baseUrl = sandbox 
      ? 'https://api.sandbox.ebay.com' 
      : 'https://api.ebay.com';
    
    super(credentials, baseUrl);
    this.marketplace = credentials.marketplace_id || 'EBAY_DE'; // Default to Germany
  }

  protected getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.credentials.access_token}`,
      'Content-Type': 'application/json',
      'X-EBAY-C-MARKETPLACE-ID': this.marketplace,
    };
  }

  protected getSupplierName(): string {
    return 'eBay';
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/sell/inventory/v1/inventory_item?limit=1');
      return !!response;
    } catch (error) {
      this.handleError(error, 'credential validation');
      return false;
    }
  }

  async fetchProducts(options: FetchOptions = {}): Promise<SupplierProduct[]> {
    try {
      const params = new URLSearchParams({
        limit: (options.limit || 50).toString()
      });
      
      if (options.page) {
        params.append('offset', ((parseInt(options.page) - 1) * (options.limit || 50)).toString());
      }

      const response = await this.makeRequest(`/sell/inventory/v1/inventory_item?${params}`);
      
      if (!response.inventoryItems) return [];

      const products = [];
      for (const item of response.inventoryItems) {
        const product = await this.normalizeeBayProduct(item);
        if (product) products.push(product);
      }

      return products;
    } catch (error) {
      this.handleError(error, 'product fetching');
      return [];
    }
  }

  async fetchProduct(sku: string): Promise<SupplierProduct | null> {
    try {
      const response = await this.makeRequest(`/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`);
      
      if (!response) return null;
      
      return this.normalizeeBayProduct(response);
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

    logAction('Starting eBay inventory update', { count: products.length });

    for (const product of products) {
      try {
        await this.delay();
        
        // Vérifier si l'article existe déjà
        const existingProduct = await this.fetchProduct(product.sku);
        
        if (existingProduct) {
          // Mettre à jour l'inventaire
          await this.updateeBayInventory(product.sku, product.stock);
          result.duplicates++;
          logAction('eBay inventory updated', { sku: product.sku, stock: product.stock });
        } else {
          // Créer un nouvel article d'inventaire
          await this.createeBayInventoryItem(product);
          result.imported++;
          logAction('eBay inventory item created', { sku: product.sku });
        }
      } catch (error: any) {
        result.errors.push(`Erreur pour ${product.sku}: ${error.message}`);
        logError(error, `eBay inventory update for ${product.sku}`);
      }
    }

    return result;
  }

  private async normalizeeBayProduct(ebayProduct: any): Promise<SupplierProduct | null> {
    try {
      const product = ebayProduct.product || {};
      const availability = ebayProduct.availability || {};
      
      return {
        id: ebayProduct.sku,
        sku: ebayProduct.sku,
        title: product.title || '',
        description: product.description || '',
        price: 0, // Prix obtenu via l'API des offers
        costPrice: undefined,
        currency: 'EUR',
        stock: availability.shipToLocationAvailability?.quantity || 0,
        images: product.imageUrls || [],
        category: product.aspects?.Brand?.[0] || 'General',
        brand: product.aspects?.Brand?.[0] || '',
        supplier: {
          id: 'ebay',
          name: 'eBay',
          sku: ebayProduct.sku
        },
        attributes: {
          condition: ebayProduct.condition || 'NEW',
          condition_description: ebayProduct.conditionDescription,
          package_weight_and_size: ebayProduct.packageWeightAndSize,
          aspects: product.aspects || {},
          ean: product.ean?.[0],
          upc: product.upc?.[0],
          isbn: product.isbn?.[0]
        }
      };
    } catch (error) {
      logError(error as Error, 'eBay product normalization');
      return null;
    }
  }

  private async updateeBayInventory(sku: string, quantity: number): Promise<void> {
    const updateData = {
      availability: {
        shipToLocationAvailability: {
          quantity: quantity
        }
      }
    };

    await this.makeRequest(`/sell/inventory/v1/inventory_item/${encodeURIComponent(sku)}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
  }

  private async createeBayInventoryItem(product: SupplierProduct): Promise<void> {
    const inventoryItem = {
      availability: {
        shipToLocationAvailability: {
          quantity: product.stock
        }
      },
      condition: 'NEW',
      product: {
        title: product.title,
        description: product.description,
        imageUrls: product.images.slice(0, 12), // eBay limite à 12 images
        aspects: {
          Brand: [product.brand || 'Unbranded']
        }
      }
    };

    await this.makeRequest(`/sell/inventory/v1/inventory_item/${encodeURIComponent(product.sku)}`, {
      method: 'PUT',
      body: JSON.stringify(inventoryItem)
    });
  }

  async getOffers(sku?: string): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        limit: '100',
        ...(sku && { sku })
      });

      const response = await this.makeRequest(`/sell/inventory/v1/offer?${params}`);
      return response?.offers || [];
    } catch (error) {
      this.handleError(error, 'offers fetching');
      return [];
    }
  }

  async createOffer(sku: string, price: number, categoryId: string): Promise<string | null> {
    try {
      const offer = {
        sku: sku,
        marketplaceId: this.marketplace,
        format: 'FIXED_PRICE',
        availableQuantity: 1,
        categoryId: categoryId,
        listingDescription: 'Product listing via API',
        listingPolicies: {
          fulfillmentPolicyId: this.credentials.fulfillment_policy_id,
          paymentPolicyId: this.credentials.payment_policy_id,
          returnPolicyId: this.credentials.return_policy_id
        },
        pricingSummary: {
          price: {
            currency: 'EUR',
            value: price.toString()
          }
        }
      };

      const response = await this.makeRequest('/sell/inventory/v1/offer', {
        method: 'POST',
        body: JSON.stringify(offer)
      });

      return response?.offerId || null;
    } catch (error) {
      this.handleError(error, 'offer creation');
      return null;
    }
  }

  async publishOffer(offerId: string): Promise<boolean> {
    try {
      await this.makeRequest(`/sell/inventory/v1/offer/${offerId}/publish`, {
        method: 'POST'
      });
      return true;
    } catch (error) {
      this.handleError(error, 'offer publishing');
      return false;
    }
  }

  async getCategories(): Promise<any[]> {
    try {
      const response = await this.makeRequest(`/commerce/taxonomy/v1/category_tree/${this.marketplace}`);
      return this.flattenCategories(response?.rootCategoryNode?.childCategoryTreeNodes || []);
    } catch (error) {
      this.handleError(error, 'categories fetching');
      return [];
    }
  }

  private flattenCategories(nodes: any[], level = 0): any[] {
    const categories: any[] = [];
    
    for (const node of nodes) {
      categories.push({
        id: node.category.categoryId,
        name: node.category.categoryName,
        level: level
      });
      
      if (node.childCategoryTreeNodes) {
        categories.push(...this.flattenCategories(node.childCategoryTreeNodes, level + 1));
      }
    }
    
    return categories;
  }

  async getOrders(options: { status?: string; limit?: number } = {}): Promise<any[]> {
    try {
      const params = new URLSearchParams({
        limit: (options.limit || 50).toString(),
        ...(options.status && { orderfulfillmentstatus: options.status })
      });

      const response = await this.makeRequest(`/sell/fulfillment/v1/order?${params}`);
      return response?.orders || [];
    } catch (error) {
      this.handleError(error, 'orders fetching');
      return [];
    }
  }
}