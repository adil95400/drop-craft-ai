import { supabase } from '@/integrations/supabase/client';
import { BaseConnector } from './connectors/BaseConnector';
import { ShopifyConnector } from './connectors/ShopifyConnector';
import { CdiscountConnector } from './connectors/CdiscountConnector';
import { EproloConnector } from './connectors/EproloConnector';
import { SynceeConnector } from './connectors/SynceeConnector';
import { VidaXLConnector } from './connectors/VidaXLConnector';
import { PrintfulConnector } from './connectors/PrintfulConnector';
import { ImportManager } from './ImportManager';
import { DeduplicationService } from './sync/DeduplicationService';
import { SupplierCredentials, SupplierProduct } from '@/types/suppliers';

export interface SupplierConnectorInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  logo?: string;
  category: string;
  authType: 'api_key' | 'oauth' | 'credentials' | 'none';
  features: {
    products: boolean;
    inventory: boolean;
    orders: boolean;
    webhooks: boolean;
  };
  rateLimits: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  status?: 'available' | 'beta' | 'coming_soon';
  setupComplexity: 'easy' | 'medium' | 'advanced';
  documentation?: string;
}

export interface SyncSchedule {
  supplierId: string;
  frequency: 'hourly' | 'daily' | 'weekly' | 'manual';
  enabled: boolean;
  lastSync?: Date;
  nextSync?: Date;
  config: {
    syncProducts: boolean;
    syncInventory: boolean;
    syncPrices: boolean;
    categories?: string[];
    priceRules?: any;
  };
}

export class SupplierHub {
  private static instance: SupplierHub;
  private connectors: Map<string, BaseConnector> = new Map();
  private deduplicationService = DeduplicationService.getInstance();
  private importManager = ImportManager.getInstance();

  static getInstance(): SupplierHub {
    if (!SupplierHub.instance) {
      SupplierHub.instance = new SupplierHub();
    }
    return SupplierHub.instance;
  }

