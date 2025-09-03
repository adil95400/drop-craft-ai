import { BaseConnector } from './BaseConnector';
import type { SupplierCredentials } from '@/types/suppliers';

export interface ConnectorInfo {
  id: string;
  name: string;
  displayName: string;
  description: string;
  category: string;
  authType: 'api_key' | 'oauth' | 'credentials';
  status: 'available' | 'beta' | 'coming_soon';
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
  setupComplexity: 'easy' | 'medium' | 'advanced';
}

export class ConnectorFactory {
  private static connectors: Map<string, ConnectorInfo> = new Map([
    ['cdiscount-pro', {
      id: 'cdiscount-pro',
      name: 'Cdiscount Pro',
      displayName: 'Cdiscount Pro',
      description: 'Marketplace française leader avec API complète',
      category: 'Marketplace Française',
      authType: 'api_key',
      status: 'available',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 30, requestsPerHour: 1800 },
      setupComplexity: 'advanced'
    }],
    ['syncee', {
      id: 'syncee',
      name: 'Syncee',
      displayName: 'Syncee',
      description: 'Plateforme B2B avec 5M+ produits européens',
      category: 'Marketplace Globale',
      authType: 'api_key',
      status: 'available',
      features: { products: true, inventory: true, orders: false, webhooks: true },
      rateLimits: { requestsPerMinute: 120, requestsPerHour: 7200 },
      setupComplexity: 'easy'
    }],
    ['eprolo', {
      id: 'eprolo',
      name: 'Eprolo',
      displayName: 'Eprolo',
      description: 'Fournisseur dropshipping avec fulfillment automatique',
      category: 'Dropshipping Premium',
      authType: 'oauth',
      status: 'available',
      features: { products: true, inventory: true, orders: true, webhooks: true },
      rateLimits: { requestsPerMinute: 100, requestsPerHour: 6000 },
      setupComplexity: 'medium'
    }]
  ]);

  static getAvailableConnectors(): ConnectorInfo[] {
    return Array.from(this.connectors.values());
  }

  static getConnector(id: string): ConnectorInfo | undefined {
    return this.connectors.get(id);
  }

  static validateCredentials(connectorId: string, credentials: SupplierCredentials): boolean {
    const connector = this.connectors.get(connectorId);
    if (!connector) return false;

    switch (connector.authType) {
      case 'api_key':
        return !!credentials.apiKey;
      case 'oauth':
        return !!(credentials.clientId && credentials.clientSecret);
      case 'credentials':
        return !!(credentials.username && credentials.password);
      default:
        return false;
    }
  }

  static async createConnectorInstance(connectorId: string, credentials: SupplierCredentials): Promise<BaseConnector | null> {
    try {
      // Pour la démo, simuler la création d'instances avec des mocks
      return {
        validateCredentials: async () => true,
        fetchProducts: async (options?: any) => {
          // Retourner des produits simulés basés sur des données réelles
          return [
            {
              id: "DEMO_001",
              sku: "DEMO-PROD-001",
              title: "Produit démo " + connectorId,
              description: "Description du produit démo",
              price: 29.99,
              costPrice: 19.99,
              currency: "EUR",
              stock: 50,
              images: ["https://example.com/image.jpg"],
              category: "Électronique",
              brand: "Démo",
              attributes: {},
              supplier: {
                id: connectorId,
                name: connectorId,
                sku: "DEMO-SKU"
              }
            }
          ];
        },
        fetchProduct: async (sku: string) => null,
        updateInventory: async (products: any[]) => ({
          total: products.length,
          imported: products.length,
          duplicates: 0,
          errors: []
        }),
        getSupplierName: () => connectorId,
      } as any;
    } catch (error) {
      console.error(`Erreur création connecteur ${connectorId}:`, error);
      return null;
    }
  }
}