  // Available Supplier Connectors
  getAvailableConnectors(): SupplierConnectorInfo[] {
    return [
      {
        id: 'shopify',
        name: 'shopify',
        displayName: 'Shopify',
        description: 'Synchronise vos produits avec votre boutique Shopify',
        logo: 'https://cdn.shopify.com/assets/images/logos/shopify-bag.png',
        category: 'Plateforme E-commerce',
        authType: 'api_key',
        features: {
          products: true,
          inventory: true,
          orders: true,
          webhooks: true,
        },
        rateLimits: {
          requestsPerMinute: 40,
          requestsPerHour: 2000,
        },
        status: 'available',
        setupComplexity: 'easy',
        documentation: 'https://shopify.dev/api',
      },
      {
        id: 'cdiscount',
        name: 'cdiscount',
        displayName: 'Cdiscount Pro',
        description: 'Importez des produits depuis Cdiscount Marketplace',
        logo: 'https://www.cdiscount.com/favicon.ico',
        category: 'Marketplace',
        authType: 'api_key',
        features: {
          products: true,
          inventory: true,
          orders: false,
          webhooks: false,
        },
        rateLimits: {
          requestsPerMinute: 60,
          requestsPerHour: 3000,
        },
        status: 'available',
        setupComplexity: 'medium',
      },
      {
        id: 'eprolo',
        name: 'eprolo',
        displayName: 'Eprolo',
        description: 'Fournisseur dropshipping avec expédition rapide',
        logo: 'https://eprolo.com/favicon.ico',
        category: 'Dropshipping',
        authType: 'api_key',
        features: {
          products: true,
          inventory: true,
          orders: true,
          webhooks: false,
        },
        rateLimits: {
          requestsPerMinute: 120,
          requestsPerHour: 6000,
        },
        status: 'available',
        setupComplexity: 'easy',
      },
      {
        id: 'syncee',
        name: 'syncee',
        displayName: 'Syncee',
        description: 'Plateforme de sourcing de produits B2B',
        logo: 'https://syncee.com/favicon.ico',
        category: 'B2B Marketplace',
        authType: 'api_key',
        features: {
          products: true,
          inventory: true,
          orders: false,
          webhooks: false,
        },
        rateLimits: {
          requestsPerMinute: 60,
          requestsPerHour: 2000,
        },
        status: 'available',
        setupComplexity: 'medium',
      },
      {
        id: 'vidaxl',
        name: 'vidaxl',
        displayName: 'VidaXL',
        description: 'Grossiste en produits de maison et jardin',
        logo: 'https://www.vidaxl.fr/favicon.ico',
        category: 'Grossiste',
        authType: 'api_key',
        features: {
          products: true,
          inventory: true,
          orders: true,
          webhooks: false,
        },
        rateLimits: {
          requestsPerMinute: 30,
          requestsPerHour: 1800,
        },
        status: 'available',
        setupComplexity: 'medium',
      },
      {
        id: 'printful',
        name: 'printful',
        displayName: 'Printful',
        description: 'Print-on-demand et fulfillment',
        logo: 'https://www.printful.com/favicon.ico',
        category: 'Print-on-Demand',
        authType: 'api_key',
        features: {
          products: true,
          inventory: false,
          orders: true,
          webhooks: true,
        },
        rateLimits: {
          requestsPerMinute: 120,
          requestsPerHour: 7200,
        },
        status: 'available',
        setupComplexity: 'easy',
      },
      {
        id: 'printify',
        name: 'printify',
        displayName: 'Printify',
        description: 'Print-on-demand avec multiples fournisseurs',
        category: 'Print-on-Demand',
        authType: 'api_key',
        features: {
          products: true,
          inventory: false,
          orders: true,
          webhooks: true,
        },
        rateLimits: {
          requestsPerMinute: 100,
          requestsPerHour: 6000,
        },
        status: 'beta',
        setupComplexity: 'easy',
      },
      {
        id: 'appscenic',
        name: 'appscenic',
        displayName: 'AppScenic',
        description: 'Dropshipping européen premium',
        category: 'Dropshipping',
        authType: 'api_key',
        features: {
          products: true,
          inventory: true,
          orders: true,
          webhooks: false,
        },
        rateLimits: {
          requestsPerMinute: 60,
          requestsPerHour: 3000,
        },
        status: 'coming_soon',
        setupComplexity: 'medium',
      },
      {
        id: 'matterhorn',
        name: 'matterhorn',
        displayName: 'Matterhorn',
        description: 'Fournisseur B2B européen',
        category: 'B2B',
        authType: 'credentials',
        features: {
          products: true,
          inventory: true,
          orders: false,
          webhooks: false,
        },
        rateLimits: {
          requestsPerMinute: 30,
          requestsPerHour: 1500,
        },
        status: 'coming_soon',
        setupComplexity: 'advanced',
      }
    ];
  }

  // Connect to a supplier (simplified for demo - would use localStorage until tables exist)
  async connectSupplier(connectorId: string, credentials: SupplierCredentials): Promise<boolean> {
    try {
      const connector = this.createConnector(connectorId, credentials);
      if (!connector) {
        throw new Error(`Connector ${connectorId} not supported`);
      }

      // Validate credentials (simplified validation)
      // const isValid = await connector.validateCredentials();
      const isValid = true; // For demo purposes
      if (!isValid) {
        throw new Error('Invalid credentials');
      }

      // Store connector
      this.connectors.set(connectorId, connector);

      // Store in localStorage for demo (would be database in production)
      const activeConnectors = JSON.parse(localStorage.getItem('active_connectors') || '[]');
      if (!activeConnectors.includes(connectorId)) {
        activeConnectors.push(connectorId);
        localStorage.setItem('active_connectors', JSON.stringify(activeConnectors));
      }

      return true;
    } catch (error) {
      console.error(`Failed to connect to ${connectorId}:`, error);
      return false;
    }
  }

  // Disconnect from a supplier (simplified for demo)
  async disconnectSupplier(connectorId: string): Promise<boolean> {
    try {
      this.connectors.delete(connectorId);

      // Remove from localStorage for demo
      const activeConnectors = JSON.parse(localStorage.getItem('active_connectors') || '[]');
      const filtered = activeConnectors.filter((id: string) => id !== connectorId);
      localStorage.setItem('active_connectors', JSON.stringify(filtered));

      return true;
    } catch (error) {
      console.error(`Failed to disconnect from ${connectorId}:`, error);
      return false;
    }
  }

  // Sync products from a supplier
  async syncSupplierProducts(
    connectorId: string,
    options?: {
      fullSync?: boolean;
      category?: string;
      limit?: number;
    }
  ): Promise<{
    total: number;
    imported: number;
    duplicates: number;
    errors: string[];
  }> {
    try {
      const connector = this.connectors.get(connectorId);
      if (!connector) {
        throw new Error(`Connector ${connectorId} not connected`);
      }

      // Fetch products
      const products = await connector.fetchProducts({
        limit: options?.limit || 100,
        category: options?.category,
        lastSync: options?.fullSync ? undefined : await this.getLastSyncDate(connectorId),
      });

      // Deduplicate products
      const deduplicatedProducts = await this.deduplicationService.deduplicateProducts(products);

      // Save to database
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      let importedCount = 0;
      const errors: string[] = [];

      for (const product of deduplicatedProducts) {
        try {
          const { error } = await supabase
            .from('imported_products')
            .upsert({
              user_id: user.user.id,
              name: product.title,
              sku: product.sku,
              description: product.description,
              price: product.price,
              cost_price: product.costPrice,
              currency: product.currency,
              stock_quantity: product.stock,
              category: product.category,
              brand: product.brand,
              image_urls: product.images,
              supplier_name: product.supplier.name,
              supplier_sku: product.supplier.sku,
              weight: product.weight,
              ean: product.attributes?.ean,
              status: 'draft',
            });

          if (error) {
            errors.push(`Failed to save product ${product.sku}: ${error.message}`);
          } else {
            importedCount++;
          }
        } catch (error) {
          errors.push(`Error processing product ${product.sku}: ${error}`);
        }
      }

      // Update last sync date
      await this.updateLastSyncDate(connectorId);

      return {
        total: products.length,
        imported: importedCount,
        duplicates: products.length - deduplicatedProducts.length,
        errors,
      };
    } catch (error) {
      console.error(`Sync failed for ${connectorId}:`, error);
      throw error;
    }
  }

  // Schedule automatic syncs (simplified for demo)
  async scheduleSync(schedule: SyncSchedule): Promise<void> {
    // Store in localStorage for demo
    const schedules = JSON.parse(localStorage.getItem('sync_schedules') || '[]');
    const existingIndex = schedules.findIndex((s: any) => s.supplierId === schedule.supplierId);
    
    if (existingIndex >= 0) {
      schedules[existingIndex] = schedule;
    } else {
      schedules.push(schedule);
    }
    
    localStorage.setItem('sync_schedules', JSON.stringify(schedules));
  }

  // Get sync schedules (simplified for demo)
  async getSyncSchedules(): Promise<SyncSchedule[]> {
    return JSON.parse(localStorage.getItem('sync_schedules') || '[]');
  }

  // Manual sync trigger
  async triggerManualSync(connectorId: string): Promise<void> {
    const result = await this.syncSupplierProducts(connectorId, { fullSync: false });
    
    // Log the sync result
    const { data: user } = await supabase.auth.getUser();
    if (user.user) {
      await supabase
        .from('activity_logs')
        .insert({
          user_id: user.user.id,
          action: 'manual_sync',
          description: `Manual sync completed for ${connectorId}`,
          metadata: result,
        });
    }
  }

  // Helper methods
  private createConnector(connectorId: string, credentials: SupplierCredentials): any {
    // For demo, return a simplified mock connector
    switch (connectorId) {
      case 'shopify':
        return {
          validateCredentials: async () => true,
          fetchProducts: async (options?: any) => [],
          fetchProduct: async (sku: string) => null,
        };
      case 'cdiscount':
        return new CdiscountConnector(credentials);
      case 'eprolo':
        return new EproloConnector(credentials);
      case 'syncee':
        return new SynceeConnector(credentials);
      case 'vidaxl':
        return new VidaXLConnector(credentials);
      case 'printful':
        return new PrintfulConnector(credentials);
      default:
        return null;
    }
  }

  private async getLastSyncDate(connectorId: string): Promise<Date | undefined> {
    // For demo, return undefined (would query database in production)
    return undefined;
  }

  private async updateLastSyncDate(connectorId: string): Promise<void> {
    // For demo, store in localStorage (would update database in production)
    const lastSyncs = JSON.parse(localStorage.getItem('last_syncs') || '{}');
    lastSyncs[connectorId] = new Date().toISOString();
    localStorage.setItem('last_syncs', JSON.stringify(lastSyncs));
  }
}

export const supplierHub = SupplierHub.getInstance();